import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import LessonViewer from '../components/LessonViewer';
import ChatEditor from '../components/ChatEditor';
import AssignButton from '../components/AssignButton';
import SaveButton from '../components/SaveButton';
import resourceService from '../services/resourceService';

function LessonView() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const response = await resourceService.getResource(lessonId);
      
      console.log('Loaded resource response:', response);
      
      if (response.success) {
        const resourceData = response.resource;
        console.log('Resource data:', resourceData);
        console.log('Resource images:', resourceData.images);
        console.log('Resource content:', resourceData.content);
        
        setLesson(resourceData.content);
        setImages(resourceData.images || {});
      } else {
        setError('Failed to load lesson');
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      setError('Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonUpdated = (updatedLesson, updatedImages) => {
    setLesson(updatedLesson);
    setImages(updatedImages);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error || 'Lesson not found'}</p>
        <button onClick={() => navigate('/library')} className="btn-primary">
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Action Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-[57px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <SaveButton lesson={lesson} images={images} resourceId={lessonId} />
            <AssignButton lesson={lesson} resourceId={lessonId} />
          </div>
        </div>
      </div>

      {/* Desktop Layout - Side by side */}
      <main className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lesson Content - 2/3 width */}
          <div className="lg:col-span-2">
            <LessonViewer lesson={lesson} images={images} />
          </div>

          {/* Chat Editor - 1/3 width */}
          <div className="lg:col-span-1">
            <ChatEditor
              lessonId={lessonId}
              onLessonUpdated={handleLessonUpdated}
            />
          </div>
        </div>
      </main>

      {/* Mobile Layout - ChatGPT style */}
      <main className="lg:hidden flex flex-col" style={{ height: 'calc(100vh - 9rem)' }}>
        {/* Lesson Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <LessonViewer lesson={lesson} images={images} />
        </div>

        {/* Chat Editor - Fixed at bottom */}
        <div className="border-t border-gray-200 bg-white safe-bottom">
          <ChatEditor
            lessonId={lessonId}
            onLessonUpdated={handleLessonUpdated}
            isMobile={true}
          />
        </div>
      </main>
    </>
  );
}

export default LessonView;
