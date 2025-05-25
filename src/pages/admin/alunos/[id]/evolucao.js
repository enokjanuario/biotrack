import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import Layout from '../../../../components/layout/Layout';
import Link from 'next/link';
import { formatDate } from '../../../../utils/formatDate';
import LineChart from '../../../../components/layout/charts/LineChart';

export default function AdminAlunoEvolucao() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, userType } = useAuth();
  const [aluno, setAluno] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('peso');

  useEffect(() => {
    const fetchData = async () => {
      if (id && currentUser?.uid) {
        try {
          setLoading(true);
          
          // Buscar dados do aluno
          const perfilQuery = query(collection(db, 'perfis'), where('userId', '==', id));
          const perfilSnapshot = await getDocs(perfilQuery);
          
          if (!perfilSnapshot.empty) {
            const perfilData = {
              id: perfilSnapshot.docs[0].id,
              ...perfilSnapshot.docs[0].data()
            };
            setAluno(perfilData);
          }
          
          // Buscar avaliações do aluno
          const simpleQuery = query(collection(db, 'avaliacoes'), where('alunoId', '==', id));
          const simpleSnapshot = await getDocs(simpleQuery);
          
          // Tentar buscar com orderBy, com fallback para busca simples
          let avaliacoesSnapshot;
          try {
            const avaliacoesQuery = query(
              collection(db, 'avaliacoes'),
              where('alunoId', '==', id),
              orderBy('dataAvaliacao', 'asc')
            );
            avaliacoesSnapshot = await getDocs(avaliacoesQuery);
          } catch (indexError) {
            if (indexError.code === 'failed-precondition' && indexError.message.includes('index')) {
              avaliacoesSnapshot = simpleSnapshot;
            } else {
              throw indexError;
            }
          }
          
          // Processar dados das avaliações
          let avaliacoesData = avaliacoesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Ordenar manualmente se necessário
          avaliacoesData = avaliacoesData.sort((a, b) => {
            const dataA = a.dataAvaliacao?.toDate ? a.dataAvaliacao.toDate() : new Date(a.dataAvaliacao);
            const dataB = b.dataAvaliacao?.toDate ? b.dataAvaliacao.toDate() : new Date(b.dataAvaliacao);
            return dataA - dataB; // Ordem crescente para evolução
          });
          
          setAvaliacoes(avaliacoesData);
        } catch (error) {
          console.error('Erro ao buscar dados:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (currentUser && userType === 'admin') {
      fetchData();
    } else if (currentUser && userType !== 'admin') {
      setLoading(false);
    } else if (!currentUser) {
      setLoading(false);
    }
  }, [id, currentUser, userType]);

  // Preparar dados para gráfico
  const prepararDadosGrafico = () => {
    if (avaliacoes.length === 0) return { labels: [], datasets: [] };

    const labels = avaliacoes.map(av => formatDate(av.dataAvaliacao?.toDate()));
    let data = [];
    let label = '';
    let borderColor = '#3b82f6';
    let backgroundColor = 'rgba(59, 130, 246, 0.1)';

    switch (selectedMetric) {
      case 'peso':
        data = avaliacoes.map(av => av.peso || null);
        label = 'Peso (kg)';
        borderColor = '#3b82f6';
        backgroundColor = 'rgba(59, 130, 246, 0.1)';
        break;
      case 'gordura':
        data = avaliacoes.map(av => av.percentualGordura || null);
        label = 'Gordura Corporal (%)';
        borderColor = '#ef4444';
        backgroundColor = 'rgba(239, 68, 68, 0.1)';
        break;
      case 'massaMagra':
        data = avaliacoes.map(av => av.massaMagra || null);
        label = 'Massa Magra (kg)';
        borderColor = '#10b981';
        backgroundColor = 'rgba(16, 185, 129, 0.1)';
        break;
      case 'imc':
        data = avaliacoes.map(av => av.imc || null);
        label = 'IMC';
        borderColor = '#8b5cf6';
        backgroundColor = 'rgba(139, 92, 246, 0.1)';
        break;
      default:
        data = avaliacoes.map(() => null);
    }

    return {
      labels,
      datasets: [{
        label,
        data,
        borderColor,
        backgroundColor,
        fill: true,
        tension: 0.3,
      }]
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Carregando dados de evolução...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Verificar permissões
  if (currentUser && userType !== 'admin') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Acesso Negado</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Apenas administradores podem ver esta página.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Não Autenticado</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Você precisa fazer login para acessar esta página.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!aluno) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Aluno não encontrado</h1>
            <Link href="/admin/alunos" className="text-blue-600 hover:text-blue-800">
              Voltar para lista de alunos
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link 
                  href="/admin/alunos"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ← Alunos
                </Link>
                <span className="text-gray-400">/</span>
                <Link 
                  href={`/admin/alunos/${id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {aluno.nome}
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600 text-sm">Evolução</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Evolução do Aluno</h1>
              <p className="text-gray-600 mt-1">Acompanhe o progresso de {aluno.nome}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                href={`/admin/alunos/${id}/evolucao-avancada`}
                className="px-3 py-2 text-sm border border-purple-300 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                Análise Avançada
              </Link>
              <Link 
                href={`/admin/alunos/${id}`}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Perfil do Aluno
              </Link>
            </div>
          </div>
        </div>

        {/* Informações do Aluno */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Nome</p>
              <p className="text-lg font-semibold text-gray-900">{aluno.nome}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Idade</p>
              <p className="text-lg font-semibold text-gray-900">{aluno.idade} anos</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Altura</p>
              <p className="text-lg font-semibold text-gray-900">{aluno.altura} cm</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total de Avaliações</p>
              <p className="text-lg font-semibold text-gray-900">{avaliacoes.length}</p>
            </div>
          </div>
        </div>

        {/* Seletor de Métrica */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Métrica para Visualização</h2>
              <p className="text-sm text-gray-600">Selecione qual métrica você deseja acompanhar</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMetric('peso')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedMetric === 'peso'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Peso
              </button>
              <button
                onClick={() => setSelectedMetric('gordura')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedMetric === 'gordura'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                % Gordura
              </button>
              <button
                onClick={() => setSelectedMetric('massaMagra')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedMetric === 'massaMagra'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Massa Magra
              </button>
              <button
                onClick={() => setSelectedMetric('imc')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedMetric === 'imc'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                IMC
              </button>
            </div>
          </div>
        </div>

        {/* Gráfico de Evolução */}
        {avaliacoes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma avaliação encontrada</h3>
            <p className="text-gray-500 mb-4">
              Este aluno ainda não possui avaliações registradas.
            </p>
            <Link 
              href={`/admin/avaliacoes/nova?alunoId=${id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Registrar Primeira Avaliação
            </Link>
          </div>
        ) : avaliacoes.length === 1 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Apenas uma avaliação</h3>
            <p className="text-gray-500 mb-4">
              É necessário ter pelo menos duas avaliações para visualizar a evolução.
            </p>
            <Link 
              href={`/admin/avaliacoes/nova?alunoId=${id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Registrar Nova Avaliação
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="h-96">
              <LineChart 
                data={prepararDadosGrafico()}
                title={`Evolução - ${aluno.nome}`}
              />
            </div>
            
            {/* Resumo */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo da Evolução</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{avaliacoes.length}</p>
                  <p className="text-sm text-gray-600">Total de Avaliações</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {Math.ceil((new Date(avaliacoes[avaliacoes.length - 1].dataAvaliacao?.toDate()) - 
                               new Date(avaliacoes[0].dataAvaliacao?.toDate())) / 
                               (1000 * 60 * 60 * 24))}
                  </p>
                  <p className="text-sm text-gray-600">Dias de Acompanhamento</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {(avaliacoes.length / Math.max(1, Math.ceil((new Date(avaliacoes[avaliacoes.length - 1].dataAvaliacao?.toDate()) - 
                               new Date(avaliacoes[0].dataAvaliacao?.toDate())) / 
                               (1000 * 60 * 60 * 24 * 30)))).toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Avaliações por Mês</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ações Rápidas */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="flex flex-wrap gap-3">
            <Link 
              href={`/admin/avaliacoes/nova?alunoId=${id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nova Avaliação
            </Link>
            <Link 
              href={`/admin/alunos/${id}/evolucao-avancada`}
              className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Análise Avançada
            </Link>
            <Link 
              href={`/admin/alunos/${id}/relatorio`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Gerar Relatório
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
} 