import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resultAPI, quizAPI } from '../services/api';
import Alert from '../components/Alert';

export default function QuizResults() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [topicStats, setTopicStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [quizId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizRes, resultsRes, statsRes, topicRes] = await Promise.all([
        quizAPI.getQuiz(quizId),
        resultAPI.getQuizResults(quizId),
        resultAPI.getQuizStats(quizId),
        resultAPI.getQuizTopicStats(quizId),
      ]);
      setQuiz(quizRes.data);
      setResults(resultsRes.data.data || []);
      setStats(statsRes.data.data || {});
      setTopicStats(topicRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  const getMasteryBadge = (accuracy) => {
    if (accuracy >= 80) return 'badge-success';
    if (accuracy >= 60) return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <main style={{ flex: 1 }}>
      <div className="container" style={{ padding: '2rem 0' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>{quiz?.title} - Results</h1>
            <p style={{ color: 'var(--text-muted)' }}>Student attempt results and statistics</p>
          </div>
          <Link to="/teacher" className="btn btn-outline-secondary">
            Back
          </Link>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {topicStats.length > 0 && (
          <div className="card mb-4">
            <div className="card-header">Topic Mastery</div>
            <div className="card-body" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Topic</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Questions</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Answers</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Accuracy</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {topicStats.map((topic) => {
                    const badge = getMasteryBadge(topic.accuracy);
                    const recommendation = topic.accuracy < 60 ? 'Reteach' : topic.accuracy < 80 ? 'Reinforce' : 'Good';
                    return (
                      <tr key={topic.topic} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem' }}>{topic.topic}</td>
                        <td style={{ padding: '0.75rem' }}>{topic.questionCount}</td>
                        <td style={{ padding: '0.75rem' }}>{topic.totalAnswers}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`badge ${badge}`}>{topic.accuracy}%</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{recommendation}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && stats.total_attempts > 0 && (
          <div className="row mb-4">
            <div className="col-3">
              <div className="stat-card">
                <div className="stat-icon blue">A</div>
                <div>
                  <div className="stat-value">{stats.total_attempts}</div>
                  <div className="stat-label">Total Attempts</div>
                </div>
              </div>
            </div>
            <div className="col-3">
              <div className="stat-card">
                <div className="stat-icon green">Avg</div>
                <div>
                  <div className="stat-value">{Math.round(stats.average_score)}</div>
                  <div className="stat-label">Average Score</div>
                </div>
              </div>
            </div>
            <div className="col-3">
              <div className="stat-card">
                <div className="stat-icon purple">Hi</div>
                <div>
                  <div className="stat-value">{stats.max_score}</div>
                  <div className="stat-label">Highest Score</div>
                </div>
              </div>
            </div>
            <div className="col-3">
              <div className="stat-card">
                <div className="stat-icon orange">Lo</div>
                <div>
                  <div className="stat-value">{stats.min_score}</div>
                  <div className="stat-label">Lowest Score</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 ? (
          <div className="card">
            <div className="card-body" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Student Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Score</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Percentage</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => {
                    const badge = result.percentage >= 75 ? 'badge-success' : result.percentage >= 50 ? 'badge-warning' : 'badge-danger';
                    return (
                      <tr key={result.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem' }}>{result.student_name}</td>
                        <td style={{ padding: '0.75rem' }}>{result.email}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <strong>{result.score}/{result.total_questions}</strong>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`badge ${badge}`}>{result.percentage}%</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {new Date(result.submitted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-state-text">No student attempts yet</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
