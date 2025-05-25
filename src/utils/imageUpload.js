import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

// Verificar se o Storage foi inicializado corretamente
const checkStorageInit = () => {
  if (!storage) {
    throw new Error('Firebase Storage não foi inicializado. Verifique as configurações do Firebase.');
  }
  return true;
};

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
  const tamanhoMaximo = 5 * 1024 * 1024; // 5MB

  if (!tiposPermitidos.includes(file.type)) {
    return { valido: false, erro: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.' };
  }

  if (file.size > tamanhoMaximo) {
    return { valido: false, erro: 'Arquivo muito grande. Máximo 5MB.' };
  }

  return { valido: true };
};

// Redimensionar imagem (opcional - para otimizar)
export const redimensionarImagem = (file, maxWidth = 1200, maxHeight = 1600, quality = 0.8) => {
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
      canvas.toBlob(resolve, file.type, quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

// Upload de uma imagem
export const uploadImagem = async (file, alunoId, avaliacaoId, tipoFoto) => {
  try {
    // Verificar inicialização do Storage
    checkStorageInit();
    
    // Validar arquivo
    const validacao = validarImagem(file);
    if (!validacao.valido) {
      throw new Error(validacao.erro);
    }

    // Redimensionar se necessário
    const imagemOtimizada = await redimensionarImagem(file);
    
    // Criar referência no Storage
    const nomeArquivo = `${tipoFoto}.${file.type.split('/')[1]}`;
    const path = `avaliacoes/${alunoId}/${avaliacaoId}/${nomeArquivo}`;
    
    const storageRef = ref(storage, path);

    // Upload do arquivo com retry
    let tentativas = 0;
    const maxTentativas = 3;
    let snapshot;
    
    while (tentativas < maxTentativas) {
      try {
        snapshot = await uploadBytes(storageRef, imagemOtimizada);
        break; // Upload bem-sucedido
      } catch (uploadError) {
        tentativas++;
        
        if (tentativas >= maxTentativas) {
          // Verificar se é erro de CORS ou configuração
          if (uploadError.code === 'storage/unauthorized') {
            throw new Error('Erro de autorização. Verifique se está logado e as regras do Storage.');
          } else if (uploadError.message.includes('CORS') || uploadError.message.includes('preflight')) {
            throw new Error('Erro de configuração do Firebase Storage. Verifique se o Storage está ativado no Firebase Console.');
          } else if (uploadError.code === 'storage/unknown') {
            throw new Error('Erro desconhecido no Storage. Verifique sua conexão e configurações do Firebase.');
          }
          throw uploadError;
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 1000 * tentativas));
      }
    }
    
    // Obter URL de download
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      sucesso: true,
      url: downloadURL,
      path: snapshot.ref.fullPath,
      tipo: tipoFoto
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error.message || 'Erro desconhecido no upload'
    };
  }
};

// Upload de múltiplas imagens
export const uploadMultiplasImagens = async (arquivos, alunoId, avaliacaoId, onProgress) => {
  const resultados = {};
  const total = Object.keys(arquivos).length;
  let processados = 0;

  for (const [tipo, file] of Object.entries(arquivos)) {
    if (file) {
      try {
        const resultado = await uploadImagem(file, alunoId, avaliacaoId, tipo);
        resultados[tipo] = resultado;
        
        processados++;
        if (onProgress) {
          onProgress({ processados, total, tipo, resultado });
        }
        
      } catch (error) {
        resultados[tipo] = { sucesso: false, erro: error.message };
        processados++;
        if (onProgress) {
          onProgress({ processados, total, tipo, erro: error.message });
        }
      }
    }
  }

  return resultados;
};

// Deletar imagem do Storage
export const deletarImagem = async (imagePath) => {
  try {
    checkStorageInit();
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    return { sucesso: true };
  } catch (error) {
    return { sucesso: false, erro: error.message };
  }
};

// Deletar todas as fotos de uma avaliação
export const deletarFotosAvaliacao = async (fotos) => {
  const resultados = {};
  
  for (const [tipo, foto] of Object.entries(fotos || {})) {
    if (foto?.path) {
      resultados[tipo] = await deletarImagem(foto.path);
    }
  }
  
  return resultados;
};

// Criar preview de imagem
export const criarPreview = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
};

// Utilitário para validar e preparar dados de fotos para Firestore
export const prepararDadosFotos = (resultadosUpload) => {
  const fotos = {};
  
  Object.entries(resultadosUpload).forEach(([tipo, resultado]) => {
    if (resultado.sucesso) {
      fotos[tipo] = {
        url: resultado.url,
        path: resultado.path,
        uploadedAt: new Date()
      };
    }
  });
  
  return fotos;
}; 