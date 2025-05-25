// Alternativa GRATUITA para upload de fotos usando Firestore (sem Firebase Storage)
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Tipos de fotos permitidas
export const FOTO_TIPOS = {
  FRENTE: 'frente',
  LADO_DIREITO: 'ladoDireito',
  LADO_ESQUERDO: 'ladoEsquerdo',
  COSTAS: 'costas'
};

// Validar arquivo de imagem
export const validarImagem = (file) => {
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const tamanhoMaximo = 2 * 1024 * 1024; // 2MB (menor para base64)

  if (!tiposPermitidos.includes(file.type)) {
    return { valido: false, erro: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.' };
  }

  if (file.size > tamanhoMaximo) {
    return { valido: false, erro: 'Arquivo muito grande. Máximo 2MB para modo gratuito.' };
  }

  return { valido: true };
};

// Redimensionar imagem para otimizar base64
export const redimensionarImagem = (file, maxWidth = 800, maxHeight = 1000, quality = 0.7) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcular novas dimensões mantendo proporção
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Converter para blob
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

// Converter imagem para base64
export const imagemParaBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Processar uma imagem (validar, redimensionar, converter)
export const processarImagem = async (file, tipoFoto) => {
  try {
    // Validar arquivo
    const validacao = validarImagem(file);
    if (!validacao.valido) {
      throw new Error(validacao.erro);
    }

    console.log('Processando imagem:', { tipoFoto, fileSize: file.size });

    // Redimensionar para otimizar
    const imagemOtimizada = await redimensionarImagem(file);
    
    // Converter para base64
    const base64 = await imagemParaBase64(imagemOtimizada);
    
    console.log('Imagem processada:', { tipoFoto, base64Size: base64.length });
    
    return {
      sucesso: true,
      base64: base64,
      tipo: tipoFoto,
      tamanhoOriginal: file.size,
      tamanhoOtimizado: base64.length
    };
  } catch (error) {
    console.error('Erro no processamento:', error);
    return {
      sucesso: false,
      erro: error.message || 'Erro desconhecido no processamento'
    };
  }
};

// Processar múltiplas imagens
export const processarMultiplasImagens = async (arquivos, onProgress) => {
  const resultados = {};
  const total = Object.keys(arquivos).length;
  let processados = 0;

  console.log('Processando múltiplas imagens:', { total });

  for (const [tipo, file] of Object.entries(arquivos)) {
    if (file) {
      try {
        const resultado = await processarImagem(file, tipo);
        resultados[tipo] = resultado;
        
        processados++;
        if (onProgress) {
          onProgress({ processados, total, tipo, resultado });
        }
        
        console.log(`Processamento ${processados}/${total} concluído:`, tipo, resultado.sucesso ? 'OK' : 'ERRO');
      } catch (error) {
        console.error(`Erro no processamento de ${tipo}:`, error);
        resultados[tipo] = { sucesso: false, erro: error.message };
        processados++;
        if (onProgress) {
          onProgress({ processados, total, tipo, erro: error.message });
        }
      }
    }
  }

  console.log('Processamento múltiplo finalizado:', resultados);
  return resultados;
};

// Salvar fotos base64 na avaliação do Firestore
export const salvarFotosAvaliacao = async (avaliacaoId, resultadosProcessamento) => {
  try {
    const fotos = {};
    
    Object.entries(resultadosProcessamento).forEach(([tipo, resultado]) => {
      if (resultado.sucesso) {
        fotos[tipo] = {
          base64: resultado.base64,
          tipo: resultado.tipo,
          tamanhoOriginal: resultado.tamanhoOriginal,
          tamanhoOtimizado: resultado.tamanhoOtimizado,
          uploadedAt: new Date()
        };
      }
    });
    
    if (Object.keys(fotos).length > 0) {
      const avaliacaoRef = doc(db, 'avaliacoes', avaliacaoId);
      await updateDoc(avaliacaoRef, { fotos });
      
      console.log('Fotos salvas no Firestore:', Object.keys(fotos));
      return { sucesso: true, quantidadeSalvas: Object.keys(fotos).length };
    } else {
      return { sucesso: false, erro: 'Nenhuma foto válida para salvar' };
    }
  } catch (error) {
    console.error('Erro ao salvar fotos:', error);
    return { sucesso: false, erro: error.message };
  }
};

// Criar preview de imagem
export const criarPreview = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
};

// Utilitário para preparar dados de fotos para exibição
export const prepararDadosFotosParaExibicao = (fotosFirestore) => {
  const fotos = {};
  
  if (fotosFirestore) {
    Object.entries(fotosFirestore).forEach(([tipo, dadosFoto]) => {
      if (dadosFoto.base64) {
        fotos[tipo] = {
          url: dadosFoto.base64, // base64 pode ser usado diretamente como src
          tipo: dadosFoto.tipo,
          uploadedAt: dadosFoto.uploadedAt
        };
      }
    });
  }
  
  return fotos;
};

// Calcular tamanho total das fotos de uma avaliação
export const calcularTamanhoFotos = (fotos) => {
  let tamanhoTotal = 0;
  
  Object.values(fotos || {}).forEach(foto => {
    if (foto.tamanhoOtimizado) {
      tamanhoTotal += foto.tamanhoOtimizado;
    }
  });
  
  return tamanhoTotal;
};

// Formatar tamanho em bytes para leitura humana
export const formatarTamanho = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 