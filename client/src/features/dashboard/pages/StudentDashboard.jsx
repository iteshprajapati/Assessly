import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quizAPI, resultAPI } from '../../shared/services/api';
import '../styles/StudentDashboard.scss';

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
      <main className="student-main">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="student-main">
      <div className="container">
        <div className="student-wrapper">
          <div className="student-header">
            <h1>Student Dashboard</h1>
            <p>Attempt quizzes and track your progress</p>
          </div>

          {/* Tabs */}
          <div className="student-tabs">
            <button
              onClick={() => setTab('available')}
              className={`student-tab-btn ${tab === 'available' ? 'active' : ''}`}
            >
              Available Quizzes
            </button>
            <button
              onClick={() => setTab('results')}
              className={`student-tab-btn ${tab === 'results' ? 'active' : ''}`}
            >
              My Results
            </button>
          </div>

          {/* Available Quizzes */}
          {tab === 'available' && (
            <div>
              {quizzes.length > 0 ? (
                <div className="student-quizzes-grid">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id}>
                      <div className="card">
                        <div className="card-body student-quiz-card-content">
                          <h3>{quiz.title}</h3>
                          <p>{quiz.description}</p>
                          <div className="student-quiz-info-row">
                            <div className="student-info-item">
                              <span>Questions: </span>
                              <strong>{quiz.question_count}</strong>
                            </div>
                            <div className="student-info-item">
                              <span>Time: </span>
                              <strong>{quiz.time_limit} min</strong>
                            </div>
                            <div className="student-info-item">
                              <span>Attempts: </span>
                              <strong>{quiz.attempt_count}</strong>
                            </div>
                          </div>
                          <Link
                            to={`/student/attempt/${quiz.id}`}
                            className="btn btn-primary student-attempt-btn"
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
                <div className="student-results-container">
                  <table className="student-results-table">
                    <thead>
                      <tr>
                        <th>Quiz Title</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => {
                        const badge = result.percentage >= 75 ? 'badge-success' : result.percentage >= 50 ? 'badge-warning' : 'badge-danger';
                        return (
                          <tr key={result.id}>
                            <td>{result.quiz_title}</td>
                            <td>{result.score}/{result.total_questions}</td>
                            <td>
                              <span className={`badge ${badge}`}>{result.percentage}%</span>
                            </td>
                            <td>
                              {new Date(result.submitted_at).toLocaleDateString()}
                            </td>
                            <td>
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
