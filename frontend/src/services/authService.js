import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import axios from 'axios';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.token = null;
    this.listeners = [];
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
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
   * Sign out
   */
  async signOut() {
    try {
      await firebaseSignOut(auth);
      this.currentUser = null;
      this.token = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
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
