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

  const percentage = result?.percentage ?? 0;

  return (
    <main style={{ flex: 1 }}>
      <div className="container" style={{ padding: '2rem 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Result Summary */}
          <div className="card mb-4">
            <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Quiz Attempt Summary</h1>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary)' }}>
                    {result?.total_score}/{result?.max_score}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>Points Earned</div>
                </div>
                <div>
                  <span className={`badge ${getBadgeColor(percentage)}`} style={{ fontSize: '1.5rem', padding: '0.75rem 1.5rem' }}>
                    {percentage}%
                  </span>
                </div>
              </div>

              {result?.descriptive_score > 0 && (
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-body)' }}>
                  MCQ Score: <strong>{result.mcq_score}</strong> &nbsp;·&nbsp; Descriptive Score: <strong>{result.descriptive_score}</strong>
                </div>
              )}

              <div style={{ marginTop: '1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Submitted on {new Date(result?.submitted_at).toLocaleString()} (Attempt #{result?.attempt_number})
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
                
                // For MCQ / TRUE_FALSE questions
                if (question.type === 'MCQ' || question.type === 'TRUE_FALSE') {
                  const isCorrect = answer?.is_correct;
                  const selectedOption = question.options?.find(o => o.id === answer?.selected_option_id);
                  const correctOption = question.options?.find(o => o.is_correct);

                  return (
                    <div key={question.id} className={`question-card ${isCorrect ? 'correct' : 'incorrect'}`}>
                      <div className="question-number">Question {index + 1} ({question.type})</div>
                      <div className="question-text">{question.question}</div>

                      <div style={{ marginTop: '1rem', backgroundColor: isCorrect ? '#f0fdf4' : '#fef2f2', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>Your Answer:</strong>
                        </div>
                        <div style={{ marginBottom: '1rem', color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                          {selectedOption ? selectedOption.option_text : 'Not answered'}
                        </div>

                        {!isCorrect && (
                          <>
                            <div style={{ marginBottom: '0.5rem' }}>
                              <strong>Correct Answer:</strong>
                            </div>
                            <div style={{ color: 'var(--success)' }}>
                              {correctOption ? correctOption.option_text : 'N/A'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }

                // For Descriptive questions
                const isGraded = answer?.is_correct !== null;
                return (
                  <div key={question.id} className={`question-card ${isGraded ? (answer?.is_correct ? 'correct' : 'incorrect') : 'pending'}`}>
                    <div className="question-number" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Question {index + 1} (Descriptive)</span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: isGraded ? '#059669' : '#d97706',
                        background: isGraded ? '#d1fae5' : '#fef3c7',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px'
                      }}>
                        {isGraded ? `Graded: ${answer?.marks_obtained || 0} pts` : 'Pending Grading'}
                      </span>
                    </div>
                    <div className="question-text">{question.question}</div>

                    <div style={{ marginTop: '1rem', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Your Answer:</strong>
                      </div>
                      <div style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                        {answer?.answer_text || '(No answer provided)'}
                      </div>

                      {answer?.image_path && (
                        <div style={{ marginBottom: '1rem' }}>
                          <a href={answer.image_path} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', color: 'var(--primary)', textDecoration: 'underline' }}>
                            View Uploaded Workspace Image
                          </a>
                        </div>
                      )}

                      {isGraded && answer?.teacher_feedback && (
                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                          <strong>Teacher Feedback:</strong>
                          <p style={{ color: '#4b5563', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                            {answer.teacher_feedback}
                          </p>
                        </div>
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
