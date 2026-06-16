import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quizAPI } from '../../shared/services/api';
import { useAuth } from '../../auth/context/AuthContext';
import { LayoutDashboard, BookOpen, HelpCircle, Users, Plus, Edit2, BarChart3, Trash2 } from 'lucide-react';
import '../styles/TeacherDashboard.scss';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalQuestions: 0,
    totalAttempts: 0,
  });

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getTeacherQuizzes();
      const quizzesData = response.data.data;
      setQuizzes(quizzesData);

      // Calculate stats
      const totalQuestions = quizzesData.reduce((sum, q) => sum + (q.question_count || 0), 0);
      const totalAttempts = quizzesData.reduce((sum, q) => sum + (q.attempt_count || 0), 0);

      setStats({
        totalQuizzes: quizzesData.length,
        totalQuestions,
        totalAttempts,
      });
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Delete this quiz? This action cannot be undone.')) return;
    try {
      await quizAPI.deleteQuiz(quizId);
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
      loadQuizzes();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    }
  };

  if (loading && quizzes.length === 0) {
    return (
      <main className="teacher-main">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="teacher-main">
      <div className="container">
        <div className="teacher-wrapper">
          {/* Welcome Section */}
          <div className="teacher-header">
            <div className="teacher-header-title">
              <LayoutDashboard size={28} strokeWidth={1.5} />
              <h2>Teacher Dashboard</h2>
            </div>
            <p>
              Welcome back, <strong>{user?.name || 'Teacher'}</strong>
            </p>
          </div>

          {/* Stats Cards */}
          <div className="teacher-stats-grid">
            <div className="teacher-stat-box">
              <div className="teacher-stat-icon-wrapper blue">
                <BookOpen size={24} strokeWidth={1.5} />
              </div>
              <div className="teacher-stat-val">{stats.totalQuizzes}</div>
              <div className="teacher-stat-lbl">My Quizzes</div>
            </div>
            <div className="teacher-stat-box">
              <div className="teacher-stat-icon-wrapper gray">
                <HelpCircle size={24} strokeWidth={1.5} />
              </div>
              <div className="teacher-stat-val">{stats.totalQuestions}</div>
              <div className="teacher-stat-lbl">Total Questions</div>
            </div>
            <div className="teacher-stat-box">
              <div className="teacher-stat-icon-wrapper green">
                <Users size={24} strokeWidth={1.5} />
              </div>
              <div className="teacher-stat-val">{stats.totalAttempts}</div>
              <div className="teacher-stat-lbl">Student Attempts</div>
            </div>
          </div>

          {/* My Recent Quizzes Section */}
          <div className="teacher-quizzes-section">
            <div className="teacher-section-header">
              <h3>My Recent Quizzes</h3>
              <Link to="/teacher/create-quiz" className="btn btn-primary btn-black">
                + Create Quiz
              </Link>
            </div>

            {quizzes.length > 0 ? (
              <div className="teacher-quizzes-grid">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="card teacher-quiz-card">
                    <div className="card-body teacher-card-body">
                      <h4>{quiz.title}</h4>
                      <p>
                        {quiz.description || 'No description'}
                      </p>

                      {/* Quiz Info */}
                      <div className="teacher-quiz-info-row">
                        <div className="teacher-info-item">
                          <span className="icon-gray" title="Time Limit">⏱</span>
                          <span>{quiz.time_limit} min</span>
                        </div>
                        <div className="teacher-info-item">
                          <HelpCircle size={16} strokeWidth={2} className="icon-gray" />
                          <span>{quiz.question_count} Qs</span>
                        </div>
                        <div className="teacher-info-item">
                          <Users size={16} strokeWidth={2} className="icon-gray" />
                          <span>{quiz.attempt_count} attempts</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="teacher-quiz-actions">
                        <Link to={`/teacher/quiz/${quiz.id}/questions`} className="btn btn-sm btn-black">
                          <Plus size={16} strokeWidth={2} />
                          Add Q
                        </Link>
                        <Link to={`/teacher/quiz/${quiz.id}`} className="btn btn-sm btn-gray-toggle">
                          <Edit2 size={16} strokeWidth={2} />
                          Edit
                        </Link>
                        <Link to={`/teacher/quiz/${quiz.id}/results`} className="btn btn-sm btn-gray-toggle">
                          <BarChart3 size={16} strokeWidth={2} />
                          Results
                        </Link>
                        <button
                          onClick={() => handleDelete(quiz.id)}
                          className="btn btn-danger btn-sm btn-delete"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="card-body">
                  <div className="empty-state">
                    <div style={{ marginBottom: '1rem' }}>
                      <BookOpen size={48} strokeWidth={1.5} style={{ color: '#ccc' }} />
                    </div>
                    <div className="empty-state-text" style={{ marginBottom: '1rem' }}>No quizzes yet</div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                      Create your first quiz to get started with the Quiz System
                    </p>
                    <Link to="/teacher/create-quiz" className="btn btn-primary">
                      Create Your First Quiz
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
