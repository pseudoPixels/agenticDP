import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Pricing() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '',
      description: 'Start creating lessons instantly.',
      features: [
        'Instant lesson + worksheet creation',
        'Limited homeschool PDF search (Phase 2+)',
        'Assign tasks to one student',
        'Student mode',
        'Basic library for saved resources'
      ],
      cta: 'Start Free',
      highlighted: false,
      action: () => navigate('/')
    },
    {
      name: 'Founding Families',
      price: '$0',
      period: 'free for life',
      badge: 'Limited to first 100 families',
      description: 'All premium features, free forever for early supporters.',
      features: [
        'Unlimited lesson creation',
        'Unlimited PDF/worksheet search (when launched)',
        'Full Library + organization',
        'Early access to new features',
        'Private Founding Families group',
        'Priority roadmap input'
      ],
      cta: 'Join as a Founding Family',
      highlighted: true,
      disclaimer: 'Lifetime access. Limited availability.',
      action: async () => {
        try {
          await signIn();
        } catch (error) {
          console.error('Sign in failed:', error);
        }
      }
    },
    {
      name: 'Pro',
      price: '$5',
      period: '/month',
      badge: 'Coming Soon',
      description: 'For families who use DoodlePad daily.',
      features: [
        'Everything in Founding Families',
        'Multiple students',
        'Autocomplete Day',
        'Curriculum suggestions',
        'Pods (micro-groups)',
        'Priority support'
      ],
      cta: 'Coming Soon',
      highlighted: false,
      disabled: true,
      action: () => {}
    }
  ];

  const faqs = [
    {
      question: 'Why is DoodlePad free for Founding Families?',
      answer: 'We believe in rewarding early supporters who help shape our product. Founding Families get lifetime access to all premium features as a thank you for joining us early and providing valuable feedback.'
    },
    {
      question: 'What happens after I sign up?',
      answer: 'You can immediately start creating lessons, worksheets, and presentations. If you join as a Founding Family, you\'ll get access to our private community and early feature previews.'
    },
    {
      question: 'Do I need a credit card?',
      answer: 'No credit card required for the Free plan or Founding Families membership. Simply sign up with your email and start creating.'
    },
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Founding Families have lifetime access to all features. When Pro launches, you can choose to upgrade for additional features like multiple students and curriculum suggestions.'
    },
    {
      question: 'What if I\'m not satisfied?',
      answer: 'Since our Free and Founding Families plans are completely free, there\'s no risk. Try it out and see if DoodlePad works for your homeschool needs.'
    }
  ];

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Simple pricing for every homeschool family
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">
            Founding Families get lifetime access.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                  plan.highlighted
                    ? 'ring-4 ring-emerald-400 transform md:scale-105'
                    : ''
                } ${plan.disabled ? 'opacity-75' : ''}`}
              >
                {plan.badge && (
                  <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium ${
                    plan.highlighted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-5xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-600 text-lg">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={plan.action}
                  disabled={plan.disabled}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-600 shadow-lg'
                      : plan.disabled
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>

                {plan.disclaimer && (
                  <p className="text-center text-xs text-gray-500 mt-4 italic">
                    {plan.disclaimer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-400 to-teal-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Homeschool?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join hundreds of families creating amazing educational resources
          </p>
          <button
            onClick={async () => {
              try {
                await signIn();
              } catch (error) {
                console.error('Sign in failed:', error);
              }
            }}
            className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg text-lg"
          >
            Get Started Free
          </button>
        </div>
      </section>
    </div>
  );
}

export default Pricing;
