import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Library from './pages/Library';
import LessonView from './pages/LessonView';
import WorksheetView from './pages/WorksheetView';
import PresentationView from './pages/PresentationView';

function AppRouter() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/lesson/:lessonId" element={<LessonView />} />
            <Route path="/worksheet/:worksheetId" element={<WorksheetView />} />
            <Route path="/presentation/:presentationId" element={<PresentationView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default AppRouter;
