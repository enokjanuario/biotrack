import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { collection, doc, addDoc, getDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FotoUpload from '../../../components/ui/FotoUpload';
import { 
  processarMultiplasImagens, 
  salvarFotosAvaliacao,
  formatarTamanho 
} from '../../../utils/imageUploadLocal';

export default function NovaAvaliacao() {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const { currentUser, userType } = useAuth();
  const [loading, setLoading] = useState(false);
  const [processandoFotos, setProcessandoFotos] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [fotos, setFotos] = useState({});
  const [progressoFotos, setProgressoFotos] = useState(null);
  const router = useRouter();
  const { alunoId } = router.query;
  
  // Tabs para diferentes seções do formulário
  const [activeTab, setActiveTab] = useState('composicao');

  // Para calcular o IMC automaticamente
  const peso = watch('peso');
  const altura = watch('altura');
  const percentualGordura = watch('percentualGordura');

  // Função para mostrar informações sobre o modo gratuito
  const mostrarInfoModoGratuito = () => {
    const totalFotos = Object.keys(fotos).length;
    let tamanhoEstimado = 0;
    
    Object.values(fotos).forEach(file => {
      if (file instanceof File) {
        tamanhoEstimado += file.size;
      }
    });

    toast.info(
      `💡 Modo Gratuito Ativado:\n` +
      `• ${totalFotos} fotos selecionadas\n` +
      `• Tamanho estimado: ${formatarTamanho(tamanhoEstimado)}\n` +
      `• Fotos serão otimizadas automaticamente\n` +
      `• Máximo 2MB por foto`, 
      { autoClose: 8000 }
    );
  };

  useEffect(() => {
    // Quando peso e altura são preenchidos, calcula o IMC automaticamente
    if (peso && altura) {
      const alturaMetros = parseFloat(altura) / 100;
      const imc = (parseFloat(peso) / (alturaMetros * alturaMetros)).toFixed(1);
      setValue('imc', imc);
    }
    
    // Quando peso e percentual de gordura são preenchidos, calcula massa magra e gorda
    if (peso && percentualGordura) {
      const massaGorda = ((parseFloat(peso) * parseFloat(percentualGordura)) / 100).toFixed(1);
      const massaMagra = (parseFloat(peso) - parseFloat(massaGorda)).toFixed(1);
      setValue('massaGorda', massaGorda);
      setValue('massaMagra', massaMagra);
    }
  }, [peso, altura, percentualGordura, setValue]);

  // Carregar lista de alunos
  useEffect(() => {
    const fetchAlunos = async () => {
      try {
        setLoadingAlunos(true);
        const alunosQuery = query(collection(db, 'usuarios'), where('tipo', '==', 'aluno'));
        const alunosSnapshot = await getDocs(alunosQuery);
        
        const alunosData = alunosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAlunos(alunosData);
        
        // Se um alunoId for fornecido na URL, pré-selecione esse aluno
        if (alunoId) {
          const alunoDoc = await getDoc(doc(db, 'usuarios', alunoId));
          if (alunoDoc.exists()) {
            const alunoData = { id: alunoDoc.id, ...alunoDoc.data() };
            setSelectedAluno(alunoData);
            setValue('alunoId', alunoId);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar alunos:', error);
        toast.error('Erro ao carregar lista de alunos');
      } finally {
        setLoadingAlunos(false);
      }
    };

    if (currentUser && userType === 'admin') {
      fetchAlunos();
    }
  }, [currentUser, userType, alunoId, setValue]);

  const onSubmit = async (data) => {
    if (userType !== 'admin') {
      toast.error('Você não tem permissão para cadastrar avaliações');
      return;
    }
    
    if (!data.alunoId) {
      toast.error('Selecione um aluno para a avaliação');
      return;
    }
    
    try {
      setLoading(true);
      
      // Preparar dados básicos da avaliação
      const avaliacaoData = {
        alunoId: data.alunoId,
        alunoNome: selectedAluno?.nome || '',
        avaliadorId: currentUser.uid,
        avaliador: 'Admin',
        dataAvaliacao: Timestamp.fromDate(data.dataAvaliacao ? new Date(data.dataAvaliacao) : new Date()),
        
        // Composição corporal
        peso: parseFloat(data.peso),
        altura: parseFloat(data.altura),
        imc: parseFloat(data.imc),
        percentualGordura: parseFloat(data.percentualGordura),
        massaGorda: parseFloat(data.massaGorda),
        massaMagra: parseFloat(data.massaMagra),
        
        // Circunferências (se preenchidas)
        circunferencias: {
          ...(data.circBraco && { braco: parseFloat(data.circBraco) }),
          ...(data.circAntebraco && { antebraco: parseFloat(data.circAntebraco) }),
          ...(data.circTorax && { torax: parseFloat(data.circTorax) }),
          ...(data.circCintura && { cintura: parseFloat(data.circCintura) }),
          ...(data.circAbdomen && { abdomen: parseFloat(data.circAbdomen) }),
          ...(data.circQuadril && { quadril: parseFloat(data.circQuadril) }),
          ...(data.circCoxa && { coxa: parseFloat(data.circCoxa) }),
          ...(data.circPanturrilha && { panturrilha: parseFloat(data.circPanturrilha) }),
        },
        
        // Testes físicos (se preenchidos)
        testes: {
          ...(data.testeForcaBraco && { forcaBraco: data.testeForcaBraco }),
          ...(data.testeResistencia && { resistencia: data.testeResistencia }),
          ...(data.testeFlexibilidade && { flexibilidade: data.testeFlexibilidade }),
          ...(data.testeVO2max && { vo2max: data.testeVO2max }),
        },
        
        observacoes: data.observacoes || '',
        createdAt: Timestamp.now()
      };
      
      // Salvar avaliação no Firestore primeiro (para obter o ID)
      const avaliacaoRef = await addDoc(collection(db, 'avaliacoes'), avaliacaoData);
      const avaliacaoId = avaliacaoRef.id;
      
      // Se há fotos para processar, processá-las e salvar
      if (Object.keys(fotos).length > 0) {
        setProcessandoFotos(true);
        toast.info('🖼️ Processando fotos no modo gratuito...');
        
        try {
          const resultadosProcessamento = await processarMultiplasImagens(
            fotos,
            (progress) => {
              setProgressoFotos(progress);
              toast.info(`Processando foto ${progress.processados}/${progress.total}: ${progress.tipo}`);
            }
          );
          
          // Salvar fotos processadas no Firestore
          const resultadoSalvar = await salvarFotosAvaliacao(avaliacaoId, resultadosProcessamento);
          
          if (resultadoSalvar.sucesso) {
            toast.success(`✅ ${resultadoSalvar.quantidadeSalvas} fotos salvas com sucesso!`);
          } else {
            toast.warning('Algumas fotos não puderam ser salvas.');
          }
          
          // Verificar se houve algum erro no processamento
          const errosProcessamento = Object.entries(resultadosProcessamento)
            .filter(([_, resultado]) => !resultado.sucesso)
            .map(([tipo, resultado]) => `${tipo}: ${resultado.erro}`);
          
          if (errosProcessamento.length > 0) {
            toast.warning(`Problemas em algumas fotos: ${errosProcessamento.join(', ')}`);
          }
        } catch (processError) {
          console.error('Erro no processamento de fotos:', processError);
          toast.error('Erro ao processar fotos, mas a avaliação foi salva.');
        } finally {
          setProcessandoFotos(false);
          setProgressoFotos(null);
        }
      }
      
      toast.success('✅ Avaliação cadastrada com sucesso!');
      
      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        router.push('/admin/alunos');
      }, 2000);
    } catch (error) {
      console.error('Erro ao cadastrar avaliação:', error);
      toast.error('Falha ao cadastrar avaliação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Nova Avaliação Física</h1>
            <p className="text-sm text-green-600 mt-1">🎉 Modo Gratuito - Fotos salvas no Firestore</p>
          </div>
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
              {/* Seleção de Aluno */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Aluno</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="alunoId" className="block text-sm font-medium text-gray-700">
                      Selecione o Aluno *
                    </label>
                    <div className="mt-1">
                      <select
                        id="alunoId"
                        disabled={loadingAlunos || alunoId}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          errors.alunoId ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          (loadingAlunos || alunoId) ? 'bg-gray-100' : ''
                        }`}
                        {...register('alunoId', { required: 'Selecione um aluno' })}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const aluno = alunos.find(a => a.id === selectedId);
                          setSelectedAluno(aluno);
                        }}
                      >
                        <option value="">Selecione um aluno</option>
                        {alunos.map(aluno => (
                          <option key={aluno.id} value={aluno.id}>
                            {aluno.nome}
                          </option>
                        ))}
                      </select>
                      {errors.alunoId && (
                        <p className="mt-2 text-sm text-red-600">{errors.alunoId.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="dataAvaliacao" className="block text-sm font-medium text-gray-700">
                      Data da Avaliação *
                    </label>
                    <div className="mt-1">
                      <input
                        id="dataAvaliacao"
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className={`appearance-none block w-full px-3 py-2 border ${
                          errors.dataAvaliacao ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                        {...register('dataAvaliacao', { required: 'Data é obrigatória' })}
                      />
                      {errors.dataAvaliacao && (
                        <p className="mt-2 text-sm text-red-600">{errors.dataAvaliacao.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tabs para diferentes seções do formulário */}
              <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-8">
                  <button
                    type="button"
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'composicao'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('composicao')}
                  >
                    Composição Corporal
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'circunferencias'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('circunferencias')}
                  >
                    Circunferências
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'testes'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('testes')}
                  >
                    Testes Físicos
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'fotos'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('fotos')}
                  >
                    📷 Fotos
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'observacoes'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('observacoes')}
                  >
                    Observações
                  </button>
                </div>
              </div>
              
              {/* Composição Corporal */}
              {activeTab === 'composicao' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-800">Composição Corporal</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="peso" className="block text-sm font-medium text-gray-700">
                        Peso (kg) *
                      </label>
                      <div className="mt-1">
                        <input
                          id="peso"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.peso ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('peso', { 
                            required: 'Peso é obrigatório',
                            min: { value: 30, message: 'Peso deve ser maior que 30kg' },
                            max: { value: 300, message: 'Peso deve ser menor que 300kg' }
                          })}
                        />
                        {errors.peso && (
                          <p className="mt-2 text-sm text-red-600">{errors.peso.message}</p>
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
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.altura ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('altura', { 
                            required: 'Altura é obrigatória',
                            min: { value: 100, message: 'Altura deve ser maior que 100cm' },
                            max: { value: 250, message: 'Altura deve ser menor que 250cm' }
                          })}
                        />
                        {errors.altura && (
                          <p className="mt-2 text-sm text-red-600">{errors.altura.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="imc" className="block text-sm font-medium text-gray-700">
                        IMC (calculado automaticamente)
                      </label>
                      <div className="mt-1">
                        <input
                          id="imc"
                          type="number"
                          step="0.1"
                          readOnly
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                          {...register('imc')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="percentualGordura" className="block text-sm font-medium text-gray-700">
                        Percentual de Gordura (%) *
                      </label>
                      <div className="mt-1">
                        <input
                          id="percentualGordura"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.percentualGordura ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('percentualGordura', { 
                            required: 'Percentual de gordura é obrigatório',
                            min: { value: 3, message: 'Percentual deve ser maior que 3%' },
                            max: { value: 50, message: 'Percentual deve ser menor que 50%' }
                          })}
                        />
                        {errors.percentualGordura && (
                          <p className="mt-2 text-sm text-red-600">{errors.percentualGordura.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="massaGorda" className="block text-sm font-medium text-gray-700">
                        Massa Gorda (kg)
                      </label>
                      <div className="mt-1">
                        <input
                          id="massaGorda"
                          type="number"
                          step="0.1"
                          readOnly
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                          {...register('massaGorda')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="massaMagra" className="block text-sm font-medium text-gray-700">
                        Massa Magra (kg)
                      </label>
                      <div className="mt-1">
                        <input
                          id="massaMagra"
                          type="number"
                          step="0.1"
                          readOnly
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                          {...register('massaMagra')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Circunferências */}
              {activeTab === 'circunferencias' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-800">Circunferências (cm)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="circBraco" className="block text-sm font-medium text-gray-700">
                        Braço
                      </label>
                      <div className="mt-1">
                        <input
                          id="circBraco"
                          type="number"
                          step="0.1"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          {...register('circBraco')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circAntebraco" className="block text-sm font-medium text-gray-700">
                        Antebraço
                      </label>
                      <div className="mt-1">
                        <input
                          id="circAntebraco"
                          type="number"
                          step="0.1"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          {...register('circAntebraco')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circTorax" className="block text-sm font-medium text-gray-700">
                        Tórax
                      </label>
                      <div className="mt-1">
                        <input
                          id="circTorax"
                          type="number"
                          step="0.1"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          {...register('circTorax')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circCintura" className="block text-sm font-medium text-gray-700">
                        Cintura
                      </label>
                      <div className="mt-1">
                        <input
                          id="circCintura"
                          type="number"
                          step="0.1"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          {...register('circCintura')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circAbdomen" className="block text-sm font-medium text-gray-700">
                        Abdômen
                      </label>
                      <div className="mt-1">
                        <input
                          id="circAbdomen"
                          type="number"
                          step="0.1"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          {...register('circAbdomen')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circQuadril" className="block text-sm font-medium text-gray-700">
                        Quadril
                      </label>
                      <div className="mt-1">
                        <input
                          id="circQuadril"
                          type="number"
                          step="0.1"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          {...register('circQuadril')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circCoxa" className="block text-sm font-medium text-gray-700">
                        Coxa
                      </label>
                      <div className="mt-1">
                        <input
                          id="circCoxa"
                          type="number"
                          step="0.1"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          {...register('circCoxa')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circPanturrilha" className="block text-sm font-medium text-gray-700">
                        Panturrilha
                      </label>
                      <div className="mt-1">
                        <input
                          id="circPanturrilha"
                          type="number"
                          step="0.1"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          {...register('circPanturrilha')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Testes Físicos */}
              {activeTab === 'testes' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-800">Testes Físicos</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="testeForcaBraco" className="block text-sm font-medium text-gray-700">
                        Força de Braço (repetições)
                      </label>
                      <div className="mt-1">
                        <input
                          id="testeForcaBraco"
                          type="number"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          {...register('testeForcaBraco')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="testeResistencia" className="block text-sm font-medium text-gray-700">
                        Resistência Abdominal (repetições)
                      </label>
                      <div className="mt-1">
                        <input
                          id="testeResistencia"
                          type="number"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          {...register('testeResistencia')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="testeFlexibilidade" className="block text-sm font-medium text-gray-700">
                        Flexibilidade (cm)
                      </label>
                      <div className="mt-1">
                        <input
                          id="testeFlexibilidade"
                          type="number"
                          step="0.1"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          {...register('testeFlexibilidade')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="testeVO2max" className="block text-sm font-medium text-gray-700">
                        VO2 Máximo (ml/kg/min)
                      </label>
                      <div className="mt-1">
                        <input
                          id="testeVO2max"
                          type="number"
                          step="0.1"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          {...register('testeVO2max')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Nova aba de Fotos */}
              {activeTab === 'fotos' && (
                <div className="space-y-6">
                  {/* Informações do modo gratuito */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-green-800">🎉 Modo Gratuito Ativado</h4>
                        <p className="text-sm text-green-700 mt-1">Fotos são otimizadas e salvas no Firestore. Clique para ver detalhes.</p>
                      </div>
                      <button
                        type="button"
                        onClick={mostrarInfoModoGratuito}
                        className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-800 bg-green-100 hover:bg-green-200 transition-colors"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ver Informações
                      </button>
                    </div>
                  </div>

                  <FotoUpload 
                    fotos={fotos}
                    onFotosChange={setFotos}
                    disabled={loading || processandoFotos}
                  />
                  
                  {progressoFotos && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-blue-800">
                          Processando fotos: {progressoFotos.processados}/{progressoFotos.total}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Observações */}
              {activeTab === 'observacoes' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-800">Observações</h3>
                  
                  <div>
                    <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
                      Observações e Recomendações
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="observacoes"
                        rows="4"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Observações sobre a avaliação, recomendações de treinamento, etc."
                        {...register('observacoes')}
                      ></textarea>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link 
                  href="/admin/alunos"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
                  {loading ? 'Salvando...' : 'Salvar Avaliação'}
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