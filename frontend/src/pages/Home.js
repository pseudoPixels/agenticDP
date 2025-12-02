import React, { useState } from 'react';
import { Download } from 'lucide-react';
import LessonGenerator from '../components/LessonGenerator';
import LessonViewer from '../components/LessonViewer';
import PresentationViewer from '../components/PresentationViewer';
import WorksheetViewer from '../components/WorksheetViewer';
import ChatEditor from '../components/ChatEditor';
import SaveButton from '../components/SaveButton';
import AssignButton from '../components/AssignButton';
import DownloadButton from '../components/DownloadButton';
import { downloadPresentation } from '../api';

function Home() {
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonImages, setLessonImages] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedResourceId, setSavedResourceId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
  
  const handleProcessingChange = (processing) => {
    setIsProcessing(processing);
  };

  const handleSaved = (resourceId) => {
    setSavedResourceId(resourceId);
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

  const contentType = currentLesson?.contentType;
  const isPresentation = contentType === 'presentation';
  const isWorksheet = contentType === 'worksheet';
  
  console.log('Home - Render - currentLesson:', currentLesson?.title);
  console.log('Home - Render - contentType:', contentType);
  console.log('Home - Render - isPresentation:', isPresentation);
  console.log('Home - Render - isWorksheet:', isWorksheet);

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
                {isPresentation ? (
                  <button
                    onClick={handleDownloadPresentation}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PPTX
                  </button>
                ) : (
                  <>
                    <SaveButton
                      lesson={currentLesson}
                      images={lessonImages}
                      onSaved={handleSaved}
                    />
                    <DownloadButton lesson={currentLesson} />
                    {savedResourceId && (
                      <AssignButton
                        lesson={currentLesson}
                        resourceId={savedResourceId}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Layout - Side by side */}
          <main className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className={`grid grid-cols-1 ${isPresentation || isWorksheet ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
              {/* Content */}
              <div className={isPresentation || isWorksheet ? '' : 'lg:col-span-2'}>
                {isPresentation ? (
                  <PresentationViewer presentation={currentLesson} images={lessonImages} isProcessing={isProcessing} />
                ) : isWorksheet ? (
                  <WorksheetViewer worksheet={currentLesson} images={lessonImages} isProcessing={isProcessing} />
                ) : (
                  <LessonViewer lesson={currentLesson} images={lessonImages} isProcessing={isProcessing} />
                )}
              </div>

              {/* Chat Editor - Only for lessons */}
              {!isPresentation && !isWorksheet && (
                <div className="lg:col-span-1">
                  <ChatEditor
                    lessonId={currentLesson.id}
                    onLessonUpdated={handleLessonUpdated}
                    onProcessingChange={handleProcessingChange}
                  />
                </div>
              )}
            </div>
          </main>

          {/* Mobile Layout - ChatGPT style */}
          <main className="lg:hidden flex flex-col" style={{ height: 'calc(100vh - 9rem)' }}>
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {isPresentation ? (
                <PresentationViewer presentation={currentLesson} images={lessonImages} isProcessing={isProcessing} />
              ) : isWorksheet ? (
                <WorksheetViewer worksheet={currentLesson} images={lessonImages} isProcessing={isProcessing} />
              ) : (
                <LessonViewer lesson={currentLesson} images={lessonImages} isProcessing={isProcessing} />
              )}
            </div>

            {/* Chat Editor - Fixed at bottom - Only for lessons */}
            {!isPresentation && !isWorksheet && (
              <div className="border-t border-gray-200 bg-white safe-bottom">
                <ChatEditor
                  lessonId={currentLesson.id}
                  onLessonUpdated={handleLessonUpdated}
                  onProcessingChange={handleProcessingChange}
                  isMobile={true}
                />
              </div>
            )}
          </main>
        </>
      )}
    </>
  );
}

export default Home;
