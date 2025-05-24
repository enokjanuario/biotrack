import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Bars3Icon, 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

export default function Header({ toggleSidebar, toggleSidebarCollapse, isSidebarCollapsed, showSidebar }) {
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
    <header className="bg-blue-600 text-white shadow-md relative z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Botão hambúrguer para mobile */}
            {showSidebar && (
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded hover:bg-blue-700 transition-colors"
                aria-label="Abrir menu"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            )}
            
            {/* Botão para colapsar sidebar em desktop */}
            {showSidebar && (
              <button
                onClick={toggleSidebarCollapse}
                className="hidden md:block p-2 rounded hover:bg-blue-700 transition-colors"
                aria-label={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
              >
                {isSidebarCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5" />
                )}
              </button>
            )}
            
            <Link 
              href={currentUser ? (userType === 'admin' ? '/admin/dashboard' : '/aluno/dashboard') : '/'}
              className="flex items-center space-x-2 hover:opacity-90 transition-opacity"
            >
              <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">AF</span>
              </div>
              <span className="font-bold text-xl">Avaliação Física</span>
            </Link>
          </div>

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center space-x-2 p-2 rounded hover:bg-blue-700 transition-colors"
                aria-label="Menu do usuário"
              >
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {currentUser.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden md:inline font-medium">{currentUser.email}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-600">Logado como</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{currentUser.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{userType}</p>
                  </div>
                  
                  <Link 
                    href={userType === 'admin' ? '/admin/perfil' : '/aluno/perfil'}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Meu Perfil</span>
                    </div>
                  </Link>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sair</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex space-x-4 items-center">
              <Link 
                href="/"
                className={`px-4 py-2 rounded transition-colors ${router.pathname === '/' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
              >
                Login
              </Link>
              <Link 
                href="/cadastro"
                className={`px-4 py-2 rounded transition-colors ${router.pathname === '/cadastro' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
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