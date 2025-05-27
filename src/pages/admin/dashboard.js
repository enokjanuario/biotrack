import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { formatDate } from '../../utils/formatDate';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalAvaliacoes: 0,
    avaliacoesRecentes: 0
  });
  const [avaliacoesRecentes, setAvaliacoesRecentes] = useState([]);
  const [alunosRecentes, setAlunosRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser?.uid) {
        try {
          setLoading(true);
          
          const alunosQuery = query(
            collection(db, 'usuarios'),
            where('tipo', '==', 'aluno')
          );
          const alunosSnapshot = await getDocs(alunosQuery);
          const totalAlunos = alunosSnapshot.size;
          
          let alunosRecentesData = [];
          
          if (totalAlunos > 0) {
            const alunosRecentesQuery = query(
              collection(db, 'usuarios'),
              where('tipo', '==', 'aluno'),
              orderBy('createdAt', 'desc'),
              limit(5)
            );
            const alunosRecentesSnapshot = await getDocs(alunosRecentesQuery);
            alunosRecentesData = alunosRecentesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          }
          
          const avaliacoesQuery = query(collection(db, 'avaliacoes'));
          const avaliacoesSnapshot = await getDocs(avaliacoesQuery);
          const totalAvaliacoes = avaliacoesSnapshot.size;
          
          // Avaliações do último mês
          const umMesAtras = new Date();
          umMesAtras.setMonth(umMesAtras.getMonth() - 1);
          
          let avaliacoesRecentes = 0;
          
          if (totalAvaliacoes > 0) {
            const avaliacoesRecentesCountQuery = query(
              collection(db, 'avaliacoes'),
              where('dataAvaliacao', '>=', Timestamp.fromDate(umMesAtras))
            );
            const avaliacoesRecentesCountSnapshot = await getDocs(avaliacoesRecentesCountQuery);
            avaliacoesRecentes = avaliacoesRecentesCountSnapshot.size;
          }
          
          // Últimas avaliações realizadas
          let avaliacoesData = [];
          
          if (totalAvaliacoes > 0) {
            const ultimasAvaliacoesQuery = query(
              collection(db, 'avaliacoes'),
              orderBy('dataAvaliacao', 'desc'),
              limit(5)
            );
            const ultimasAvaliacoesSnapshot = await getDocs(ultimasAvaliacoesQuery);
            
            // Para cada avaliação, buscar dados do aluno
            for (const avaliacaoDoc of ultimasAvaliacoesSnapshot.docs) {
              const avaliacaoData = {
                id: avaliacaoDoc.id,
                ...avaliacaoDoc.data()
              };
              
              // Verificar se já tem o nome do aluno nos dados
              if (!avaliacaoData.alunoNome && avaliacaoData.alunoId) {
                try {
                  const alunoRef = collection(db, 'usuarios');
                  const alunoQuery = query(alunoRef, where('uid', '==', avaliacaoData.alunoId));
                  const alunoSnapshot = await getDocs(alunoQuery);
                  
                  if (!alunoSnapshot.empty) {
                    const alunoData = alunoSnapshot.docs[0].data();
                    avaliacaoData.alunoNome = alunoData.nome;
                  } else {
                    // Tentar buscar usando o id diretamente como o document id
                    const alunoQueryById = query(collection(db, 'usuarios'));
                    const alunoByIdSnapshot = await getDocs(alunoQueryById);
                    
                    const alunoEncontrado = alunoByIdSnapshot.docs.find(doc => doc.id === avaliacaoData.alunoId);
                    
                    if (alunoEncontrado) {
                      avaliacaoData.alunoNome = alunoEncontrado.data().nome;
                    }
                  }
                } catch (error) {
                  console.error('Erro ao buscar nome do aluno:', error);
                }
              }
              
              avaliacoesData.push(avaliacaoData);
            }
          }
          
          setStats({
            totalAlunos,
            totalAvaliacoes,
            avaliacoesRecentes
          });
          
          setAvaliacoesRecentes(avaliacoesData);
          setAlunosRecentes(alunosRecentesData);
        } catch (error) {
          console.error('Erro ao buscar dados:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [currentUser]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Admin</h1>
        
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
                  Erro ao carregar dados: {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Total de Alunos</p>
                    <p className="text-2xl font-semibold text-gray-800">{stats.totalAlunos}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link 
                    href="/admin/alunos"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Ver todos os alunos →
                  </Link>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Total de Avaliações</p>
                    <p className="text-2xl font-semibold text-gray-800">{stats.totalAvaliacoes}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link 
                    href="/admin/avaliacoes"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Ver todas as avaliações →
                  </Link>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 text-sm">Avaliações Recentes (30 dias)</p>
                    <p className="text-2xl font-semibold text-gray-800">{stats.avaliacoesRecentes}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link 
                    href="/admin/avaliacoes/nova"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Registrar nova avaliação →
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Últimas Avaliações</h2>
                  <Link 
                    href="/admin/avaliacoes"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Ver todas
                  </Link>
                </div>
                
                {avaliacoesRecentes.length > 0 ? (
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
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {avaliacoesRecentes.map((avaliacao) => (
                          <tr key={avaliacao.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {avaliacao.dataAvaliacao?.toDate ? formatDate(avaliacao.dataAvaliacao.toDate()) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {avaliacao.alunoNome || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {avaliacao.peso || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {avaliacao.percentualGordura ? `${avaliacao.percentualGordura}%` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">Nenhuma avaliação encontrada</p>
                    <Link 
                      href="/admin/avaliacoes/nova"
                      className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                    >
                      Registrar primeira avaliação →
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Alunos Recentes</h2>
                  <Link 
                    href="/admin/alunos"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Ver todos
                  </Link>
                </div>
                
                {alunosRecentes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nome
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data de Cadastro
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {alunosRecentes.map((aluno) => (
                          <tr key={aluno.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {aluno.nome}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {aluno.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {aluno.createdAt?.toDate ? formatDate(aluno.createdAt.toDate()) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link 
                                href={`/admin/alunos/${aluno.id}`}
                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-full transition-colors inline-flex items-center justify-center"
                                title="Ver perfil do aluno"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">Nenhum aluno cadastrado</p>
                    <Link 
                      href="/admin/alunos/novo"
                      className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                    >
                      Cadastrar primeiro aluno →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
