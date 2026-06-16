import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { questionAPI, quizAPI } from '../../shared/services/api';
import Alert from '../../shared/components/Alert';
import '../styles/ManageQuestions.scss';
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
      <main className="manage-questions-main">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </main>
    );
  }

  const mcqCount = questions.filter(q => q.type === 'MCQ' || q.type === 'TRUE_FALSE').length;
  const descriptiveCount = questions.filter(q => q.type === 'DESCRIPTIVE').length;

  return (
    <main className="manage-questions-main manage-questions-bg">
      <div className="container manage-questions-wrapper">
        {/* ── Header ── */}
        <div className="manage-questions-header">
          <div>
            <h1>{quiz?.title}</h1>
            <p className="manage-questions-subheader">
              Manage Questions &nbsp;·&nbsp; {questions.length} total
              {mcqCount > 0 && ` · ${mcqCount} MCQ`}
              {descriptiveCount > 0 && ` · ${descriptiveCount} Descriptive`}
            </p>
          </div>
          <div className="manage-questions-header-actions">
            <Link to="/teacher" className="btn btn-outline-secondary btn-sm">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* ── Alerts ── */}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}


        {/* ── Two-Column Layout ── */}
        <div className="manage-questions-grid">

          {/* ══ LEFT: Add / Edit Form ══ */}
          <div className="card manage-questions-form-card">
            <div className="card-body">
              {/* Form header */}
              <div className="manage-questions-form-title-wrapper">
                <h2>
                  {editingId ? 'Edit Question' : 'Add New Question'}
                </h2>
              </div>

              {/* Question Type Selector */}
              <div className="manage-questions-type-selector-wrapper">
                <label className="form-label">Question Type *</label>
                <div className="manage-questions-type-radios">
                  {[
                    { val: 'MCQ', label: 'Multiple Choice' },
                    { val: 'TRUE_FALSE', label: 'True / False' },
                    { val: 'DESCRIPTIVE', label: 'Descriptive' }
                  ].map((t) => (
                    <label key={t.val} className={`manage-questions-type-label ${editingId ? 'disabled' : ''}`}>
                      <input
                        type="radio"
                        name="questionType"
                        value={t.val}
                        checked={questionType === t.val}
                        onChange={(e) => {
                          if (!editingId) setQuestionType(e.target.value);
                        }}
                        disabled={!!editingId}
                      />
                      <span>{t.label}</span>
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
                    className="manage-questions-input auth-input"
                    placeholder="e.g. Algebra, Networking, Photosynthesis"
                    value={formData.topic}
                    onChange={handleChange}
                  />
                  <div className="form-text">Optional, used for analytics.</div>
                </div>

                {/* Difficulty & Points row */}
                <div className="manage-questions-form-row">
                  <div>
                    <label className="form-label">Difficulty *</label>
                    <select
                      name="difficulty"
                      className="manage-questions-select auth-input"
                      value={formData.difficulty || 'medium'}
                      onChange={handleChange}
                      required
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Points</label>
                    <input
                      type="number"
                      name="points"
                      className="manage-questions-input auth-input"
                      min="1"
                      value={formData.points}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="mb-3">
                  <label className="form-label">Upload Image (Optional)</label>
                  <div className="manage-questions-upload-zone"
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
                      <ImageIcon size={24} className="upload-icon" />
                      <div className="upload-text">
                        Drag and drop or click to select
                      </div>
                      <div className="upload-subtext">
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
                  <div className="manage-questions-preview-box">
                    <span>
                      {typeof previewImage === 'string' && previewImage.startsWith('data:') ? '✓ Image selected' : previewImage}
                    </span>
                    <button
                      type="button"
                      className="btn-remove-preview"
                      onClick={() => {
                        setSelectedImage(null);
                        setPreviewImage(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
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
                    className="manage-questions-textarea auth-input"
                    rows="3"
                    placeholder="Enter the question..."
                    value={formData.question}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* MCQ or TRUE_FALSE Options */}
                {(questionType === 'MCQ' || questionType === 'TRUE_FALSE') && (
                  <>
                    {questionType === 'MCQ' ? (
                      [1, 2, 3, 4].map((num) => (
                        <div key={num} className="mb-3">
                          <label className="form-label">Option {num} *</label>
                          <input
                            type="text"
                            name={`option${num}`}
                            className="manage-questions-input auth-input"
                            placeholder={`Enter option ${num}...`}
                            value={formData[`option${num}`]}
                            onChange={handleChange}
                            required={questionType === 'MCQ'}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="manage-questions-info-box">
                        Options auto-configured: <strong>Option 1 = True</strong>, <strong>Option 2 = False</strong>.
                      </div>
                    )}

                    {/* Correct Option */}
                    <div className="mb-4">
                      <label className="form-label">Correct Option *</label>
                      <select
                        name="correctOption"
                        className="manage-questions-select auth-input"
                        value={formData.correctOption}
                        onChange={handleChange}
                        required
                      >
                        <option value="1">{questionType === 'MCQ' ? 'Option 1' : 'True'}</option>
                        <option value="2">{questionType === 'MCQ' ? 'Option 2' : 'False'}</option>
                        {questionType === 'MCQ' && (
                          <>
                            <option value="3">Option 3</option>
                            <option value="4">Option 4</option>
                          </>
                        )}
                      </select>
                    </div>
                  </>
                )}

                {/* Buttons */}
                <div className="manage-questions-buttons-row">
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
              <div className="manage-questions-list">
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    className={`card manage-question-card ${editingId === q.id ? 'editing' : ''}`}
                  >
                    <div className="card-body manage-question-card-body">
                      {/* Q number + type + actions */}
                      <div className="manage-question-card-header">
                        <div className="manage-question-card-badges">
                          <span className="badge-number">
                            Q{index + 1}
                          </span>
                          <span className={`badge-type ${q.type === 'MCQ' ? 'type-mcq' : q.type === 'TRUE_FALSE' ? 'type-true-false' : 'type-descriptive'}`}>
                            {q.type}
                          </span>
                          <span className={`badge-difficulty ${q.difficulty === 'easy' ? 'diff-easy' : q.difficulty === 'hard' ? 'diff-hard' : 'diff-medium'}`}>
                            {q.difficulty?.toUpperCase()}
                          </span>
                          <span className="badge-points">
                            {q.points || 1} pts
                          </span>
                        </div>
                        <div className="manage-question-card-actions">
                          <button
                            onClick={() => openModal(q)}
                            className="btn-card-edit"
                          >
                            <Edit2 size={14} strokeWidth={2} color="currentColor" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="btn-card-delete"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Question Image */}
                      {q.image_path && (
                        <div className="manage-question-image-wrapper">
                          <img
                            src={q.image_path}
                            alt="Question"
                          />
                        </div>
                      )}

                      {/* Question text */}
                      <p className="manage-question-text">
                        {q.question}
                      </p>

                      <div className="manage-question-topic-badge">
                        Topic: <strong>{q.topic || 'General'}</strong>
                      </div>

                      {/* Options (MCQ / TRUE_FALSE) */}
                      {(q.type === 'MCQ' || q.type === 'TRUE_FALSE') && (
                        <div className="manage-question-options">
                          {(q.type === 'MCQ' ? [1, 2, 3, 4] : [1, 2]).map((num) => {
                            const isCorrect = q.correct_option === num;
                            return (
                              <div
                                key={num}
                                className={`manage-question-option ${isCorrect ? 'correct' : ''}`}
                              >
                                <span className={`option-num-indicator ${isCorrect ? 'correct' : ''}`}>
                                  {isCorrect ? '✓' : num}
                                </span>
                                {num === 1 ? (q.option1 || 'True') : num === 2 ? (q.option2 || 'False') : num === 3 ? q.option3 : q.option4}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Descriptive indicator */}
                      {q.type === 'DESCRIPTIVE' && (
                        <div className="manage-question-descriptive-indicator">
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
