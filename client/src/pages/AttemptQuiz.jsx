import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI, resultAPI, answerAPI } from '../services/api';
import QuizTimer from '../components/QuizTimer';
import Alert from '../components/Alert';
import { Image as ImageIcon } from 'lucide-react';

export default function AttemptQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [descriptiveAnswers, setDescriptiveAnswers] = useState({});
  const [descriptiveImages, setDescriptiveImages] = useState({});
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

  const handleMCQAnswerChange = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleDescriptiveAnswerChange = (questionId, text) => {
    setDescriptiveAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleDescriptiveImageChange = (questionId, e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Only JPG, PNG, and PDF files are allowed');
        return;
      }
      setDescriptiveImages((prev) => ({ ...prev, [questionId]: file }));
    }
  };

  const handleTimeUp = () => {
    submitQuiz();
  };

  const submitQuiz = async () => {
    try {
      if (submitInProgressRef.current) return;
      submitInProgressRef.current = true;
      setSubmitting(true);

      // Submit MCQ answers
      const response = await resultAPI.submitQuiz({
        quizId: parseInt(quizId),
        answers,
      });

      // Submit descriptive answers
      for (const [questionId, answerText] of Object.entries(descriptiveAnswers)) {
        if (answerText || descriptiveImages[questionId]) {
          await answerAPI.submitAnswer({
            quizId: parseInt(quizId),
            questionId: parseInt(questionId),
            answerText,
            image: descriptiveImages[questionId],
          });
        }
      }

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

  if (!hasStarted) {
    return (
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', margin: '2rem' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>{quiz?.title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {quiz?.description}
            </p>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              <strong>Total Questions:</strong> {quiz?.questions?.length} <br />
              <strong>Time Limit:</strong> {quiz?.time_limit} minutes
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setHasStarted(true)}
              style={{ width: '100%' }}
            >
              Start Quiz
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentQuestion = quiz?.questions?.[currentIndex];

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
                Question {currentIndex + 1} of {quiz?.questions?.length}
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
                {currentQuestion ? (
                  <div className="card">
                    <div className="card-body">
                      {/* Question type badge */}
                      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{
                          fontWeight: '600',
                          fontSize: '0.75rem',
                          color: currentQuestion.type === 'MCQ' ? '#1f2937' : '#059669',
                          background: currentQuestion.type === 'MCQ' ? '#f0f0f0' : '#d1fae5',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                        }}>
                          {currentQuestion.type}
                        </span>
                        {currentQuestion.points && (
                          <span style={{
                            fontWeight: '500',
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            background: '#f3f4f6',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                          }}>
                            {currentQuestion.points} points
                          </span>
                        )}
                      </div>

                      {/* Question Image */}
                      {currentQuestion.image_path && (
                        <div style={{ marginBottom: '1rem' }}>
                          <img
                            src={currentQuestion.image_path}
                            alt="Question"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '300px',
                              borderRadius: '8px',
                              objectFit: 'contain'
                            }}
                          />
                        </div>
                      )}

                      {/* Question text */}
                      <div className="question-text" style={{ marginBottom: '1.5rem', fontSize: '1.05rem', fontWeight: '500' }}>
                        {currentQuestion.question}
                      </div>

                      {/* MCQ and TRUE_FALSE Options */}
                      {(currentQuestion.type === 'MCQ' || currentQuestion.type === 'TRUE_FALSE') && (
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {currentQuestion.options?.map((option) => {
                            const isSelected = answers[currentQuestion.id] === option.id;
                            return (
                              <label
                                key={option.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '1rem',
                                  border: isSelected ? '2px solid #6366f1' : '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  background: isSelected ? '#eef2ff' : '#ffffff',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                    e.currentTarget.style.background = '#f9fafb';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.background = '#ffffff';
                                  }
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`question-${currentQuestion.id}`}
                                  value={option.id}
                                  checked={isSelected}
                                  onChange={() => handleMCQAnswerChange(currentQuestion.id, option.id)}
                                  style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                                />
                                <span style={{
                                  fontWeight: isSelected ? '600' : '400',
                                  color: isSelected ? '#6366f1' : 'inherit'
                                }}>
                                  {option.option_text}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Descriptive Answer */}
                      {currentQuestion.type === 'DESCRIPTIVE' && (
                        <div style={{ marginTop: '1rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Your Answer
                          </label>
                          <textarea
                            value={descriptiveAnswers[currentQuestion.id] || ''}
                            onChange={(e) => handleDescriptiveAnswerChange(currentQuestion.id, e.target.value)}
                            placeholder="Type your answer here..."
                            rows="6"
                            style={{
                              width: '100%',
                              padding: '1rem',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.95rem',
                              fontFamily: 'inherit',
                              boxSizing: 'border-box',
                              resize: 'vertical'
                            }}
                          />

                          {/* Image upload for descriptive */}
                          <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                              Upload supporting image (Optional)
                            </label>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '1rem',
                              border: '2px dashed #e5e7eb',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: '#f9fafb',
                              transition: 'all 0.2s',
                            }}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <div style={{ textAlign: 'center' }}>
                                <ImageIcon size={24} style={{ color: '#9ca3af', marginBottom: '0.5rem' }} />
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                  Click to select image
                                </div>
                              </div>
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,application/pdf"
                              onChange={(e) => handleDescriptiveImageChange(currentQuestion.id, e)}
                              style={{ display: 'none' }}
                            />
                            {descriptiveImages[currentQuestion.id] && (
                              <div style={{
                                marginTop: '0.75rem',
                                padding: '0.5rem',
                                background: '#d1fae5',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                color: '#059669',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <span>✓ {descriptiveImages[currentQuestion.id].name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDescriptiveImages((prev) => {
                                      const updated = { ...prev };
                                      delete updated[currentQuestion.id];
                                      return updated;
                                    });
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Alert type="error" message="No question available." />
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

              {/* Question Navigator */}
              <div>
                <div className="card" style={{ position: 'sticky', top: '5.5rem' }}>
                  <div className="card-header">Questions</div>
                  <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                      {quiz?.questions?.map((question, index) => {
                        const isAnswered = (question.type === 'MCQ' || question.type === 'TRUE_FALSE')
                          ? answers[question.id] !== undefined
                          : descriptiveAnswers[question.id];
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
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                            title={question.type}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border)',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)'
                    }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: '#f0fdf4', background: '#10b981', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>■</span> Answered
                      </div>
                      <div>
                        <span style={{ color: '#f9fafb', background: '#d1d5db', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>■</span> Not answered
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
