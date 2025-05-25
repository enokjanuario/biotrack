import { useState, useRef, useEffect } from 'react';
import { FOTO_TIPOS, validarImagem, criarPreview } from '../../utils/imageUpload';

const FotoUpload = ({ fotos = {}, onFotosChange, disabled = false }) => {
  const [previews, setPreviews] = useState({});
  const [erros, setErros] = useState({});
  const fileInputRefs = useRef({});

  // Labels para os tipos de foto
  const labels = {
    [FOTO_TIPOS.FRENTE]: 'Frente',
    [FOTO_TIPOS.LADO_DIREITO]: 'Lado Direito',
    [FOTO_TIPOS.LADO_ESQUERDO]: 'Lado Esquerdo',
    [FOTO_TIPOS.COSTAS]: 'Costas'
  };

  // Ícones para cada tipo
  const icones = {
    [FOTO_TIPOS.FRENTE]: '👤',
    [FOTO_TIPOS.LADO_DIREITO]: '🔄',
    [FOTO_TIPOS.LADO_ESQUERDO]: '🔃',
    [FOTO_TIPOS.COSTAS]: '🔙'
  };

  // Efeito para sincronizar previews com fotos do estado pai
  useEffect(() => {
    const syncPreviews = async () => {
      const newPreviews = {};
      
      for (const [tipo, foto] of Object.entries(fotos)) {
        if (foto && foto instanceof File) {
          // Se é um arquivo, criar preview
          try {
            const preview = await criarPreview(foto);
            newPreviews[tipo] = preview;
              } catch (error) {
          }
        } else if (foto && typeof foto === 'string') {
          // Se é uma URL, usar diretamente
          newPreviews[tipo] = foto;
        } else if (foto && foto.url) {
          // Se é um objeto com URL
          newPreviews[tipo] = foto.url;
        }
      }
      
      setPreviews(newPreviews);
    };

    syncPreviews();
  }, [fotos]);

  const handleFileSelect = async (tipo, file) => {
    if (!file) return;

    // Validar arquivo
    const validacao = validarImagem(file);
    if (!validacao.valido) {
      setErros(prev => ({ ...prev, [tipo]: validacao.erro }));
      return;
    }

    // Limpar erro anterior
    setErros(prev => ({ ...prev, [tipo]: null }));

    try {
      // Criar preview
      const preview = await criarPreview(file);
      setPreviews(prev => ({ ...prev, [tipo]: preview }));

      // Atualizar fotos no componente pai
      const novasFotos = { ...fotos, [tipo]: file };
      onFotosChange(novasFotos);
    } catch (error) {
      setErros(prev => ({ ...prev, [tipo]: 'Erro ao processar imagem' }));
    }
  };

  const handleRemoveFoto = (tipo) => {
    // Remover preview e arquivo
    setPreviews(prev => {
      const novosPreviews = { ...prev };
      delete novosPreviews[tipo];
      return novosPreviews;
    });

    setErros(prev => {
      const novosErros = { ...prev };
      delete novosErros[tipo];
      return novosErros;
    });

    // Atualizar fotos no componente pai
    const novasFotos = { ...fotos };
    delete novasFotos[tipo];
    onFotosChange(novasFotos);

    // Limpar input
    if (fileInputRefs.current[tipo]) {
      fileInputRefs.current[tipo].value = '';
    }
  };

  const renderFotoCard = (tipo) => {
    const fotoExistente = fotos[tipo];
    const preview = previews[tipo];
    const erro = erros[tipo];
    const temFoto = fotoExistente || preview;

    return (
      <div key={tipo} className="relative">
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{icones[tipo]}</span>
                <span className="font-medium text-gray-900">{labels[tipo]}</span>
              </div>
              {temFoto && (
                <button
                  type="button"
                  onClick={() => handleRemoveFoto(tipo)}
                  disabled={disabled}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {/* Área de upload/preview */}
            <div className="relative">
              {preview ? (
                <div className="relative group">
                  <img
                    src={preview}
                    alt={labels[tipo]}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {!disabled && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[tipo]?.click()}
                        className="opacity-0 group-hover:opacity-100 bg-white text-gray-700 px-3 py-1 rounded-md text-sm font-medium transition-opacity"
                      >
                        Alterar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => !disabled && fileInputRefs.current[tipo]?.click()}
                >
                  <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600 text-center">
                    Clique para selecionar
                    <br />
                    <span className="text-xs text-gray-500">JPG, PNG até 2MB</span>
                  </p>
                </div>
              )}

              {/* Input file oculto */}
              <input
                ref={el => fileInputRefs.current[tipo] = el}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => handleFileSelect(tipo, e.target.files[0])}
                className="hidden"
                disabled={disabled}
              />
            </div>

            {/* Erro */}
            {erro && (
              <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {erro}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Fotos da Avaliação (Modo Gratuito)</h3>
        <span className="text-sm text-gray-500">
          {Object.keys(fotos).length}/4 fotos
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(FOTO_TIPOS).map(tipo => renderFotoCard(tipo))}
      </div>

      {/* Dicas */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-green-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-green-800">💚 Modo Gratuito - Firestore</h4>
            <ul className="mt-1 text-sm text-green-700 space-y-1">
              <li>• Máximo 2MB por foto (otimização automática)</li>
              <li>• Fotos são redimensionadas para web (800x1000px)</li>
              <li>• Armazenamento gratuito no Firestore</li>
              <li>• Use boa iluminação e roupas justas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FotoUpload; 