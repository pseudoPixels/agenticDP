import React, { useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import LessonGenerator from './components/LessonGenerator';
import LessonViewer from './components/LessonViewer';
import ChatEditor from './components/ChatEditor';

function App() {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonImages, setLessonImages] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleLessonGenerated = (lesson, images) => {
    setCurrentLesson(lesson);
    setLessonImages(images);
  };

  const handleLessonUpdated = (updatedLesson, updatedImages) => {
    setCurrentLesson(updatedLesson);
    setLessonImages(updatedImages);
  };

  const handleNewLesson = () => {
    setCurrentLesson(null);
    setLessonImages({});
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary-500 to-indigo-600 p-2 rounded-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Lesson Generator</h1>
                <p className="text-sm text-gray-500">Powered by Gemini & Imagen</p>
              </div>
            </div>
            {currentLesson && (
              <button
                onClick={handleNewLesson}
                className="btn-secondary flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                New Lesson
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentLesson ? (
          <div className="max-w-2xl mx-auto">
            <LessonGenerator
              onLessonGenerated={handleLessonGenerated}
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lesson Content - 2/3 width */}
            <div className="lg:col-span-2">
              <LessonViewer lesson={currentLesson} images={lessonImages} />
            </div>

            {/* Chat Editor - 1/3 width */}
            <div className="lg:col-span-1">
              <ChatEditor
                lessonId={currentLesson.id}
                onLessonUpdated={handleLessonUpdated}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            Built with React, Flask, Gemini AI, and Imagen (Nano Banana)
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
