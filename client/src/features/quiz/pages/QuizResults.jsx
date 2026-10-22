import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resultAPI, quizAPI } from '../../shared/services/api';
import Alert from '../../shared/components/Alert';
import '../styles/QuizResults.scss';

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
      <main className="results-main">
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
    <main className="results-main">
      <div className="container results-wrapper">
        <div className="results-header-row">
          <div>
            <h1>{quiz?.title} - Results</h1>
            <p className="results-subheader-text">Student attempt results and statistics</p>
          </div>
          <Link to="/teacher" className="btn btn-outline-secondary">
            Back
          </Link>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {topicStats.length > 0 && (
          <div className="card mb-4">
            <div className="card-header">Difficulty Mastery</div>
            <div className="card-body results-card-body-scrollable">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Difficulty</th>
                    <th>Questions</th>
                    <th>Answers</th>
                    <th>Accuracy</th>
                    <th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {topicStats.map((topic) => {
                    const badge = getMasteryBadge(topic.accuracy);
                    const recommendation = topic.accuracy < 60 ? 'Reteach' : topic.accuracy < 80 ? 'Reinforce' : 'Good';
                    return (
                      <tr key={topic.topic}>
                        <td>{topic.topic}</td>
                        <td>{topic.questionCount}</td>
                        <td>{topic.totalAnswers}</td>
                        <td>
                          <span className={`badge ${badge}`}>{topic.accuracy}%</span>
                        </td>
                        <td>{recommendation}</td>
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
            <div className="card-body results-card-body-scrollable">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Grading Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => {
                    const badge = result.percentage >= 75 ? 'badge-success' : result.percentage >= 50 ? 'badge-warning' : 'badge-danger';
                    const isPending = result.grading_status === 'pending_review';
                    return (
                      <tr key={result.id}>
                        <td>{result.student_name}</td>
                        <td>{result.email}</td>
                        <td>
                          <strong>{result.total_score}/{result.max_score}</strong>
                        </td>
                        <td>
                          <span className={`badge ${badge}`}>{result.percentage}%</span>
                        </td>
                        <td>
                          {isPending ? (
                            <span className="badge badge-warning" title="Descriptive answers not yet fully graded">
                              ⏳ Pending
                            </span>
                          ) : (
                            <span className="badge badge-success">
                              ✅ Published
                            </span>
                          )}
                        </td>
                        <td>
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
