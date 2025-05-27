import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import { formatDate } from '../../utils/formatDate';
import dynamic from 'next/dynamic';

// Importação dinâmica para evitar problemas de SSR
const LineChart = dynamic(() => import('../../components/layout/charts/LineChart'), { ssr: false });
const BarChart = dynamic(() => import('../../components/layout/charts/BarChart'), { ssr: false });
const PieChart = dynamic(() => import('../../components/layout/charts/PieChart'), { ssr: false });

export default function RelatoriosGerenciais() {
  const router = useRouter();
  const { currentUser, userType } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState({
    alunos: [],
    avaliacoes: [],
    kpis: {},
    tendencias: {},
    distribuicoes: {}
  });
  const [periodoFiltro, setPeriodoFiltro] = useState('30'); // dias
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    if (currentUser && userType === 'admin') {
      carregarDados();
    }
  }, [currentUser, userType, periodoFiltro, dataInicio, dataFim]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // Calcular datas do período
      const agora = new Date();
      let inicioConsulta = new Date();
      
      if (dataInicio && dataFim) {
        inicioConsulta = new Date(dataInicio);
        agora.setTime(new Date(dataFim).getTime());
      } else {
        inicioConsulta.setDate(agora.getDate() - parseInt(periodoFiltro));
      }

      // Buscar todos os alunos
      const alunosSnapshot = await getDocs(collection(db, 'usuarios'));
      const todosAlunos = alunosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtrar apenas alunos (não admins)
      const alunos = todosAlunos.filter(usuario => 
        usuario.userType === 'aluno' || !usuario.userType
      );

      // Buscar todas as avaliações do período
      const avaliacoesQuery = query(
        collection(db, 'avaliacoes'),
        where('dataAvaliacao', '>=', Timestamp.fromDate(inicioConsulta)),
        where('dataAvaliacao', '<=', Timestamp.fromDate(agora)),
        orderBy('dataAvaliacao', 'desc')
      );
      
      const avaliacoesSnapshot = await getDocs(avaliacoesQuery);
      const avaliacoes = avaliacoesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calcular KPIs e análises
      const kpis = calcularKPIs(alunos, avaliacoes, inicioConsulta, agora);
      const tendencias = calcularTendencias(avaliacoes);
      const distribuicoes = calcularDistribuicoes(alunos, avaliacoes);

      setDados({
        alunos,
        avaliacoes,
        kpis,
        tendencias,
        distribuicoes
      });

    } catch (error) {
      console.error('Erro ao carregar dados dos relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularKPIs = (alunos, avaliacoes, dataInicio, dataFim) => {
    const diasPeriodo = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24));
    const alunosAtivos = alunos.filter(aluno => {
      const ultimaAvaliacao = avaliacoes.find(av => av.alunoId === aluno.id);
      return ultimaAvaliacao;
    });

    // Agrupar avaliações por aluno
    const avaliacoesPorAluno = {};
    avaliacoes.forEach(av => {
      if (!avaliacoesPorAluno[av.alunoId]) {
        avaliacoesPorAluno[av.alunoId] = [];
      }
      avaliacoesPorAluno[av.alunoId].push(av);
    });

    // Calcular médias de evolução
    let totalVariacaoPeso = 0;
    let totalVariacaoGordura = 0;
    let alunosComEvolucao = 0;

    Object.keys(avaliacoesPorAluno).forEach(alunoId => {
      const avaliacoesAluno = avaliacoesPorAluno[alunoId].sort((a, b) => 
        a.dataAvaliacao.toDate() - b.dataAvaliacao.toDate()
      );
      
      if (avaliacoesAluno.length >= 2) {
        const primeira = avaliacoesAluno[0];
        const ultima = avaliacoesAluno[avaliacoesAluno.length - 1];
        
        if (primeira.peso && ultima.peso) {
          totalVariacaoPeso += (ultima.peso - primeira.peso);
          alunosComEvolucao++;
        }
        
        if (primeira.percentualGordura && ultima.percentualGordura) {
          totalVariacaoGordura += (ultima.percentualGordura - primeira.percentualGordura);
        }
      }
    });

    return {
      totalAlunos: alunos.length,
      alunosAtivos: alunosAtivos.length,
      totalAvaliacoes: avaliacoes.length,
      avaliacoesPorDia: (avaliacoes.length / Math.max(diasPeriodo, 1)).toFixed(1),
      avaliacoesPorAluno: alunosAtivos.length > 0 ? (avaliacoes.length / alunosAtivos.length).toFixed(1) : '0',
      mediaVariacaoPeso: alunosComEvolucao > 0 ? (totalVariacaoPeso / alunosComEvolucao).toFixed(1) : '0',
      mediaVariacaoGordura: alunosComEvolucao > 0 ? (totalVariacaoGordura / alunosComEvolucao).toFixed(1) : '0',
      taxaRetencao: alunos.length > 0 ? ((alunosAtivos.length / alunos.length) * 100).toFixed(1) : '0',
      diasPeriodo
    };
  };

  const calcularTendencias = (avaliacoes) => {
    // Agrupar avaliações por semana
    const avaliacoesPorSemana = {};
    
    avaliacoes.forEach(av => {
      const data = av.dataAvaliacao.toDate();
      const inicioSemana = new Date(data);
      inicioSemana.setDate(data.getDate() - data.getDay());
      const chaveSeamana = inicioSemana.toISOString().split('T')[0];
      
      if (!avaliacoesPorSemana[chaveSeamana]) {
        avaliacoesPorSemana[chaveSeamana] = 0;
      }
      avaliacoesPorSemana[chaveSeamana]++;
    });

    const labels = Object.keys(avaliacoesPorSemana).sort();
    const dados = labels.map(label => avaliacoesPorSemana[label]);

    return {
      avaliacoesPorSemana: {
        labels: labels.map(label => formatDate(new Date(label))),
        datasets: [{
          label: 'Avaliações por Semana',
          data: dados,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
        }]
      }
    };
  };

  const calcularDistribuicoes = (alunos, avaliacoes) => {
    // Distribuição por sexo
    const distribuicaoSexo = alunos.reduce((acc, aluno) => {
      const sexo = aluno.sexo === 'M' ? 'Masculino' : aluno.sexo === 'F' ? 'Feminino' : 'Não informado';
      acc[sexo] = (acc[sexo] || 0) + 1;
      return acc;
    }, {});

    // Distribuição por faixa etária
    const distribuicaoIdade = alunos.reduce((acc, aluno) => {
      if (aluno.idade) {
        const faixa = aluno.idade < 25 ? '18-24' :
                     aluno.idade < 35 ? '25-34' :
                     aluno.idade < 45 ? '35-44' :
                     aluno.idade < 55 ? '45-54' : '55+';
        acc[faixa] = (acc[faixa] || 0) + 1;
      }
      return acc;
    }, {});

    // Distribuição de avaliações por mês
    const avaliacoesPorMes = avaliacoes.reduce((acc, av) => {
      const mes = av.dataAvaliacao.toDate().toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[mes] = (acc[mes] || 0) + 1;
      return acc;
    }, {});

    return {
      sexo: {
        labels: Object.keys(distribuicaoSexo),
        datasets: [{
          data: Object.values(distribuicaoSexo),
          backgroundColor: ['#3b82f6', '#ef4444', '#10b981'],
        }]
      },
      idade: {
        labels: Object.keys(distribuicaoIdade),
        datasets: [{
          label: 'Alunos por Faixa Etária',
          data: Object.values(distribuicaoIdade),
          backgroundColor: '#3b82f6',
        }]
      },
      avaliacoesMensais: {
        labels: Object.keys(avaliacoesPorMes),
        datasets: [{
          label: 'Avaliações por Mês',
          data: Object.values(avaliacoesPorMes),
          backgroundColor: '#10b981',
        }]
      }
    };
  };

  // Verificar permissões
  if (currentUser && userType !== 'admin') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-primary-700">Acesso Negado</h3>
                <div className="mt-2 text-sm text-primary-600">
                  <p>Apenas administradores podem acessar os relatórios gerenciais.</p>
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Relatórios Gerenciais</h1>
              <p className="text-gray-600 mt-1">Dashboard executivo com KPIs e análises estratégicas</p>
            </div>
            
            {/* Filtros de Período */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={periodoFiltro}
                onChange={(e) => setPeriodoFiltro(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="365">Último ano</option>
              </select>
              
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Data início"
                />
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Data fim"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Carregando dados...
            </div>
          </div>
        ) : (
          <>
            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total de Alunos</p>
                    <p className="text-3xl font-bold text-blue-600">{dados.kpis.totalAlunos}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {dados.kpis.alunosAtivos} ativos ({dados.kpis.taxaRetencao}%)
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Avaliações</p>
                    <p className="text-3xl font-bold text-green-600">{dados.kpis.totalAvaliacoes}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {dados.kpis.avaliacoesPorDia} por dia
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Média Evolução Peso</p>
                    <p className={`text-3xl font-bold ${parseFloat(dados.kpis.mediaVariacaoPeso) >= 0 ? 'text-blue-600' : 'text-purple-600'}`}>
                      {dados.kpis.mediaVariacaoPeso > 0 ? '+' : ''}{dados.kpis.mediaVariacaoPeso}kg
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Por aluno no período
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Média Redução Gordura</p>
                    <p className={`text-3xl font-bold ${parseFloat(dados.kpis.mediaVariacaoGordura) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dados.kpis.mediaVariacaoGordura > 0 ? '+' : ''}{dados.kpis.mediaVariacaoGordura}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Por aluno no período
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos de Tendências */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução de Avaliações</h3>
                <div className="h-64">
                  <LineChart data={dados.tendencias.avaliacoesPorSemana} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Avaliações por Mês</h3>
                <div className="h-64">
                  <BarChart data={dados.distribuicoes.avaliacoesMensais} />
                </div>
              </div>
            </div>

            {/* Distribuições */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Sexo</h3>
                <div className="h-64">
                  <PieChart data={dados.distribuicoes.sexo} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Faixa Etária</h3>
                <div className="h-64">
                  <BarChart data={dados.distribuicoes.idade} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taxa de Retenção</span>
                    <span className="font-semibold text-blue-600">{dados.kpis.taxaRetencao}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${dados.kpis.taxaRetencao}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avaliações por Aluno</span>
                    <span className="font-semibold text-green-600">{dados.kpis.avaliacoesPorAluno}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Período Analisado</span>
                    <span className="font-semibold text-purple-600">{dados.kpis.diasPeriodo} dias</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights e Recomendações */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">📊 Insights Estratégicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Performance Geral</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• {dados.kpis.totalAlunos} alunos cadastrados no sistema</li>
                    <li>• {dados.kpis.alunosAtivos} alunos com avaliações recentes ({dados.kpis.taxaRetencao}% taxa de retenção)</li>
                    <li>• Média de {dados.kpis.avaliacoesPorAluno} avaliações por aluno ativo</li>
                    <li>• {dados.kpis.avaliacoesPorDia} avaliações realizadas por dia</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Resultados dos Alunos</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Variação média de peso: {dados.kpis.mediaVariacaoPeso > 0 ? 'ganho' : 'redução'} de {Math.abs(dados.kpis.mediaVariacaoPeso)}kg</li>
                    <li>• Variação média de gordura: {dados.kpis.mediaVariacaoGordura > 0 ? 'aumento' : 'redução'} de {Math.abs(dados.kpis.mediaVariacaoGordura)}%</li>
                    <li>• Período de análise: {dados.kpis.diasPeriodo} dias</li>
                    <li>• Total de {dados.kpis.totalAvaliacoes} avaliações no período</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
} 