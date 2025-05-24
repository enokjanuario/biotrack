import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Head from 'next/head';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await login(data.email, data.password);
      // O redirecionamento é feito no AuthContext
    } catch (error) {
      console.error('Erro no login:', error);
      let errorMessage = 'Falha no login. Verifique suas credenciais.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | Sistema de Avaliação Física</title>
        <meta name="description" content="Faça login para acessar o Sistema de Avaliação Física e acompanhar sua evolução" />
      </Head>
      
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Lado esquerdo - Banner visual */}
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 to-blue-800 justify-center items-center p-12">
          <div className="max-w-md text-center">
            <img 
              src="/fitness-illustration.svg" 
              alt="Ilustração" 
              className="w-full max-w-sm mx-auto mb-8" 
              onError={(e) => {
                // Fallback caso a imagem não exista
                e.target.style.display = 'none';
              }}
            />
            <h1 className="text-3xl font-bold text-white mb-4">Acompanhe sua evolução física</h1>
            <p className="text-blue-100">Monitore seus resultados, visualize sua progressão e alcance seus objetivos de forma inteligente.</p>
          </div>
        </div>
        
        {/* Lado direito - Formulário */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-16 bg-white">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-10">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-16 w-auto mx-auto mb-5" 
                onError={(e) => {
                  // Fallback caso a logo não exista
                  e.target.style.display = 'none';
                  const parent = e.target.parentNode;
                  const text = document.createElement('h2');
                  text.className = "text-2xl font-bold text-blue-600";
                  text.innerHTML = "Avaliação Física";
                  parent.prepend(text);
                }}
              />
              <h2 className="text-2xl font-bold text-gray-900">Bem-vindo</h2>
              <p className="mt-2 text-sm text-gray-600">Faça login para acessar sua conta</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    aria-describedby="email-error"
                    className={`pl-10 py-2 block w-full rounded-lg border ${
                      errors.email ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } shadow-sm`}
                    placeholder="seu@email.com"
                    {...register('email', { 
                      required: 'E-mail é obrigatório',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'E-mail inválido'
                      }
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600" id="email-error">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    aria-describedby="password-error"
                    className={`pl-10 py-2 block w-full rounded-lg border ${
                      errors.password ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } shadow-sm`}
                    {...register('password', { 
                      required: 'Senha é obrigatória',
                      minLength: {
                        value: 6,
                        message: 'A senha deve ter pelo menos 6 caracteres'
                      }
                    })}
                  />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600" id="password-error">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Lembrar-me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/recuperar-senha" className="font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out">
                    Esqueceu sua senha?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  aria-label="Fazer login"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Entrando...
                    </>
                  ) : 'Entrar'}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <Link href="/cadastro" className="font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out">
                  Cadastre-se
                </Link>
              </p>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500">
                &copy; {new Date().getFullYear()} Sistema de Avaliação Física. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  );
}