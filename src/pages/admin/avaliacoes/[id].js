import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../../components/layout/Layout';
import { formatDate } from '../../../utils/formatDate';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';

export default function DetalhesAvaliacao() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, userType } = useAuth();
  const [avaliacao, setAvaliacao] = useState(null);
  const [avaliacaoAnterior, setAvaliacaoAnterior] = useState(null);
  const [aluno, setAluno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('composicao');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchAvaliacao = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Buscar dados da avaliação
        const avaliacaoDoc = await getDoc(doc(db, 'avaliacoes', id));
        
        if (!avaliacaoDoc.exists()) {
          setError('Avaliação não encontrada');
          return;
        }
        
        const avaliacaoData = {
          id: avaliacaoDoc.id,
          ...avaliacaoDoc.data()
        };
        
        setAvaliacao(avaliacaoData);
        
        // Buscar informações do aluno
        if (avaliacaoData.alunoId) {
          const alunoDoc = await getDoc(doc(db, 'usuarios', avaliacaoData.alunoId));
          if (alunoDoc.exists()) {
            setAluno({
              id: alunoDoc.id,
              ...alunoDoc.data()
            });
          }
        }
        
        // Buscar avaliação anterior para comparação
        const avaliacoesQuery = query(
          collection(db, 'avaliacoes'),
          where('alunoId', '==', avaliacaoData.alunoId),
          where('dataAvaliacao', '<', avaliacaoData.dataAvaliacao),
          orderBy('dataAvaliacao', 'desc'),
          limit(1)
        );
        
        const avaliacoesSnapshot = await getDocs(avaliacoesQuery);
        
        if (!avaliacoesSnapshot.empty) {
          const avaliacaoAnteriorData = {
            id: avaliacoesSnapshot.docs[0].id,
            ...avaliacoesSnapshot.docs[0].data()
          };
          
          setAvaliacaoAnterior(avaliacaoAnteriorData);
        }
      } catch (error) {
        console.error('Erro ao buscar avaliação:', error);
        setError('Erro ao carregar dados da avaliação');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchAvaliacao();
    }
  }, [id, currentUser]);

  // Função para calcular a variação entre a avaliação atual e a anterior
  const calcularVariacao = (metrica) => {
    if (!avaliacaoAnterior || !avaliacao[metrica] || !avaliacaoAnterior[metrica]) {
      return null;
    }
    
    const atual = parseFloat(avaliacao[metrica]);
    const anterior = parseFloat(avaliacaoAnterior[metrica]);
    
    return ((atual - anterior) / anterior * 100).toFixed(1);
  };

  // Função para determinar a cor da variação (verde para melhorias, vermelho para pioras)
  const corVariacao = (metrica, menorMelhor = false) => {
    const variacao = calcularVariacao(metrica);
    
    if (variacao === null) {
      return 'text-gray-500';
    }
    
    const valor = parseFloat(variacao);
    
    if (menorMelhor) {
      // Para métricas onde valores menores são melhores (peso, % gordura, etc)
      return valor < 0 ? 'text-green-600' : 'text-red-600';
    } else {
      // Para métricas onde valores maiores são melhores (massa magra, etc)
      return valor > 0 ? 'text-green-600' : 'text-red-600';
    }
  };

  // Função para abrir modal de confirmação
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  // Função para fechar modal
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  // Função para confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!id || userType !== 'admin') return;
    
    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'avaliacoes', id));
      toast.success('Avaliação excluída com sucesso');
      
      // Fechar modal
      setShowDeleteModal(false);
      
      // Redirecionar após exclusão
      setTimeout(() => {
        router.push('/admin/avaliacoes');
      }, 2000);
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      toast.error('Erro ao excluir avaliação');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 flex justify-center items-center h-64">
          <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </Layout>
    );
  }
  
  if (error || !avaliacao) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-primary-700">{error || 'Erro ao carregar avaliação'}</h3>
                <div className="mt-2 text-sm text-primary-600">
                  <p>Não foi possível carregar os dados da avaliação. Por favor, tente novamente mais tarde.</p>
                </div>
                <div className="mt-4">
                  <Link href="/admin/avaliacoes" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                    Voltar para avaliações
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Detalhes da Avaliação</h1>
          <div className="flex gap-2">
            <Link 
              href="/admin/avaliacoes"
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Voltar
            </Link>
            {userType === 'admin' && (
              <>
                <Link 
                  href={`/admin/avaliacoes/editar/${avaliacao.id}`}
                  className="inline-flex items-center px-3 py-1 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </Link>
                <Link 
                  href={`/admin/avaliacoes/nova?alunoId=${avaliacao.alunoId}`}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Nova Avaliação
                </Link>
                <button 
                  onClick={handleDeleteClick}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Excluir
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Avaliação de {formatDate(avaliacao.dataAvaliacao?.toDate())}
                </h2>
                <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-gray-600 mt-1">
                  <p>
                    <span className="font-medium">Aluno:</span> {aluno?.nome || avaliacao.alunoNome || 'N/A'}
                  </p>
                  {avaliacao.avaliador && (
                    <p>
                      <span className="font-medium">Avaliador:</span> {avaliacao.avaliador}
                    </p>
                  )}
                </div>
              </div>
              
              {avaliacaoAnterior && (
                <div className="text-sm text-gray-600 mt-2 sm:mt-0">
                  Comparando com avaliação de {formatDate(avaliacaoAnterior.dataAvaliacao?.toDate())}
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <div className="flex space-x-1 border-b">
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'composicao' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('composicao')}
                >
                  Composição Corporal
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'circunferencias' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('circunferencias')}
                >
                  Circunferências
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'testes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('testes')}
                >
                  Testes Físicos
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'observacoes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('observacoes')}
                >
                  Observações
                </button>
              </div>
              
              <div className="py-4">
                {activeTab === 'composicao' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Medidas Básicas</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-600">Peso</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{avaliacao.peso} kg</span>
                            {calcularVariacao('peso') !== null && (
                              <span className={`text-sm ${corVariacao('peso', true)}`}>
                                {parseFloat(calcularVariacao('peso')) < 0 ? '↓' : '↑'} 
                                {Math.abs(calcularVariacao('peso'))}%
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-600">Altura</span>
                          <span className="font-medium">{avaliacao.altura} cm</span>
                        </div>
                        
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-600">IMC</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{avaliacao.imc}</span>
                            {calcularVariacao('imc') !== null && (
                              <span className={`text-sm ${corVariacao('imc', true)}`}>
                                {parseFloat(calcularVariacao('imc')) < 0 ? '↓' : '↑'} 
                                {Math.abs(calcularVariacao('imc'))}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Composição Corporal</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-600">Percentual de Gordura</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{avaliacao.percentualGordura}%</span>
                            {calcularVariacao('percentualGordura') !== null && (
                              <span className={`text-sm ${corVariacao('percentualGordura', true)}`}>
                                {parseFloat(calcularVariacao('percentualGordura')) < 0 ? '↓' : '↑'} 
                                {Math.abs(calcularVariacao('percentualGordura'))}%
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-600">Massa Gorda</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{avaliacao.massaGorda} kg</span>
                            {calcularVariacao('massaGorda') !== null && (
                              <span className={`text-sm ${corVariacao('massaGorda', true)}`}>
                                {parseFloat(calcularVariacao('massaGorda')) < 0 ? '↓' : '↑'} 
                                {Math.abs(calcularVariacao('massaGorda'))}%
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-600">Massa Magra</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{avaliacao.massaMagra} kg</span>
                            {calcularVariacao('massaMagra') !== null && (
                              <span className={`text-sm ${corVariacao('massaMagra', false)}`}>
                                {parseFloat(calcularVariacao('massaMagra')) < 0 ? '↓' : '↑'} 
                                {Math.abs(calcularVariacao('massaMagra'))}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'circunferencias' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Circunferências</h3>
                    
                    {avaliacao.circunferencias && Object.keys(avaliacao.circunferencias).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(avaliacao.circunferencias).map(([key, value]) => {
                          // Verificar se há valor anterior para comparação
                          let variacao = null;
                          let corVar = 'text-gray-500';
                          
                          if (avaliacaoAnterior?.circunferencias && avaliacaoAnterior.circunferencias[key]) {
                            const atual = parseFloat(value);
                            const anterior = parseFloat(avaliacaoAnterior.circunferencias[key]);
                            
                            variacao = ((atual - anterior) / anterior * 100).toFixed(1);
                            
                            // Para circunferências, diminuir geralmente é positivo (exceto para braços talvez)
                            const ehBraco = key.toLowerCase().includes('braco');
                            corVar = ehBraco 
                              ? (parseFloat(variacao) > 0 ? 'text-green-600' : 'text-red-600')
                              : (parseFloat(variacao) < 0 ? 'text-green-600' : 'text-red-600');
                          }
                          
                          return (
                            <div key={key} className="flex justify-between border-b border-gray-200 pb-2">
                              <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{value} cm</span>
                                {variacao !== null && (
                                  <span className={`text-sm ${corVar}`}>
                                    {parseFloat(variacao) < 0 ? '↓' : '↑'} 
                                    {Math.abs(variacao)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Não há dados de circunferências nesta avaliação</p>
                    )}
                  </div>
                )}
                
                {activeTab === 'testes' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Testes Físicos</h3>
                    
                    {avaliacao.testes && Object.keys(avaliacao.testes).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(avaliacao.testes).map(([key, value]) => {
                          // Verificar se há valor anterior para comparação
                          let variacao = null;
                          let corVar = 'text-gray-500';
                          
                          if (avaliacaoAnterior?.testes && avaliacaoAnterior.testes[key]) {
                            const atual = parseFloat(value);
                            const anterior = parseFloat(avaliacaoAnterior.testes[key]);
                            
                            variacao = ((atual - anterior) / anterior * 100).toFixed(1);
                            
                            // Para testes físicos, melhorar (aumentar o número) geralmente é positivo
                            corVar = parseFloat(variacao) > 0 ? 'text-green-600' : 'text-red-600';
                          }
                          
                          return (
                            <div key={key} className="flex justify-between border-b border-gray-200 pb-2">
                              <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{value}</span>
                                {variacao !== null && (
                                  <span className={`text-sm ${corVar}`}>
                                    {parseFloat(variacao) < 0 ? '↓' : '↑'} 
                                    {Math.abs(variacao)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Não há dados de testes físicos nesta avaliação</p>
                    )}
                  </div>
                )}
                
                {activeTab === 'observacoes' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Observações e Recomendações</h3>
                    
                    {avaliacao.observacoes ? (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="whitespace-pre-line">{avaliacao.observacoes}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Não há observações nesta avaliação</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Próximos Passos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href={`/admin/avaliacoes/nova?alunoId=${avaliacao.alunoId}`}
              className="flex items-center justify-center p-4 border border-green-200 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Registrar Nova Avaliação
            </Link>
            
            <Link 
              href={`/admin/alunos/${avaliacao.alunoId}`}
              className="flex items-center justify-center p-4 border border-blue-200 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Ver Perfil do Aluno
            </Link>
          </div>
        </div>
      </div>
      
      {/* Modal de confirmação de exclusão */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Excluir Avaliação"
        message={`Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={deleting}
      />
      
      <ToastContainer position="top-right" autoClose={5000} />
    </Layout>
  );
} 