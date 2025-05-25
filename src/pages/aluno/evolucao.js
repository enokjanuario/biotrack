import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import { formatDate } from '../../utils/formatDate';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Importação dinâmica dos componentes de gráfico
const ComposicaoCorporalChart = dynamic(() => import('../../components/layout/charts/ComposicaoCorporalChart'), { ssr: false });
const CircunferenciasChart = dynamic(() => import('../../components/layout/charts/CircunferenciasChart'), { ssr: false });
const TestesChart = dynamic(() => import('../../components/layout/charts/TestesChart'), { ssr: false });
const AdvancedProgressChart = dynamic(() => import('../../components/layout/charts/AdvancedProgressChart'), { ssr: false });
const ComparisonDashboard = dynamic(() => import('../../components/layout/charts/ComparisonDashboard'), { ssr: false });

export default function EvolucaoCompleta() {
  const { currentUser } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('ultimos6Meses');
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, basico, avancado
  const [activeTab, setActiveTab] = useState('composicao');
  const [selectedMetric, setSelectedMetric] = useState('peso');
  const [dataSeries, setDataSeries] = useState({
    composicao: [],
    circunferencias: [],
    testes: []
  });

  useEffect(() => {
    const fetchAvaliacoes = async () => {
      if (currentUser?.uid) {
        try {
          setLoading(true);
          
          // Base da consulta
          let avaliacoesQuery = query(
            collection(db, 'avaliacoes'),
            where('alunoId', '==', currentUser.uid),
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
              where('alunoId', '==', currentUser.uid),
              where('dataAvaliacao', '>=', dataLimite),
              orderBy('dataAvaliacao', 'asc')
            );
          }
          
          const avaliacoesSnapshot = await getDocs(avaliacoesQuery);
          
          const avaliacoesData = avaliacoesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            dataFormatada: formatDate(doc.data().dataAvaliacao?.toDate())
          }));
          
          setAvaliacoes(avaliacoesData);
          
          // Preparar dados para os gráficos
          prepararDadosGraficos(avaliacoesData);
        } catch (error) {
          // Erro removido - sem console.log
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAvaliacoes();
  }, [currentUser, periodoSelecionado]);

  // Função para preparar dados para os gráficos
  const prepararDadosGraficos = (avaliacoesData) => {
    // Dados para gráfico de composição corporal
    const dadosComposicao = {
      labels: avaliacoesData.map(av => av.dataFormatada),
      datasets: [
        {
          label: 'Peso (kg)',
          data: avaliacoesData.map(av => av.peso),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          yAxisID: 'y',
        },
        {
          label: '% Gordura',
          data: avaliacoesData.map(av => av.percentualGordura),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          yAxisID: 'y1',
        },
        {
          label: 'Massa Magra (kg)',
          data: avaliacoesData.map(av => av.massaMagra),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          yAxisID: 'y',
        }
      ]
    };
    
    // Verificar se há dados de circunferências para montar o gráfico
    const circunferenciasDisponiveis = {};
    let temCircunferencias = false;
    
    // Primeiro, identifique todas as circunferências disponíveis em todas as avaliações
    avaliacoesData.forEach(av => {
      if (av.circunferencias) {
        temCircunferencias = true;
        Object.keys(av.circunferencias).forEach(circ => {
          circunferenciasDisponiveis[circ] = true;
        });
      }
    });
    
    // Cores para usar nos datasets
    const cores = [
      { borderColor: 'rgb(53, 162, 235)', backgroundColor: 'rgba(53, 162, 235, 0.5)' },
      { borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)' },
      { borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)' },
      { borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.5)' },
      { borderColor: 'rgb(153, 102, 255)', backgroundColor: 'rgba(153, 102, 255, 0.5)' },
      { borderColor: 'rgb(201, 203, 207)', backgroundColor: 'rgba(201, 203, 207, 0.5)' }
    ];
    
    // Crie um dataset para cada circunferência
    const datasetsCircunferencias = Object.keys(circunferenciasDisponiveis).map((circ, index) => {
      const cor = cores[index % cores.length];
      return {
        label: circ.replace(/([A-Z])/g, ' $1').trim(), // Formatar nome para exibição
        data: avaliacoesData.map(av => av.circunferencias?.[circ] || null),
        borderColor: cor.borderColor,
        backgroundColor: cor.backgroundColor,
      };
    });
    
    const dadosCircunferencias = {
      labels: avaliacoesData.map(av => av.dataFormatada),
      datasets: datasetsCircunferencias
    };
    
    // Verificar se há dados de testes para montar o gráfico
    const testesDisponiveis = {};
    let temTestes = false;
    
    // Identificar todos os testes disponíveis
    avaliacoesData.forEach(av => {
      if (av.testes) {
        temTestes = true;
        Object.keys(av.testes).forEach(teste => {
          testesDisponiveis[teste] = true;
        });
      }
    });
    
    // Crie um dataset para cada teste
    const datasetsTestes = Object.keys(testesDisponiveis).map((teste, index) => {
      const cor = cores[index % cores.length];
      return {
        label: teste.replace(/([A-Z])/g, ' $1').trim(), // Formatar nome para exibição
        data: avaliacoesData.map(av => av.testes?.[teste] || null),
        borderColor: cor.borderColor,
        backgroundColor: cor.backgroundColor,
      };
    });
    
    const dadosTestes = {
      labels: avaliacoesData.map(av => av.dataFormatada),
      datasets: datasetsTestes
    };
    
    setDataSeries({
      composicao: dadosComposicao,
      circunferencias: dadosCircunferencias,
      testes: dadosTestes
    });
  };

  // Preparar dados para gráficos individuais (análise avançada)
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
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Carregando dados de evolução...</p>
            </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Análise de Evolução</h1>
              <p className="text-gray-600 mt-1">Acompanhe seu progresso físico de forma completa</p>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                href="/aluno/dashboard"
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
        
        {/* Controles */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
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
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'dashboard' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveView('basico')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'basico' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Básico
                </button>
                <button
                  onClick={() => setActiveView('avancado')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'avancado' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Avançado
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo baseado na visualização selecionada */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            <ComparisonDashboard avaliacoes={avaliacoes} />
          </div>
        )}

        {activeView === 'basico' && (
          <div className="space-y-6">
            {/* Abas de navegação */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('composicao')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'composicao'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Composição Corporal
                  </button>
                  <button
                    onClick={() => setActiveTab('circunferencias')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'circunferencias'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Circunferências
                  </button>
                  <button
                    onClick={() => setActiveTab('testes')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'testes'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Testes
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'composicao' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Evolução da Composição Corporal</h3>
                    {dataSeries.composicao.labels?.length > 0 ? (
                      <ComposicaoCorporalChart data={dataSeries.composicao} />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum dado de composição corporal encontrado para o período selecionado.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'circunferencias' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Evolução das Circunferências</h3>
                    {dataSeries.circunferencias.labels?.length > 0 && dataSeries.circunferencias.datasets?.length > 0 ? (
                      <CircunferenciasChart data={dataSeries.circunferencias} />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum dado de circunferências encontrado para o período selecionado.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'testes' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Evolução dos Testes</h3>
                    {dataSeries.testes.labels?.length > 0 && dataSeries.testes.datasets?.length > 0 ? (
                      <TestesChart data={dataSeries.testes} />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum dado de testes encontrado para o período selecionado.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'avancado' && (
          <div className="space-y-6">
            {/* Seletor de Métrica */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(metricas).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedMetric(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedMetric === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {config.title}
                  </button>
                ))}
              </div>

              {/* Gráfico Individual da Métrica */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {metricas[selectedMetric]?.title}
                </h3>
                {avaliacoes.length > 0 ? (
                  <AdvancedProgressChart 
                    data={prepararDadosMetrica(selectedMetric)}
                    metrica={metricas[selectedMetric]}
                    avaliacoes={avaliacoes}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma avaliação encontrada para o período selecionado.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resumo estatístico */}
        <div className="bg-white rounded-lg shadow-md mt-6">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo do Período</h3>
            
            {avaliacoes.length >= 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['peso', 'percentualGordura', 'massaMagra', 'imc'].map(campo => {
                  const calcularVariacao = (campo) => {
                    if (avaliacoes.length < 2) return { valor: 0, percentual: 0 };
                    
                    const primeira = avaliacoes[0][campo] || 0;
                    const ultima = avaliacoes[avaliacoes.length - 1][campo] || 0;
                    const variacao = ultima - primeira;
                    const percentual = primeira !== 0 ? (variacao / primeira) * 100 : 0;
                    
                    return { valor: variacao, percentual };
                  };

                  const variacao = calcularVariacao(campo);
                  const labels = {
                    peso: 'Peso',
                    percentualGordura: '% Gordura',
                    massaMagra: 'Massa Magra',
                    imc: 'IMC'
                  };
                  const unidades = {
                    peso: 'kg',
                    percentualGordura: '%',
                    massaMagra: 'kg',
                    imc: ''
                  };

                  return (
                    <div key={campo} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700">{labels[campo]}</h4>
                      <div className="mt-2">
                        <div className={`text-lg font-semibold ${
                          variacao.valor > 0 ? 'text-green-600' : variacao.valor < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {variacao.valor > 0 ? '+' : ''}{variacao.valor.toFixed(1)}{unidades[campo]}
                        </div>
                        <div className={`text-sm ${
                          variacao.percentual > 0 ? 'text-green-600' : variacao.percentual < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {variacao.percentual > 0 ? '+' : ''}{variacao.percentual.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {avaliacoes.length < 2 && (
              <div className="text-center py-8 text-gray-500">
                É necessário ter pelo menos 2 avaliações para calcular a evolução.
              </div>
            )}
            
            {avaliacoes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma avaliação encontrada para o período selecionado.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}