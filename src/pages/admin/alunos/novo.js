import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { doc, setDoc, Timestamp, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { initializeApp } from 'firebase/app';

export default function NovoAluno() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { userType } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const password = watch('password');

  // Função para validar CPF
  const validarCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Elimina CPFs inválidos conhecidos
    if (
      cpf === '00000000000' ||
      cpf === '11111111111' ||
      cpf === '22222222222' ||
      cpf === '33333333333' ||
      cpf === '44444444444' ||
      cpf === '55555555555' ||
      cpf === '66666666666' ||
      cpf === '77777777777' ||
      cpf === '88888888888' ||
      cpf === '99999999999'
    ) {
      return false;
    }
    
    // Valida 1o dígito
    let add = 0;
    for (let i = 0; i < 9; i++) {
      add += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) {
      rev = 0;
    }
    if (rev !== parseInt(cpf.charAt(9))) {
      return false;
    }
    
    // Valida 2o dígito
    add = 0;
    for (let i = 0; i < 10; i++) {
      add += parseInt(cpf.charAt(i)) * (11 - i);
    }
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) {
      rev = 0;
    }
    if (rev !== parseInt(cpf.charAt(10))) {
      return false;
    }
    
    return true;
  };

  const onSubmit = async (data) => {
    if (userType !== 'admin') {
      toast.error('Você não tem permissão para cadastrar alunos');
      return;
    }
    
    try {
      setLoading(true);
      
      // Criar uma instância temporária para não afetar o usuário logado atual
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };
      
      // Inicializar uma segunda instância do Firebase (temporária)
      const secondaryApp = initializeApp(firebaseConfig, 'secondary');
      const secondaryAuth = getAuth(secondaryApp);
      
      // Cadastrar o usuário usando a instância temporária
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      const user = userCredential.user;
      
      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        uid: user.uid,
        email: data.email,
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
        dataNascimento: data.dataNascimento ? Timestamp.fromDate(new Date(data.dataNascimento)) : null,
        endereco: data.endereco,
        tipo: 'aluno',
        createdAt: Timestamp.now(),
        createdBy: auth.currentUser.uid
      });
      
      // Criar perfil do aluno 
      await addDoc(collection(db, 'perfis'), {
        userId: user.uid,
        nome: data.nome,
        idade: data.dataNascimento ? calcularIdade(new Date(data.dataNascimento)) : null,
        sexo: data.sexo,
        altura: data.altura ? parseFloat(data.altura) : null,
        objetivo: data.objetivo,
        observacoes: data.observacoes,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Fazer logout na instância secundária para limpar
      await secondaryAuth.signOut();
      
      toast.success('Aluno cadastrado com sucesso!');
      
      // Redirecionar para a página de nova avaliação com o ID do aluno
      setTimeout(() => {
        router.push(`/admin/avaliacoes/nova?alunoId=${user.uid}`);
      }, 2000);
      
    } catch (error) {
      let errorMessage = 'Falha ao cadastrar aluno. Tente novamente.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'E-mail inválido.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha é muito fraca.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular idade a partir da data de nascimento
  const calcularIdade = (dataNascimento) => {
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const m = hoje.getMonth() - dataNascimento.getMonth();
    
    if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Cadastrar Novo Aluno</h1>
          <Link 
            href="/admin/alunos"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </Link>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                    Nome completo *
                  </label>
                  <div className="mt-1">
                    <input
                      id="nome"
                      type="text"
                      autoComplete="name"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.nome ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      {...register('nome', { 
                        required: 'Nome é obrigatório',
                        minLength: {
                          value: 3,
                          message: 'O nome deve ter pelo menos 3 caracteres'
                        }
                      })}
                    />
                    {errors.nome && (
                      <p className="mt-2 text-sm text-red-600">{errors.nome.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                    CPF *
                  </label>
                  <div className="mt-1">
                    <input
                      id="cpf"
                      type="text"
                      autoComplete="off"
                      placeholder="000.000.000-00"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.cpf ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      {...register('cpf', { 
                        required: 'CPF é obrigatório',
                        validate: value => validarCPF(value) || 'CPF inválido'
                      })}
                    />
                    {errors.cpf && (
                      <p className="mt-2 text-sm text-red-600">{errors.cpf.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-mail *
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      {...register('email', { 
                        required: 'E-mail é obrigatório',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'E-mail inválido'
                        }
                      })}
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                    Telefone *
                  </label>
                  <div className="mt-1">
                    <input
                      id="telefone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="(00) 00000-0000"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.telefone ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      {...register('telefone', { 
                        required: 'Telefone é obrigatório',
                        pattern: {
                          value: /^[\(]?[1-9]{2}[\)]?[\s]?[0-9]{4,5}[\-]?[0-9]{4}$/,
                          message: 'Formato de telefone inválido'
                        }
                      })}
                    />
                    {errors.telefone && (
                      <p className="mt-2 text-sm text-red-600">{errors.telefone.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-700">
                    Data de nascimento *
                  </label>
                  <div className="mt-1">
                    <input
                      id="dataNascimento"
                      type="date"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.dataNascimento ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      {...register('dataNascimento', { 
                        required: 'Data de nascimento é obrigatória',
                        validate: {
                          validDate: value => {
                            const date = new Date(value);
                            const today = new Date();
                            const age = today.getFullYear() - date.getFullYear();
                            return age >= 10 && age <= 100 || 'Idade deve estar entre 10 e 100 anos';
                          }
                        }
                      })}
                    />
                    {errors.dataNascimento && (
                      <p className="mt-2 text-sm text-red-600">{errors.dataNascimento.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="sexo" className="block text-sm font-medium text-gray-700">
                    Sexo *
                  </label>
                  <div className="mt-1">
                    <select
                      id="sexo"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.sexo ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      {...register('sexo', { 
                        required: 'Sexo é obrigatório' 
                      })}
                    >
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                    {errors.sexo && (
                      <p className="mt-2 text-sm text-red-600">{errors.sexo.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="altura" className="block text-sm font-medium text-gray-700">
                    Altura (cm) *
                  </label>
                  <div className="mt-1">
                    <input
                      id="altura"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Ex: 170"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.altura ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      {...register('altura', {
                        required: 'Altura é obrigatória',
                        min: {
                          value: 50,
                          message: 'Altura deve ser maior que 50cm'
                        },
                        max: {
                          value: 250,
                          message: 'Altura deve ser menor que 250cm'
                        }
                      })}
                    />
                    {errors.altura && (
                      <p className="mt-2 text-sm text-red-600">{errors.altura.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="objetivo" className="block text-sm font-medium text-gray-700">
                    Objetivo *
                  </label>
                  <div className="mt-1">
                    <select
                      id="objetivo"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.objetivo ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      {...register('objetivo', { 
                        required: 'Objetivo é obrigatório' 
                      })}
                    >
                      <option value="">Selecione</option>
                      <option value="Emagrecimento">Emagrecimento</option>
                      <option value="Hipertrofia">Hipertrofia</option>
                      <option value="Condicionamento">Condicionamento Físico</option>
                      <option value="Saúde">Saúde e Bem-estar</option>
                      <option value="Reabilitação">Reabilitação</option>
                      <option value="Outro">Outro</option>
                    </select>
                    {errors.objetivo && (
                      <p className="mt-2 text-sm text-red-600">{errors.objetivo.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">
                    Endereço *
                  </label>
                  <div className="mt-1">
                    <input
                      id="endereco"
                      type="text"
                      placeholder="Rua, número, bairro, cidade - UF"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.endereco ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      {...register('endereco', { 
                        required: 'Endereço é obrigatório',
                        minLength: {
                          value: 10,
                          message: 'Endereço deve ter pelo menos 10 caracteres'
                        }
                      })}
                    />
                    {errors.endereco && (
                      <p className="mt-2 text-sm text-red-600">{errors.endereco.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
                    Observações
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="observacoes"
                      rows="3"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.observacoes ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      {...register('observacoes')}
                    />
                    {errors.observacoes && (
                      <p className="mt-2 text-sm text-red-600">{errors.observacoes.message}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6 pb-2">
                <h3 className="text-lg font-medium text-gray-900">Dados de Acesso</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Defina a senha inicial para este aluno. Ele poderá alterá-la posteriormente.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Senha *
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      type="password"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      {...register('password', { 
                        required: 'Senha é obrigatória',
                        minLength: {
                          value: 6,
                          message: 'A senha deve ter pelo menos 6 caracteres'
                        }
                      })}
                    />
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirme a senha *
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      type="password"
                      className={`appearance-none block w-full px-3 py-2 border ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      {...register('confirmPassword', { 
                        required: 'Confirmação de senha é obrigatória',
                        validate: value => value === password || 'As senhas não coincidem'
                      })}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Link 
                  href="/admin/alunos"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </Layout>
  );
}