import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye } from 'lucide-react';

/**
 * PPTXViewer - Embeds PowerPoint viewer in the page
 * 
 * Options:
 * 1. Microsoft Office Online Viewer (requires public URL)
 * 2. Google Docs Viewer (requires public URL)
 * 3. PDF conversion + PDF viewer
 */
function PPTXViewer({ presentationId, presentation, onDownload }) {
  const [viewMode, setViewMode] = useState('html'); // 'html' or 'embedded'
  const [pptxUrl, setPptxUrl] = useState(null);

  useEffect(() => {
    if (viewMode === 'embedded' && presentationId) {
      // Generate PPTX URL
      const url = `/api/presentation/${presentationId}/download`;
      setPptxUrl(url);
    }
  }, [viewMode, presentationId]);

  const handleToggleView = () => {
    setViewMode(prev => prev === 'html' ? 'embedded' : 'html');
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Presentation View</h3>
            <p className="text-sm text-gray-600">
              {viewMode === 'html' 
                ? 'Viewing as HTML slides (editable, instant preview)' 
                : 'Viewing embedded PowerPoint (read-only)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleView}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            {viewMode === 'html' ? 'View as PPTX' : 'View as HTML'}
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* Embedded PPTX Viewer */}
      {viewMode === 'embedded' && pptxUrl && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="aspect-video">
            {/* Option 1: Microsoft Office Online Viewer */}
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + pptxUrl)}`}
              width="100%"
              height="100%"
              frameBorder="0"
              title="PowerPoint Presentation"
              className="w-full h-full"
            />
            
            {/* Alternative: Google Docs Viewer */}
            {/* <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(window.location.origin + pptxUrl)}&embedded=true`}
              width="100%"
              height="100%"
              frameBorder="0"
              title="PowerPoint Presentation"
              className="w-full h-full"
            /> */}
          </div>
          <div className="bg-yellow-50 border-t border-yellow-200 p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Embedded viewer requires the file to be publicly accessible. 
              For local development, use HTML view or download the PPTX.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PPTXViewer;
