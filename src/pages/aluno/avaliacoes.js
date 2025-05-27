import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { formatDate } from '../../utils/formatDate';

export default function AvaliacoesAluno() {
  const { currentUser } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [periodoSelecionado, setPeriodoSelecionado] = useState('ultimos6Meses');

  useEffect(() => {
    const fetchAvaliacoes = async () => {
      if (currentUser?.uid) {
        try {
          setLoading(true);
          
          // Base da consulta
          let avaliacoesQuery = query(
            collection(db, 'avaliacoes'),
            where('alunoId', '==', currentUser.uid),
            orderBy('dataAvaliacao', 'desc')
          );
          
          // Filtrar por período
          if (periodoSelecionado !== 'todas') {
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
              orderBy('dataAvaliacao', 'desc')
            );
          }
          
          const avaliacoesSnapshot = await getDocs(avaliacoesQuery);
          
          const avaliacoesData = avaliacoesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setAvaliacoes(avaliacoesData);
        } catch (error) {
          console.error('Erro ao buscar avaliações:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAvaliacoes();
  }, [currentUser, periodoSelecionado]);

  // Filtrar por tipo
  const avaliacoesFiltradas = avaliacoes.filter(avaliacao => {
    if (filtro === 'todas') return true;
    if (filtro === 'composicaoCorporal') return true; // Todas têm composição corporal
    if (filtro === 'circunferencias') return avaliacao.circunferencias && Object.keys(avaliacao.circunferencias).length > 0;
    if (filtro === 'testes') return avaliacao.testes && Object.keys(avaliacao.testes).length > 0;
    return true;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Minhas Avaliações</h1>
        
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div>
                <label htmlFor="filtro" className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por tipo
                </label>
                <select
                  id="filtro"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="todas">Todas</option>
                  <option value="composicaoCorporal">Composição Corporal</option>
                  <option value="circunferencias">Circunferências</option>
                  <option value="testes">Testes Físicos</option>
                </select>
              </div>
              
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
                  <option value="todas">Todas</option>
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : avaliacoesFiltradas.length > 0 ? (
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
                        Observações
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {avaliacoesFiltradas.map((avaliacao) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                          {avaliacao.observacoes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Link 
                            href={`/aluno/avaliacoes/${avaliacao.id}`}
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
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">Nenhuma avaliação encontrada para o período selecionado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
