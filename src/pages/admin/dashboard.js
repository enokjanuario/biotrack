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

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser?.uid) {
        try {
          setLoading(true);
          
          // Contagem total de alunos
          const alunosQuery = query(
            collection(db, 'usuarios'),
            where('tipo', '==', 'aluno')
          );
          const alunosSnapshot = await getDocs(alunosQuery);
          const totalAlunos = alunosSnapshot.size;
          
          // Últimos alunos cadastrados
          const alunosRecentesQuery = query(
            collection(db, 'usuarios'),
            where('tipo', '==', 'aluno'),
            orderBy('createdAt', 'desc'),
            limit(5)
          );
          const alunosRecentesSnapshot = await getDocs(alunosRecentesQuery);
          const alunosRecentesData = alunosRecentesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Total de avaliações
          const avaliacoesQuery = query(collection(db, 'avaliacoes'));
          const avaliacoesSnapshot = await getDocs(avaliacoesQuery);
          const totalAvaliacoes = avaliacoesSnapshot.size;
          
          // Avaliações do último mês
          const umMesAtras = new Date();
          umMesAtras.setMonth(umMesAtras.getMonth() - 1);
          
          const avaliacoesRecentesCountQuery = query(
            collection(db, 'avaliacoes'),
            where('dataAvaliacao', '>=', Timestamp.fromDate(umMesAtras))
          );
          const avaliacoesRecentesCountSnapshot = await getDocs(avaliacoesRecentesCountQuery);
          const avaliacoesRecentes = avaliacoesRecentesCountSnapshot.size;
          
          // Últimas avaliações realizadas
          const ultimasAvaliacoesQuery = query(
            collection(db, 'avaliacoes'),
            orderBy('dataAvaliacao', 'desc'),
            limit(5)
          );
          const ultimasAvaliacoesSnapshot = await getDocs(ultimasAvaliacoesQuery);
          
          // Para cada avaliação, buscar dados do aluno
          const avaliacoesData = [];
          for (const avaliacaoDoc of ultimasAvaliacoesSnapshot.docs) {
            const avaliacaoData = {
              id: avaliacaoDoc.id,
              ...avaliacaoDoc.data()
            };
            
            // Buscar dados do aluno
            if (avaliacaoData.alunoId) {
              const alunoDoc = await getDocs(
                query(collection(db, 'usuarios'), where('uid', '==', avaliacaoData.alunoId))
              );
              
              if (!alunoDoc.empty) {
                avaliacaoData.aluno = alunoDoc.docs[0].data();
              }
            }
            
            avaliacoesData.push(avaliacaoData);
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
                              {formatDate(avaliacao.dataAvaliacao?.toDate())}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {avaliacao.aluno?.nome || avaliacao.alunoNome || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {avaliacao.peso}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {avaliacao.percentualGordura}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link 
                                href={`/admin/avaliacoes/${avaliacao.id}`}
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
                            E-mail
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data Cadastro
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
                              {aluno.nome || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {aluno.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(aluno.createdAt?.toDate())}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link 
                                href={`/admin/alunos/${aluno.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Ver perfil
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-center py-4">Nenhum aluno encontrado</p>
                )}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Ações Rápidas</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link 
                  href="/admin/alunos/novo"
                  className="flex items-center justify-center p-4 border border-blue-200 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Cadastrar Novo Aluno
                </Link>
                
                <Link 
                  href="/admin/avaliacoes/nova"
                  className="flex items-center justify-center p-4 border border-green-200 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Registrar Nova Avaliação
                </Link>
                
                <Link 
                  href="/admin/relatorios"
                  className="flex items-center justify-center p-4 border border-purple-200 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Gerar Relatórios
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}