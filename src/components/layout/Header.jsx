import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

export default function Header({ toggleSidebar }) {
  const { currentUser, logout, userType } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Verifica se é uma página de autenticação
  const isAuthPage = [
    '/',
    '/cadastro',
    '/recuperar-senha'
  ].includes(router.pathname);

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {!isAuthPage && currentUser && (
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded hover:bg-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            <Link 
              href={currentUser ? (userType === 'admin' ? '/admin/dashboard' : '/aluno/dashboard') : '/'}
              className="flex items-center space-x-2"
            >
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
              <span className="font-bold text-xl">Avaliação Física</span>
            </Link>
          </div>

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center space-x-2 p-2 rounded hover:bg-blue-700"
              >
                <span className="hidden md:inline">{currentUser.email}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link 
                    href={userType === 'admin' ? '/admin/perfil' : '/aluno/perfil'}
                    className="block px-4 py-2 text-gray-800 hover:bg-blue-100"
                    onClick={() => setShowMenu(false)}
                  >
                    Perfil
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-100"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex space-x-4 items-center">
              <Link 
                href="/"
                className={`px-4 py-2 rounded ${router.pathname === '/' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
              >
                Login
              </Link>
              <Link 
                href="/cadastro"
                className={`px-4 py-2 rounded ${router.pathname === '/cadastro' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
              >
                Cadastro
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}