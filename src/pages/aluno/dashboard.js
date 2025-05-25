import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { formatDate } from '../../utils/formatDate';

export default function AlunoDashboard() {
  const { currentUser } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [ultimaAvaliacao, setUltimaAvaliacao] = useState(null);
  const [perfilAluno, setPerfilAluno] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser?.uid) {
        try {
          // Buscar perfil do aluno
          const perfilQuery = query(
            collection(db, 'perfis'),
            where('userId', '==', currentUser.uid)
          );
          const perfilSnapshot = await getDocs(perfilQuery);
          
          if (!perfilSnapshot.empty) {
            setPerfilAluno({
              id: perfilSnapshot.docs[0].id,
              ...perfilSnapshot.docs[0].data()
            });
          }
          
          // Buscar avaliações do aluno
          const avaliacoesQuery = query(
            collection(db, 'avaliacoes'),
            where('alunoId', '==', currentUser.uid),
            orderBy('dataAvaliacao', 'desc'),
            limit(5)
          );
          
          const avaliacoesSnapshot = await getDocs(avaliacoesQuery);
          
          const avaliacoesData = avaliacoesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setAvaliacoes(avaliacoesData);
          
          if (avaliacoesData.length > 0) {
            setUltimaAvaliacao(avaliacoesData[0]);
          }
        } catch (error) {
          console.error('Erro ao buscar dados:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [currentUser]);

  // Calcular variação entre última e penúltima avaliação
  const calcularVariacao = (campo) => {
    if (avaliacoes.length < 2 || !avaliacoes[0][campo] || !avaliacoes[1][campo]) {
      return null;
    }
    
    const atual = parseFloat(avaliacoes[0][campo]);
    const anterior = parseFloat(avaliacoes[1][campo]);
    
    return ((atual - anterior) / anterior * 100).toFixed(1);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Última Avaliação</h2>
                {ultimaAvaliacao ? (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Data: <span className="font-medium">{formatDate(ultimaAvaliacao.dataAvaliacao?.toDate())}</span>
                    </p>
                    <p className="text-gray-600 mb-2">
                      Peso: <span className="font-medium">{ultimaAvaliacao.peso} kg</span>
                    </p>
                    <p className="text-gray-600 mb-2">
                      % Gordura: <span className="font-medium">{ultimaAvaliacao.percentualGordura}%</span>
                      {calcularVariacao('percentualGordura') !== null && (
                        <span className={`ml-2 text-sm ${parseFloat(calcularVariacao('percentualGordura')) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(calcularVariacao('percentualGordura')) < 0 ? '↓' : '↑'} 
                          {Math.abs(calcularVariacao('percentualGordura'))}%
                        </span>
                      )}
                    </p>
                    <p className="text-gray-600 mb-2">
                      Massa Magra: <span className="font-medium">{ultimaAvaliacao.massaMagra} kg</span>
                      {calcularVariacao('massaMagra') !== null && (
                        <span className={`ml-2 text-sm ${parseFloat(calcularVariacao('massaMagra')) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(calcularVariacao('massaMagra')) > 0 ? '↑' : '↓'} 
                          {Math.abs(calcularVariacao('massaMagra'))}%
                        </span>
                      )}
                    </p>
                    <div className="mt-4">
                      <Link 
                        href={`/aluno/avaliacoes/${ultimaAvaliacao.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver detalhes →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Nenhuma avaliação encontrada</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Progresso</h2>
                {avaliacoes.length > 1 ? (
                  <div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">% Gordura</p>
                      <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, parseFloat(ultimaAvaliacao.percentualGordura) * 2)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Força Abdominal</p>
                      <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, (parseFloat(ultimaAvaliacao.testeAbdominal || 0) / 50) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0</span>
                        <span>50 rep</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Link 
                        href="/aluno/evolucao"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver evolução completa →
                      </Link>
                    </div>
                    
                    <div className="mt-2">
                      <Link 
                        href="/aluno/evolucao-avancada"
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        Análise avançada →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">É necessário ter pelo menos duas avaliações para ver o progresso</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Perfil</h2>
                {perfilAluno ? (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Nome: <span className="font-medium">{perfilAluno.nome}</span>
                    </p>
                    <p className="text-gray-600 mb-2">
                      Idade: <span className="font-medium">{perfilAluno.idade} anos</span>
                    </p>
                    <p className="text-gray-600 mb-2">
                      Altura: <span className="font-medium">{perfilAluno.altura} cm</span>
                    </p>
                    <p className="text-gray-600 mb-2">
                      Objetivo: <span className="font-medium">{perfilAluno.objetivo || 'Não definido'}</span>
                    </p>
                    <div className="mt-4">
                      <Link 
                        href="/aluno/perfil"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Editar perfil →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500 italic mb-4">Perfil não configurado</p>
                    <Link 
                      href="/aluno/perfil"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Configurar perfil
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-700">Histórico de Avaliações</h2>
                <Link 
                  href="/aluno/avaliacoes"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Ver todas
                </Link>
              </div>
              
              {avaliacoes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
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
                            {formatDate(avaliacao.dataAvaliacao?.toDate())}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {avaliacao.peso}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {avaliacao.percentualGordura}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {avaliacao.imc}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link 
                              href={`/aluno/avaliacoes/${avaliacao.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Detalhes
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-4">Nenhuma avaliação encontrada</p>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}