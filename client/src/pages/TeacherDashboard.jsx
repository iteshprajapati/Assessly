import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quizAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, BookOpen, HelpCircle, Users, Plus, Edit2, BarChart3, Trash2 } from 'lucide-react';

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
      <main style={{ flex: 1 }}>
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <div className="container">
        <div style={{ padding: '2rem 0' }}>
          {/* Welcome Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <LayoutDashboard size={28} strokeWidth={1.5} />
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Teacher Dashboard</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Welcome back, <strong>{user?.name || 'Teacher'}</strong>
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: '#f3f4f6', borderRadius: '12px', textAlign: 'center', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: '#007bff' }}>
                <BookOpen size={24} strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{stats.totalQuizzes}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>My Quizzes</div>
            </div>
            <div style={{ backgroundColor: '#f3f4f6', borderRadius: '12px', textAlign: 'center', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: '#6c757d' }}>
                <HelpCircle size={24} strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{stats.totalQuestions}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Questions</div>
            </div>
            <div style={{ backgroundColor: '#f3f4f6', borderRadius: '12px', textAlign: 'center', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: '#28a745' }}>
                <Users size={24} strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{stats.totalAttempts}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Student Attempts</div>
            </div>
          </div>

          {/* My Recent Quizzes Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', margin: 0 }}>My Recent Quizzes</h3>
              <Link to="/teacher/create-quiz" className="btn btn-primary" style={{ backgroundColor: '#000000', color: 'white' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = 'white'; }}>
                + Create Quiz
              </Link>
            </div>

            {quizzes.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="card-body" style={{ flex: 1, padding: '1rem' }}>
                      <h4 style={{ marginBottom: '0.5rem', marginTop: 0 }}>{quiz.title}</h4>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        {quiz.description || 'No description'}
                      </p>

                      {/* Quiz Info */}
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ color: '#6c757d' }} title="Time Limit">⏱</span>
                          <span>{quiz.time_limit} min</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <HelpCircle size={16} strokeWidth={2} style={{ color: '#6c757d' }} />
                          <span>{quiz.question_count} Qs</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Users size={16} strokeWidth={2} style={{ color: '#6c757d' }} />
                          <span>{quiz.attempt_count} attempts</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                        <Link to={`/teacher/quiz/${quiz.id}/questions`} className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', borderRadius: '8px', backgroundColor: '#000000', color: 'white', border: 'none', padding: '0.4rem 0.8rem' }}>
                          <Plus size={16} strokeWidth={2} />
                          Add Q
                        </Link>
                        <Link to={`/teacher/quiz/${quiz.id}`} className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', color: '#111827', padding: '0.4rem 0.8rem', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5e7eb'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}>
                          <Edit2 size={16} strokeWidth={2} />
                          Edit
                        </Link>
                        <Link to={`/teacher/quiz/${quiz.id}/results`} className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', color: '#111827', padding: '0.4rem 0.8rem', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5e7eb'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}>
                          <BarChart3 size={16} strokeWidth={2} />
                          Results
                        </Link>
                        <button
                          onClick={() => handleDelete(quiz.id)}
                          className="btn btn-danger btn-sm"
                          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', width: '32px', height: '32px', borderRadius: '50%', padding: 0 }}
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
