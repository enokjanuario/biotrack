// components/layout/Sidebar.jsx - Versão corrigida

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Tooltip from '../ui/Tooltip';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  UserIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

export default function Sidebar({ isOpen, isCollapsed, userType, toggleSidebar }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [userName, setUserName] = useState('');
  const [userInitial, setUserInitial] = useState('');

  // Efeito para buscar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.email) {
        // Usar o email como nome temporário se não houver um perfil
        const emailName = currentUser.email.split('@')[0];
        const nameCapitalized = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        setUserName(nameCapitalized);
        setUserInitial(nameCapitalized.charAt(0));
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Links de navegação com ícones modernos
  const navLinks = userType === 'admin' 
    ? [
        { 
          href: '/admin/dashboard', 
          label: 'Dashboard', 
          icon: <HomeIcon className="w-5 h-5" /> 
        },
        { 
          href: '/admin/alunos', 
          label: 'Alunos', 
          icon: <UserIcon className="w-5 h-5" /> 
        },
        { 
          href: '/admin/avaliacoes', 
          label: 'Avaliações', 
          icon: <DocumentTextIcon className="w-5 h-5" /> 
        },
        { 
          href: '/admin/relatorios', 
          label: 'Relatórios', 
          icon: <ChartBarIcon className="w-5 h-5" /> 
        }
      ]
    : [
        { 
          href: '/aluno/dashboard', 
          label: 'Dashboard', 
          icon: <HomeIcon className="w-5 h-5" /> 
        },
        { 
          href: '/aluno/avaliacoes', 
          label: 'Minhas Avaliações', 
          icon: <DocumentTextIcon className="w-5 h-5" /> 
        },
        { 
          href: '/aluno/evolucao', 
          label: 'Evolução', 
          icon: <ChartBarIcon className="w-5 h-5" /> 
        },
        { 
          href: '/aluno/evolucao-avancada', 
          label: 'Análise Avançada', 
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )
        },
        { 
          href: '/aluno/perfil', 
          label: 'Perfil', 
          icon: <UserIcon className="w-5 h-5" /> 
        }
      ];

  // Determinar classes CSS baseado no estado do sidebar
  const sidebarClasses = `
    fixed inset-y-0 left-0 transform transition-all duration-300 ease-in-out z-30 bg-white shadow-lg pt-16
    ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
    md:translate-x-0
    ${isCollapsed ? 'md:w-16' : 'md:w-64'}
    w-64
  `.trim();

      return (    <aside className={sidebarClasses}>      <div className="h-full overflow-y-auto sidebar-scroll">
        {/* Botão fechar no mobile */}
        <div className="md:hidden flex justify-end p-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Fechar menu"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="px-4 py-6">
          {/* Perfil do usuário */}
          {!isCollapsed && (
            <div className="flex items-center mb-6 md:mb-8">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="font-semibold text-primary-600">{userInitial}</span>
              </div>
              <div className="ml-3 min-w-0">
                <p className="font-medium text-gray-900 truncate">{userName || 'Usuário'}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {userType === 'admin' ? 'Administrador' : 'Aluno'}
                </p>
              </div>
            </div>
          )}

          {/* Versão colapsada - apenas avatar */}
          {isCollapsed && (
            <div className="hidden md:flex justify-center mb-6">
              <Tooltip content={`${userName || 'Usuário'} (${userType === 'admin' ? 'Admin' : 'Aluno'})`}>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="font-semibold text-primary-600">{userInitial}</span>
                </div>
              </Tooltip>
            </div>
          )}
          
          {/* Navegação */}
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive = router.pathname === link.href;
              
              const linkContent = (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ease-in-out
                    ${isActive
                      ? 'bg-blue-50 text-primary-700 border-r-2 border-primary-500'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                    }
                    ${isCollapsed ? 'md:justify-center md:px-2' : ''}
                  `.trim()}
                >
                                    <span className={`                    flex-shrink-0 transition-colors nav-icon                    ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-primary-500'}                  `}>                    {link.icon}                  </span>
                  
                  {/* Label - oculto quando colapsado em desktop */}
                  <span className={`
                    ml-3 transition-opacity
                    ${isCollapsed ? 'md:hidden' : ''}
                  `}>
                    {link.label}
                  </span>
                </Link>
              );

              // Se estiver colapsado em desktop, envolver com tooltip
              return isCollapsed ? (
                <div key={link.href} className="hidden md:block">
                  <Tooltip content={link.label}>
                    {linkContent}
                  </Tooltip>
                </div>
              ) : (
                <div key={link.href}>
                  {linkContent}
                </div>
              );
            })}
          </nav>

          {/* Informações adicionais no modo expandido */}
          {!isCollapsed && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="px-3 py-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sistema
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Avaliação Física v1.0
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
