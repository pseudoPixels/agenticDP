import React, { useState } from 'react';
import LessonGenerator from '../components/LessonGenerator';
import LessonViewer from '../components/LessonViewer';
import ChatEditor from '../components/ChatEditor';
import SaveButton from '../components/SaveButton';
import AssignButton from '../components/AssignButton';

function Home() {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonImages, setLessonImages] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedResourceId, setSavedResourceId] = useState(null);

  const handleLessonGenerated = (lesson, images) => {
    console.log('Home - handleLessonGenerated called with images:', Object.keys(images));
    setCurrentLesson(lesson);
    setLessonImages(prevImages => {
      const merged = { ...prevImages, ...images };
      console.log('Home - merged images:', Object.keys(merged));
      return merged;
    });
    setSavedResourceId(null); // Reset saved state for new lesson
  };

  const handleLessonUpdated = (updatedLesson, updatedImages) => {
    setCurrentLesson(updatedLesson);
    setLessonImages(updatedImages);
  };

  const handleSaved = (resourceId) => {
    setSavedResourceId(resourceId);
  };

  return (
    <>
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
          {/* Action Buttons - Above lesson on desktop, sticky on mobile */}
          <div className="bg-white border-b border-gray-200 sticky top-[57px] z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <SaveButton
                  lesson={currentLesson}
                  images={lessonImages}
                  onSaved={handleSaved}
                />
                {savedResourceId && (
                  <AssignButton
                    lesson={currentLesson}
                    resourceId={savedResourceId}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Desktop Layout - Side by side */}
          <main className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          </main>

          {/* Mobile Layout - ChatGPT style */}
          <main className="lg:hidden flex flex-col" style={{ height: 'calc(100vh - 9rem)' }}>
            {/* Lesson Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <LessonViewer lesson={currentLesson} images={lessonImages} />
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
    </>
  );
}

export default Home;
