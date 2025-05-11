import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout({ children }) {
  const { currentUser, userType, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1">
        {!isAuthPage && currentUser && (
          <Sidebar isOpen={isSidebarOpen} userType={userType} />
        )}
        
        <main className={`flex-1 p-4 md:p-6 ${!isAuthPage && currentUser ? 'md:ml-64' : ''}`}>
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
}