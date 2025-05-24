import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import { formatDate } from '../../utils/formatDate';
import dynamic from 'next/dynamic';

// Importação dinâmica dos componentes de gráfico
const ComposicaoCorporalChart = dynamic(() => import('../../components/layout/charts/ComposicaoCorporalChart'), { ssr: false });
const CircunferenciasChart = dynamic(() => import('../../components/layout/charts/CircunferenciasChart'), { ssr: false });
const TestesChart = dynamic(() => import('../../components/layout/charts/TestesChart'), { ssr: false });

export default function EvolucaoAluno() {
  const { currentUser } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('todasAvaliacoes');
  const [activeTab, setActiveTab] = useState('composicao');
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
          console.error('Erro ao buscar avaliações:', error);
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Evolução</h1>
        
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div>
                <label htmlFor="periodo" className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <select
                  id="periodo"
                  value={periodoSelecionado}
                  onChange={(e) => setPeriodoSelecionado(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="ultimos3Meses">Últimos 3 meses</option>
                  <option value="ultimos6Meses">Últimos 6 meses</option>
                  <option value="ultimoAno">Último ano</option>
                  <option value="todasAvaliacoes">Todas as avaliações</option>
                </select>
              </div>
              
              <div className="flex space-x-1">
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'composicao' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setActiveTab('composicao')}
                >
                  Composição Corporal
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'circunferencias' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setActiveTab('circunferencias')}
                >
                  Circunferências
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'testes' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setActiveTab('testes')}
                >
                  Testes Físicos
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-80">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : avaliacoes.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 mb-4">Nenhuma avaliação encontrada para visualizar evolução</p>
              </div>
            ) : avaliacoes.length === 1 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 mb-4">É necessário ter pelo menos duas avaliações para visualizar a evolução</p>
              </div>
            ) : (
              <div className="h-96 md:h-80 w-full">
                {activeTab === 'composicao' && dataSeries.composicao.datasets?.length > 0 && (
                  <ComposicaoCorporalChart data={dataSeries.composicao} />
                )}
                
                {activeTab === 'circunferencias' && dataSeries.circunferencias.datasets?.length > 0 && (
                  <CircunferenciasChart data={dataSeries.circunferencias} />
                )}
                
                {activeTab === 'testes' && dataSeries.testes.datasets?.length > 0 && (
                  <TestesChart data={dataSeries.testes} />
                )}
              </div>
            )}
            
            {avaliacoes.length > 1 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Resumo das Avaliações</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-2">Primeira Avaliação</h4>
                    <p className="text-sm text-gray-600 mb-1">Data: {avaliacoes[0].dataFormatada}</p>
                    <p className="text-sm text-gray-600 mb-1">Peso: {avaliacoes[0].peso} kg</p>
                    <p className="text-sm text-gray-600 mb-1">% Gordura: {avaliacoes[0].percentualGordura}%</p>
                    <p className="text-sm text-gray-600">IMC: {avaliacoes[0].imc}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-2">Última Avaliação</h4>
                    <p className="text-sm text-gray-600 mb-1">Data: {avaliacoes[avaliacoes.length - 1].dataFormatada}</p>
                    <p className="text-sm text-gray-600 mb-1">Peso: {avaliacoes[avaliacoes.length - 1].peso} kg</p>
                    <p className="text-sm text-gray-600 mb-1">% Gordura: {avaliacoes[avaliacoes.length - 1].percentualGordura}%</p>
                    <p className="text-sm text-gray-600">IMC: {avaliacoes[avaliacoes.length - 1].imc}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-2">Evolução Total</h4>
                    {(() => {
                      const primeiro = avaliacoes[0];
                      const ultimo = avaliacoes[avaliacoes.length - 1];
                      
                      const calcularVariacao = (campo) => {
                        if (!primeiro[campo] || !ultimo[campo]) return null;
                        const valorInicial = parseFloat(primeiro[campo]);
                        const valorFinal = parseFloat(ultimo[campo]);
                        return ((valorFinal - valorInicial) / valorInicial * 100).toFixed(1);
                      };
                      
                      const variPeso = calcularVariacao('peso');
                      const variGordura = calcularVariacao('percentualGordura');
                      const variMagra = calcularVariacao('massaMagra');
                      
                      return (
                        <>
                          <p className="text-sm text-gray-600 mb-1">
                            Peso: 
                            <span className={`ml-2 ${parseFloat(variPeso) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {parseFloat(variPeso) < 0 ? '↓' : '↑'} {Math.abs(variPeso)}%
                            </span>
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            % Gordura: 
                            <span className={`ml-2 ${parseFloat(variGordura) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {parseFloat(variGordura) < 0 ? '↓' : '↑'} {Math.abs(variGordura)}%
                            </span>
                          </p>
                          {variMagra && (
                            <p className="text-sm text-gray-600">
                              Massa Magra: 
                              <span className={`ml-2 ${parseFloat(variMagra) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {parseFloat(variMagra) > 0 ? '↑' : '↓'} {Math.abs(variMagra)}%
                              </span>
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}