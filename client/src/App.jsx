import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CreateQuiz from './pages/CreateQuiz';
import ManageQuestions from './pages/ManageQuestions';
import QuizResults from './pages/QuizResults';
import AttemptQuiz from './pages/AttemptQuiz';
import QuizResult from './pages/QuizResult';

// Styles
import './styles/style.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
