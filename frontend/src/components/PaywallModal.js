import React, { useState } from 'react';
import { X, Check, Sparkles, Crown, Gift } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

function PaywallModal({ isOpen, onClose }) {
  const { createCheckoutSession, applyPromoCode, isTrialActive } = useSubscription();
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    try {
      setCheckoutLoading(true);
      await createCheckoutSession();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to start checkout. Please try again.');
      setCheckoutLoading(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoMessage({ type: 'error', text: 'Please enter a promo code' });
      return;
    }

    try {
      setPromoLoading(true);
      setPromoMessage(null);
      const result = await applyPromoCode(promoCode);
      
      if (result.success) {
        setPromoMessage({ type: 'success', text: result.message });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setPromoMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setPromoMessage({ type: 'error', text: 'Failed to apply promo code' });
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp my-2 sm:my-4 max-h-[95vh] sm:max-h-[90vh] flex flex-col mx-auto">
        {/* Close button - Desktop */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10 hidden sm:flex"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Close button - Mobile (sticky) */}
        <button
          onClick={onClose}
          className="fixed top-2 right-2 p-2 bg-gray-800 text-white rounded-full transition-colors z-20 sm:hidden shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 text-white">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-white bg-opacity-20 rounded-full">
              <Crown className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-1 sm:mb-2">
            {isTrialActive ? 'Upgrade to Pro' : 'Your Trial Has Ended'}
          </h2>
          <p className="text-center text-emerald-50 text-sm sm:text-base">
            {isTrialActive 
              ? 'Unlock unlimited access to all features'
              : 'Continue creating amazing educational content with a subscription'
            }
          </p>
        </div>

        {/* Content - Scrollable when needed */}
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* Pricing Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 sm:p-6 md:p-8 mb-6 border-2 border-emerald-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Pro Plan</h3>
                <p className="text-sm text-gray-600 mt-1">Unlimited access to all features</p>
              </div>
              <div className="text-right">
                <div className="text-3xl sm:text-4xl font-bold text-emerald-600">$9.99</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              {[
                'Unlimited lesson generation',
                'Unlimited worksheet creation',
                'Unlimited presentation decks',
                'AI-powered content editing',
                'High-quality image generation',
                'PDF & PPTX downloads',
                'Priority support'
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Subscribe Button */}
            <button
              onClick={handleSubscribe}
              disabled={checkoutLoading}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Subscribe Now</span>
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-500 mt-3">
              Cancel anytime. No hidden fees.
            </p>
          </div>

          {/* Promo Code Section */}
          <div className="border-t border-gray-200 pt-6">
            {!showPromoInput ? (
              <button
                onClick={() => setShowPromoInput(true)}
                className="w-full flex items-center justify-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors"
              >
                <Gift className="w-4 h-4" />
                <span>Have a promo code?</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <h4 className="font-semibold text-gray-900">Promo Code</h4>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm sm:text-base"
                    disabled={promoLoading}
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="px-4 sm:px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                  >
                    {promoLoading ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {promoMessage && (
                  <div className={`p-3 rounded-lg text-sm ${
                    promoMessage.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {promoMessage.text}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Limited to first 100 users. Get lifetime access with a valid promo code.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
          will-change: opacity;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
          will-change: opacity, transform;
        }
        @media (max-height: 640px) {
          .animate-slideUp {
            animation: fadeIn 0.2s ease-out;
          }
        }
      `}</style>
    </div>
  );
}

export default PaywallModal;
