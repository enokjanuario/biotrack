import { useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, where, orderBy, startAfter, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { formatDate } from '../../utils/formatDate';

export default function AdminAlunos() {
  const { currentUser } = useAuth();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const PAGE_SIZE = 10;

  // Função para log de depuração
  const logDebug = (message, data = null) => {
    console.log(`[DEBUG] ${message}`, data ? data : '');
  };

  const fetchAlunos = async (reset = false) => {
    if (!currentUser?.uid) return;
    
    try {
      if (reset) {
        setLoading(true);
        setLastVisible(null);
      } else {
        setLoadingMore(true);
      }
      
      logDebug('Iniciando busca de alunos', { reset, searchTerm });
      
      let alunosQuery;
      
      if (reset || !lastVisible) {
        // Primeira consulta ou reset
        alunosQuery = query(
          collection(db, 'usuarios'),
          where('tipo', '==', 'aluno'),
          orderBy('nome'),
          limit(PAGE_SIZE)
        );
        logDebug('Consulta inicial construída');
      } else {
        // Consultas subsequentes (paginação)
        alunosQuery = query(
          collection(db, 'usuarios'),
          where('tipo', '==', 'aluno'),
          orderBy('nome'),
          startAfter(lastVisible),
          limit(PAGE_SIZE)
        );
        logDebug('Consulta de paginação construída');
      }
      
      const alunosSnapshot = await getDocs(alunosQuery);
      logDebug(`Encontrados ${alunosSnapshot.size} alunos`);
      
      // Verificar se tem mais resultados
      setHasMore(alunosSnapshot.size === PAGE_SIZE);
      
      // Atualizar o último documento visível para paginação
      if (alunosSnapshot.docs.length > 0) {
        setLastVisible(alunosSnapshot.docs[alunosSnapshot.docs.length - 1]);
      } else {
        setLastVisible(null);
      }
      
      const alunosData = alunosSnapshot.docs.map(doc => {
        logDebug(`Processando aluno ${doc.id}`);
        return {
          id: doc.id,
          ...doc.data()
        };
      });
      
      if (reset) {
        setAlunos(alunosData);
      } else {
        setAlunos(prev => [...prev, ...alunosData]);
      }
      
      setError(null); // Limpar erro se a consulta for bem-sucedida
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      setError('Falha ao carregar alunos: ' + error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Função para debounce da busca
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Função otimizada para busca com debounce
  const debouncedSearch = useCallback(
    debounce((term) => {
      if (term.trim()) {
        handleSearch(term);
      } else {
        fetchAlunos(true);
      }
    }, 300),
    []
  );

  const handleSearch = async (searchValue = searchTerm) => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      
      // Se o termo de busca estiver vazio, retorna à listagem normal
      if (!searchValue.trim()) {
        logDebug('Termo de busca vazio, retornando à listagem normal');
        fetchAlunos(true);
        return;
      }
      
      logDebug(`Buscando alunos com termo: "${searchValue}"`);
      
      // Convertendo o termo para minúsculas para busca case-insensitive
      const searchLower = searchValue.toLowerCase();
      
      // Busca por nome (case-insensitive)
      const alunosNomeSnapshot = await getDocs(
        query(
          collection(db, 'usuarios'),
          where('tipo', '==', 'aluno'),
          where('nome', '>=', searchValue),
          where('nome', '<=', searchValue + '\uf8ff'),
          orderBy('nome')
        )
      );
      logDebug(`Encontrados ${alunosNomeSnapshot.size} alunos pelo nome`);
      
      // Segunda busca por nome com primeira letra maiúscula para melhor cobertura
      const searchCapitalized = searchValue.charAt(0).toUpperCase() + searchValue.slice(1).toLowerCase();
      const alunosNomeCapSnapshot = await getDocs(
        query(
          collection(db, 'usuarios'),
          where('tipo', '==', 'aluno'),
          where('nome', '>=', searchCapitalized),
          where('nome', '<=', searchCapitalized + '\uf8ff'),
          orderBy('nome')
        )
      );
      logDebug(`Encontrados ${alunosNomeCapSnapshot.size} alunos pelo nome capitalizado`);
      
      // Terceira busca por nome em minúsculas para completar a cobertura
      const alunosNomeLowerSnapshot = await getDocs(
        query(
          collection(db, 'usuarios'),
          where('tipo', '==', 'aluno'),
          where('nome', '>=', searchLower),
          where('nome', '<=', searchLower + '\uf8ff'),
          orderBy('nome')
        )
      );
      logDebug(`Encontrados ${alunosNomeLowerSnapshot.size} alunos pelo nome em minúsculas`);
      
      // Busca por email (sempre em minúsculas)
      const alunosEmailSnapshot = await getDocs(
        query(
          collection(db, 'usuarios'),
          where('tipo', '==', 'aluno'),
          where('email', '>=', searchLower),
          where('email', '<=', searchLower + '\uf8ff'),
          orderBy('email')
        )
      );
      logDebug(`Encontrados ${alunosEmailSnapshot.size} alunos pelo email`);
      
      // Combinando resultados sem duplicatas
      const alunosMap = new Map();
      
      // Processar resultados da busca por nome (primeira busca)
      alunosNomeSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Filtragem adicional case-insensitive no cliente
        if (data.nome && data.nome.toLowerCase().includes(searchLower)) {
          alunosMap.set(doc.id, {
            id: doc.id,
            ...data
          });
        }
      });
      
      // Processar resultados da busca por nome capitalizado
      alunosNomeCapSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Filtragem adicional case-insensitive no cliente
        if (data.nome && data.nome.toLowerCase().includes(searchLower) && !alunosMap.has(doc.id)) {
          alunosMap.set(doc.id, {
            id: doc.id,
            ...data
          });
        }
      });
      
      // Processar resultados da busca por nome em minúsculas
      alunosNomeLowerSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Filtragem adicional case-insensitive no cliente
        if (data.nome && data.nome.toLowerCase().includes(searchLower) && !alunosMap.has(doc.id)) {
          alunosMap.set(doc.id, {
            id: doc.id,
            ...data
          });
        }
      });
      
      // Processar resultados da busca por email
      alunosEmailSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Filtragem adicional case-insensitive no cliente
        if (data.email && data.email.toLowerCase().includes(searchLower) && !alunosMap.has(doc.id)) {
          alunosMap.set(doc.id, {
            id: doc.id,
            ...data
          });
        }
      });
      
      const alunosData = Array.from(alunosMap.values());
      logDebug(`Total de alunos encontrados (sem duplicatas): ${alunosData.length}`);
      
      // Ordenar por nome
      alunosData.sort((a, b) => a.nome?.localeCompare(b.nome));
      
      setAlunos(alunosData);
      setHasMore(false); // Não tem paginação em resultados de busca
      setLastVisible(null);
      setError(null); // Limpar erro se a consulta for bem-sucedida
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      setError('Falha ao buscar alunos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar o useEffect para incluir busca automática
  useEffect(() => {
    if (currentUser) {
      if (searchTerm.trim()) {
        debouncedSearch(searchTerm);
      } else {
        fetchAlunos(true);
      }
    }
  }, [currentUser, searchTerm, debouncedSearch]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Alunos</h1>
          <Link 
            href="/admin/alunos/novo"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Aluno
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar por nome ou e-mail..." 
                    className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchTerm && (
                    <button
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchTerm('')}
                      title="Limpar busca"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : alunos.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-gray-500 text-lg">
                {searchTerm ? 'Nenhum aluno encontrado com esse termo' : 'Nenhum aluno cadastrado'}
              </p>
              <div className="mt-6">
                <Link 
                  href="/admin/alunos/novo"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Cadastrar o primeiro aluno
                </Link>
              </div>
            </div>
          ) : (
            <>
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
                        CPF
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
                    {alunos.map((aluno) => (
                      <tr key={aluno.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {aluno.nome || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {aluno.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {aluno.cpf || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {aluno.createdAt?.toDate ? formatDate(aluno.createdAt.toDate()) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <Link 
                              href={`/admin/alunos/${aluno.id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver perfil completo"
                            >
                              Ver Perfil
                            </Link>
                            <Link 
                              href={`/admin/avaliacoes/nova?alunoId=${aluno.id}`}
                              className="text-green-600 hover:text-green-900"
                              title="Registrar nova avaliação"
                            >
                              Nova Avaliação
                            </Link>
                            <Link 
                              href={`/admin/alunos/${aluno.id}/evolucao`}
                              className="text-purple-600 hover:text-purple-900"
                              title="Ver evolução simples"
                            >
                              Evolução
                            </Link>
                            <Link 
                              href={`/admin/alunos/${aluno.id}/evolucao-avancada`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Ver análise avançada"
                            >
                              Análise Avançada
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {hasMore && (
                <div className="py-4 px-6 text-center">
                  <button
                    onClick={() => fetchAlunos(false)}
                    disabled={loadingMore}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      loadingMore ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loadingMore ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Carregando...
                      </>
                    ) : (
                      'Carregar mais'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}