import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { questionAPI, quizAPI } from '../services/api';
import Alert from '../components/Alert';

export default function ManageQuestions() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correctOption: 1,
  });

  useEffect(() => {
    loadData();
  }, [quizId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizRes, qRes] = await Promise.all([
        quizAPI.getQuiz(quizId),
        questionAPI.getQuestions(quizId),
      ]);
      setQuiz(quizRes.data);
      setQuestions(qRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ question: '', option1: '', option2: '', option3: '', option4: '', correctOption: 1 });
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'correctOption' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      if (editingId) {
        await questionAPI.updateQuestion(editingId, { ...formData, quizId: parseInt(quizId) });
        setSuccess('Question updated successfully!');
      } else {
        await questionAPI.addQuestion({ ...formData, quizId: parseInt(quizId) });
        setSuccess('Question added successfully!');
      }
      resetForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (question) => {
    setFormData({
      question: question.question,
      option1: question.option1,
      option2: question.option2,
      option3: question.option3,
      option4: question.option4,
      correctOption: question.correct_option,
    });
    setEditingId(question.id);
    setSuccess('');
    setError('');
    // Scroll left panel to top on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await questionAPI.deleteQuestion(id);
      setQuestions(questions.filter((q) => q.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete question');
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

  return (
    <main style={{ flex: 1, background: 'var(--bg-secondary, #f8f9fa)' }}>
      <div className="container" style={{ padding: '1.5rem 0 2rem' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '0.2rem' }}>
              {quiz?.title}
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
              Manage Questions &nbsp;·&nbsp; {questions.length} question{questions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/teacher" className="btn btn-outline-secondary btn-sm">
            ← Back to Dashboard
          </Link>
        </div>

        {/* ── Alerts ── */}
        {error   && <Alert type="error"   message={error}   onClose={() => setError('')}   />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* ── Two-Column Layout ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}>

          {/* ══ LEFT: Add / Edit Form ══ */}
          <div className="card" style={{ position: 'sticky', top: '1rem' }}>
            <div className="card-body">
              {/* Form header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
                  {editingId ? 'Edit Question' : 'Add New Question'}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={resetForm}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      padding: '0.25rem 0.5rem',
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                {/* Question text */}
                <div className="mb-3">
                  <label className="form-label">Question *</label>
                  <textarea
                    name="question"
                    className="form-control"
                    rows="3"
                    placeholder="Enter the question..."
                    value={formData.question}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Options */}
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="mb-3">
                    <label className="form-label">Option {num} *</label>
                    <input
                      type="text"
                      name={`option${num}`}
                      className="form-control"
                      placeholder={`Enter option ${num}...`}
                      value={formData[`option${num}`]}
                      onChange={handleChange}
                      required
                    />
                  </div>
                ))}

                {/* Correct Option */}
                <div className="mb-4">
                  <label className="form-label">Correct Option *</label>
                  <select
                    name="correctOption"
                    className="form-select"
                    value={formData.correctOption}
                    onChange={handleChange}
                    required
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>Option {n}</option>
                    ))}
                  </select>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ flex: 1 }}
                  >
                    {saving
                      ? 'Saving...'
                      : editingId
                        ? 'Update Question'
                        : 'Add Question'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* ══ RIGHT: Question List ══ */}
          <div>
            {questions.length === 0 ? (
              <div className="card">
                <div className="card-body">
                  <div className="empty-state">
                    <div className="empty-state-text">
                      No questions yet. Add your first question on the left.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    className="card"
                    style={{
                      border: editingId === q.id
                        ? '2px solid var(--primary, #6366f1)'
                        : '1px solid var(--border, #e5e7eb)',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
                      {/* Q number + actions */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                      }}>
                        <span style={{
                          fontWeight: '700',
                          fontSize: '0.78rem',
                          color: 'var(--primary, #6366f1)',
                          background: 'var(--primary-light, #eef2ff)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          whiteSpace: 'nowrap',
                        }}>
                          Q{index + 1}
                        </span>
                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                          <button
                            onClick={() => handleEdit(q)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Question text */}
                      <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: '1.45' }}>
                        {q.question}
                      </p>

                      {/* Options */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {[1, 2, 3, 4].map((num) => {
                          const isCorrect = q.correct_option === num;
                          return (
                            <div
                              key={num}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.35rem 0.6rem',
                                borderRadius: '6px',
                                background: isCorrect ? '#d1fae5' : 'transparent',
                                borderLeft: isCorrect ? '3px solid var(--success, #10b981)' : '3px solid transparent',
                                fontSize: '0.83rem',
                                color: isCorrect ? 'var(--success, #059669)' : 'var(--text-body)',
                                fontWeight: isCorrect ? '600' : '400',
                              }}
                            >
                              <span style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: isCorrect ? 'var(--success, #10b981)' : 'var(--border, #d1d5db)',
                                color: isCorrect ? '#fff' : 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                flexShrink: 0,
                              }}>
                                {isCorrect ? '✓' : num}
                              </span>
                              {q[`option${num}`]}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Responsive override for small screens ── */}
        <style>{`
          @media (max-width: 768px) {
            .mq-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </main>
  );
}
