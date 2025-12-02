import React, { useState } from 'react';
import { Plus, HelpCircle, ChevronDown, Menu, X, Download } from 'lucide-react';
import LessonGenerator from './components/LessonGenerator';
import LessonViewer from './components/LessonViewer';
import PresentationViewer from './components/PresentationViewer';
import ChatEditor from './components/ChatEditor';
import { downloadPresentation } from './api';

function App() {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonImages, setLessonImages] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLearnMoreMenu, setShowLearnMoreMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLessonGenerated = (lesson, images) => {
    console.log('App.js - handleLessonGenerated called');
    console.log('App.js - lesson:', lesson);
    console.log('App.js - contentType:', lesson?.contentType);
    console.log('App.js - images:', Object.keys(images));
    setCurrentLesson(lesson);
    setLessonImages(prevImages => {
      const merged = { ...prevImages, ...images };
      console.log('App.js - merged images:', Object.keys(merged));
      return merged;
    });
  };

  const handleLessonUpdated = (updatedLesson, updatedImages) => {
    setCurrentLesson(updatedLesson);
    setLessonImages(updatedImages);
  };

  const handleNewLesson = () => {
    console.log('App.js - Resetting lesson and images');
    setCurrentLesson(null);
    setLessonImages({});
    setIsGenerating(false);
  };

  const handleDownloadPresentation = async () => {
    if (!currentLesson || !currentLesson.id) return;
    
    try {
      const blob = await downloadPresentation(currentLesson.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentLesson.title || 'presentation'}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading presentation:', error);
      alert('Failed to download presentation. Please try again.');
    }
  };

  const isPresentation = currentLesson?.contentType === 'presentation';
  
  console.log('App.js - Render - currentLesson:', currentLesson?.title);
  console.log('App.js - Render - isPresentation:', isPresentation);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-base sm:text-lg font-semibold text-gray-900">DoodlePad</span>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              {/* Create - Always visible and highlighted */}
              <button
                onClick={handleNewLesson}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>

              {/* Learn more - Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLearnMoreMenu(!showLearnMoreMenu)}
                  onBlur={() => setTimeout(() => setShowLearnMoreMenu(false), 200)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Learn more</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {showLearnMoreMenu && (
                  <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      How it Works
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Pricing
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Login/Sign Up & Mobile Menu */}
            <div className="flex items-center gap-2">
              {/* Login Button - Hidden on small mobile, visible on tablet+ */}
              <button className="hidden sm:block px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-emerald-500 hover:to-teal-600 transition-all">
                <span className="hidden sm:inline">Login / Sign Up</span>
                <span className="sm:hidden">Login</span>
              </button>

              {/* Mobile Menu Button - Only visible on mobile */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu - Dropdown */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 space-y-2">
              <button
                onClick={() => {
                  handleNewLesson();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>
              
              <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                How it Works
              </button>
              
              <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Pricing
              </button>

              {/* Login button for very small screens */}
              <button className="sm:hidden w-full px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-500 hover:to-teal-600 transition-all">
                Login / Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      {!currentLesson ? (
        <main>
          <LessonGenerator
            onLessonGenerated={handleLessonGenerated}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
          />
        </main>
      ) : (
        <>
          {/* Download Button for Presentations */}
          {isPresentation && (
            <div className="bg-white border-b border-gray-200 sticky top-[57px] z-30">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <button
                  onClick={handleDownloadPresentation}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PPTX
                </button>
              </div>
            </div>
          )}

          {/* Desktop Layout - Side by side */}
          <main className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Content - 2/3 width */}
              <div className="lg:col-span-2">
                {isPresentation ? (
                  <PresentationViewer presentation={currentLesson} images={lessonImages} />
                ) : (
                  <LessonViewer lesson={currentLesson} images={lessonImages} />
                )}
              </div>

              {/* Chat Editor - 1/3 width */}
              <div className="lg:col-span-1">
                <ChatEditor
                  lessonId={currentLesson.id}
                  onLessonUpdated={handleLessonUpdated}
                />
              </div>
            </div>
          </main>

          {/* Mobile Layout - ChatGPT style */}
          <main className="lg:hidden flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {isPresentation ? (
                <PresentationViewer presentation={currentLesson} images={lessonImages} />
              ) : (
                <LessonViewer lesson={currentLesson} images={lessonImages} />
              )}
            </div>

            {/* Chat Editor - Fixed at bottom */}
            <div className="border-t border-gray-200 bg-white safe-bottom">
              <ChatEditor
                lessonId={currentLesson.id}
                onLessonUpdated={handleLessonUpdated}
                isMobile={true}
              />
            </div>
          </main>
        </>
      )}

    </div>
  );
}

export default App;
