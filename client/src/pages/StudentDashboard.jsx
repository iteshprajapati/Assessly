import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quizAPI, resultAPI } from '../services/api';

export default function StudentDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('available');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizzesRes, resultsRes] = await Promise.all([
        quizAPI.getAllQuizzes(),
        resultAPI.getStudentResults(),
      ]);
      setQuizzes(quizzesRes.data.data);
      setResults(resultsRes.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
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
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Student Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Attempt quizzes and track your progress</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => setTab('available')}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderBottom: tab === 'available' ? '2px solid var(--primary)' : 'none',
                color: tab === 'available' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: tab === 'available' ? '600' : '500'
              }}
            >
              Available Quizzes
            </button>
            <button
              onClick={() => setTab('results')}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderBottom: tab === 'results' ? '2px solid var(--primary)' : 'none',
                color: tab === 'results' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: tab === 'results' ? '600' : '500'
              }}
            >
              My Results
            </button>
          </div>

          {/* Available Quizzes */}
          {tab === 'available' && (
            <div>
              {quizzes.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {quizzes.map((quiz) => (
                    <div key={quiz.id}>
                      <div className="card">
                        <div className="card-body">
                          <h3 style={{ marginBottom: '0.5rem' }}>{quiz.title}</h3>
                          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            {quiz.description}
                          </p>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Questions: </span>
                              <strong>{quiz.question_count}</strong>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Time: </span>
                              <strong>{quiz.time_limit} min</strong>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attempts: </span>
                              <strong>{quiz.attempt_count}</strong>
                            </div>
                          </div>
                          <Link
                            to={`/student/attempt/${quiz.id}`}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                          >
                            Attempt Quiz
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <div className="empty-state-text">No quizzes available</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {tab === 'results' && (
            <div>
              {results.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Quiz Title</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Score</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Percentage</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => {
                        const badge = result.percentage >= 75 ? 'badge-success' : result.percentage >= 50 ? 'badge-warning' : 'badge-danger';
                        return (
                          <tr key={result.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.75rem' }}>{result.quiz_title}</td>
                            <td style={{ padding: '0.75rem' }}>{result.score}/{result.total_questions}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span className={`badge ${badge}`}>{result.percentage}%</span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              {new Date(result.submitted_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <Link
                                to={`/student/result/${result.id}`}
                                className="btn btn-primary btn-sm"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <div className="empty-state-text">No results yet. Attempt a quiz to see your results</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
