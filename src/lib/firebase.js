// Importações do Firebase
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase
// Substitua com suas credenciais do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Verificar se as variáveis de ambiente estão configuradas
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variáveis de ambiente do Firebase não configuradas:', missingVars);
  console.error('📄 Consulte o arquivo FIREBASE_SETUP.md para instruções de configuração');
  console.error('🔧 Crie o arquivo .env.local na raiz do projeto com as seguintes variáveis:');
  missingVars.forEach(varName => {
    console.error(`   ${varName}=sua-configuracao-aqui`);
  });
}

// Verificar se a API key parece válida
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('AIza')) {
  console.error('⚠️ API Key do Firebase parece inválida. Deve começar com "AIza"');
}

// Inicializar Firebase apenas uma vez
let firebaseApp;

try {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
    console.log('✅ Firebase inicializado com sucesso');
  } else {
    firebaseApp = getApps()[0];
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
  
  if (error.code === 'auth/invalid-api-key') {
    console.error('🔑 PROBLEMA: API Key inválida');
    console.error('💡 SOLUÇÕES:');
    console.error('   1. Acesse o Firebase Console');
    console.error('   2. Vá em Configurações > Geral > Apps');
    console.error('   3. Copie a configuração correta');
    console.error('   4. Atualize o arquivo .env.local');
  }
  
  throw new Error('Falha na configuração do Firebase. Verifique suas variáveis de ambiente.');
}

// Exportar instâncias do Firebase
let auth, db, storage;

try {
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
} catch (error) {
  console.error('❌ Erro ao inicializar serviços do Firebase:', error);
  
  // Criar objetos mock para desenvolvimento
  auth = null;
  db = null;
  storage = null;
}

export { auth, db, storage };
export default firebaseApp;