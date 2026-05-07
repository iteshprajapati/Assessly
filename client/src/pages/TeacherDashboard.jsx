import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quizAPI } from '../services/api';

export default function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getTeacherQuizzes();
      setQuizzes(response.data.data);
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
    <main style={{ flex: 1 }}>
      <div className="container">
        <div style={{ padding: '2rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem' }}>My Quizzes</h1>
              <p style={{ color: 'var(--text-muted)' }}>Create and manage your quizzes</p>
            </div>
            <Link to="/teacher/create-quiz" className="btn btn-primary">
              + Create New Quiz
            </Link>
          </div>

          {quizzes.length > 0 ? (
            <div className="row">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="col-6 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <h3 style={{ marginBottom: '0.5rem' }}>{quiz.title}</h3>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        {quiz.description}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Questions: </span>
                          <strong>{quiz.question_count}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attempts: </span>
                          <strong>{quiz.attempt_count}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Time: </span>
                          <strong>{quiz.time_limit} min</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link to={`/teacher/quiz/${quiz.id}`} className="btn btn-primary btn-sm">
                          Edit
                        </Link>
                        <Link to={`/teacher/quiz/${quiz.id}/questions`} className="btn btn-outline-primary btn-sm">
                          Questions
                        </Link>
                        <Link to={`/teacher/quiz/${quiz.id}/results`} className="btn btn-outline-primary btn-sm">
                          Results
                        </Link>
                        <button
                          onClick={() => handleDelete(quiz.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="empty-state">
                  <div className="empty-state-text">No quizzes yet</div>
                  <Link to="/teacher/create-quiz" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Create Your First Quiz
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
