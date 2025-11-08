import React, { useState } from 'react';
import { Sparkles, Loader2, BookOpen } from 'lucide-react';
import { generateLesson, generateImages } from '../api';

function LessonGenerator({ onLessonGenerated, isGenerating, setIsGenerating }) {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      return;
    }

    setIsGenerating(true);
    setStatus('Generating lesson structure...');

    try {
      // Step 1: Generate lesson structure
      const lessonResponse = await generateLesson(topic);
      
      if (lessonResponse.success) {
        const lessonId = lessonResponse.lesson_id;
        const lessonData = lessonResponse.lesson;
        
        setStatus('Generating images with Imagen (Nano Banana)...');
        
        // Step 2: Generate images
        const imagesResponse = await generateImages(lessonId);
        
        console.log('Images response:', imagesResponse);
        console.log('Images data:', imagesResponse.images);
        
        if (imagesResponse.success) {
          setStatus('Lesson generated successfully!');
          onLessonGenerated(lessonData, imagesResponse.images);
        } else {
          // Even if images fail, show the lesson
          console.warn('Image generation failed, showing lesson without images');
          onLessonGenerated(lessonData, {});
        }
      }
    } catch (error) {
      console.error('Error generating lesson:', error);
      setStatus('Error generating lesson. Please try again.');
    } finally {
      setIsGenerating(false);
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

      {status && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm font-medium flex items-center gap-2">
            {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
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
