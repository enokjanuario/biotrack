import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout({ children }) {
  const { currentUser, userType, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Fechar sidebar mobile quando navegar
  useEffect(() => {
    const handleRouteChange = () => {
      setIsSidebarOpen(false);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Verificar autenticação para páginas protegidas
  useEffect(() => {
    if (!loading) {
      const publicPaths = ['/', '/cadastro', '/recuperar-senha'];
      const isPublicPath = publicPaths.includes(router.pathname);
      
      // Se for uma página protegida e usuário não estiver autenticado
      if (!isPublicPath && !currentUser) {
        router.push('/');
      }
      
      // Redirecionar se usuário estiver na área errada
      if (currentUser && userType) {
        const isAdminPath = router.pathname.startsWith('/admin');
        const isAlunoPath = router.pathname.startsWith('/aluno');
        
        if (isAdminPath && userType !== 'admin') {
          router.push('/aluno/dashboard');
        } else if (isAlunoPath && userType !== 'aluno') {
          router.push('/admin/dashboard');
        }
      }
    }
  }, [currentUser, userType, loading, router]);

  // Verifica se é uma página de autenticação
  const isAuthPage = [
    '/',
    '/cadastro',
    '/recuperar-senha'
  ].includes(router.pathname);

  // Calcular margem do conteúdo principal baseado no estado do sidebar
  const getMainContentClass = () => {
    if (isAuthPage || !currentUser) return 'flex-1 p-4 md:p-6';
    
    if (isSidebarCollapsed) {
      return 'flex-1 p-4 md:p-6 md:ml-16 transition-all duration-300 ease-in-out';
    }
    
    return 'flex-1 p-4 md:p-6 md:ml-64 transition-all duration-300 ease-in-out';
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header 
        toggleSidebar={toggleSidebar} 
        toggleSidebarCollapse={toggleSidebarCollapse}
        isSidebarCollapsed={isSidebarCollapsed}
        showSidebar={!isAuthPage && currentUser}
      />
      
      <div className="flex flex-1 relative">
        {!isAuthPage && currentUser && (
          <>
            <Sidebar 
              isOpen={isSidebarOpen} 
              isCollapsed={isSidebarCollapsed}
              userType={userType} 
              toggleSidebar={toggleSidebar}
            />
            
            {/* Overlay para mobile quando sidebar está aberto */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                onClick={toggleSidebar}
              />
            )}
          </>
        )}
        
                <main className={`${getMainContentClass()} main-content`}>          <div className="max-w-7xl mx-auto flex-safe">            {children}          </div>        </main>
      </div>
      
      <Footer />
    </div>
  );
}
