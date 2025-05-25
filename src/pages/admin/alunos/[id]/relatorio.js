import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import Layout from '../../../../components/layout/Layout';
import Link from 'next/link';
import { formatDate } from '../../../../utils/formatDate';
import { generatePDFReport, generateChartPDF } from '../../../../utils/pdfGenerator';
import { prepararDadosFotosParaExibicao } from '../../../../utils/imageUploadLocal';
import dynamic from 'next/dynamic';

// Importação dinâmica para evitar problemas de SSR
const LineChart = dynamic(() => import('../../../../components/layout/charts/LineChart'), { ssr: false });

export default function RelatorioAluno() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, userType } = useAuth();
  const [aluno, setAluno] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [stats, setStats] = useState({});
  const chartRefs = useRef({});

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
          let avaliacoesData = avaliacoesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Processar fotos se existirem
              fotos: data.fotos ? prepararDadosFotosParaExibicao(data.fotos) : null
            };
          });
          
          // Ordenar manualmente se necessário
          avaliacoesData = avaliacoesData.sort((a, b) => {
            const dataA = a.dataAvaliacao?.toDate ? a.dataAvaliacao.toDate() : new Date(a.dataAvaliacao);
            const dataB = b.dataAvaliacao?.toDate ? b.dataAvaliacao.toDate() : new Date(b.dataAvaliacao);
            return dataA - dataB;
          });
          
          setAvaliacoes(avaliacoesData);
          
          // Calcular estatísticas
          if (avaliacoesData.length > 0) {
            const primeira = avaliacoesData[0];
            const ultima = avaliacoesData[avaliacoesData.length - 1];
            
            const statsData = {
              totalAvaliacoes: avaliacoesData.length,
              periodoMonitoramento: primeira && ultima ? 
                Math.ceil((ultima.dataAvaliacao?.toDate() - primeira.dataAvaliacao?.toDate()) / (1000 * 60 * 60 * 24)) : 0,
              variacaoPeso: primeira?.peso && ultima?.peso ? 
                (ultima.peso - primeira.peso) : 0,
              variacaoGordura: primeira?.percentualGordura && ultima?.percentualGordura ? 
                (ultima.percentualGordura - primeira.percentualGordura) : 0,
              variacaoIMC: primeira?.imc && ultima?.imc ? 
                (ultima.imc - primeira.imc) : 0,
              variacaoMassaMagra: primeira?.massaMagra && ultima?.massaMagra ? 
                (ultima.massaMagra - primeira.massaMagra) : 0,
              mediaIMC: avaliacoesData.reduce((acc, av) => acc + (av.imc || 0), 0) / avaliacoesData.length,
              mediaPeso: avaliacoesData.reduce((acc, av) => acc + (av.peso || 0), 0) / avaliacoesData.length,
              primeiraAvaliacao: primeira?.dataAvaliacao ? formatDate(primeira.dataAvaliacao?.toDate()) : null,
              ultimaAvaliacao: ultima?.dataAvaliacao ? formatDate(ultima.dataAvaliacao?.toDate()) : null
            };
            
            setStats(statsData);
          }
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

  // Preparar dados para gráficos
  const prepararDadosGraficos = () => {
    if (avaliacoes.length === 0) return { peso: null, gordura: null, imc: null };

    const labels = avaliacoes.map(av => formatDate(av.dataAvaliacao?.toDate()));

    const pesoData = {
      labels,
      datasets: [{
        label: 'Peso (kg)',
        data: avaliacoes.map(av => av.peso || null),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
      }]
    };

    const gorduraData = {
      labels,
      datasets: [{
        label: 'Gordura Corporal (%)',
        data: avaliacoes.map(av => av.percentualGordura || null),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.3,
      }]
    };

    const imcData = {
      labels,
      datasets: [{
        label: 'IMC',
        data: avaliacoes.map(av => av.imc || null),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
      }]
    };

    return { peso: pesoData, gordura: gorduraData, imc: imcData };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true);
      await generatePDFReport(aluno, avaliacoes, stats);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleGenerateChartPDF = async (chartType) => {
    try {
      const chartElement = chartRefs.current[chartType];
      if (!chartElement) {
        alert('Gráfico não encontrado. Tente novamente.');
        return;
      }

      const chartTitles = {
        peso: 'Evolução do Peso',
        gordura: 'Evolução do Percentual de Gordura',
        imc: 'Evolução do IMC'
      };

      await generateChartPDF(chartElement, aluno, chartTitles[chartType]);
    } catch (error) {
      console.error('Erro ao gerar PDF do gráfico:', error);
      alert('Erro ao gerar PDF do gráfico. Tente novamente.');
    }
  };

  const getVariacaoColor = (valor) => {
    if (!valor) return 'text-gray-500';
    const num = parseFloat(valor);
    if (num > 0) return 'text-red-600';
    if (num < 0) return 'text-green-600';
    return 'text-gray-500';
  };

  const getVariacaoIcon = (valor) => {
    if (!valor) return null;
    const num = parseFloat(valor);
    if (num > 0) return '↗';
    if (num < 0) return '↘';
    return '→';
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
              <p className="text-gray-600">Gerando relatório...</p>
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

  const graficos = prepararDadosGraficos();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header - não impresso */}
        <div className="mb-8 print:hidden">
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
                <span className="text-gray-600 text-sm">Relatório</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Relatório de Evolução</h1>
              <p className="text-gray-600 mt-1">Relatório completo de {aluno.nome}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGeneratePDF}
                disabled={generatingPDF}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPDF ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Gerar PDF
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir
              </button>
              <Link 
                href={`/admin/alunos/${id}`}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voltar ao Perfil
              </Link>
            </div>
          </div>
        </div>

        {/* Conteúdo do Relatório */}
        <div className="bg-white rounded-lg shadow-md p-8 print:shadow-none print:p-0">
          
          {/* Cabeçalho do Relatório */}
          <div className="border-b border-gray-200 pb-6 mb-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">RELATÓRIO DE EVOLUÇÃO FÍSICA</h1>
              <p className="text-lg text-gray-600">Acompanhamento Profissional de Composição Corporal</p>
              <p className="text-sm text-gray-500 mt-2">Gerado em {formatDate(new Date())}</p>
            </div>
            
            {/* Informações do Aluno */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Pessoais</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Nome:</span> {aluno.nome}</p>
                  <p><span className="font-medium">Idade:</span> {aluno.idade} anos</p>
                  <p><span className="font-medium">Sexo:</span> {aluno.sexo === 'M' ? 'Masculino' : aluno.sexo === 'F' ? 'Feminino' : 'Não informado'}</p>
                  <p><span className="font-medium">Altura:</span> {aluno.altura} cm</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Acompanhamento</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Objetivo:</span> {aluno.objetivo || 'Não definido'}</p>
                  <p><span className="font-medium">Total de Avaliações:</span> {stats.totalAvaliacoes || 0}</p>
                  <p><span className="font-medium">Primeira Avaliação:</span> {stats.primeiraAvaliacao || 'N/A'}</p>
                  <p><span className="font-medium">Última Avaliação:</span> {stats.ultimaAvaliacao || 'N/A'}</p>
                  <p><span className="font-medium">Período de Acompanhamento:</span> {stats.periodoMonitoramento || 0} dias</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo Executivo */}
          {avaliacoes.length > 1 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumo Executivo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Variação de Peso</p>
                      <p className={`text-2xl font-bold ${getVariacaoColor(stats.variacaoPeso)}`}>
                        {stats.variacaoPeso ? `${stats.variacaoPeso > 0 ? '+' : ''}${stats.variacaoPeso.toFixed(1)} kg` : 'N/A'}
                      </p>
                    </div>
                    <span className="text-2xl">{getVariacaoIcon(stats.variacaoPeso)}</span>
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Variação % Gordura</p>
                      <p className={`text-2xl font-bold ${getVariacaoColor(stats.variacaoGordura)}`}>
                        {stats.variacaoGordura ? `${stats.variacaoGordura > 0 ? '+' : ''}${stats.variacaoGordura.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                    <span className="text-2xl">{getVariacaoIcon(stats.variacaoGordura)}</span>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Variação IMC</p>
                      <p className={`text-2xl font-bold ${getVariacaoColor(stats.variacaoIMC)}`}>
                        {stats.variacaoIMC ? `${stats.variacaoIMC > 0 ? '+' : ''}${stats.variacaoIMC.toFixed(1)}` : 'N/A'}
                      </p>
                    </div>
                    <span className="text-2xl">{getVariacaoIcon(stats.variacaoIMC)}</span>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Variação Massa Magra</p>
                      <p className={`text-2xl font-bold ${getVariacaoColor(stats.variacaoMassaMagra)}`}>
                        {stats.variacaoMassaMagra ? `${stats.variacaoMassaMagra > 0 ? '+' : ''}${stats.variacaoMassaMagra.toFixed(1)} kg` : 'N/A'}
                      </p>
                    </div>
                    <span className="text-2xl">{getVariacaoIcon(stats.variacaoMassaMagra)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gráficos de Evolução */}
          {avaliacoes.length > 1 && (
            <div className="mb-8 print:break-before-page">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Gráficos de Evolução</h2>
              
              <div className="space-y-8">
                {graficos.peso && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Evolução do Peso</h3>
                      <button
                        onClick={() => handleGenerateChartPDF('peso')}
                        className="print:hidden px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        PDF do Gráfico
                      </button>
                    </div>
                    <div 
                      className="h-64"
                      ref={el => chartRefs.current.peso = el}
                    >
                      <LineChart data={graficos.peso} title="Peso (kg)" />
                    </div>
                  </div>
                )}
                
                {graficos.gordura && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Evolução do Percentual de Gordura</h3>
                      <button
                        onClick={() => handleGenerateChartPDF('gordura')}
                        className="print:hidden px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        PDF do Gráfico
                      </button>
                    </div>
                    <div 
                      className="h-64"
                      ref={el => chartRefs.current.gordura = el}
                    >
                      <LineChart data={graficos.gordura} title="Gordura Corporal (%)" />
                    </div>
                  </div>
                )}
                
                {graficos.imc && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Evolução do IMC</h3>
                      <button
                        onClick={() => handleGenerateChartPDF('imc')}
                        className="print:hidden px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        PDF do Gráfico
                      </button>
                    </div>
                    <div 
                      className="h-64"
                      ref={el => chartRefs.current.imc = el}
                    >
                      <LineChart data={graficos.imc} title="IMC" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Histórico de Avaliações */}
          {avaliacoes.length > 0 && (
            <div className="mb-8 print:break-before-page">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Histórico Detalhado de Avaliações</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peso (kg)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Gordura</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Massa Magra (kg)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {avaliacoes.map((avaliacao, index) => (
                      <tr key={avaliacao.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDate(avaliacao.dataAvaliacao?.toDate())}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {avaliacao.peso?.toFixed(1) || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {avaliacao.imc?.toFixed(1) || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {avaliacao.percentualGordura?.toFixed(1) || '-'}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {avaliacao.massaMagra?.toFixed(1) || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {avaliacao.observacoes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Análise e Recomendações */}
          {avaliacoes.length > 1 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Análise e Recomendações</h2>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Observações do Período</h3>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>• <strong>Duração do acompanhamento:</strong> {stats.periodoMonitoramento} dias com {stats.totalAvaliacoes} avaliações realizadas.</p>
                  <p>• <strong>Frequência de avaliações:</strong> {(stats.totalAvaliacoes / Math.max(1, Math.ceil(stats.periodoMonitoramento / 30))).toFixed(1)} avaliações por mês.</p>
                  {stats.variacaoPeso !== 0 && (
                    <p>• <strong>Tendência de peso:</strong> {stats.variacaoPeso > 0 ? 'Ganho' : 'Perda'} de {Math.abs(stats.variacaoPeso).toFixed(1)} kg no período.</p>
                  )}
                  {stats.variacaoGordura !== 0 && (
                    <p>• <strong>Composição corporal:</strong> {stats.variacaoGordura > 0 ? 'Aumento' : 'Redução'} de {Math.abs(stats.variacaoGordura).toFixed(1)}% na gordura corporal.</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Recomendações</h3>
                <div className="text-sm text-green-800 space-y-2">
                  <p>• Manter regularidade nas avaliações para acompanhamento preciso da evolução.</p>
                  <p>• Considerar fatores externos que podem influenciar os resultados (hidratação, horário, etc.).</p>
                  <p>• Ajustar estratégias de treinamento e nutrição baseadas nos dados coletados.</p>
                  <p>• Documentar observações específicas a cada avaliação para melhor contexto dos resultados.</p>
                </div>
              </div>
            </div>
          )}

          {/* Sem avaliações */}
          {avaliacoes.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma avaliação encontrada</h3>
              <p className="text-gray-500 mb-4">
                Este aluno ainda não possui avaliações registradas para gerar o relatório.
              </p>
            </div>
          )}

          {/* Rodapé do Relatório */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <div className="text-center text-sm text-gray-500">
              <p>Relatório gerado automaticamente pelo Sistema de Avaliação Física</p>
              <p>Data de geração: {formatDate(new Date())} | Profissional responsável: Administrador</p>
              <p className="mt-2 text-xs">
                Este relatório contém informações confidenciais e deve ser tratado com sigilo profissional.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos para impressão */}
      <style jsx>{`
        @media print {
          body {
            print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .print\\:break-before-page {
            break-before: page;
          }
          
          .container {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </Layout>
  );
} 