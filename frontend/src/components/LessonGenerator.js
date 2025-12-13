import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, CheckCircle2, Circle, ChevronDown, Check, Lightbulb } from 'lucide-react';
import { generateLessonStream, generatePresentationStream, generateWorksheetStream } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

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
  const { setShowPaywall } = useSubscription();
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState('');
  const [agentStep, setAgentStep] = useState('');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [selectedType, setSelectedType] = useState('Lesson Plan');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showIdeasPopup, setShowIdeasPopup] = useState(false);
  const [randomPrompts, setRandomPrompts] = useState([]);
  const [placeholderText, setPlaceholderText] = useState('');
  
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

  // Set random placeholder on component mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * homeschool_prompts.length);
    setPlaceholderText(homeschool_prompts[randomIndex]);
  }, []);

  // Generate 5 random prompts when popup opens
  useEffect(() => {
    if (showIdeasPopup) {
      const shuffled = [...homeschool_prompts].sort(() => Math.random() - 0.5);
      setRandomPrompts(shuffled.slice(0, 5));
    }
  }, [showIdeasPopup]);

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
            } else {
              setStatus('Error generating presentation. Please try again.');
              setIsGenerating(false);
              setAgentStep('');
              setCompletedSteps([]);
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
            } else {
              setStatus('Error generating worksheet. Please try again.');
              setIsGenerating(false);
              setAgentStep('');
              setCompletedSteps([]);
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
            } else {
              setStatus('Error generating lesson. Please try again.');
              setIsGenerating(false);
              setAgentStep('');
              setCompletedSteps([]);
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
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      {/* Main Heading */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12 max-w-4xl w-full leading-tight">
        {user ? (
          <>
            Hi {user.name?.split(' ')[0]}, create <RotatingText />
            <br />
            for your homeschool today
          </>
        ) : (
          <>
            Create <RotatingText />
            <br />
            for your homeschool today
          </>
        )}
      </h1>

      {/* Main Card */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Content Type Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              onBlur={() => setTimeout(() => setShowTypeDropdown(false), 200)}
              className="w-full sm:w-64 flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg text-left text-gray-900 hover:bg-gray-50 transition-colors"
              disabled={isGenerating}
            >
              <span className="font-medium">{selectedType}</span>
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {showTypeDropdown && (
              <div className="absolute top-full mt-2 left-0 w-full sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {contentTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedType(type);
                      setShowTypeDropdown(false);
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

          {/* Large Text Area */}
          <div>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={placeholderText}
              className="w-full h-32 px-4 py-4 text-base text-gray-900 placeholder-gray-400 bg-white border-0 rounded-lg resize-none focus:outline-none focus:ring-0"
              disabled={isGenerating}
            />
          </div>

          {/* Create Button */}
          <button
            type="submit"
            disabled={isGenerating || !topic.trim()}
            className="w-full py-4 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create
              </>
            )}
          </button>
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

      {/* Floating "Need ideas?" Button - Bottom Right */}
      {!isGenerating && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => setShowIdeasPopup(!showIdeasPopup)}
            className="flex items-center gap-2 px-5 py-3 bg-white text-gray-700 font-medium rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-all"
          >
            <Lightbulb className="w-5 h-5 text-emerald-500" />
            <span>Need ideas?</span>
          </button>

          {/* Ideas Popup */}
          {showIdeasPopup && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-20 -z-10"
                onClick={() => setShowIdeasPopup(false)}
              />
              
              {/* Popup Card */}
              <div className="absolute bottom-full right-0 mb-4 w-[90vw] sm:w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Try one of these:</h3>
                <div className="space-y-3">
                  {randomPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setTopic(prompt);
                        setShowIdeasPopup(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:bg-emerald-50 rounded-lg transition-colors border border-gray-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default LessonGenerator;
