import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, CheckCircle2, Circle, ChevronDown, Check, Lightbulb } from 'lucide-react';
import { generateLessonStream, generatePresentationStream, generateWorksheetStream } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigation } from '../hooks/useNavigation';
import posthog from '../posthog';
import PaywallModal from './PaywallModal';

// Animated rotating text component
function RotatingText() {
  const words = ['a lesson plan', 'a worksheet', 'a presentation deck', 'anything'];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`inline-block transition-all duration-300 ${
        isAnimating ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'
      }`}
    >
      {words[currentIndex]}
    </span>
  );
}

const AGENT_STEPS_BY_TYPE = {
  'Lesson Plan': [
    { id: 'analyzing', label: 'Analyzing your request', duration: 1200 },
    { id: 'planning', label: 'Creating lesson plan', duration: 1500 },
    { id: 'researching', label: 'Researching topic content', duration: 1800 },
    { id: 'drafting', label: 'Drafting lesson structure', duration: 2000 },
    { id: 'generating', label: 'Generating detailed content', duration: 0 },
  ],
  'Presentation Deck': [
    { id: 'analyzing', label: 'Analyzing your request', duration: 1200 },
    { id: 'planning', label: 'Planning slide structure', duration: 1500 },
    { id: 'researching', label: 'Researching topic content', duration: 1800 },
    { id: 'drafting', label: 'Designing slide layouts', duration: 2000 },
    { id: 'generating', label: 'Creating presentation slides', duration: 0 },
  ],
  'Worksheet': [
    { id: 'analyzing', label: 'Analyzing your request', duration: 1200 },
    { id: 'planning', label: 'Determining grade level', duration: 1500 },
    { id: 'researching', label: 'Selecting worksheet types', duration: 1800 },
    { id: 'drafting', label: 'Creating questions & activities', duration: 2000 },
    { id: 'generating', label: 'Generating worksheet content', duration: 0 },
  ],
};

function AgentProgress({ currentStep, completedSteps, contentType }) {
  const steps = AGENT_STEPS_BY_TYPE[contentType] || AGENT_STEPS_BY_TYPE['Lesson Plan'];
  
  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 transition-all duration-300 ${
                isCompleted || isCurrent ? 'opacity-100' : 'opacity-40'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <span
                className={`text-sm font-medium ${
                  isCompleted
                    ? 'text-green-700'
                    : isCurrent
                    ? 'text-blue-700'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LessonGenerator({ onLessonGenerated, isGenerating, setIsGenerating }) {
  const { user } = useAuth();
  const { showPaywall, setShowPaywall, isTrialActive, isSubscribed, isLifetime, hasExpired, canCreateContent } = useSubscription();
  const { triggerNavigationReset, goToHome } = useNavigation();
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState('');
  const [agentStep, setAgentStep] = useState('');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [selectedType, setSelectedType] = useState('Lesson Plan');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showIdeasPopup, setShowIdeasPopup] = useState(false);
  const [randomPrompts, setRandomPrompts] = useState([]);
  const [placeholderText, setPlaceholderText] = useState('');
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  
  // Force header to re-render when component mounts
  useEffect(() => {
    // Trigger navigation reset on component mount
    triggerNavigationReset();
  }, [triggerNavigationReset]);
  
  const contentTypes = [
    'Lesson Plan',
    'Worksheet',
    'Presentation Deck',
    // 'Curriculum',
    // 'Flashcards',
    // 'Quiz/Assignment'
  ];
  
  const homeschool_prompts = [
    "Create a simple homeschool lesson on the Solar System with activities.",
    "Make a child-friendly Water Cycle lesson with diagram and experiment.",
    "Explain photosynthesis in a fun homeschool lesson with vocab and activity.",
    "Create a Human Body Systems lesson for kids with examples.",
    "Make a Life Cycle of a Butterfly lesson with coloring activity.",
    "Generate a Forces and Motion homeschool lesson with simple experiments.",
    "Create an Earth’s Layers lesson with craft and visual aid.",
    "Make a Simple Machines lesson using household items and demonstrations.",
    "Create a homeschool fractions lesson using food examples.",
    "Make a multiplication basics lesson with games for kids.",
    "Generate a shapes and geometry lesson with cut-and-paste activity.",
    "Create a reading comprehension lesson using a short story and questions.",
    "Make a creative writing prompt lesson with steps and examples.",
    "Generate a parts-of-speech lesson with simple practice sentences.",
    "Create a child-friendly lesson on the Five Pillars with activities.",
    "Make a homeschool lesson summarizing a Prophet’s story for kids.",
    "Generate a beginners’ lesson on basic daily duas with examples."
  ];

  // Generate random prompts when component mounts
  useEffect(() => {
    const shuffled = [...homeschool_prompts].sort(() => Math.random() - 0.5);
    setRandomPrompts(shuffled.slice(0, 5));
  }, []);

  // Simulate agent steps before actual generation
  useEffect(() => {
    if (!isGenerating || agentStep === 'generating') return;

    const runSteps = async () => {
      const steps = AGENT_STEPS_BY_TYPE[selectedType] || AGENT_STEPS_BY_TYPE['Lesson Plan'];
      for (let i = 0; i < steps.length - 1; i++) {
        const step = steps[i];
        setAgentStep(step.id);
        await new Promise(resolve => setTimeout(resolve, step.duration));
        setCompletedSteps(prev => [...prev, step.id]);
      }
      // Set to final step but don't complete it yet
      setAgentStep('generating');
    };

    runSteps();
  }, [isGenerating, agentStep, selectedType]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      return;
    }
    
    // Trigger navigation reset before generating content
    // This ensures header links will work after content generation
    triggerNavigationReset();

    // Track content creation attempt
    posthog.capture('create_button_clicked', { 
      content_type: selectedType,
      topic_length: topic.length,
      has_user: !!user
    });

    // Only check subscription for logged-in users
    if (user) {
      // A user has access if they have an active trial, subscription, lifetime access, or explicit canCreateContent permission
      const hasAccess = isTrialActive || isSubscribed || isLifetime || canCreateContent;
      
      // Debug subscription status (can be removed in production)
      console.log('LessonGenerator - Subscription status:', { 
        isTrialActive, 
        isSubscribed, 
        isLifetime, 
        hasExpired, 
        canCreateContent, 
        hasAccess,
        isLoggedIn: !!user
      });
      
      if (!hasAccess) {
        // Show paywall if logged-in user doesn't have access
        posthog.capture('paywall_shown', { 
          trigger: 'create_button',
          content_type: selectedType
        });
        // Set showPaywall to true to display the paywall modal
        setShowPaywall(true);
        return;
      }
    } else {
      // Log that a non-logged-in user is creating content
      console.log('Non-logged-in user creating content');
      posthog.capture('guest_content_creation', { 
        content_type: selectedType
      });
    }

    setIsGenerating(true);
    const contentTypeName = selectedType === 'Lesson Plan' ? 'lesson' : selectedType.toLowerCase();
    setStatus(`Generating ${contentTypeName}...`);
    setAgentStep('analyzing');
    setCompletedSteps([]);

    let currentContent = null;
    let currentImages = {};

    try {
      // Route to appropriate generator based on content type
      const userId = user?.uid || null;
      
      if (selectedType === 'Presentation Deck') {
        await generatePresentationStream(topic, userId, (data) => {
          console.log('Presentation stream data:', data.type, data);
          if (data.type === 'init') {
            // Initial connection established
          } else if (data.type === 'presentation') {
            // Complete the generating step
            setCompletedSteps(prev => [...prev, 'generating']);
            setStatus('Presentation ready! Loading images...');
            currentContent = { ...data.presentation, contentType: 'presentation' };
            console.log('Setting presentation content:', currentContent);
            // Immediately show the presentation structure with empty images
            onLessonGenerated(currentContent, {});
          } else if (data.type === 'image') {
            // Update images as they come in
            currentImages[data.key] = data.image;
            console.log('Image received:', data.key, 'Total images:', Object.keys(currentImages).length);
            if (currentContent) {
              // Create a new object to trigger re-render
              const updatedImages = { ...currentImages };
              onLessonGenerated(currentContent, updatedImages);
            }
          } else if (data.type === 'complete') {
            setStatus('Presentation generated successfully!');
            setIsGenerating(false);
            // Track successful presentation generation
            posthog.capture('content_generated_success', { 
              content_type: 'presentation',
              topic_length: topic.length
            });
            
            // Trigger navigation reset to ensure header links work
            triggerNavigationReset();
            
            // Trigger again after a short delay to ensure it works
            setTimeout(() => {
              triggerNavigationReset();
            }, 500);
            
            setTimeout(() => {
              setStatus('');
              setAgentStep('');
              setCompletedSteps([]);
            }, 3000);
          } else if (data.type === 'error') {
            console.error('Error generating presentation:', data.error);
            if (data.error === 'subscription_required') {
              setStatus('');
              setIsGenerating(false);
              setAgentStep('');
              setCompletedSteps([]);
              setShowPaywall(true);
              // Track subscription required error
              posthog.capture('content_generation_error', { 
                content_type: 'presentation',
                error_type: 'subscription_required'
              });
            } else {
              setStatus('Error generating presentation. Please try again.');
              setIsGenerating(false);
              setAgentStep('');
              setCompletedSteps([]);
              // Track general error
              posthog.capture('content_generation_error', { 
                content_type: 'presentation',
                error_type: 'general_error'
              });
            }
          }
        });
      } else if (selectedType === 'Worksheet') {
        await generateWorksheetStream(topic, userId, (data) => {
          console.log('Worksheet stream data:', data.type, data);
          if (data.type === 'init') {
            // Initial connection established
          } else if (data.type === 'worksheet') {
            // Complete the generating step
            setCompletedSteps(prev => [...prev, 'generating']);
            setStatus('Worksheet ready! Loading images...');
            currentContent = { ...data.worksheet, contentType: 'worksheet' };
            console.log('Setting worksheet content:', currentContent);
            // Immediately show the worksheet structure with empty images
            onLessonGenerated(currentContent, {});
          } else if (data.type === 'image') {
            // Update images as they come in
            currentImages[data.key] = data.image;
            console.log('Image received:', data.key, 'Total images:', Object.keys(currentImages).length);
            if (currentContent) {
              // Create a new object to trigger re-render
              const updatedImages = { ...currentImages };
              onLessonGenerated(currentContent, updatedImages);
            }
          } else if (data.type === 'complete') {
            setStatus('Worksheet generated successfully!');
            setIsGenerating(false);
            // Track successful worksheet generation
            posthog.capture('content_generated_success', { 
              content_type: 'worksheet',
              topic_length: topic.length
            });
            
            // Trigger navigation reset to ensure header links work
            triggerNavigationReset();
            
            // Trigger again after a short delay to ensure it works
            setTimeout(() => {
              triggerNavigationReset();
            }, 500);
            
            setTimeout(() => {
              setStatus('');
              setAgentStep('');
              setCompletedSteps([]);
            }, 3000);
          } else if (data.type === 'error') {
            console.error('Error generating worksheet:', data.error);
            if (data.error === 'subscription_required') {
              setStatus('');
              setIsGenerating(false);
              setAgentStep('');
              setCompletedSteps([]);
              setShowPaywall(true);
              // Track subscription required error
              posthog.capture('content_generation_error', { 
                content_type: 'worksheet',
                error_type: 'subscription_required'
              });
            } else {
              setStatus('Error generating worksheet. Please try again.');
              setIsGenerating(false);
              setAgentStep('');
              setCompletedSteps([]);
              // Track general error
              posthog.capture('content_generation_error', { 
                content_type: 'worksheet',
                error_type: 'general_error'
              });
            }
          }
        });
      } else {
        // Default to lesson generation
        await generateLessonStream(topic, userId, (data) => {
          if (data.type === 'init') {
            // Initial connection established
          } else if (data.type === 'lesson') {
            // Complete the generating step
            setCompletedSteps(prev => [...prev, 'generating']);
            setStatus('Lesson ready! Loading images...');
            currentContent = { ...data.lesson, contentType: 'lesson' };
            // Immediately show the lesson structure with empty images
            onLessonGenerated(currentContent, {});
          } else if (data.type === 'image') {
            // Update images as they come in
            currentImages[data.key] = data.image;
            console.log('Image received:', data.key, 'Total images:', Object.keys(currentImages).length);
            console.log('Image data preview:', data.image.substring(0, 50));
            if (currentContent) {
              // Create a new object to trigger re-render
              const updatedImages = { ...currentImages };
              onLessonGenerated(currentContent, updatedImages);
            }
          } else if (data.type === 'complete') {
            setStatus('Lesson generated successfully!');
            setIsGenerating(false);
            // Track successful lesson generation
            posthog.capture('content_generated_success', { 
              content_type: 'lesson',
              topic_length: topic.length
            });
            
            // Trigger navigation reset to ensure header links work
            triggerNavigationReset();
            
            // Trigger again after a short delay to ensure it works
            setTimeout(() => {
              triggerNavigationReset();
            }, 500);
            
            setTimeout(() => {
              setStatus('');
              setAgentStep('');
              setCompletedSteps([]);
            }, 3000);
          } else if (data.type === 'error') {
            console.error('Error generating lesson:', data.error);
            if (data.error === 'subscription_required') {
              setStatus('');
              setIsGenerating(false);
              setAgentStep('');
              setCompletedSteps([]);
              setShowPaywall(true);
              // Track subscription required error
              posthog.capture('content_generation_error', { 
                content_type: 'lesson',
                error_type: 'subscription_required'
              });
            } else {
              setStatus('Error generating lesson. Please try again.');
              setIsGenerating(false);
              setAgentStep('');
              setCompletedSteps([]);
              // Track general error
              posthog.capture('content_generation_error', { 
                content_type: 'lesson',
                error_type: 'general_error'
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setStatus(`Error generating ${contentTypeName}. Please try again.`);
      setIsGenerating(false);
      setAgentStep('');
      setCompletedSteps([]);
      
      // Trigger navigation reset even on error
      triggerNavigationReset();
      
      // Track general exception error
      posthog.capture('content_generation_error', { 
        content_type: selectedType.toLowerCase(),
        error_type: 'exception',
        error_message: error.message
      });
      
      setTimeout(() => {
        // Trigger navigation reset again after a delay
        triggerNavigationReset();
        setStatus('');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 to-purple-200 flex flex-col items-center py-12 px-4">
      {/* Main Heading */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-8">
        Create resources for your homeschool
      </h1>

      {/* Main Card */}
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-lg p-6 mb-8">
        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Text Area */}
          <div>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onFocus={() => {
                setIsTextareaFocused(true);
                posthog.capture('textarea_focused');
              }}
              onBlur={() => setIsTextareaFocused(false)}
              placeholder="Describe what you want to create..."
              className="w-full px-4 py-4 text-lg text-gray-700 placeholder-gray-400 bg-transparent border-0 rounded-lg resize-none focus:outline-none focus:ring-0"
              disabled={isGenerating}
            />
          </div>

          {/* Bottom Controls Row */}
          <div className="flex items-center justify-between">
            {/* Content Type Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                onBlur={() => setTimeout(() => setShowTypeDropdown(false), 200)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-left text-gray-800 hover:bg-gray-50 transition-colors"
                disabled={isGenerating}
              >
                <Sparkles className="w-4 h-4 text-teal-500" />
                <span className="font-medium">{selectedType}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {showTypeDropdown && (
                <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {contentTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedType(type);
                        setShowTypeDropdown(false);
                        // Track content type selection
                        posthog.capture('content_type_selected', { content_type: type });
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition-colors flex items-center justify-between"
                    >
                      <span>{type}</span>
                      {selectedType === type && (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          
            {/* Create Button */}
            <button
              type="submit"
              disabled={isGenerating || !topic.trim()}
              className="px-8 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Create</>
              )}
            </button>
          </div>
        </form>

        {/* Agent Progress */}
        {isGenerating && agentStep && (
          <div className="mt-6">
            <AgentProgress currentStep={agentStep} completedSteps={completedSteps} contentType={selectedType} />
          </div>
        )}

        {/* Success Status */}
        {status && !isGenerating && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {status}
            </p>
          </div>
        )}
      </div>

      {/* Example Prompts Section */}
      <div className="w-full max-w-3xl">
        <h2 className="text-center text-gray-700 mb-4">Example prompts:</h2>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => setTopic("Create a child-friendly math worksheet")}
            className="px-5 py-3 text-gray-700 bg-white hover:bg-gray-50 rounded-full transition-colors border border-gray-200 shadow-sm"
          >
            Create a child-friendly math worksheet
          </button>
          <button
            type="button"
            onClick={() => setTopic("Explain photosynthesis for 3rd grade")}
            className="px-5 py-3 text-gray-700 bg-white hover:bg-gray-50 rounded-full transition-colors border border-gray-200 shadow-sm"
          >
            Explain photosynthesis for 3rd grade
          </button>
          <button
            type="button"
            onClick={() => setTopic("Make a spelling quiz for beginners")}
            className="px-5 py-3 text-gray-700 bg-white hover:bg-gray-50 rounded-full transition-colors border border-gray-200 shadow-sm"
          >
            Make a spelling quiz for beginners
          </button>
          <button
            type="button"
            onClick={() => setTopic("Create a reading comprehension activity")}
            className="px-5 py-3 text-gray-700 bg-white hover:bg-gray-50 rounded-full transition-colors border border-gray-200 shadow-sm"
          >
            Create a reading comprehension activity
          </button>
        </div>
      </div>
      
      {/* Render PaywallModal directly in LessonGenerator */}
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}

export default LessonGenerator;
