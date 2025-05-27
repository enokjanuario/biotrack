import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Head from 'next/head';

export default function RecuperarSenha() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { resetPassword, currentUser, userType, loading } = useAuth();
  const [resetLoading, setResetLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  // Verificar se o usuário já está logado e redirecioná-lo
  useEffect(() => {
    if (!loading && currentUser && userType) {
      const redirectPath = userType === 'admin' ? '/admin/dashboard' : '/aluno/dashboard';
      router.replace(redirectPath);
    }
  }, [currentUser, userType, loading, router]);

  // Se ainda está carregando ou usuário já está logado, mostra um loading
  if (loading || (currentUser && userType)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Carregando...' : 'Redirecionando...'}
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data) => {
    try {
      setResetLoading(true);
      await resetPassword(data.email);
      setEmailSent(true);
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error) {
      console.error('Erro na recuperação de senha:', error);
      let errorMessage = 'Falha ao enviar e-mail de recuperação.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'E-mail não encontrado.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'E-mail inválido.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
      }
      
      toast.error(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  if (emailSent) {
    return (
      <>
        <Head>
          <title>E-mail Enviado | Sistema de Avaliação Física</title>
        </Head>
        
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                E-mail enviado!
              </h2>
              <p className="text-gray-600 mb-8">
                Enviamos um link de recuperação para seu e-mail. Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <div className="space-y-4">
                <Link
                  href="/"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Voltar ao login
                </Link>
                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Enviar novamente
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Recuperar Senha | Sistema de Avaliação Física</title>
        <meta name="description" content="Recupere sua senha para acessar o Sistema de Avaliação Física" />
      </Head>
      
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-16 w-auto"
            src="/logo.png"
            alt="Logo"
            onError={(e) => {
              e.target.style.display = 'none';
              const parent = e.target.parentNode;
              const text = document.createElement('h2');
              text.className = "text-2xl font-bold text-blue-600 text-center";
              text.innerHTML = "Avaliação Física";
              parent.prepend(text);
            }}
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Recuperar senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Informe seu e-mail para receber as instruções de recuperação
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <div className="mt-1 relative">
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
                    className={`pl-10 appearance-none block w-full px-3 py-2 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
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
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    resetLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {resetLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : 'Enviar e-mail de recuperação'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Ou</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <Link
                  href="/"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Voltar ao login
                </Link>
                <p className="text-center text-sm text-gray-600">
                  Não tem uma conta?{' '}
                  <Link href="/cadastro" className="font-medium text-blue-600 hover:text-blue-500">
                    Cadastre-se
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    </>
  );
}
