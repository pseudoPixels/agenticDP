import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import Header from './components/Header';
import Home from './pages/Home';
import Library from './pages/Library';
import LessonView from './pages/LessonView';
import WorksheetView from './pages/WorksheetView';
import PresentationView from './pages/PresentationView';
import HowItWorks from './pages/HowItWorks';
import Pricing from './pages/Pricing';
import posthog from './posthog';

// Component to track page views
function PostHogPageView() {
  const location = useLocation();
  
  useEffect(() => {
    posthog.capture('$pageview');
  }, [location]);
  
  return null;
}

function AppRouter() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Router>
          <PostHogPageView />
          <div className="min-h-screen">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/library" element={<Library />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/lesson/:lessonId" element={<LessonView />} />
              <Route path="/worksheet/:worksheetId" element={<WorksheetView />} />
              <Route path="/presentation/:presentationId" element={<PresentationView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default AppRouter;
