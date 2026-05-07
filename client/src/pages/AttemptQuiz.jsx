import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI, resultAPI } from '../services/api';
import QuizTimer from '../components/QuizTimer';
import Alert from '../components/Alert';

export default function AttemptQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [warning, setWarning] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);
  const submitInProgressRef = useRef(false);
  const tabSwitchCountRef = useRef(0);
  const TAB_SWITCH_LIMIT = 3;

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz?.questions?.length) {
      setCurrentIndex(0);
    }
  }, [quiz?.questions?.length]);

  useEffect(() => {
    const savedCount = parseInt(localStorage.getItem(`quizTabSwitchCount:${quizId}`) || '0', 10);
    tabSwitchCountRef.current = Number.isNaN(savedCount) ? 0 : savedCount;
    setTabSwitchCount(tabSwitchCountRef.current);
  }, [quizId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;
      if (submitInProgressRef.current) return;

      const nextCount = tabSwitchCountRef.current + 1;
      tabSwitchCountRef.current = nextCount;
      setTabSwitchCount(nextCount);
      localStorage.setItem(`quizTabSwitchCount:${quizId}`, String(nextCount));

      if (nextCount >= TAB_SWITCH_LIMIT) {
        setWarning(`Tab switching limit reached (${nextCount}/${TAB_SWITCH_LIMIT}). Auto-submitting your quiz.`);
        submitQuiz();
        return;
      }

      setWarning(`Tab switch detected (${nextCount}/${TAB_SWITCH_LIMIT}). Avoid leaving the quiz tab.`);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getQuizForAttempt(quizId);
      setQuiz(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleTimeUp = () => {
    submitQuiz();
  };

  const submitQuiz = async () => {
    try {
      if (submitInProgressRef.current) return;
      submitInProgressRef.current = true;
      setSubmitting(true);
      const response = await resultAPI.submitQuiz({
        quizId: parseInt(quizId),
        answers,
      });

      const { resultId } = response.data;
      localStorage.removeItem(`quizTabSwitchCount:${quizId}`);
      navigate(`/student/result/${resultId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit quiz');
      setSubmitting(false);
      submitInProgressRef.current = false;
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

  return (
    <main style={{ flex: 1 }}>
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '1rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{quiz?.title}</h1>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {quiz?.questions?.length} Questions
              </span>
            </div>
            {hasStarted && (
              <QuizTimer
                totalSeconds={quiz?.time_limit * 60}
                onTimeUp={handleTimeUp}
                timerRef={timerRef}
              />
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 0' }}>
        {warning && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert type="warning" message={warning} />
          </div>
        )}
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <form onSubmit={(e) => { e.preventDefault(); submitQuiz(); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.5rem' }}>
              <div>
                {quiz?.questions?.length ? (
                  <div className="question-card">
                    <div className="question-number">Question {currentIndex + 1}</div>
                    <div className="question-text">{quiz.questions[currentIndex].question}</div>

                    <div style={{ marginTop: '1rem' }}>
                      {[1, 2, 3, 4].map((optionNum) => {
                        const optionKey = `option${optionNum}`;
                        const question = quiz.questions[currentIndex];
                        const isSelected = answers[question.id] === optionNum;
                        return (
                          <label
                            key={optionNum}
                            className={`option ${isSelected ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={optionNum}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(question.id, optionNum)}
                            />
                            {question[optionKey]}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Alert type="error" message="No questions available for this quiz." />
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={!quiz?.questions?.length || currentIndex === quiz.questions.length - 1}
                    onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, quiz.questions.length - 1))}
                  >
                    Next
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    style={{ marginLeft: 'auto' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                </div>
              </div>

              <div>
                <div className="card" style={{ position: 'sticky', top: '5.5rem' }}>
                  <div className="card-header">Question Navigator</div>
                  <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                      {quiz?.questions?.map((question, index) => {
                        const isAnswered = answers[question.id] !== undefined;
                        const isActive = index === currentIndex;
                        return (
                          <button
                            key={question.id}
                            type="button"
                            onClick={() => setCurrentIndex(index)}
                            style={{
                              padding: '0.5rem 0',
                              borderRadius: '8px',
                              border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                              background: isAnswered ? '#f0fdf4' : '#f9fafb',
                              color: 'var(--text-dark)',
                              fontWeight: isActive ? 700 : 600,
                              cursor: 'pointer'
                            }}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Green indicates answered questions.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {!hasStarted && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '640px',
              width: '100%',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div className="card-body" style={{ padding: '2rem' }}>
              <h2 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Before You Start</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
                Please read the instructions carefully. The timer will start once you proceed.
              </p>
              <ul style={{ paddingLeft: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-body)' }}>
                <li>Do not refresh or close the tab during the quiz.</li>
                <li>Tab switching is monitored and limited.</li>
                <li>Each quiz can be submitted only once.</li>
                <li>Make sure your answers are final before submitting.</li>
              </ul>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => navigate('/student')}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setHasStarted(true)}
                >
                  Proceed to Start
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
