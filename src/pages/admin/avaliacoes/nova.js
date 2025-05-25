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
    
    // Validar se há pelo menos uma foto
    if (Object.keys(fotos).length === 0) {
      toast.error('É obrigatório incluir pelo menos uma foto na avaliação');
      return;
    }
    
    // Validar se todos os testes físicos foram preenchidos
    if (!data.testeForcaBraco || !data.testeResistencia || !data.testeFlexibilidade || !data.testeVO2max) {
      toast.error('Todos os testes físicos são obrigatórios');
      return;
    }
    
    // Validar se todas as circunferências foram preenchidas
    const circunferenciasObrigatorias = [
      'circBracoDireito', 'circBracoEsquerdo', 'circAntebracoDireito', 'circAntebracoEsquerdo',
      'circTorax', 'circCintura', 'circAbdomen', 'circQuadril',
      'circCoxaDireita', 'circCoxaEsquerda', 'circPanturrilhaDireita', 'circPanturrilhaEsquerda'
    ];
    
    const circunferenciasFaltando = circunferenciasObrigatorias.filter(campo => !data[campo]);
    if (circunferenciasFaltando.length > 0) {
      toast.error('Todas as circunferências são obrigatórias');
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
        
        // Circunferências (com distinção direito/esquerdo)
        circunferencias: {
          bracoDireito: parseFloat(data.circBracoDireito),
          bracoEsquerdo: parseFloat(data.circBracoEsquerdo),
          antebracoDireito: parseFloat(data.circAntebracoDireito),
          antebracoEsquerdo: parseFloat(data.circAntebracoEsquerdo),
          torax: parseFloat(data.circTorax),
          cintura: parseFloat(data.circCintura),
          abdomen: parseFloat(data.circAbdomen),
          quadril: parseFloat(data.circQuadril),
          coxaDireita: parseFloat(data.circCoxaDireita),
          coxaEsquerda: parseFloat(data.circCoxaEsquerda),
          panturrilhaDireita: parseFloat(data.circPanturrilhaDireita),
          panturrilhaEsquerda: parseFloat(data.circPanturrilhaEsquerda),
        },
        
        // Testes físicos (todos obrigatórios)
        testes: {
          forcaBraco: parseFloat(data.testeForcaBraco),
          resistencia: parseFloat(data.testeResistencia),
          flexibilidade: parseFloat(data.testeFlexibilidade),
          vo2max: parseFloat(data.testeVO2max),
        },
        
        observacoes: data.observacoes || '',
        createdAt: Timestamp.now()
      };
      
      // Salvar avaliação no Firestore primeiro (para obter o ID)
      const avaliacaoRef = await addDoc(collection(db, 'avaliacoes'), avaliacaoData);
      const avaliacaoId = avaliacaoRef.id;
      
      // Processar fotos (agora obrigatórias)
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
                  <h3 className="text-lg font-medium text-gray-800">Circunferências (cm) - Todos os campos obrigatórios</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="circBracoDireito" className="block text-sm font-medium text-gray-700">
                        Braço Direito *
                      </label>
                      <div className="mt-1">
                        <input
                          id="circBracoDireito"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.circBracoDireito ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('circBracoDireito', { 
                            required: 'Circunferência do braço direito é obrigatória',
                            min: { value: 10, message: 'Valor deve ser maior que 10cm' },
                            max: { value: 100, message: 'Valor deve ser menor que 100cm' }
                          })}
                        />
                        {errors.circBracoDireito && (
                          <p className="mt-1 text-sm text-red-600">{errors.circBracoDireito.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circBracoEsquerdo" className="block text-sm font-medium text-gray-700">
                        Braço Esquerdo *
                      </label>
                      <div className="mt-1">
                        <input
                          id="circBracoEsquerdo"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.circBracoEsquerdo ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('circBracoEsquerdo', { 
                            required: 'Circunferência do braço esquerdo é obrigatória',
                            min: { value: 10, message: 'Valor deve ser maior que 10cm' },
                            max: { value: 100, message: 'Valor deve ser menor que 100cm' }
                          })}
                        />
                        {errors.circBracoEsquerdo && (
                          <p className="mt-1 text-sm text-red-600">{errors.circBracoEsquerdo.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circAntebracoDireito" className="block text-sm font-medium text-gray-700">
                        Antebraço Direito *
                      </label>
                      <div className="mt-1">
                        <input
                          id="circAntebracoDireito"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.circAntebracoDireito ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('circAntebracoDireito', { 
                            required: 'Circunferência do antebraço direito é obrigatória',
                            min: { value: 10, message: 'Valor deve ser maior que 10cm' },
                            max: { value: 50, message: 'Valor deve ser menor que 50cm' }
                          })}
                        />
                        {errors.circAntebracoDireito && (
                          <p className="mt-1 text-sm text-red-600">{errors.circAntebracoDireito.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circAntebracoEsquerdo" className="block text-sm font-medium text-gray-700">
                        Antebraço Esquerdo *
                      </label>
                      <div className="mt-1">
                        <input
                          id="circAntebracoEsquerdo"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.circAntebracoEsquerdo ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('circAntebracoEsquerdo', { 
                            required: 'Circunferência do antebraço esquerdo é obrigatória',
                            min: { value: 10, message: 'Valor deve ser maior que 10cm' },
                            max: { value: 50, message: 'Valor deve ser menor que 50cm' }
                          })}
                        />
                        {errors.circAntebracoEsquerdo && (
                          <p className="mt-1 text-sm text-red-600">{errors.circAntebracoEsquerdo.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circTorax" className="block text-sm font-medium text-gray-700">
                        Tórax *
                      </label>
                      <div className="mt-1">
                        <input
                          id="circTorax"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.circTorax ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('circTorax', { 
                            required: 'Circunferência do tórax é obrigatória',
                            min: { value: 40, message: 'Valor deve ser maior que 40cm' },
                            max: { value: 150, message: 'Valor deve ser menor que 150cm' }
                          })}
                        />
                        {errors.circTorax && (
                          <p className="mt-1 text-sm text-red-600">{errors.circTorax.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circCintura" className="block text-sm font-medium text-gray-700">
                        Cintura *
                      </label>
                      <div className="mt-1">
                        <input
                          id="circCintura"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.circCintura ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('circCintura', { 
                            required: 'Circunferência da cintura é obrigatória',
                            min: { value: 40, message: 'Valor deve ser maior que 40cm' },
                            max: { value: 150, message: 'Valor deve ser menor que 150cm' }
                          })}
                        />
                        {errors.circCintura && (
                          <p className="mt-1 text-sm text-red-600">{errors.circCintura.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circAbdomen" className="block text-sm font-medium text-gray-700">
                        Abdômen *
                      </label>
                      <div className="mt-1">
                        <input
                          id="circAbdomen"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.circAbdomen ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('circAbdomen', { 
                            required: 'Circunferência do abdômen é obrigatória',
                            min: { value: 40, message: 'Valor deve ser maior que 40cm' },
                            max: { value: 150, message: 'Valor deve ser menor que 150cm' }
                          })}
                        />
                        {errors.circAbdomen && (
                          <p className="mt-1 text-sm text-red-600">{errors.circAbdomen.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circQuadril" className="block text-sm font-medium text-gray-700">
                        Quadril *
                      </label>
                      <div className="mt-1">
                        <input
                          id="circQuadril"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.circQuadril ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('circQuadril', { 
                            required: 'Circunferência do quadril é obrigatória',
                            min: { value: 40, message: 'Valor deve ser maior que 40cm' },
                            max: { value: 150, message: 'Valor deve ser menor que 150cm' }
                          })}
                        />
                        {errors.circQuadril && (
                          <p className="mt-1 text-sm text-red-600">{errors.circQuadril.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circCoxaDireita" className="block text-sm font-medium text-gray-700">
                        Coxa Direita *
                      </label>
                      <div className="mt-1">
                        <input
                          id="circCoxaDireita"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.circCoxaDireita ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('circCoxaDireita', { 
                            required: 'Circunferência da coxa direita é obrigatória',
                            min: { value: 20, message: 'Valor deve ser maior que 20cm' },
                            max: { value: 100, message: 'Valor deve ser menor que 100cm' }
                          })}
                        />
                        {errors.circCoxaDireita && (
                          <p className="mt-1 text-sm text-red-600">{errors.circCoxaDireita.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circCoxaEsquerda" className="block text-sm font-medium text-gray-700">
                        Coxa Esquerda *
                      </label>
                      <div className="mt-1">
                        <input
                          id="circCoxaEsquerda"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.circCoxaEsquerda ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('circCoxaEsquerda', { 
                            required: 'Circunferência da coxa esquerda é obrigatória',
                            min: { value: 20, message: 'Valor deve ser maior que 20cm' },
                            max: { value: 100, message: 'Valor deve ser menor que 100cm' }
                          })}
                        />
                        {errors.circCoxaEsquerda && (
                          <p className="mt-1 text-sm text-red-600">{errors.circCoxaEsquerda.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circPanturrilhaDireita" className="block text-sm font-medium text-gray-700">
                        Panturrilha Direita *
                      </label>
                      <div className="mt-1">
                        <input
                          id="circPanturrilhaDireita"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.circPanturrilhaDireita ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('circPanturrilhaDireita', { 
                            required: 'Circunferência da panturrilha direita é obrigatória',
                            min: { value: 15, message: 'Valor deve ser maior que 15cm' },
                            max: { value: 60, message: 'Valor deve ser menor que 60cm' }
                          })}
                        />
                        {errors.circPanturrilhaDireita && (
                          <p className="mt-1 text-sm text-red-600">{errors.circPanturrilhaDireita.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="circPanturrilhaEsquerda" className="block text-sm font-medium text-gray-700">
                        Panturrilha Esquerda *
                      </label>
                      <div className="mt-1">
                        <input
                          id="circPanturrilhaEsquerda"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.circPanturrilhaEsquerda ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('circPanturrilhaEsquerda', { 
                            required: 'Circunferência da panturrilha esquerda é obrigatória',
                            min: { value: 15, message: 'Valor deve ser maior que 15cm' },
                            max: { value: 60, message: 'Valor deve ser menor que 60cm' }
                          })}
                        />
                        {errors.circPanturrilhaEsquerda && (
                          <p className="mt-1 text-sm text-red-600">{errors.circPanturrilhaEsquerda.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Testes Físicos */}
              {activeTab === 'testes' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-800">Testes Físicos - Todos os campos obrigatórios</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="testeForcaBraco" className="block text-sm font-medium text-gray-700">
                        Força de Braço (repetições) *
                      </label>
                      <div className="mt-1">
                        <input
                          id="testeForcaBraco"
                          type="number"
                          min="0"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.testeForcaBraco ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('testeForcaBraco', { 
                            required: 'Teste de força de braço é obrigatório',
                            min: { value: 0, message: 'Valor deve ser maior ou igual a 0' },
                            max: { value: 200, message: 'Valor deve ser menor que 200' }
                          })}
                        />
                        {errors.testeForcaBraco && (
                          <p className="mt-1 text-sm text-red-600">{errors.testeForcaBraco.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="testeResistencia" className="block text-sm font-medium text-gray-700">
                        Resistência Abdominal (repetições) *
                      </label>
                      <div className="mt-1">
                        <input
                          id="testeResistencia"
                          type="number"
                          min="0"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.testeResistencia ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('testeResistencia', { 
                            required: 'Teste de resistência abdominal é obrigatório',
                            min: { value: 0, message: 'Valor deve ser maior ou igual a 0' },
                            max: { value: 300, message: 'Valor deve ser menor que 300' }
                          })}
                        />
                        {errors.testeResistencia && (
                          <p className="mt-1 text-sm text-red-600">{errors.testeResistencia.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="testeFlexibilidade" className="block text-sm font-medium text-gray-700">
                        Flexibilidade (cm) *
                      </label>
                      <div className="mt-1">
                        <input
                          id="testeFlexibilidade"
                          type="number"
                          step="0.1"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.testeFlexibilidade ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('testeFlexibilidade', { 
                            required: 'Teste de flexibilidade é obrigatório',
                            min: { value: -20, message: 'Valor deve ser maior que -20cm' },
                            max: { value: 60, message: 'Valor deve ser menor que 60cm' }
                          })}
                        />
                        {errors.testeFlexibilidade && (
                          <p className="mt-1 text-sm text-red-600">{errors.testeFlexibilidade.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="testeVO2max" className="block text-sm font-medium text-gray-700">
                        VO2 Máximo (ml/kg/min) *
                      </label>
                      <div className="mt-1">
                        <input
                          id="testeVO2max"
                          type="number"
                          step="0.1"
                          min="0"
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.testeVO2max ? 'border-red-300' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          {...register('testeVO2max', { 
                            required: 'Teste de VO2 máximo é obrigatório',
                            min: { value: 10, message: 'Valor deve ser maior que 10 ml/kg/min' },
                            max: { value: 100, message: 'Valor deve ser menor que 100 ml/kg/min' }
                          })}
                        />
                        {errors.testeVO2max && (
                          <p className="mt-1 text-sm text-red-600">{errors.testeVO2max.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Nova aba de Fotos */}
              {activeTab === 'fotos' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-800">Fotos da Avaliação - Obrigatórias</h3>
                  
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