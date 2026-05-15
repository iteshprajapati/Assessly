import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { questionAPI, quizAPI } from '../services/api';
import Alert from '../components/Alert';
import { Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';

export default function ManageQuestions() {
  const { quizId } = useParams();
  const formRef = useRef(null);
  const fileInputRef = useRef(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [questionType, setQuestionType] = useState('MCQ'); // 'MCQ' or 'DESCRIPTIVE'
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    topic: '',
    question: '',
    points: 1,
    // MCQ-specific
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
    setFormData({
      topic: '',
      question: '',
      points: 1,
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correctOption: 1,
    });
    setEditingId(null);
    setShowModal(false);
    setSelectedImage(null);
    setPreviewImage(null);
    setQuestionType('MCQ');
    if (formRef.current) {
      formRef.current.reset();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openModal = (question) => {
    setFormData({
      topic: question.topic || '',
      question: question.question,
      points: question.points || 1,
      option1: question.option1 || '',
      option2: question.option2 || '',
      option3: question.option3 || '',
      option4: question.option4 || '',
      correctOption: question.correct_option || 1,
    });
    setQuestionType(question.type || 'MCQ');
    setEditingId(question.id);
    setSuccess('');
    setError('');
    setPreviewImage(question.image_path || null);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['correctOption', 'points'].includes(name) ? parseInt(value) : value,
    }));
  };

  const handleImageChange = (e) => {
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
      setSelectedImage(file);
      // Create preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewImage('PDF file selected');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const submitData = {
        ...formData,
        quizId: parseInt(quizId),
        image: selectedImage,
      };

      if (questionType === 'MCQ') {
        // Validate MCQ fields
        if (!formData.option1 || !formData.option2 || !formData.option3 || !formData.option4) {
          throw new Error('All options are required for MCQ');
        }
        await questionAPI.addMCQQuestion(submitData);
      } else {
        await questionAPI.addDescriptiveQuestion(submitData);
      }

      setSuccess(`${questionType} question added successfully!`);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save question');
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
      const submitData = {
        ...formData,
        quizId: parseInt(quizId),
        image: selectedImage,
      };

      if (questionType === 'MCQ') {
        if (!formData.option1 || !formData.option2 || !formData.option3 || !formData.option4) {
          throw new Error('All options are required for MCQ');
        }
      }

      await questionAPI.updateQuestion(editingId, submitData);
      setSuccess('Question updated successfully!');
      resetForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update question');
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

  const mcqCount = questions.filter(q => q.type === 'MCQ').length;
  const descriptiveCount = questions.filter(q => q.type === 'DESCRIPTIVE').length;

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
              Manage Questions &nbsp;·&nbsp; {questions.length} total
              {mcqCount > 0 && ` · ${mcqCount} MCQ`}
              {descriptiveCount > 0 && ` · ${descriptiveCount} Descriptive`}
            </p>
          </div>
          <Link to="/teacher" className="btn btn-outline-secondary btn-sm">
            ← Back to Dashboard
          </Link>
        </div>

        {/* ── Alerts ── */}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
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
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
                  {editingId ? 'Edit Question' : 'Add New Question'}
                </h2>
              </div>

              {/* Question Type Selector */}
              <div className="mb-3" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Question Type *</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {['MCQ', 'DESCRIPTIVE'].map((type) => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="questionType"
                        value={type}
                        checked={questionType === type}
                        onChange={(e) => {
                          if (!editingId) setQuestionType(e.target.value);
                        }}
                        disabled={!!editingId}
                        style={{ cursor: editingId ? 'not-allowed' : 'pointer' }}
                      />
                      <span>{type === 'MCQ' ? 'Multiple Choice' : 'Descriptive'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <form ref={formRef} onSubmit={editingId ? handleUpdateQuestion : handleSubmit}>
                {/* Topic */}
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
                  <div className="form-text">Optional, used for analytics.</div>
                </div>

                {/* Points */}
                <div className="mb-3">
                  <label className="form-label">Points</label>
                  <input
                    type="number"
                    name="points"
                    className="auth-input"
                    min="1"
                    value={formData.points}
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
                </div>

                {/* Image Upload */}
                <div className="mb-3">
                  <label className="form-label">Upload Image (Optional)</label>
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
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#6366f1';
                      e.currentTarget.style.background = '#eef2ff';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#f9fafb';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#f9fafb';
                      if (e.dataTransfer.files?.[0]) {
                        fileInputRef.current.files = e.dataTransfer.files;
                        handleImageChange({ target: { files: e.dataTransfer.files } });
                      }
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <ImageIcon size={24} style={{ color: '#9ca3af', marginBottom: '0.5rem' }} />
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        Drag and drop or click to select
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                        JPG, PNG or PDF (Max 5MB)
                      </div>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Image Preview */}
                {previewImage && (
                  <div className="mb-3" style={{
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: '#374151' }}>
                      {typeof previewImage === 'string' && previewImage.startsWith('data:') ? '✓ Image selected' : previewImage}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setPreviewImage(null);
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
                      ✕ Remove
                    </button>
                  </div>
                )}

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

                {/* MCQ Options (only show for MCQ) */}
                {questionType === 'MCQ' && (
                  <>
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
                          required={questionType === 'MCQ'}
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
                  </>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingId ? 'Update Question' : 'Add Question'}
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
                      {/* Q number + type + actions */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                      }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                          <span style={{
                            fontWeight: '600',
                            fontSize: '0.75rem',
                            color: q.type === 'MCQ' ? '#1f2937' : '#059669',
                            background: q.type === 'MCQ' ? '#f0f0f0' : '#d1fae5',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                          }}>
                            {q.type}
                          </span>
                          <span style={{
                            fontWeight: '500',
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            background: '#f3f4f6',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                          }}>
                            {q.points} pts
                          </span>
                        </div>
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

                      {/* Question Image */}
                      {q.image_path && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <img
                            src={q.image_path}
                            alt="Question"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '150px',
                              borderRadius: '6px',
                              objectFit: 'contain'
                            }}
                          />
                        </div>
                      )}

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

                      {/* Options (MCQ only) */}
                      {q.type === 'MCQ' && (
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
                      )}

                      {/* Descriptive indicator */}
                      {q.type === 'DESCRIPTIVE' && (
                        <div style={{
                          padding: '0.5rem',
                          background: '#f0fdf4',
                          borderLeft: '3px solid #10b981',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          color: '#059669',
                        }}>
                          ✓ Descriptive question - Students will provide text answers
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
