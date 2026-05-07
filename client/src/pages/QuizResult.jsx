import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resultAPI, questionAPI } from '../services/api';
import Alert from '../components/Alert';

export default function QuizResult() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResult();
  }, [resultId]);

  const loadResult = async () => {
    try {
      setLoading(true);
      const response = await resultAPI.getResult(resultId);
      setResult(response.data.data);

      const qResponse = await questionAPI.getQuestions(response.data.data.quiz_id);
      setQuestions(qResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load result');
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

  if (error) {
    return (
      <main style={{ flex: 1 }}>
        <div className="container" style={{ padding: '2rem 0' }}>
          <Alert type="error" message={error} />
        </div>
      </main>
    );
  }

  const getBadgeColor = (percentage) => {
    if (percentage >= 75) return 'badge-success';
    if (percentage >= 50) return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <main style={{ flex: 1 }}>
      <div className="container" style={{ padding: '2rem 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Result Summary */}
          <div className="card mb-4">
            <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Quiz Complete!</h1>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary)' }}>
                    {result?.score}/{result?.total_questions}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>Correct Answers</div>
                </div>
                <div>
                  <span className={`badge ${getBadgeColor(result?.percentage)}`} style={{ fontSize: '1.5rem', padding: '0.75rem 1.5rem' }}>
                    {result?.percentage}%
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Submitted on {new Date(result?.submitted_at).toLocaleString()}
              </div>

              <button
                onClick={() => navigate('/student')}
                className="btn btn-primary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Answers Review */}
          {questions.length > 0 && result?.answers && (
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>Review Your Answers</h2>
              {questions.map((question, index) => {
                const answer = result.answers?.find((a) => a.question_id === question.id);
                const isCorrect = answer?.selected_option === question.correct_option;

                return (
                  <div key={question.id} className={`question-card ${isCorrect ? 'correct' : 'incorrect'}`} style={{
                    borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}`
                  }}>
                    <div className="question-number">Question {index + 1}</div>
                    <div className="question-text">{question.question}</div>

                    <div style={{ marginTop: '1rem', backgroundColor: isCorrect ? '#f0fdf4' : '#fef2f2', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Your Answer:</strong>
                      </div>
                      <div style={{ marginBottom: '1rem', color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                        {answer?.selected_option ? question[`option${answer.selected_option}`] : 'Not answered'}
                      </div>

                      {!isCorrect && (
                        <>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Correct Answer:</strong>
                          </div>
                          <div style={{ color: 'var(--success)' }}>
                            {question[`option${question.correct_option}`]}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
