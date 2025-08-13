import { initializeApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, Firestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore collections
export const COLLECTIONS = {
  USERS: 'users',
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  BUDGETS: 'budgets',
  CATEGORIES: 'categories'
} as const;

// Helper function to get user document reference
export const getUserDocRef = (userId: string) => {
  return doc(db, COLLECTIONS.USERS, userId);
};

// Helper function to get account document reference
export const getAccountDocRef = (userId: string, accountId: string) => {
  return doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.ACCOUNTS, accountId);
};

// Helper function to get transaction document reference
export const getTransactionDocRef = (userId: string, transactionId: string) => {
  return doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.TRANSACTIONS, transactionId);
};

// Helper function to get user accounts collection reference
export const getUserAccountsCollection = (userId: string) => {
  return collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.ACCOUNTS);
};

// Helper function to get user transactions collection reference
export const getUserTransactionsCollection = (userId: string) => {
  return collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.TRANSACTIONS);
};

export default app; 