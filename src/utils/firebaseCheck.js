import { storage } from '../lib/firebase';

// Verificar configuração do Firebase Storage
export const verificarConfiguracao = () => {
  const checks = {
    storageInicializado: false,
    bucketCorreto: false,
    variaveis: {},
    problemas: [],
    solucoes: []
  };

  // Verificar se storage foi inicializado
  if (storage) {
    checks.storageInicializado = true;
    
    // Verificar se o bucket está correto
    const bucket = storage.app.options.storageBucket;
    if (bucket && bucket.endsWith('.appspot.com')) {
      checks.bucketCorreto = true;
    } else {
      checks.problemas.push('Storage bucket incorreto');
      checks.solucoes.push('O bucket deve terminar com .appspot.com, não .firebasestorage.app');
    }
  } else {
    checks.problemas.push('Firebase Storage não inicializado');
    checks.solucoes.push('Verifique se as variáveis de ambiente estão corretas no .env.local');
  }

  // Verificar variáveis de ambiente
  const envVars = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  checks.variaveis = envVars;

  // Verificar variáveis faltantes
  Object.entries(envVars).forEach(([key, value]) => {
    if (!value) {
      checks.problemas.push(`Variável ${key} não definida`);
      checks.solucoes.push(`Adicione NEXT_PUBLIC_FIREBASE_${key.toUpperCase()} no .env.local`);
    }
  });

  return checks;
};

// Testar conexão com Storage
export const testarStorage = async () => {
  try {
    if (!storage) {
      throw new Error('Storage não inicializado');
    }

    // Tentar criar uma referência de teste
    const { ref } = await import('firebase/storage');
    const testRef = ref(storage, 'test/connection.txt');
    
    return {
      sucesso: true,
      bucket: storage.app.options.storageBucket,
      projeto: storage.app.options.projectId
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error.message,
      codigo: error.code
    };
  }
};

// Exibir relatório de configuração
export const exibirRelatorio = async () => {
  console.log('🔍 VERIFICANDO CONFIGURAÇÃO DO FIREBASE STORAGE...\n');
  
  const config = verificarConfiguracao();
  const teste = await testarStorage();

  console.log('📊 RESULTADOS:');
  console.log(`✅ Storage Inicializado: ${config.storageInicializado ? 'SIM' : 'NÃO'}`);
  console.log(`✅ Bucket Correto: ${config.bucketCorreto ? 'SIM' : 'NÃO'}`);
  console.log(`✅ Teste de Conexão: ${teste.sucesso ? 'OK' : 'ERRO'}`);
  
  if (teste.sucesso) {
    console.log(`📦 Bucket: ${teste.bucket}`);
    console.log(`🏗️ Projeto: ${teste.projeto}`);
  }

  if (config.problemas.length > 0) {
    console.log('\n❌ PROBLEMAS ENCONTRADOS:');
    config.problemas.forEach((problema, i) => {
      console.log(`${i + 1}. ${problema}`);
    });

    console.log('\n💡 SOLUÇÕES:');
    config.solucoes.forEach((solucao, i) => {
      console.log(`${i + 1}. ${solucao}`);
    });
  }

  if (!teste.sucesso) {
    console.log(`\n🚨 ERRO DE CONEXÃO: ${teste.erro}`);
    
    if (teste.codigo === 'storage/unknown') {
      console.log('\n🔧 SOLUÇÃO:');
      console.log('1. Acesse: https://console.firebase.google.com/project/avaliacaofisicaapp/storage');
      console.log('2. Clique em "Get Started" para ativar o Storage');
      console.log('3. Execute: firebase deploy --only storage');
    }
  }

  return { config, teste };
}; 