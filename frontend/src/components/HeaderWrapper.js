import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';

/**
 * HeaderWrapper component ensures the header works consistently across the application
 * This component is used in AppRouter.js and wraps the Header component
 */
function HeaderWrapper() {
  const location = useLocation();
  const [resetKey, setResetKey] = useState(0);
  
  // Force a re-render of the header
  const forceRerender = useCallback(() => {
    setResetKey(prevKey => prevKey + 1);
  }, []);
  
  // Listen for navigation reset events
  useEffect(() => {
    const handleNavigationReset = () => {
      // Force re-render of the header by updating the key
      forceRerender();
    };
    
    window.addEventListener('navigation-reset', handleNavigationReset);
    
    return () => {
      window.removeEventListener('navigation-reset', handleNavigationReset);
    };
  }, [forceRerender]);
  
  // Force re-render when location changes
  useEffect(() => {
    // This ensures the header links work properly when navigating between pages
    forceRerender();
    
    // Set up an interval to periodically force re-render
    // This helps ensure header links work even if other events fail
    const intervalId = setInterval(() => {
      forceRerender();
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(intervalId);
  }, [location.pathname, forceRerender]);
  
  // Generate a unique key to force re-render
  const key = `header-${location.pathname}-${resetKey}`;
  
  return <Header key={key} />;
}

export default HeaderWrapper;
