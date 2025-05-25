import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import Layout from '../../../../components/layout/Layout';
import { formatDate } from '../../../../utils/formatDate';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Importação dinâmica dos componentes de gráfico
const AdvancedProgressChart = dynamic(() => import('../../../../components/layout/charts/AdvancedProgressChart'), { ssr: false });
const ComparisonDashboard = dynamic(() => import('../../../../components/layout/charts/ComparisonDashboard'), { ssr: false });

export default function AdminAlunoEvolucaoAvancada() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, userType } = useAuth();
  const [aluno, setAluno] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('ultimos6Meses');
  const [activeView, setActiveView] = useState('dashboard');
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
            // Base da consulta de avaliações
            let avaliacoesQuery = query(
              collection(db, 'avaliacoes'),
              where('alunoId', '==', id),
              orderBy('dataAvaliacao', 'asc')
            );
            
            // Filtrar por período
            if (periodoSelecionado !== 'todasAvaliacoes') {
              const hoje = new Date();
              let dataLimite;
              
              if (periodoSelecionado === 'ultimos3Meses') {
                dataLimite = new Date(hoje.setMonth(hoje.getMonth() - 3));
              } else if (periodoSelecionado === 'ultimos6Meses') {
                dataLimite = new Date(hoje.setMonth(hoje.getMonth() - 6));
              } else if (periodoSelecionado === 'ultimoAno') {
                dataLimite = new Date(hoje.setFullYear(hoje.getFullYear() - 1));
              }
              
              avaliacoesQuery = query(
                collection(db, 'avaliacoes'),
                where('alunoId', '==', id),
                where('dataAvaliacao', '>=', dataLimite),
                orderBy('dataAvaliacao', 'asc')
              );
            }
            
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
            ...doc.data(),
            dataFormatada: formatDate(doc.data().dataAvaliacao?.toDate())
          }));
          
          // Aplicar filtro de período manualmente se necessário
          if (periodoSelecionado !== 'todasAvaliacoes' && avaliacoesSnapshot === simpleSnapshot) {
            const hoje = new Date();
            let dataLimite;
            
            if (periodoSelecionado === 'ultimos3Meses') {
              dataLimite = new Date(hoje.setMonth(hoje.getMonth() - 3));
            } else if (periodoSelecionado === 'ultimos6Meses') {
              dataLimite = new Date(hoje.setMonth(hoje.getMonth() - 6));
            } else if (periodoSelecionado === 'ultimoAno') {
              dataLimite = new Date(hoje.setFullYear(hoje.getFullYear() - 1));
            }
            
            avaliacoesData = avaliacoesData.filter(av => {
              const dataAvaliacao = av.dataAvaliacao?.toDate ? av.dataAvaliacao.toDate() : new Date(av.dataAvaliacao);
              return dataAvaliacao >= dataLimite;
            });
          }
          
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
  }, [id, currentUser, userType, periodoSelecionado]);

  // Preparar dados para gráficos individuais
  const prepararDadosMetrica = (metrica) => {
    if (avaliacoes.length === 0) return { labels: [], data: [] };
    
    const labels = avaliacoes.map(av => av.dataFormatada);
    let data = [];
    
    switch (metrica) {
      case 'peso':
        data = avaliacoes.map(av => av.peso || null);
        break;
      case 'gordura':
        data = avaliacoes.map(av => av.percentualGordura || null);
        break;
      case 'massaMagra':
        data = avaliacoes.map(av => av.massaMagra || null);
        break;
      case 'imc':
        data = avaliacoes.map(av => av.imc || null);
        break;
      default:
        data = avaliacoes.map(() => null);
    }
    
    return { labels, data };
  };

  // Configurações das métricas
  const metricas = {
    peso: {
      title: 'Evolução do Peso',
      unit: 'kg',
      color: '#3b82f6',
      goal: null
    },
    gordura: {
      title: 'Evolução do Percentual de Gordura',
      unit: '%',
      color: '#ef4444',
      goal: null
    },
    massaMagra: {
      title: 'Evolução da Massa Magra',
      unit: 'kg',
      color: '#10b981',
      goal: null
    },
    imc: {
      title: 'Evolução do IMC',
      unit: 'kg/m²',
      color: '#8b5cf6',
      goal: 25 // Meta exemplo para IMC
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                <span className="text-gray-600 text-sm">Evolução Avançada</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Evolução Avançada</h1>
              <p className="text-gray-600 mt-1">Análise detalhada do progresso de {aluno.nome}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                href={`/admin/alunos/${id}/evolucao`}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Visualização Simples
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
              <p className="text-sm text-gray-600">Objetivo</p>
              <p className="text-lg font-semibold text-gray-900">{aluno.objetivo || 'Não definido'}</p>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {/* Filtro de Período */}
            <div>
              <label htmlFor="periodo" className="block text-sm font-medium text-gray-700 mb-2">
                Período de Análise
              </label>
              <select
                id="periodo"
                value={periodoSelecionado}
                onChange={(e) => setPeriodoSelecionado(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
              >
                <option value="ultimos3Meses">Últimos 3 meses</option>
                <option value="ultimos6Meses">Últimos 6 meses</option>
                <option value="ultimoAno">Último ano</option>
                <option value="todasAvaliacoes">Todas as avaliações</option>
              </select>
            </div>

            {/* Tipo de Visualização */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Visualização
              </label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'dashboard'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveView('individual')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'individual'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Métricas Individuais
                </button>
              </div>
            </div>

            {/* Seletor de Métrica (apenas para vista individual) */}
            {activeView === 'individual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Métrica
                </label>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                >
                  <option value="peso">Peso</option>
                  <option value="gordura">% Gordura</option>
                  <option value="massaMagra">Massa Magra</option>
                  <option value="imc">IMC</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo Principal */}
        {avaliacoes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma avaliação encontrada</h3>
            <p className="text-gray-500 mb-4">
              Não há avaliações no período selecionado para visualizar a evolução.
            </p>
            <Link 
              href={`/admin/alunos/${id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Ver perfil do aluno
            </Link>
          </div>
        ) : (
          <div>
            {activeView === 'dashboard' ? (
              <ComparisonDashboard avaliacoes={avaliacoes} />
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6">
                <AdvancedProgressChart 
                  data={prepararDadosMetrica(selectedMetric)}
                  title={metricas[selectedMetric].title}
                  unit={metricas[selectedMetric].unit}
                  color={metricas[selectedMetric].color}
                  showGoal={metricas[selectedMetric].goal !== null}
                  goalValue={metricas[selectedMetric].goal}
                  showTrend={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Insights e Recomendações */}
        {avaliacoes.length >= 2 && (
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Insights de {aluno.nome}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Progresso Geral</h4>
                <p className="text-sm text-gray-600">
                  Com base em {avaliacoes.length} avaliações, {aluno.nome} mostra uma evolução que pode orientar as próximas estratégias de treinamento.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Recomendações</h4>
                <p className="text-sm text-gray-600">
                  Continue acompanhando regularmente as métricas para identificar padrões e otimizar os resultados do aluno.
                </p>
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
              href={`/admin/alunos/${id}/relatorio`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Gerar Relatório
            </Link>
            <Link 
              href={`/admin/alunos/${id}/evolucao`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Evolução Simples
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
} 