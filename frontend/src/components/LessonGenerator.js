import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { generateLessonStream } from '../api';

const AGENT_STEPS = [
  { id: 'analyzing', label: 'Analyzing your request', duration: 1200 },
  { id: 'planning', label: 'Creating lesson plan', duration: 1500 },
  { id: 'researching', label: 'Researching topic content', duration: 1800 },
  { id: 'drafting', label: 'Drafting lesson structure', duration: 2000 },
  { id: 'generating', label: 'Generating detailed content', duration: 0 }, // This will complete when lesson is ready
];

function AgentProgress({ currentStep, completedSteps }) {
  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="space-y-3">
        {AGENT_STEPS.map((step, index) => {
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
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState('');
  const [agentStep, setAgentStep] = useState('');
  const [completedSteps, setCompletedSteps] = useState([]);

  // Simulate agent steps before actual generation
  useEffect(() => {
    if (!isGenerating || agentStep === 'generating') return;

    const runSteps = async () => {
      for (let i = 0; i < AGENT_STEPS.length - 1; i++) {
        const step = AGENT_STEPS[i];
        setAgentStep(step.id);
        await new Promise(resolve => setTimeout(resolve, step.duration));
        setCompletedSteps(prev => [...prev, step.id]);
      }
      // Set to final step but don't complete it yet
      setAgentStep('generating');
    };

    runSteps();
  }, [isGenerating, agentStep]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      return;
    }

    setIsGenerating(true);
    setStatus('Generating lesson...');
    setAgentStep('analyzing');
    setCompletedSteps([]);

    let currentLesson = null;
    let currentImages = {};

    try {
      await generateLessonStream(topic, (data) => {
        if (data.type === 'init') {
          // Initial connection established
        } else if (data.type === 'lesson') {
          // Complete the generating step
          setCompletedSteps(prev => [...prev, 'generating']);
          setStatus('Lesson ready! Loading images...');
          currentLesson = data.lesson;
          // Immediately show the lesson structure with empty images
          onLessonGenerated(currentLesson, {});
        } else if (data.type === 'image') {
          // Update images as they come in
          currentImages[data.key] = data.image;
          console.log('Image received:', data.key, 'Total images:', Object.keys(currentImages).length);
          console.log('Image data preview:', data.image.substring(0, 50));
          if (currentLesson) {
            // Create a new object to trigger re-render
            const updatedImages = { ...currentImages };
            onLessonGenerated(currentLesson, updatedImages);
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
          setStatus('Error generating lesson. Please try again.');
          setIsGenerating(false);
          setAgentStep('');
          setCompletedSteps([]);
        }
      });
    } catch (error) {
      console.error('Error generating lesson:', error);
      setStatus('Error generating lesson. Please try again.');
      setIsGenerating(false);
      setAgentStep('');
      setCompletedSteps([]);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="lesson-card">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Generate Your Lesson
        </h2>
        <p className="text-gray-600">
          Enter any topic and let AI create a comprehensive, professional lesson with images
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            Lesson Topic
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Photosynthesis, World War II, Machine Learning..."
            className="input-field"
            disabled={isGenerating}
          />
        </div>

        <button
          type="submit"
          disabled={isGenerating || !topic.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Lesson
            </>
          )}
        </button>
      </form>

      {isGenerating && agentStep && (
        <AgentProgress currentStep={agentStep} completedSteps={completedSteps} />
      )}

      {status && !isGenerating && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {status}
          </p>
        </div>
      )}

      {/* Example Topics */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-3">Try these topics:</p>
        <div className="flex flex-wrap gap-2">
          {['Photosynthesis', 'Ancient Egypt', 'JavaScript Basics', 'Climate Change', 'Quantum Physics'].map((exampleTopic) => (
            <button
              key={exampleTopic}
              onClick={() => setTopic(exampleTopic)}
              disabled={isGenerating}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors disabled:opacity-50"
            >
              {exampleTopic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LessonGenerator;
