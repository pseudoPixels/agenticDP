import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Library, LogOut, Menu, X, User, HelpCircle, ChevronDown, Clock, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigation } from '../hooks/useNavigation';

function Header() {
  const { goToHome, goToLibrary, navigate } = useNavigation();
  const location = useLocation();
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  const { subscriptionStatus, isTrialActive, isLifetime, hasExpired, daysRemaining, createPortalSession, setShowPaywall } = useSubscription();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLearnMoreMenu, setShowLearnMoreMenu] = useState(false);
  
  // Refs for dropdown menus
  const userMenuRef = useRef(null);
  const learnMoreMenuRef = useRef(null);
  
  // Handle clicks outside of the menus
  useEffect(() => {
    function handleClickOutside(event) {
      // Close user menu if clicked outside
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      
      // Close learn more menu if clicked outside
      if (learnMoreMenuRef.current && !learnMoreMenuRef.current.contains(event.target)) {
        setShowLearnMoreMenu(false);
      }
    }
    
    // Add event listener when menus are open
    if (showUserMenu || showLearnMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showLearnMoreMenu]);

  const handleAuthClick = async () => {
    if (isAuthenticated) {
      setShowUserMenu(!showUserMenu);
    } else {
      try {
        await signIn();
      } catch (error) {
        console.error('Sign in failed:', error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Check if the current path starts with a given path
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <button
            onClick={goToHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/doodlepad.ico" alt="Doodlepad Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-900">Doodlepad</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={goToHome}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/')
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Create
            </button>

            {/* Learn More Dropdown - Only shown when not authenticated */}
            {!isAuthenticated && (
              <div className="relative" ref={learnMoreMenuRef}>
                <button
                  onClick={() => setShowLearnMoreMenu(!showLearnMoreMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                >
                  <HelpCircle className="w-4 h-4" />
                  Learn more
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showLearnMoreMenu && (
                  <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        setShowLearnMoreMenu(false);
                        navigate('/how-it-works');
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      How it Works
                    </button>
                    <button
                      onClick={() => {
                        setShowLearnMoreMenu(false);
                        navigate('/pricing');
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Pricing
                    </button>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated && (
              <button
                onClick={goToLibrary}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/library')
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Library className="w-4 h-4" />
                Library
              </button>
            )}
          </div>

          {/* Right: Auth & Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* User Menu - Desktop */}
            {isAuthenticated ? (
              <div className="hidden sm:block relative" ref={userMenuRef}>
                <button
                  onClick={handleAuthClick}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-emerald-500 hover:to-teal-600 transition-all"
                >
                  {user?.picture ? (
                    <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{user?.name || 'Account'}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                    </div>
                    
                    {/* Subscription Status */}
                    {subscriptionStatus && (
                      <div className="px-4 py-3 border-b border-gray-200">
                        {isLifetime ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Crown className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium text-gray-900">Lifetime Access</span>
                          </div>
                        ) : isTrialActive ? (
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-emerald-600" />
                                <span className="font-medium text-gray-900">Trial Active</span>
                              </div>
                              <p className="text-xs text-gray-600">
                                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                setShowPaywall(true);
                              }}
                              className="w-full px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-medium rounded-md hover:from-emerald-500 hover:to-teal-600 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Crown className="w-3.5 h-3.5" />
                              Upgrade to Pro
                            </button>
                          </div>
                        ) : hasExpired ? (
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-red-500" />
                                <span className="font-medium text-gray-900">Subscription Expired</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                setShowPaywall(true);
                              }}
                              className="w-full px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-medium rounded-md hover:from-emerald-500 hover:to-teal-600 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Crown className="w-3.5 h-3.5" />
                              Upgrade Now
                            </button>
                          </div>
                        ) : subscriptionStatus.subscription_status === 'active' ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Crown className="w-4 h-4 text-emerald-600" />
                              <span className="font-medium text-gray-900">Pro Subscriber</span>
                            </div>
                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                createPortalSession();
                              }}
                              className="text-xs text-emerald-600 hover:text-emerald-700 underline"
                            >
                              Manage subscription
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-900">No Active Subscription</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                setShowPaywall(true);
                              }}
                              className="w-full px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-medium rounded-md hover:from-emerald-500 hover:to-teal-600 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Crown className="w-3.5 h-3.5" />
                              Upgrade Now
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleAuthClick}
                className="hidden sm:block px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-emerald-500 hover:to-teal-600 transition-all"
              >
                Login / Sign Up
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 space-y-2">
            <button
              onClick={() => {
                goToHome();
                setShowMobileMenu(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/') ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              Create
            </button>

            {isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    goToLibrary();
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/library') ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Library className="w-4 h-4" />
                  Library
                </button>

                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                  </div>
                  
                  {/* Subscription Status - Mobile */}
                  {subscriptionStatus && (
                    <div className="px-4 py-2 mb-2">
                      {isLifetime ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Crown className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-gray-900">Lifetime Access</span>
                        </div>
                      ) : isTrialActive ? (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-emerald-600" />
                              <span className="font-medium text-gray-900">Trial Active</span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setShowMobileMenu(false);
                              setShowPaywall(true);
                            }}
                            className="w-full px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-medium rounded-md hover:from-emerald-500 hover:to-teal-600 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            Upgrade to Pro
                          </button>
                        </div>
                      ) : hasExpired ? (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-red-500" />
                              <span className="font-medium text-gray-900">Subscription Expired</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setShowMobileMenu(false);
                              setShowPaywall(true);
                            }}
                            className="w-full px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-medium rounded-md hover:from-emerald-500 hover:to-teal-600 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            Upgrade Now
                          </button>
                        </div>
                      ) : subscriptionStatus.subscription_status === 'active' ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Crown className="w-4 h-4 text-emerald-600" />
                            <span className="font-medium text-gray-900">Pro Subscriber</span>
                          </div>
                          <button
                            onClick={() => {
                              setShowMobileMenu(false);
                              createPortalSession();
                            }}
                            className="text-xs text-emerald-600 hover:text-emerald-700 underline"
                          >
                            Manage subscription
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900">No Active Subscription</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setShowMobileMenu(false);
                              setShowPaywall(true);
                            }}
                            className="w-full px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-medium rounded-md hover:from-emerald-500 hover:to-teal-600 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            Upgrade Now
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      handleSignOut();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <button
                onClick={() => {
                  handleAuthClick();
                  setShowMobileMenu(false);
                }}
                className="sm:hidden w-full px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-500 hover:to-teal-600 transition-all"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
