import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { questionAPI, quizAPI } from '../services/api';
import Alert from '../components/Alert';
import { Edit2, Trash2, X } from 'lucide-react';

export default function ManageQuestions() {
  const { quizId } = useParams();
  const formRef = useRef(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    topic: '',
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

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
    setFormData({ topic: '', question: '', option1: '', option2: '', option3: '', option4: '', correctOption: 1 });
    setEditingId(null);
    setShowModal(false);
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const openModal = (question) => {
    setFormData({
      topic: question.topic || '',
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
    setShowModal(true);
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
      // Always add from left form, update happens in modal
      await questionAPI.addQuestion({ ...formData, quizId: parseInt(quizId) });
      setSuccess('Question added successfully!');
      resetForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await questionAPI.updateQuestion(editingId, { ...formData, quizId: parseInt(quizId) });
      setSuccess('Question updated successfully!');
      resetForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update question');
    } finally {
      setSaving(false);
    }
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
                marginBottom: '1.25rem',
              }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
                  Add New Question
                </h2>
              </div>

              <form ref={formRef} onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Topic</label>
                  <input
                    type="text"
                    name="topic"
                    className="auth-input"
                    placeholder="e.g. Algebra, Networking, Photosynthesis"
                    value={formData.topic}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      background: '#f3f4f6',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div className="form-text">Optional, used for mastery analytics.</div>
                </div>
                {/* Question text */}
                <div className="mb-3">
                  <label className="form-label">Question *</label>
                  <textarea
                    name="question"
                    className="auth-input"
                    rows="3"
                    placeholder="Enter the question..."
                    value={formData.question}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      background: '#f3f4f6',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Options */}
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="mb-3">
                    <label className="form-label">Option {num} *</label>
                    <input
                      type="text"
                      name={`option${num}`}
                      className="auth-input"
                      placeholder={`Enter option ${num}...`}
                      value={formData[`option${num}`]}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        background: '#f3f4f6',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ))}

                {/* Correct Option */}
                <div className="mb-4">
                  <label className="form-label">Correct Option *</label>
                  <select
                    name="correctOption"
                    className="auth-input"
                    value={formData.correctOption}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      background: '#f3f4f6',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
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
                  >
                    {saving ? 'Saving...' : 'Add Question'}
                  </button>
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
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          <button
                            onClick={() => openModal(q)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              padding: '0.5rem 1rem',
                              background: '#f3f4f6',
                              border: 'none',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              color: '#374151',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#000000';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f3f4f6';
                              e.currentTarget.style.color = '#374151';
                            }}
                          >
                            <Edit2 size={14} strokeWidth={2} color="currentColor" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              padding: '0.5rem 1rem',
                              background: '#fee2e2',
                              border: 'none',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              color: '#dc2626',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#fca5a5';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#fee2e2';
                            }}
                          >
                            <Trash2 size={14} strokeWidth={2} />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Question text */}
                      <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: '1.45' }}>
                        {q.question}
                      </p>

                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.2rem 0.6rem',
                        background: '#f3f4f6',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        color: '#374151',
                        marginBottom: '0.75rem'
                      }}>
                        Topic: <strong>{q.topic || 'General'}</strong>
                      </div>

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

        {/* ── Edit Modal ── */}
        {showModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
            onClick={(e) => e.target === e.currentTarget && resetForm()}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                animation: 'slideUp 0.3s ease-out',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.5rem',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>
                  Edit Question
                </h2>
                <button
                  onClick={resetForm}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.5rem' }}>
                <form onSubmit={handleUpdateQuestion}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#111827' }}>
                      Topic
                    </label>
                    <input
                      type="text"
                      name="topic"
                      className="auth-input"
                      placeholder="e.g. Algebra, Networking, Photosynthesis"
                      value={formData.topic}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        background: '#f3f4f6',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  {/* Question text */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#111827' }}>
                      Question *
                    </label>
                    <textarea
                      name="question"
                      className="auth-input"
                      rows="3"
                      placeholder="Enter the question..."
                      value={formData.question}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        background: '#f3f4f6',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {/* Options */}
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#111827' }}>
                        Option {num} *
                      </label>
                      <input
                        type="text"
                        name={`option${num}`}
                        className="auth-input"
                        placeholder={`Enter option ${num}...`}
                        value={formData[`option${num}`]}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.65rem 1rem',
                          background: '#f3f4f6',
                          border: '1px solid transparent',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          color: '#111827',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}

                  {/* Correct Option */}
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#111827' }}>
                      Correct Option *
                    </label>
                    <select
                      name="correctOption"
                      className="auth-input"
                      value={formData.correctOption}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        background: '#f3f4f6',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                      }}
                    >
                      {[1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          Option {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Modal Footer */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      paddingTop: '1.5rem',
                      borderTop: '1px solid #e5e7eb',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{
                        padding: '0.7rem 1.5rem',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        color: '#374151',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#e5e7eb')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        padding: '0.7rem 1.5rem',
                        background: '#111827',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        color: '#ffffff',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!saving) e.currentTarget.style.background = '#000000';
                      }}
                      onMouseLeave={(e) => {
                        if (!saving) e.currentTarget.style.background = '#111827';
                      }}
                    >
                      {saving ? 'Updating...' : 'Update Question'}
                    </button>
                  </div>
                </form>
              </div>

              <style>{`
                @keyframes slideUp {
                  from {
                    opacity: 0;
                    transform: translateY(20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
