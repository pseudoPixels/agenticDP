import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Download } from 'lucide-react';
import PresentationViewer from '../components/PresentationViewer';
import ChatEditor from '../components/ChatEditor';
import AssignButton from '../components/AssignButton';
import SaveButton from '../components/SaveButton';
import resourceService from '../services/resourceService';
import { downloadPresentation } from '../api';

function PresentationView() {
  const { presentationId } = useParams();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState(null);
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPresentation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationId]);

  const loadPresentation = async () => {
    try {
      setLoading(true);
      const response = await resourceService.getResource(presentationId);
      
      console.log('Loaded presentation response:', response);
      
      if (response.success) {
        const resourceData = response.resource;
        console.log('Presentation data:', resourceData);
        
        setPresentation(resourceData.content);
        setImages(resourceData.images || {});
      } else {
        setError('Failed to load presentation');
      }
    } catch (error) {
      console.error('Error loading presentation:', error);
      setError('Failed to load presentation');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPresentation = async () => {
    if (!presentation || !presentation.id) return;
    
    try {
      const blob = await downloadPresentation(presentation.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${presentation.title || 'presentation'}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading presentation:', error);
      alert('Failed to download presentation. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error || 'Presentation not found'}</p>
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
            <button
              onClick={handleDownloadPresentation}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PPTX
            </button>
            <SaveButton lesson={presentation} images={images} resourceId={presentationId} />
            <AssignButton lesson={presentation} resourceId={presentationId} />
          </div>
        </div>
      </div>

      {/* Desktop Layout - Side by side */}
      <main className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Presentation Content - 2/3 width */}
          <div className="lg:col-span-2">
            <PresentationViewer presentation={presentation} images={images} isProcessing={isProcessing} />
          </div>

          {/* Chat Editor - 1/3 width */}
          <div className="lg:col-span-1">
            <ChatEditor
              lessonId={presentationId}
              contentType="presentation"
              onLessonUpdated={(updatedPresentation, updatedImages) => {
                setPresentation(updatedPresentation);
                setImages(updatedImages);
              }}
              onProcessingChange={setIsProcessing}
            />
          </div>
        </div>
      </main>

      {/* Mobile Layout - ChatGPT style */}
      <main className="lg:hidden flex flex-col" style={{ height: 'calc(100vh - 9rem)' }}>
        {/* Presentation Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <PresentationViewer presentation={presentation} images={images} isProcessing={isProcessing} />
        </div>

        {/* Chat Editor - Fixed at bottom */}
        <div className="border-t border-gray-200 bg-white safe-bottom">
          <ChatEditor
            lessonId={presentationId}
            contentType="presentation"
            onLessonUpdated={(updatedPresentation, updatedImages) => {
              setPresentation(updatedPresentation);
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

export default PresentationView;
