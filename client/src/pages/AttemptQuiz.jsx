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
  const timerRef = useRef(null);

  useEffect(() => {
    loadQuiz();
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
      setSubmitting(true);
      const response = await resultAPI.submitQuiz({
        quizId: parseInt(quizId),
        answers,
      });

      const { resultId } = response.data;
      navigate(`/student/result/${resultId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit quiz');
      setSubmitting(false);
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
            <QuizTimer
              totalSeconds={quiz?.time_limit * 60}
              onTimeUp={handleTimeUp}
              timerRef={timerRef}
            />
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <form onSubmit={(e) => { e.preventDefault(); submitQuiz(); }}>
            {quiz?.questions?.map((question, index) => (
              <div key={question.id} className="question-card">
                <div className="question-number">Question {index + 1}</div>
                <div className="question-text">{question.question}</div>

                <div style={{ marginTop: '1rem' }}>
                  {[1, 2, 3, 4].map((optionNum) => {
                    const optionKey = `option${optionNum}`;
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
            ))}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                type="submit"
                className="btn btn-success"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
