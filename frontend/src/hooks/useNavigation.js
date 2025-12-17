import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Custom hook for consistent navigation behavior across the application
 * Ensures header links work properly in all contexts
 */
export function useNavigation() {
  const navigate = useNavigate();
  
  // Helper to trigger navigation reset event
  const triggerNavigationReset = useCallback(() => {
    // Dispatch a custom event to notify the HeaderWrapper to force re-render
    window.dispatchEvent(new CustomEvent('navigation-reset'));
    
    // Small delay to ensure the event is processed
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('navigation-reset'));
    }, 50);
  }, []);
  
  // Force navigation to home page, ensuring state is reset
  const goToHome = useCallback(() => {
    // First trigger the navigation reset
    triggerNavigationReset();
    
    // Then navigate with replace to ensure clean state
    navigate('/', { replace: true });
    
    // Trigger again after navigation
    setTimeout(triggerNavigationReset, 100);
  }, [navigate, triggerNavigationReset]);
  
  // Navigate to library with state reset
  const goToLibrary = useCallback(() => {
    // First trigger the navigation reset
    triggerNavigationReset();
    
    // Then navigate with replace to ensure clean state
    navigate('/library', { replace: true });
    
    // Trigger again after navigation
    setTimeout(triggerNavigationReset, 100);
  }, [navigate, triggerNavigationReset]);
  
  // Navigate to a specific route with optional replace
  const goToRoute = useCallback((route, options = {}) => {
    // First trigger the navigation reset
    triggerNavigationReset();
    
    // Then navigate
    navigate(route, options);
    
    // Trigger again after navigation
    setTimeout(triggerNavigationReset, 100);
  }, [navigate, triggerNavigationReset]);
  
  return {
    goToHome,
    goToLibrary,
    goToRoute,
    navigate,
    triggerNavigationReset
  };
}

export default useNavigation;
