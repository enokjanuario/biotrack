import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../../components/layout/Layout';
import { formatDate } from '../../../utils/formatDate';
import Link from 'next/link';
import LineChart from '../../../components/layout/charts/LineChart';
import FotoGaleria from '../../../components/ui/FotoGaleria';
import { prepararDadosFotosParaExibicao } from '../../../utils/imageUploadLocal';

export default function DetalhesAluno() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, userType } = useAuth();
  const [aluno, setAluno] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  
  // Data para visualizações
  const [pesoData, setPesoData] = useState({ labels: [], datasets: [] });
  const [gorduraData, setGorduraData] = useState({ labels: [], datasets: [] });
  const [imcData, setImcData] = useState({ labels: [], datasets: [] });
  const [circunferenciasData, setCircunferenciasData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchAluno = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        if (!db) {
          throw new Error('Firebase Firestore não foi inicializado corretamente');
        }
        
        // Buscar dados do aluno
        const alunoDoc = await getDoc(doc(db, 'usuarios', id));
        
        if (!alunoDoc.exists()) {
          setError('Aluno não encontrado');
          return;
        }
        
        const alunoData = {
          id: alunoDoc.id,
          ...alunoDoc.data()
        };
        
        setAluno(alunoData);
        
        // Buscar perfil do aluno
        const perfilQuery = query(collection(db, 'perfis'), where('userId', '==', id));
        const perfilSnapshot = await getDocs(perfilQuery);
        
        if (!perfilSnapshot.empty) {
          const perfilData = {
            id: perfilSnapshot.docs[0].id,
            ...perfilSnapshot.docs[0].data()
          };
          setPerfil(perfilData);
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
            orderBy('dataAvaliacao', 'desc')
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
          return dataB - dataA;
        });
        
        setAvaliacoes(avaliacoesData);
        
        // Calcular estatísticas
        if (avaliacoesData.length > 0) {
          const primeira = avaliacoesData[avaliacoesData.length - 1];
          const ultima = avaliacoesData[0];
          
          const stats = {
            totalAvaliacoes: avaliacoesData.length,
            periodoMonitoramento: primeira && ultima ? 
              Math.ceil((ultima.dataAvaliacao.toDate() - primeira.dataAvaliacao.toDate()) / (1000 * 60 * 60 * 24)) : 0,
            variacaoPeso: primeira?.peso && ultima?.peso ? 
              (ultima.peso - primeira.peso).toFixed(1) : null,
            variacaoGordura: primeira?.percentualGordura && ultima?.percentualGordura ? 
              (ultima.percentualGordura - primeira.percentualGordura).toFixed(1) : null,
            variacaoIMC: primeira?.imc && ultima?.imc ? 
              (ultima.imc - primeira.imc).toFixed(1) : null,
            ultimaAvaliacao: ultima?.dataAvaliacao ? formatDate(ultima.dataAvaliacao.toDate()) : null
          };
          
          setStats(stats);
        }
        
        // Processar dados para gráficos
        if (avaliacoesData.length > 0) {
          const sortedAvaliacoes = [...avaliacoesData].sort((a, b) => {
            return a.dataAvaliacao.toDate() - b.dataAvaliacao.toDate();
          });
          
          const labels = sortedAvaliacoes.map(av => formatDate(av.dataAvaliacao.toDate()));
          
          // Dados para gráfico de peso
          const pesoValues = sortedAvaliacoes.map(av => av.peso || null);
          setPesoData({
            labels,
            datasets: [{
              label: 'Peso (kg)',
              data: pesoValues,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.3,
              unit: 'kg'
            }]
          });
          
          // Dados para gráfico de gordura
          const gorduraValues = sortedAvaliacoes.map(av => av.percentualGordura || null);
          setGorduraData({
            labels,
            datasets: [{
              label: 'Gordura Corporal (%)',
              data: gorduraValues,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.3,
              unit: '%'
            }]
          });
          
          // Dados para gráfico de IMC
          const imcValues = sortedAvaliacoes.map(av => av.imc || null);
          setImcData({
            labels,
            datasets: [{
              label: 'IMC',
              data: imcValues,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.3,
              unit: 'kg/m²'
            }]
          });
          
          // Dados para gráfico de circunferências
          const cinturaValues = sortedAvaliacoes.map(av => av.circunferencias?.cintura || null);
          const bracoValues = sortedAvaliacoes.map(av => av.circunferencias?.bracoRelaxado || null);
          
          setCircunferenciasData({
            labels,
            datasets: [
              {
                label: 'Cintura (cm)',
                data: cinturaValues,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: false,
                tension: 0.3,
                unit: 'cm'
              },
              {
                label: 'Braço Relaxado (cm)',
                data: bracoValues,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: false,
                tension: 0.3,
                unit: 'cm'
              }
            ]
          });
        }
        
      } catch (error) {
        console.error('Erro ao buscar aluno:', error);
        setError('Erro ao carregar dados do aluno');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser && userType === 'admin') {
      fetchAluno();
    } else if (currentUser && userType !== 'admin') {
      setError('Acesso negado. Apenas administradores podem ver esta página.');
      setLoading(false);
    } else if (!currentUser) {
      setError('Usuário não autenticado. Faça login novamente.');
      setLoading(false);
    }
  }, [id, currentUser, userType]);

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return '-';
    const hoje = new Date();
    const nascimento = dataNascimento.toDate();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade + ' anos';
  };

  const getVariacaoColor = (valor) => {
    if (!valor) return 'text-gray-500';
    const num = parseFloat(valor);
    if (num > 0) return 'text-red-600';
    if (num < 0) return 'text-green-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Carregando dados do aluno...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || !aluno) {
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
                <h3 className="text-sm font-medium text-red-800">Erro ao carregar aluno</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <div className="mt-4">
                    <Link href="/admin/alunos" className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-500">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                      Voltar para lista de alunos
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Filtrar avaliações que têm fotos e prepará-las para exibição
  const avaliacoesComFotos = avaliacoes.filter(av => av.fotos && Object.keys(av.fotos).length > 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header com ações */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{aluno.nome}</h1>
            <p className="text-gray-600 mt-1">Perfil completo do aluno</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link 
              href="/admin/alunos"
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Voltar
            </Link>
            <Link 
              href={`/admin/avaliacoes/nova?alunoId=${aluno.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova Avaliação
            </Link>
            {avaliacoes.length > 0 && (
              <>
                <Link 
                  href={`/admin/alunos/${aluno.id}/evolucao`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Evolução
                </Link>
                <Link 
                  href={`/admin/alunos/${aluno.id}/evolucao-avancada`}
                  className="inline-flex items-center px-3 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Análise Avançada
                </Link>
                <Link 
                  href={`/admin/alunos/${aluno.id}/relatorio`}
                  className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Relatório PDF
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Estatísticas Gerais */}
        {avaliacoes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Total de Avaliações</p>
                  <p className="text-xl font-semibold">{stats.totalAvaliacoes}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Variação de Peso</p>
                  <p className={`text-xl font-semibold ${getVariacaoColor(stats.variacaoPeso)}`}>
                    {stats.variacaoPeso ? `${stats.variacaoPeso > 0 ? '+' : ''}${stats.variacaoPeso} kg` : '-'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Dias de Acompanhamento</p>
                  <p className="text-xl font-semibold">{stats.periodoMonitoramento || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 10v4m0-4a6 6 0 100-12 6 6 0 000 12z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Última Avaliação</p>
                  <p className="text-sm font-semibold">{stats.ultimaAvaliacao || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Perfil do Aluno */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Informações Pessoais</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Dados Básicos</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Nome Completo</span>
                    <span className="text-gray-900 font-semibold">{aluno.nome}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Email</span>
                    <span className="text-gray-900">{aluno.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">CPF</span>
                    <span className="text-gray-900">{aluno.cpf}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Telefone</span>
                    <span className="text-gray-900">{aluno.telefone || 'Não informado'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Informações Pessoais</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Data de Nascimento</span>
                    <span className="text-gray-900">{aluno.dataNascimento ? formatDate(aluno.dataNascimento.toDate()) : 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Idade</span>
                    <span className="text-gray-900 font-semibold">{calcularIdade(aluno.dataNascimento)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Sexo</span>
                    <span className="text-gray-900">
                      {perfil?.sexo === 'M' ? 'Masculino' : 
                       perfil?.sexo === 'F' ? 'Feminino' : 'Não informado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Endereço</span>
                    <span className="text-gray-900 text-right max-w-xs">{aluno.endereco || 'Não informado'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Informações de Treino</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Objetivo</span>
                    <span className="text-gray-900 font-semibold">{perfil?.objetivo || 'Não definido'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Data de Cadastro</span>
                    <span className="text-gray-900">{aluno.createdAt ? formatDate(aluno.createdAt.toDate()) : 'Não informado'}</span>
                  </div>
                  {perfil?.observacoes && (
                    <div className="mt-4">
                      <span className="text-gray-600 font-medium block mb-2">Observações</span>
                      <div className="bg-gray-50 p-3 rounded-md border">
                        <p className="text-gray-800 text-sm">{perfil.observacoes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Galeria de Fotos das Avaliações */}
        {avaliacoesComFotos.length > 0 && (
          <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Registro Fotográfico ({avaliacoesComFotos.length} avaliações com fotos)
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-8">
                {avaliacoesComFotos.slice(0, 5).map((avaliacao, index) => (
                  <div key={avaliacao.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Avaliação de {formatDate(avaliacao.dataAvaliacao?.toDate())}
                      </h3>
                      {index === 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Mais recente
                        </span>
                      )}
                    </div>
                    
                    <FotoGaleria 
                      fotos={avaliacao.fotos}
                      aluno={aluno}
                      dataAvaliacao={formatDate(avaliacao.dataAvaliacao?.toDate())}
                      showModal={true}
                    />
                  </div>
                ))}
                
                {avaliacoesComFotos.length > 5 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-500">
                      Mostrando as 5 avaliações mais recentes com fotos. 
                      Total: {avaliacoesComFotos.length} avaliações com fotos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Histórico de Avaliações */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Histórico de Avaliações ({avaliacoes.length})</h2>
          </div>
          <div className="p-6">
            {avaliacoes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma avaliação registrada para este aluno.</p>
                <Link 
                  href={`/admin/avaliacoes/nova?alunoId=${aluno.id}`}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Registrar Primeira Avaliação
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peso (kg)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Gordura</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Massa Magra (kg)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fotos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {avaliacoes.map((avaliacao, index) => (
                      <tr key={avaliacao.id} className={index === 0 ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            {index === 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                Mais recente
                              </span>
                            )}
                            {formatDate(avaliacao.dataAvaliacao.toDate())}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {avaliacao.peso || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {avaliacao.percentualGordura ? `${avaliacao.percentualGordura}%` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {avaliacao.imc || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {avaliacao.massaMagra || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {avaliacao.fotos && Object.keys(avaliacao.fotos).length > 0 ? (
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm text-green-600 font-medium">
                                {Object.keys(avaliacao.fotos).length}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link 
                            href={`/admin/avaliacoes/${avaliacao.id}`}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            Ver Detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 