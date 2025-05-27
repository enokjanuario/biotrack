import { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useRouter } from 'next/router';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'aluno' ou 'admin'
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Verificar se o usuário é admin ou aluno
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        if (userDoc.exists()) {
          setUserType(userDoc.data().tipo);
        }
      } else {
        setCurrentUser(null);
        setUserType(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Registro para alunos
  const registerAluno = async (cpf, email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
        email,
        cpf,
        tipo: 'aluno',
        createdAt: new Date()
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  // Registro para admin (apenas admin pode criar outro admin)
  const registerAdmin = async (email, password, nome) => {
    // Verificar se o usuário atual é admin
    if (userType !== 'admin') {
      throw new Error('Apenas administradores podem criar novos administradores');
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
        email,
        nome,
        tipo: 'admin',
        createdAt: new Date()
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Redirecionar com base no tipo de usuário
      const userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
      if (userDoc.exists()) {
        const tipo = userDoc.data().tipo;
        router.push(tipo === 'admin' ? '/admin/dashboard' : '/aluno/dashboard');
      }
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      throw error;
    }
  };

  // Recuperação de senha
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    currentUser,
    userType,
    registerAluno,
    registerAdmin,
    login,
    logout,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
