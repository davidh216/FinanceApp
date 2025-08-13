import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle, signOutUser, onAuthStateChange, getUserDocRef } from '../config/firebase';
import { User } from '../types/financial';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Convert Firebase user to our User type
  const convertFirebaseUserToUser = (firebaseUser: FirebaseUser): User => {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
      phone: firebaseUser.phoneNumber || undefined,
      avatar: firebaseUser.photoURL || undefined,
      bio: '',
      isActive: true,
      createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
      updatedAt: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
    };
  };

  // Create or update user document in Firestore
  const createOrUpdateUserDocument = async (firebaseUser: FirebaseUser) => {
    const userRef = getUserDocRef(firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create new user document
      const userData = convertFirebaseUserToUser(firebaseUser);
      await setDoc(userRef, userData);
      return userData;
    } else {
      // Update existing user document
      const userData = userSnap.data() as User;
      const updatedUserData = {
        ...userData,
        email: firebaseUser.email || userData.email,
        name: firebaseUser.displayName || userData.name,
        phone: firebaseUser.phoneNumber || userData.phone,
        avatar: firebaseUser.photoURL || userData.avatar,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userRef, updatedUserData);
      return updatedUserData;
    }
  };

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userData = await createOrUpdateUserDocument(firebaseUser);
          setCurrentUser(userData);
        } catch (error) {
          console.error('Error creating/updating user document:', error);
          // Fallback to basic user data
          setCurrentUser(convertFirebaseUserToUser(firebaseUser));
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in with Google
  const handleSignInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOutUser();
      setCurrentUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const userRef = getUserDocRef(currentUser.id);
      const updatedUserData = {
        ...currentUser,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(userRef, updatedUserData);
      setCurrentUser(updatedUserData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 