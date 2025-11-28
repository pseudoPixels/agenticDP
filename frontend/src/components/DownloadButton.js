import React, { useState, useRef } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

function DownloadButton({ lesson }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const printRef = useRef();

  const handleDownload = useReactToPrint({
    content: () => {
      // Find the lesson card element
      const lessonElement = document.querySelector('.lesson-card');
      return lessonElement;
    },
    documentTitle: lesson ? lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'lesson',
    onBeforeGetContent: () => {
      setIsDownloading(true);
      
      // Remove processing glow
      const lessonElement = document.querySelector('.lesson-card');
      if (lessonElement && lessonElement.classList.contains('processing')) {
        lessonElement.classList.remove('processing');
        lessonElement.setAttribute('data-had-processing', 'true');
      }
      
      // Inject print-specific styles
      const styleElement = document.createElement('style');
      styleElement.id = 'print-pdf-styles';
      styleElement.textContent = `
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .lesson-card, .lesson-card * {
            visibility: visible !important;
          }
          
          .lesson-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          
          /* Force all text to be black */
          * {
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          h1, h2, h3, h4, h5, h6 {
            color: #000000 !important;
            font-weight: bold !important;
          }
          
          p, li, span, div, a {
            color: #000000 !important;
          }
          
          /* Ensure images print */
          img {
            max-width: 100% !important;
            page-break-inside: avoid !important;
          }
          
          /* Remove any animations */
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `;
      document.head.appendChild(styleElement);
      
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setIsDownloading(false);
      
      // Restore processing glow if it was there
      const lessonElement = document.querySelector('.lesson-card');
      if (lessonElement && lessonElement.getAttribute('data-had-processing')) {
        lessonElement.classList.add('processing');
        lessonElement.removeAttribute('data-had-processing');
      }
      
      // Remove print styles
      const styleElement = document.getElementById('print-pdf-styles');
      if (styleElement) {
        styleElement.remove();
      }
    },
    onPrintError: (error) => {
      console.error('Print error:', error);
      setIsDownloading(false);
      alert('Failed to generate PDF. Please try again.');
    }
  });

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading || !lesson}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDownloading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Generating PDF...</span>
          <span className="sm:hidden">Generating...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">Download</span>
        </>
      )}
    </button>
  );
}

export default DownloadButton;
