import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { downloadLesson } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

function DownloadButton({ lesson }) {
  const { user } = useAuth();
  const { setShowPaywall } = useSubscription();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!lesson || !lesson.id) return;
    
    try {
      setIsDownloading(true);
      const userId = user?.uid || null;
      const blob = await downloadLesson(lesson.id, userId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lesson.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading lesson:', error);
      // Check if it's a subscription error
      if (error.response?.data?.error === 'subscription_required') {
        setShowPaywall(true);
      } else {
        alert('Failed to download lesson. Please try again.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

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
