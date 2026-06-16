import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resultAPI, questionAPI } from '../../shared/services/api';
import Alert from '../../shared/components/Alert';
import '../styles/QuizResult.scss';

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
      <main className="result-main">
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
      <main className="result-main">
        <div className="container result-wrapper">
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
    <main className="result-main">
      <div className="container result-wrapper">
        <div className="result-container">
          {/* Result Summary */}
          <div className="card mb-4">
            <div className="card-body result-summary-card-body">
              <h1 className="result-title">Quiz Attempt Summary</h1>
              <div className="result-score-row">
                <div>
                  <div className="result-points-earned">
                    {result?.total_score}/{result?.max_score}
                  </div>
                  <div className="result-points-label">Points Earned</div>
                </div>
                <div>
                  <span className={`badge ${getBadgeColor(percentage)} result-percentage-badge`}>
                    {percentage}%
                  </span>
                </div>
              </div>

              {result?.descriptive_score > 0 && (
                <div className="result-type-scores">
                  MCQ Score: <strong>{result.mcq_score}</strong> &nbsp;·&nbsp; Descriptive Score: <strong>{result.descriptive_score}</strong>
                </div>
              )}

              <div className="result-timestamp">
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
              <h2 className="result-review-title">Review Your Answers</h2>
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

                      <div className={`result-mcq-answer-box ${isCorrect ? 'correct' : 'incorrect'}`}>
                        <div className="result-answer-header">
                          <strong>Your Answer:</strong>
                        </div>
                        <div className={`result-answer-value ${isCorrect ? 'correct' : 'incorrect'}`}>
                          {selectedOption ? selectedOption.option_text : 'Not answered'}
                        </div>

                        {!isCorrect && (
                          <>
                            <div className="result-answer-header">
                              <strong>Correct Answer:</strong>
                            </div>
                            <div className="result-answer-value correct">
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
                    <div className="question-number result-question-card-header">
                      <span>Question {index + 1} (Descriptive)</span>
                      <span className={`result-grading-badge ${isGraded ? 'graded' : 'pending'}`}>
                        {isGraded ? `Graded: ${answer?.marks_obtained || 0} pts` : 'Pending Grading'}
                      </span>
                    </div>
                    <div className="question-text">{question.question}</div>

                    <div className="result-descriptive-answer-box">
                      <div className="result-answer-header">
                        <strong>Your Answer:</strong>
                      </div>
                      <div className="result-descriptive-text">
                        {answer?.answer_text || '(No answer provided)'}
                      </div>

                      {answer?.image_path && (
                        <div className="result-attachment-wrapper">
                          <a href={answer.image_path} target="_blank" rel="noopener noreferrer" className="result-attachment-link">
                            View Uploaded Workspace Image
                          </a>
                        </div>
                      )}

                      {isGraded && answer?.teacher_feedback && (
                        <div className="result-feedback-box">
                          <strong>Teacher Feedback:</strong>
                          <p className="result-feedback-text">
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
