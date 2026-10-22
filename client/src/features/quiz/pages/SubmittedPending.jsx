import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

/**
 * SubmittedPending
 * Shown after a student submits a quiz that contains descriptive questions.
 * The scored result is locked until the teacher grades all descriptive answers.
 */
export default function SubmittedPending() {
  const { resultId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Optional metadata passed via navigate state from AttemptQuiz
  const quizTitle = location.state?.quizTitle || 'Your Quiz';
  const submittedAt = location.state?.submittedAt
    ? new Date(location.state.submittedAt).toLocaleString()
    : new Date().toLocaleString();

  return (
    <main className="result-main">
      <div className="container result-wrapper">
        <div className="result-container">
          <div className="card mb-4">
            <div className="card-body result-summary-card-body" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>

              {/* Success Icon */}
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.35)',
              }}>
                <span style={{ fontSize: '2rem', color: '#fff' }}>✓</span>
              </div>

              <h1 className="result-title" style={{ marginBottom: '0.5rem' }}>
                Quiz Submitted Successfully!
              </h1>

              <p style={{ color: 'var(--text-muted, #6b7280)', marginBottom: '0.25rem', fontSize: '1rem' }}>
                <strong>{quizTitle}</strong>
              </p>
              <p style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.875rem', marginBottom: '2rem' }}>
                Submitted on {submittedAt}
              </p>

              {/* Pending Notice */}
              <div style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.35)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                marginBottom: '2rem',
                textAlign: 'left',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⏳</span>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary, #111827)' }}>
                      Result Pending Teacher Review
                    </p>
                    <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: '0.9rem', margin: 0 }}>
                      Your quiz contains written answers that require manual grading.
                      Your result will be published automatically once your teacher
                      has reviewed and graded all written responses.
                    </p>
                  </div>
                </div>
              </div>

              {/* Info pills */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  color: '#059669',
                }}>
                  ✅ MCQ answers graded instantly
                </div>
                <div style={{
                  background: 'rgba(251, 191, 36, 0.08)',
                  border: '1px solid rgba(251, 191, 36, 0.25)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  color: '#b45309',
                }}>
                  ✍️ Written answers under review
                </div>
              </div>

              <button
                id="btn-back-to-dashboard"
                onClick={() => navigate('/student')}
                className="btn btn-primary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
