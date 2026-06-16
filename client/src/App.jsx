import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import { Navbar, ProtectedRoute } from './features/shared/components';

// Pages
import { Home } from './features/home/pages';
import { Login, Register } from './features/auth/pages';
import { AdminDashboard, TeacherDashboard, StudentDashboard } from './features/dashboard/pages';
import { CreateQuiz, AttemptQuiz, QuizResult, QuizResults, ManageQuestions } from './features/quiz/pages';

// Styles
import './styles/style.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Teacher Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/:username"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/create-quiz"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <CreateQuiz />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/quiz/:quizId/questions"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <ManageQuestions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/quiz/:quizId/results"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <QuizResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/quiz/:quizId"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <ManageQuestions />
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attempt/:quizId"
              element={
                <ProtectedRoute requiredRole="student">
                  <AttemptQuiz />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/result/:resultId"
              element={
                <ProtectedRoute requiredRole="student">
                  <QuizResult />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
