import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import authService from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get token and verify with backend
          const token = await firebaseUser.getIdToken();
          authService.token = token;
          
          // This will get or create the user in our backend
          const userData = await authService.signInWithGoogle();
          setUser(userData);
        } catch (error) {
          console.error('Error verifying user:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        authService.currentUser = null;
        authService.token = null;
      }
      setLoading(false);
    });

    // Subscribe to auth service changes
    const authUnsubscribe = authService.onAuthStateChanged((userData) => {
      setUser(userData);
    });

    return () => {
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const signIn = async () => {
    try {
      const userData = await authService.signInWithGoogle();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
