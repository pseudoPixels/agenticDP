import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to ensure navigation state is properly reset when a resource is first created
 * This helps fix the issue where header links don't work after resource creation
 */
function useResetNavigation() {
  const location = useLocation();
  
  useEffect(() => {
    // Force a re-render of the header by dispatching a custom event
    // This ensures the header links work properly when a resource is first created
    const event = new CustomEvent('navigation-reset', { 
      detail: { path: location.pathname } 
    });
    window.dispatchEvent(event);
    
    // Clean up event listener
    return () => {
      // Nothing to clean up
    };
  }, [location.pathname]);
  
  // Return an empty object to make this a valid hook
  return {};
}

export default useResetNavigation;
