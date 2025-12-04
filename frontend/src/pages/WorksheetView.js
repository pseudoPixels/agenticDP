import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import WorksheetViewer from '../components/WorksheetViewer';
import ChatEditor from '../components/ChatEditor';
import AssignButton from '../components/AssignButton';
import SaveButton from '../components/SaveButton';
import resourceService from '../services/resourceService';

function WorksheetView() {
  const { worksheetId } = useParams();
  const navigate = useNavigate();
  const [worksheet, setWorksheet] = useState(null);
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadWorksheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheetId]);

  const loadWorksheet = async () => {
    try {
      setLoading(true);
      const response = await resourceService.getResource(worksheetId);
      
      console.log('Loaded worksheet response:', response);
      
      if (response.success) {
        const resourceData = response.resource;
        console.log('Worksheet data:', resourceData);
        
        setWorksheet(resourceData.content);
        setImages(resourceData.images || {});
      } else {
        setError('Failed to load worksheet');
      }
    } catch (error) {
      console.error('Error loading worksheet:', error);
      setError('Failed to load worksheet');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !worksheet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error || 'Worksheet not found'}</p>
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
            <SaveButton lesson={worksheet} images={images} resourceId={worksheetId} />
            <AssignButton lesson={worksheet} resourceId={worksheetId} />
          </div>
        </div>
      </div>

      {/* Desktop Layout - Side by side */}
      <main className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Worksheet Content - 2/3 width */}
          <div className="lg:col-span-2">
            <WorksheetViewer worksheet={worksheet} images={images} isProcessing={isProcessing} />
          </div>

          {/* Chat Editor - 1/3 width */}
          <div className="lg:col-span-1">
            <ChatEditor
              lessonId={worksheetId}
              contentType="worksheet"
              onLessonUpdated={(updatedWorksheet, updatedImages) => {
                setWorksheet(updatedWorksheet);
                setImages(updatedImages);
              }}
              onProcessingChange={setIsProcessing}
            />
          </div>
        </div>
      </main>

      {/* Mobile Layout - ChatGPT style */}
      <main className="lg:hidden flex flex-col" style={{ height: 'calc(100vh - 9rem)' }}>
        {/* Worksheet Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <WorksheetViewer worksheet={worksheet} images={images} isProcessing={isProcessing} />
        </div>

        {/* Chat Editor - Fixed at bottom */}
        <div className="border-t border-gray-200 bg-white safe-bottom">
          <ChatEditor
            lessonId={worksheetId}
            contentType="worksheet"
            onLessonUpdated={(updatedWorksheet, updatedImages) => {
              setWorksheet(updatedWorksheet);
              setImages(updatedImages);
            }}
            onProcessingChange={setIsProcessing}
            isMobile={true}
          />
        </div>
      </main>
    </>
  );
}

export default WorksheetView;
