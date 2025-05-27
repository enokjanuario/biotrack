import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../../components/layout/Layout';
import { formatDate } from '../../../utils/formatDate';
import { prepararDadosFotosParaExibicao } from '../../../utils/imageUploadLocal';
import Link from 'next/link';

export default function DetalhesAvaliacao() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser } = useAuth();
  const [avaliacao, setAvaliacao] = useState(null);
  const [avaliacaoAnterior, setAvaliacaoAnterior] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('composicao');

  useEffect(() => {
    const fetchAvaliacao = async () => {
      if (id && currentUser) {
        try {
          setLoading(true);
          
          // Buscar avaliação atual
          const avaliacaoDoc = await getDoc(doc(db, 'avaliacoes', id));
          
          if (!avaliacaoDoc.exists()) {
            setError('Avaliação não encontrada');
            setLoading(false);
            return;
          }
          
          const avaliacaoData = {
            id: avaliacaoDoc.id,
            ...avaliacaoDoc.data(),
            // Processar fotos se existirem
            fotos: avaliacaoDoc.data().fotos ? prepararDadosFotosParaExibicao(avaliacaoDoc.data().fotos) : null
          };
          
          // Verificar se a avaliação pertence ao aluno logado
          if (avaliacaoData.alunoId !== currentUser.uid) {
            setError('Você não tem permissão para visualizar esta avaliação');
            setLoading(false);
            return;
          }
          
          setAvaliacao(avaliacaoData);
          
          // Buscar avaliação anterior para comparação
          const avaliacoesQuery = query(
            collection(db, 'avaliacoes'),
            where('alunoId', '==', currentUser.uid),
            where('dataAvaliacao', '<', avaliacaoData.dataAvaliacao),
            orderBy('dataAvaliacao', 'desc'),
            limit(1)
          );
          
          const avaliacoesSnapshot = await getDocs(avaliacoesQuery);
          
          if (!avaliacoesSnapshot.empty) {
            setAvaliacaoAnterior({
              id: avaliacoesSnapshot.docs[0].id,
              ...avaliacoesSnapshot.docs[0].data()
            });
          }
          
        } catch (error) {
          console.error('Erro ao buscar avaliação:', error);
          setError('Erro ao carregar avaliação');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAvaliacao();
  }, [id, currentUser]);

  // Calcular variação entre avalição atual e anterior
  const calcularVariacao = (campo) => {
    if (!avaliacaoAnterior || !avaliacao[campo] || !avaliacaoAnterior[campo]) {
      return null;
    }
    
    const atual = parseFloat(avaliacao[campo]);
    const anterior = parseFloat(avaliacaoAnterior[campo]);
    
    return ((atual - anterior) / anterior * 100).toFixed(1);
  };

  // Determinar a cor com base na variação (verde para positivo, vermelho para negativo)
  const corVariacao = (campo, inverter = false) => {
    if (calcularVariacao(campo) === null) return 'text-gray-500';
    
    const variacao = parseFloat(calcularVariacao(campo));
    
    if (inverter) {
      // Para métricas onde diminuir é bom (% gordura, etc)
      return variacao < 0 ? 'text-green-600' : 'text-red-600';
    } else {
      // Para métricas onde aumentar é bom (massa magra, força, etc)
      return variacao > 0 ? 'text-green-600' : 'text-red-600';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="bg-blue-50 border-l-4 border-primary-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-primary-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <Link 
              href="/aluno/avaliacoes"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Voltar para lista de avaliações
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!avaliacao) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-500">Avaliação não encontrada.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Detalhes da Avaliação</h1>
          <Link 
            href="/aluno/avaliacoes"
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Voltar
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Avaliação de {formatDate(avaliacao.dataAvaliacao?.toDate())}
                </h2>
                {avaliacao.avaliador && (
                  <p className="text-sm text-gray-600 mt-1">
                    Avaliador: {avaliacao.avaliador}
                  </p>
                )}
              </div>
              
              {avaliacaoAnterior && (
                <div className="text-sm text-gray-600">
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
                {avaliacao.fotos && Object.keys(avaliacao.fotos).length > 0 && (
                  <button
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'fotos' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('fotos')}
                  >
                    Fotos
                  </button>
                )}
              </div>
              
              <div className="mt-6">
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
                          <span className="text-gray-600">% Gordura</span>
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
                          <span className="text-gray-600">Massa Magra</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{avaliacao.massaMagra} kg</span>
                            {calcularVariacao('massaMagra') !== null && (
                              <span className={`text-sm ${corVariacao('massaMagra')}`}>
                                {parseFloat(calcularVariacao('massaMagra')) > 0 ? '↑' : '↓'} 
                                {Math.abs(calcularVariacao('massaMagra'))}%
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
                        
                        {avaliacao.taxaMetabolicaBasal && (
                          <div className="flex justify-between border-b border-gray-200 pb-2">
                            <span className="text-gray-600">Taxa Metabólica Basal</span>
                            <span className="font-medium">{avaliacao.taxaMetabolicaBasal} kcal</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {avaliacao.observacoes && (
                      <div className="col-span-1 md:col-span-2 mt-4">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Observações</h3>
                        <p className="text-gray-600 whitespace-pre-line">{avaliacao.observacoes}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'circunferencias' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Medidas de Circunferências</h3>
                    
                    {avaliacao.circunferencias && Object.keys(avaliacao.circunferencias).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(avaliacao.circunferencias).map(([key, value]) => {
                          // Verificar se há valor anterior para comparação
                          let variacao = null;
                          let corVar = 'text-gray-500';
                          
                          if (avaliacaoAnterior?.circunferencias && avaliacaoAnterior.circunferencias[key]) {
                            const atual = parseFloat(value);
                            const anterior = parseFloat(avaliacaoAnterior.circunferencias[key]);
                            
                            variacao = ((atual - anterior) / anterior * 100).toFixed(1);
                            
                            // Para circunferências, normalmente reduzir é bom (exceto para braços, que pode ser ruim)
                            const inverter = key.toLowerCase().includes('braco') ? false : true;
                            corVar = inverter ? 
                              (parseFloat(variacao) < 0 ? 'text-green-600' : 'text-red-600') :
                              (parseFloat(variacao) > 0 ? 'text-green-600' : 'text-red-600');
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
                
                {activeTab === 'fotos' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Fotos de Acompanhamento</h3>
                    
                    {avaliacao.fotos && Object.keys(avaliacao.fotos).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(avaliacao.fotos).map(([posicao, url]) => (
                          <div key={posicao} className="border rounded-lg overflow-hidden">
                            <div className="aspect-w-4 aspect-h-5 bg-gray-200">
                              <img 
                                src={url} 
                                alt={`Foto ${posicao}`} 
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="p-2 text-center text-sm text-gray-600 capitalize">
                              {posicao.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Não há fotos nesta avaliação</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}