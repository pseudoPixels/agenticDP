import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import axios from 'axios';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.token = null;
    this.listeners = [];
    this.useRedirect = false; // Try popup first, fallback to redirect
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    try {
      let result;
      
      if (this.useRedirect) {
        // Use redirect method (more reliable but redirects page)
        await signInWithRedirect(auth, googleProvider);
        return; // Will redirect, so return early
      } else {
        // Try popup method first
        try {
          result = await signInWithPopup(auth, googleProvider);
        } catch (popupError) {
          // If popup fails (blocked), fallback to redirect
          if (popupError.code === 'auth/popup-blocked' || 
              popupError.code === 'auth/popup-closed-by-user' ||
              popupError.code === 'auth/cancelled-popup-request') {
            console.log('Popup blocked, using redirect instead');
            this.useRedirect = true;
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw popupError;
        }
      }
      
      const user = result.user;
      
      // Get Firebase ID token
      const token = await user.getIdToken();
      this.token = token;
      
      // Verify token with backend and get/create user
      const response = await axios.post('/api/auth/verify', { token });
      
      if (response.data.success) {
        this.currentUser = response.data.user;
        this.notifyListeners();
        return this.currentUser;
      }
      
      throw new Error('Failed to verify authentication');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }
  
  /**
   * Handle redirect result after sign-in redirect
   */
  async handleRedirectResult() {
    try {
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        const user = result.user;
        const token = await user.getIdToken();
        this.token = token;
        
        // Verify token with backend
        const response = await axios.post('/api/auth/verify', { token });
        
        if (response.data.success) {
          this.currentUser = response.data.user;
          this.notifyListeners();
          return this.currentUser;
        }
      }
    } catch (error) {
      console.error('Error handling redirect result:', error);
    }
    return null;
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      // Clear local state first (important for corrupted auth states)
      this.currentUser = null;
      this.token = null;
      
      // Try to sign out from Firebase
      // Use a timeout to prevent hanging on network issues
      const signOutPromise = firebaseSignOut(auth);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      );
      
      try {
        await Promise.race([signOutPromise, timeoutPromise]);
      } catch (firebaseError) {
        // Log but don't throw - local state is already cleared
        console.warn('Firebase sign out failed, but local state cleared:', firebaseError);
      }
      
      // Clear any cached credentials
      localStorage.removeItem('firebase:authUser');
      sessionStorage.clear();
      
      // Notify listeners
      this.notifyListeners();
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear local state even if Firebase fails
      this.currentUser = null;
      this.token = null;
      this.notifyListeners();
      // Don't throw - allow logout to complete
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get authentication token
   */
  async getToken() {
    if (auth.currentUser) {
      this.token = await auth.currentUser.getIdToken();
      return this.token;
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser && !!this.token;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentUser));
  }

  /**
   * Get authorization header for API requests
   */
  async getAuthHeader() {
    const token = await this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
