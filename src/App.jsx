import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import ExamSelectionPage from './pages/ExamSelectionPage';
import DashboardPage from './pages/DashboardPage';
import SyllabusPage from './pages/SyllabusPage';
import PracticePage from './pages/PracticePage';
import PracticeSessionPage from './pages/PracticeSessionPage';
import MockTestPage from './pages/MockTestPage';
import MockTestSessionPage from './pages/MockTestSessionPage';
import DailyTestPage from './pages/DailyTestPage';
import ResultsPage from './pages/ResultsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import WrongQuestionsPage from './pages/WrongQuestionsPage';
import ChatbotPage from './pages/ChatbotPage';
import ProfilePage from './pages/ProfilePage';

// Components
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Exam Required Route
const ExamRequiredRoute = ({ children }) => {
  const { user, selectedExam } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!selectedExam) {
    return <Navigate to="/select-exam" replace />;
  }
  
  return children;
};

function App() {
  const { initializeAuth } = useAuthStore();
  
  useEffect(() => {
    initializeAuth();
  }, []);
  
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route path="/select-exam" element={
          <ProtectedRoute>
            <ExamSelectionPage />
          </ProtectedRoute>
        } />
        
        {/* Exam Required Routes */}
        <Route path="/" element={
          <ExamRequiredRoute>
            <Layout />
          </ExamRequiredRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="syllabus" element={<SyllabusPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="practice/:subject/:topic" element={<PracticeSessionPage />} />
          <Route path="mock-test" element={<MockTestPage />} />
          <Route path="mock-test/:testId" element={<MockTestSessionPage />} />
          <Route path="daily-test" element={<DailyTestPage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="results/:attemptId" element={<ResultsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="wrong-questions" element={<WrongQuestionsPage />} />
          <Route path="chatbot" element={<ChatbotPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
