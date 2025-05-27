import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, startAfter, limit, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';
import { formatDate } from '../../../utils/formatDate';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminAvaliacoes() {
  const { currentUser } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alunoFilter, setAlunoFilter] = useState('');
  const [periodo, setPeriodo] = useState('todas');
  const [alunos, setAlunos] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [avaliacaoToDelete, setAvaliacaoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchAlunos = async () => {
      if (!currentUser) return;
      
      try {
        const alunosQuery = query(
          collection(db, 'usuarios'),
          where('tipo', '==', 'aluno'),
          orderBy('nome')
        );
        
        const alunosSnapshot = await getDocs(alunosQuery);
        const alunosData = alunosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAlunos(alunosData);
      } catch (error) {
        console.error('Erro ao buscar alunos:', error);
        setError('Falha ao carregar lista de alunos: ' + error.message);
      }
    };
    
    fetchAlunos();
  }, [currentUser]);

  const fetchAvaliacoes = async (reset = false) => {
    if (!currentUser) return;
    
    try {
      if (reset) {
        setLoading(true);
        setLastVisible(null);
      } else {
        setLoadingMore(true);
      }
      
      let conditions = [];
      
      if (alunoFilter) {
        conditions.push(where('alunoId', '==', alunoFilter));
      }
      
      if (periodo !== 'todas') {
        const now = new Date();
        let startDate;
        
        if (periodo === 'ultimoMes') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        } else if (periodo === 'ultimos3Meses') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        } else if (periodo === 'ultimos6Meses') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        }
        
        conditions.push(where('dataAvaliacao', '>=', startDate));
      }
      
      conditions.push(orderBy('dataAvaliacao', 'desc'));
      
      if (!reset && lastVisible) {
        conditions.push(startAfter(lastVisible));
      }
      
      conditions.push(limit(PAGE_SIZE));
      
      // Executar a consulta
      const avaliacoesQuery = query(collection(db, 'avaliacoes'), ...conditions);
      
      const avaliacoesSnapshot = await getDocs(avaliacoesQuery);
      
      // Verificar se tem mais resultados
      setHasMore(avaliacoesSnapshot.size === PAGE_SIZE);
      
      // Atualizar o último documento visível para paginação
      if (avaliacoesSnapshot.docs.length > 0) {
        setLastVisible(avaliacoesSnapshot.docs[avaliacoesSnapshot.docs.length - 1]);
      } else {
        setLastVisible(null);
      }
      
      // Processar os resultados
      let avaliacoesData = avaliacoesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      
      // Para cada avaliação, buscar o nome do aluno se necessário
      const avaliacoesPromises = avaliacoesData.map(async (avaliacao) => {
        if (!avaliacao.alunoNome && avaliacao.alunoId) {
          try {
            // Primeiro, tentar buscar usando o ID diretamente
            const alunoDoc = await getDoc(doc(db, 'usuarios', avaliacao.alunoId));
            
            if (alunoDoc.exists()) {
              avaliacao.alunoNome = alunoDoc.data().nome;
            } else {
              // Tentar buscar por uid
              const alunosQuery = query(
                collection(db, 'usuarios'),
                where('uid', '==', avaliacao.alunoId)
              );
              
              const alunosSnapshot = await getDocs(alunosQuery);
              
              if (!alunosSnapshot.empty) {
                avaliacao.alunoNome = alunosSnapshot.docs[0].data().nome;
              } else {
              }
            }
          } catch (error) {
            console.error(`Erro ao buscar nome do aluno para avaliação ${avaliacao.id}:`, error);
          }
        }
        return avaliacao;
      });
      
      avaliacoesData = await Promise.all(avaliacoesPromises);
      
      if (reset) {
        setAvaliacoes(avaliacoesData);
      } else {
        setAvaliacoes(prev => [...prev, ...avaliacoesData]);
      }
      
      setError(null); // Limpar erro se a consulta for bem-sucedida
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      setError('Falha ao carregar avaliações: ' + error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAvaliacoes(true);
    }
  }, [currentUser, alunoFilter, periodo]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchAvaliacoes(false);
    }
  };

  // Função para formatação de métricas
  const formatMetrica = (valor) => {
    return valor ? valor.toString() : '-';
  };

  // Função para abrir modal de confirmação de exclusão
  const handleDeleteClick = (avaliacao) => {
    setAvaliacaoToDelete(avaliacao);
    setShowDeleteModal(true);
  };

  // Função para fechar modal de exclusão
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAvaliacaoToDelete(null);
  };

  // Função para confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!avaliacaoToDelete) return;

    try {
      setDeleting(true);
      
      // Excluir a avaliação do Firestore
      await deleteDoc(doc(db, 'avaliacoes', avaliacaoToDelete.id));
      
      // Remover da lista local
      setAvaliacoes(prev => prev.filter(av => av.id !== avaliacaoToDelete.id));
      
      // Fechar modal
      setShowDeleteModal(false);
      setAvaliacaoToDelete(null);
      
      // Mostrar mensagem de sucesso
      toast.success('Avaliação excluída com sucesso!');
      
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      toast.error('Erro ao excluir avaliação. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Avaliações Físicas</h1>
          <Link 
            href="/admin/avaliacoes/nova"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Avaliação
          </Link>
        </div>
        
        {error && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="alunoFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por aluno
                </label>
                <select
                  id="alunoFilter"
                  value={alunoFilter}
                  onChange={(e) => setAlunoFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Todos os alunos</option>
                  {alunos.map(aluno => (
                    <option key={aluno.id} value={aluno.id}>
                      {aluno.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="periodo" className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <select
                  id="periodo"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="todas">Todas as avaliações</option>
                  <option value="ultimoMes">Último mês</option>
                  <option value="ultimos3Meses">Últimos 3 meses</option>
                  <option value="ultimos6Meses">Últimos 6 meses</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setAlunoFilter('');
                    setPeriodo('todas');
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : avaliacoes.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-gray-500 text-lg">
                Nenhuma avaliação encontrada
              </p>
              <div className="mt-6">
                <Link 
                  href="/admin/avaliacoes/nova"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Registrar primeira avaliação
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aluno
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Peso (kg)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % Gordura
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IMC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {avaliacoes.map((avaliacao) => (
                      <tr key={avaliacao.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {avaliacao.dataAvaliacao?.toDate ? formatDate(avaliacao.dataAvaliacao.toDate()) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {avaliacao.alunoNome || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatMetrica(avaliacao.peso)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {avaliacao.percentualGordura ? `${avaliacao.percentualGordura}%` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatMetrica(avaliacao.imc)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center justify-center space-x-2">
                            <Link
                              href={`/admin/avaliacoes/${avaliacao.id}`}
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-full transition-colors inline-flex items-center justify-center"
                              title="Ver detalhes da avaliação"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            <Link 
                              href={`/admin/avaliacoes/editar/${avaliacao.id}`}
                              className="text-yellow-600 hover:text-yellow-900 p-2 hover:bg-yellow-50 rounded-full transition-colors inline-flex items-center justify-center"
                              title="Editar avaliação"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <Link 
                              href={`/admin/avaliacoes/nova?alunoId=${avaliacao.alunoId}`}
                              className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-full transition-colors inline-flex items-center justify-center"
                              title="Registrar nova avaliação para este aluno"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(avaliacao)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors inline-flex items-center justify-center"
                              title="Excluir avaliação"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {hasMore && (
                <div className="py-4 px-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      loadingMore ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loadingMore ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Carregando...
                      </>
                    ) : (
                      'Carregar mais'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de confirmação de exclusão */}
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Excluir Avaliação"
          message={`Tem certeza que deseja excluir a avaliação de ${avaliacaoToDelete?.alunoNome || 'este aluno'} do dia ${
            avaliacaoToDelete?.dataAvaliacao?.toDate 
              ? formatDate(avaliacaoToDelete.dataAvaliacao.toDate()) 
              : 'N/A'
          }? Esta ação não pode ser desfeita.`}
          confirmText="Excluir Avaliação"
          isLoading={deleting}
        />

        {/* Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Layout>
  );
} 
