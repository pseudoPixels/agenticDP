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
    // Check for redirect result first (in case user was redirected back)
    const checkRedirect = async () => {
      const redirectUser = await authService.handleRedirectResult();
      if (redirectUser) {
        setUser(redirectUser);
      }
    };
    checkRedirect();

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get token and verify with backend
          const token = await firebaseUser.getIdToken();
          authService.token = token;
          
          // Verify with backend
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              authService.currentUser = data.user;
              setUser(data.user);
            }
          }
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
      
      // Initialize trial for new users
      try {
        const token = await authService.getToken();
        if (token) {
          await fetch('/api/subscription/initialize-trial', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } catch (trialError) {
        console.error('Error initializing trial:', trialError);
        // Don't block sign in if trial initialization fails
      }
      
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
      // Force clear user state even if sign out fails
      setUser(null);
      // Don't throw - allow UI to update
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
