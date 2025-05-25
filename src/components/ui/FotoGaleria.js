import { useState } from 'react';
import { FOTO_TIPOS } from '../../utils/imageUpload';

const FotoGaleria = ({ fotos = {}, aluno, dataAvaliacao, showModal = true }) => {
  const [selectedFoto, setSelectedFoto] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Labels para os tipos de foto
  const labels = {
    [FOTO_TIPOS.FRENTE]: 'Frente',
    [FOTO_TIPOS.LADO_DIREITO]: 'Lado Direito',
    [FOTO_TIPOS.LADO_ESQUERDO]: 'Lado Esquerdo',
    [FOTO_TIPOS.COSTAS]: 'Costas'
  };

  // Ordem para exibição
  const ordemExibicao = [
    FOTO_TIPOS.FRENTE,
    FOTO_TIPOS.LADO_DIREITO,
    FOTO_TIPOS.LADO_ESQUERDO,
    FOTO_TIPOS.COSTAS
  ];

  const abrirModal = (foto, tipo) => {
    if (showModal) {
      setSelectedFoto({ ...foto, tipo });
      setModalOpen(true);
    }
  };

  const fecharModal = () => {
    setModalOpen(false);
    setSelectedFoto(null);
  };

  const fotosExistentes = ordemExibicao.filter(tipo => fotos[tipo]?.url);

  if (fotosExistentes.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Nenhuma foto disponível</h3>
        <p className="text-sm text-gray-500">
          Não há fotos registradas para esta avaliação.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Galeria de fotos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ordemExibicao.map(tipo => {
          const foto = fotos[tipo];
          
          return (
            <div key={tipo} className="relative">
              {foto?.url ? (
                <div className="group relative">
                  <div 
                    className={`relative overflow-hidden rounded-lg bg-gray-100 aspect-square ${
                      showModal ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => abrirModal(foto, tipo)}
                  >
                    <img
                      src={foto.url}
                      alt={labels[tipo]}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    {showModal && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <svg className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900 text-center">
                    {labels[tipo]}
                  </p>
                </div>
              ) : (
                <div className="aspect-square rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500">{labels[tipo]}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal para visualização ampliada */}
      {modalOpen && selectedFoto && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={fecharModal}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={fecharModal}
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {labels[selectedFoto.tipo]} - {aluno?.nome}
                  </h3>
                  
                  {dataAvaliacao && (
                    <p className="text-sm text-gray-500 mb-4">
                      Avaliação de {dataAvaliacao}
                    </p>
                  )}

                  <div className="w-full flex justify-center">
                    <img
                      src={selectedFoto.url}
                      alt={labels[selectedFoto.tipo]}
                      className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                    />
                  </div>

                  {/* Navegação entre fotos */}
                  <div className="mt-6 flex justify-center space-x-2">
                    {ordemExibicao.filter(tipo => fotos[tipo]?.url).map(tipo => (
                      <button
                        key={tipo}
                        onClick={() => setSelectedFoto({ ...fotos[tipo], tipo })}
                        className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                          selectedFoto.tipo === tipo
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {labels[tipo]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FotoGaleria; 