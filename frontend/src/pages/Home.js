import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import LessonGenerator from '../components/LessonGenerator';
import LessonViewer from '../components/LessonViewer';
import PresentationViewer from '../components/PresentationViewer';
import WorksheetViewer from '../components/WorksheetViewer';
import ChatEditor from '../components/ChatEditor';
import SaveButton from '../components/SaveButton';
import AssignButton from '../components/AssignButton';
import DownloadButton from '../components/DownloadButton';
import PaywallModal from '../components/PaywallModal';
import { downloadPresentation } from '../api';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../hooks/useNavigation';

function Home() {
  const { user } = useAuth();
  const { showPaywall, setShowPaywall } = useSubscription();
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonImages, setLessonImages] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedResourceId, setSavedResourceId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use the navigation hook to ensure header links work properly
  const { triggerNavigationReset } = useNavigation();
  
  // Force header to re-render when component mounts and when resource is generated
  useEffect(() => {
    // Trigger navigation reset on component mount
    triggerNavigationReset();
    
    // Add event listener for reset-to-create event
    const handleResetToCreate = () => {
      if (currentLesson) {
        setCurrentLesson(null);
        setLessonImages({});
        setSavedResourceId(null);
        setIsGenerating(false);
      }
    };
    
    window.addEventListener('reset-to-create', handleResetToCreate);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('reset-to-create', handleResetToCreate);
    };
  }, [triggerNavigationReset, currentLesson]);

  const handleLessonGenerated = (lesson, images) => {
    console.log('Home - handleLessonGenerated called with images:', Object.keys(images));
    setCurrentLesson(lesson);
    setLessonImages(prevImages => {
      const merged = { ...prevImages, ...images };
      console.log('Home - merged images:', Object.keys(merged));
      return merged;
    });
    setSavedResourceId(null); // Reset saved state for new lesson
    
    // Trigger a navigation reset event to ensure header links work properly
    triggerNavigationReset();
    
    // Trigger again after a short delay to ensure it works
    setTimeout(() => {
      triggerNavigationReset();
    }, 500);
  };

  const handleLessonUpdated = (updatedLesson, updatedImages) => {
    setCurrentLesson(updatedLesson);
    setLessonImages(updatedImages);
    
    // Trigger a navigation reset event to ensure header links work properly
    triggerNavigationReset();
    
    // Trigger again after a short delay to ensure it works
    setTimeout(() => {
      triggerNavigationReset();
    }, 500);
  };
  
  const handleProcessingChange = (processing) => {
    setIsProcessing(processing);
  };

  const handleSaved = (resourceId) => {
    setSavedResourceId(resourceId);
    
    // Trigger a navigation reset event to ensure header links work properly after saving
    triggerNavigationReset();
    
    // Trigger again after a short delay to ensure it works
    setTimeout(() => {
      triggerNavigationReset();
    }, 500);
  };


  const handleDownloadPresentation = async () => {
    if (!currentLesson || !currentLesson.id) return;
    
    try {
      const userId = user?.uid || null;
      const blob = await downloadPresentation(currentLesson.id, userId);
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
      if (error.response?.data?.error === 'subscription_required') {
        setShowPaywall(true);
      } else {
        alert('Failed to download presentation. Please try again.');
      }
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
                  <>
                    <button
                      onClick={handleDownloadPresentation}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download PPTX
                    </button>
                    <SaveButton
                      lesson={currentLesson}
                      images={lessonImages}
                      resourceId={savedResourceId}
                      onSaved={handleSaved}
                    />
                    {savedResourceId && (
                      <AssignButton
                        lesson={currentLesson}
                        resourceId={savedResourceId}
                      />
                    )}
                  </>
                ) : isWorksheet ? (
                  <>
                    <SaveButton
                      lesson={currentLesson}
                      images={lessonImages}
                      resourceId={savedResourceId}
                      onSaved={handleSaved}
                    />
                    {savedResourceId && (
                      <AssignButton
                        lesson={currentLesson}
                        resourceId={savedResourceId}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <SaveButton
                      lesson={currentLesson}
                      images={lessonImages}
                      resourceId={savedResourceId}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Content - 2/3 width */}
              <div className="lg:col-span-2">
                {isPresentation ? (
                  <PresentationViewer presentation={currentLesson} images={lessonImages} isProcessing={isProcessing} />
                ) : isWorksheet ? (
                  <WorksheetViewer worksheet={currentLesson} images={lessonImages} isProcessing={isProcessing} />
                ) : (
                  <LessonViewer lesson={currentLesson} images={lessonImages} isProcessing={isProcessing} />
                )}
              </div>

              {/* Chat Editor - 1/3 width - For all content types */}
              <div className="lg:col-span-1">
                <ChatEditor
                  lessonId={currentLesson.id}
                  contentType={contentType}
                  onLessonUpdated={handleLessonUpdated}
                  onProcessingChange={handleProcessingChange}
                />
              </div>
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

            {/* Chat Editor - Fixed at bottom - For all content types */}
            <div className="border-t border-gray-200 bg-white safe-bottom">
              <ChatEditor
                lessonId={currentLesson.id}
                contentType={contentType}
                onLessonUpdated={handleLessonUpdated}
                onProcessingChange={handleProcessingChange}
                isMobile={true}
              />
            </div>
          </main>
        </>
      )}
      
      {/* Paywall Modal */}
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </>
  );
}

export default Home;
