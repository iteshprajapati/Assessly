import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI, resultAPI, answerAPI } from '../../shared/services/api';
import QuizTimer from '../../shared/components/QuizTimer';
import Alert from '../../shared/components/Alert';
import '../styles/AttemptQuiz.scss';
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
      <main className="attempt-quiz-main">
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
      <main className="attempt-quiz-main">
        <div className="container attempt-quiz-wrapper">
          <Alert type="error" message={error} />
        </div>
      </main>
    );
  }

  if (!hasStarted) {
    return (
      <main className="attempt-quiz-main attempt-quiz-start-view">
        <div className="attempt-quiz-start-card">
          <div className="attempt-quiz-start-body">
            <h2>{quiz?.title}</h2>
            <p className="description">
              {quiz?.description}
            </p>
            <p className="details">
              <strong>Total Questions:</strong> {quiz?.questions?.length} <br />
              <strong>Time Limit:</strong> {quiz?.time_limit} minutes
            </p>
            <button
              className="btn btn-primary btn-start"
              onClick={() => setHasStarted(true)}
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
    <main className="attempt-quiz-main">
      <div className="attempt-quiz-header">
        <div className="container">
          <div className="attempt-quiz-header-row">
            <div>
              <h1>{quiz?.title}</h1>
              <span className="question-counter">
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

      <div className="container attempt-quiz-body-container">
        {warning && (
          <div className="attempt-quiz-warning-wrapper">
            <Alert type="warning" message={warning} />
          </div>
        )}
        <div className="attempt-quiz-inner-container">
          <form onSubmit={(e) => { e.preventDefault(); submitQuiz(); }}>
            <div className="attempt-quiz-grid">
              <div>
                {currentQuestion ? (
                  <div className="card">
                    <div className="card-body">
                      {/* Question type badge */}
                      <div className="attempt-question-badges">
                        <span className={`attempt-question-badge ${currentQuestion.type === 'MCQ' ? 'type-mcq' : 'type-descriptive'}`}>
                          {currentQuestion.type}
                        </span>
                        {currentQuestion.points && (
                          <span className="attempt-points-badge">
                            {currentQuestion.points} points
                          </span>
                        )}
                      </div>

                      {/* Question Image */}
                      {currentQuestion.image_path && (
                        <div className="attempt-question-image-wrapper">
                          <img
                            src={currentQuestion.image_path}
                            alt="Question"
                          />
                        </div>
                      )}

                      {/* Question text */}
                      <div className="attempt-question-text">
                        {currentQuestion.question}
                      </div>

                      {/* MCQ and TRUE_FALSE Options */}
                      {(currentQuestion.type === 'MCQ' || currentQuestion.type === 'TRUE_FALSE') && (
                        <div className="attempt-options-container">
                          {currentQuestion.options?.map((option) => {
                            const isSelected = answers[currentQuestion.id] === option.id;
                            return (
                              <label
                                key={option.id}
                                className={`attempt-option-label ${isSelected ? 'selected' : ''}`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${currentQuestion.id}`}
                                  value={option.id}
                                  checked={isSelected}
                                  onChange={() => handleMCQAnswerChange(currentQuestion.id, option.id)}
                                />
                                <span className={`option-text ${isSelected ? 'selected-text' : ''}`}>
                                  {option.option_text}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Descriptive Answer */}
                      {currentQuestion.type === 'DESCRIPTIVE' && (
                        <div className="attempt-descriptive-container">
                          <label className="attempt-field-label">
                            Your Answer
                          </label>
                          <textarea
                            value={descriptiveAnswers[currentQuestion.id] || ''}
                            onChange={(e) => handleDescriptiveAnswerChange(currentQuestion.id, e.target.value)}
                            placeholder="Type your answer here..."
                            rows="6"
                            className="attempt-descriptive-textarea"
                          />

                          {/* Image upload for descriptive */}
                          <div className="attempt-upload-wrapper">
                            <label className="attempt-field-label">
                              Upload supporting image (Optional)
                            </label>
                            <div className="attempt-upload-dropzone"
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
                              <div className="attempt-upload-success">
                                <span>✓ {descriptiveImages[currentQuestion.id].name}</span>
                                <button
                                  type="button"
                                  className="btn-remove-file"
                                  onClick={() => {
                                    setDescriptiveImages((prev) => {
                                      const updated = { ...prev };
                                      delete updated[currentQuestion.id];
                                      return updated;
                                    });
                                    if (fileInputRef.current) fileInputRef.current.value = '';
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

                <div className="attempt-actions-row">
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
                    className="btn btn-success btn-submit-quiz"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                </div>
              </div>

              {/* Question Navigator */}
              <div>
                <div className="card attempt-navigator-card">
                  <div className="card-header">Questions</div>
                  <div className="card-body">
                    <div className="attempt-navigator-grid">
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
                            className={`attempt-navigator-btn ${isAnswered ? 'answered' : ''} ${isActive ? 'active' : ''}`}
                            title={question.type}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                    <div className="attempt-navigator-legend">
                      <div className="legend-item">
                        <span className="legend-color answered">■</span> Answered
                      </div>
                      <div className="legend-item">
                        <span className="legend-color not-answered">■</span> Not answered
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
