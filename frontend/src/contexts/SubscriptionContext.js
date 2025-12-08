import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import authService from '../services/authService';
import api from '../api';

const SubscriptionContext = createContext({});

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  // Fetch subscription status when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSubscriptionStatus();
    } else {
      setSubscriptionStatus(null);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const token = await authService.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await api.get('/subscription/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSubscriptionStatus(response.data.status);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeTrial = async () => {
    try {
      const token = await authService.getToken();
      if (!token) return null;
      const response = await api.post('/subscription/initialize-trial', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        await fetchSubscriptionStatus();
        return response.data.trial;
      }
    } catch (error) {
      console.error('Error initializing trial:', error);
    }
    return null;
  };

  const createCheckoutSession = async () => {
    try {
      const token = await authService.getToken();
      if (!token) throw new Error('Not authenticated');
      const response = await api.post('/subscription/create-checkout-session', {
        success_url: `${window.location.origin}/library?session=success`,
        cancel_url: `${window.location.origin}/library?session=cancelled`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  };

  const createPortalSession = async () => {
    try {
      const token = await authService.getToken();
      if (!token) throw new Error('Not authenticated');
      const response = await api.post('/subscription/create-portal-session', {
        return_url: `${window.location.origin}/library`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Redirect to Stripe Customer Portal
        window.location.href = response.data.portal_url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  };

  const applyPromoCode = async (code) => {
    try {
      const token = await authService.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };
      const response = await api.post('/subscription/apply-promo-code', {
        code
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        await fetchSubscriptionStatus();
        return { success: true, message: response.data.message };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Error applying promo code:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to apply promo code' 
      };
    }
  };

  const checkAccess = () => {
    if (!subscriptionStatus) return false;
    return subscriptionStatus.can_create_content === true;
  };

  const requireSubscription = (callback) => {
    if (checkAccess()) {
      callback();
    } else {
      setShowPaywall(true);
    }
  };

  const value = {
    subscriptionStatus,
    loading,
    showPaywall,
    setShowPaywall,
    fetchSubscriptionStatus,
    initializeTrial,
    createCheckoutSession,
    createPortalSession,
    applyPromoCode,
    checkAccess,
    requireSubscription,
    // Computed properties
    isTrialActive: subscriptionStatus?.subscription_status === 'trial',
    isSubscribed: subscriptionStatus?.subscription_status === 'active',
    isLifetime: subscriptionStatus?.subscription_status === 'lifetime',
    hasExpired: subscriptionStatus?.subscription_status === 'expired',
    daysRemaining: subscriptionStatus?.days_remaining || 0,
    canCreateContent: subscriptionStatus?.can_create_content || false
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
