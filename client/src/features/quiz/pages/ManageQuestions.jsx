import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { questionAPI, quizAPI } from '../../shared/services/api';
import { Alert, Tooltip } from '../../shared/components';
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

        <div className="manage-questions-layout-vertical">
          {/* ── Add / Edit Form Card ── */}
          <div className="card manage-questions-form-card">
            <div className="card-body">
              <div className="manage-questions-form-header-row">
                <h2>{editingId ? 'Edit Question' : 'Add New Question'}</h2>
                <div className="manage-questions-type-selector-wrapper">
                  <span className="type-selector-label">Question Type</span>
                  <div className="manage-questions-segmented-control">
                    {[
                      { val: 'MCQ', label: 'Multiple Choice' },
                      { val: 'TRUE_FALSE', label: 'True / False' },
                      { val: 'DESCRIPTIVE', label: 'Descriptive' }
                    ].map((t) => (
                      <Tooltip
                        key={t.val}
                        text={
                          t.val === 'MCQ'
                            ? 'MCQ (auto-graded)'
                            : t.val === 'TRUE_FALSE'
                            ? 'True/False (auto-graded)'
                            : 'Descriptive (manually graded)'
                        }
                        position="bottom"
                      >
                        <button
                          type="button"
                          className={`segment-btn ${questionType === t.val ? 'active' : ''} ${editingId ? 'disabled' : ''}`}
                          onClick={() => {
                            if (!editingId) setQuestionType(t.val);
                          }}
                          disabled={!!editingId}
                        >
                          {t.label}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>

              <form ref={formRef} onSubmit={editingId ? handleUpdateQuestion : handleSubmit}>
                {/* ── Metadata Row ── */}
                <div className="form-row form-metadata-row">
                  {/* Topic Field */}
                  <div className="metadata-field">
                    <label className="form-label">Topic</label>
                    <Tooltip text="Used for categorization and granular topic analytics" position="top">
                      <input
                        type="text"
                        name="topic"
                        className="manage-questions-input"
                        placeholder="e.g. Algebra, Networking, Photosynthesis"
                        value={formData.topic}
                        onChange={handleChange}
                      />
                    </Tooltip>
                  </div>

                  {/* Difficulty Field */}
                  <div className="metadata-field">
                    <label className="form-label">Difficulty *</label>
                    <Tooltip text="Helps in structuring balanced quiz papers" position="top">
                      <select
                        name="difficulty"
                        className="manage-questions-select"
                        value={formData.difficulty || 'medium'}
                        onChange={handleChange}
                        required
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </Tooltip>
                  </div>

                  {/* Points Field */}
                  <div className="metadata-field">
                    <label className="form-label">Points *</label>
                    <Tooltip text="Weight of this question in the total score" position="top">
                      <input
                        type="number"
                        name="points"
                        className="manage-questions-input"
                        min="1"
                        value={formData.points}
                        onChange={handleChange}
                        required
                      />
                    </Tooltip>
                  </div>

                  {/* Image Upload Field */}
                  <div className="metadata-field image-upload-field">
                    <label className="form-label">Upload Image (Optional)</label>
                    <Tooltip text="Attach a supportive diagram, code snippet or math proof" position="top">
                      <div className="manage-questions-image-section">
                        <div className="upload-container">
                          <div
                            className="manage-questions-upload-zone-compact"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImageIcon size={16} className="upload-icon" />
                            <span className="upload-text">Select Image / PDF</span>
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
                          <div className="manage-questions-preview-box-compact">
                            <div className="preview-info">
                              {(() => {
                                const isImagePreview = typeof previewImage === 'string' &&
                                  (previewImage.startsWith('data:image/') || previewImage.startsWith('http') || previewImage.match(/\.(jpeg|jpg|gif|png)$/i));
                                return isImagePreview ? (
                                  <img src={previewImage} alt="Preview" className="img-preview" />
                                ) : (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', padding: '0 0.25rem' }}>PDF</span>
                                );
                              })()}
                              <span className="file-info" title={selectedImage ? selectedImage.name : (typeof previewImage === 'string' ? previewImage.split('/').pop() : 'Image')}>
                                {selectedImage ? selectedImage.name : (typeof previewImage === 'string' ? previewImage.split('/').pop() : 'Image')}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="btn-remove-preview"
                              onClick={() => {
                                setSelectedImage(null);
                                setPreviewImage(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </Tooltip>
                  </div>
                </div>

                {/* ── Content Row ── */}
                <div className={`form-row form-content-row ${questionType === 'DESCRIPTIVE' ? 'single-column' : 'two-columns'}`}>
                  {/* Left Side: Question Input */}
                  <div className="form-group question-text-group">
                    <label className="form-label">Question Text *</label>
                    <textarea
                      name="question"
                      className="manage-questions-textarea"
                      rows="4"
                      placeholder="Enter the question text..."
                      value={formData.question}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Right Side: Options (if MCQ or TRUE_FALSE) */}
                  {questionType === 'MCQ' && (
                    <div className="manage-questions-options-section">
                      <label className="form-label">Options & Correct Answer *</label>
                      <div className="options-grid-2x2">
                        {[1, 2, 3, 4].map((num) => {
                          const isCorrect = formData.correctOption === num;
                          return (
                            <div key={num} className={`option-input-group ${isCorrect ? 'is-correct' : ''}`}>
                              <Tooltip text="Mark this choice as the correct answer" position="top">
                                <div className="option-radio-wrapper">
                                  <input
                                    type="radio"
                                    name="correctOption"
                                    value={num}
                                    checked={isCorrect}
                                    onChange={handleChange}
                                    className="correct-option-radio"
                                  />
                                </div>
                              </Tooltip>
                              <input
                                type="text"
                                name={`option${num}`}
                                className="option-text-input"
                                placeholder={`Option ${num}`}
                                value={formData[`option${num}`]}
                                onChange={handleChange}
                                required={questionType === 'MCQ'}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {questionType === 'TRUE_FALSE' && (
                    <div className="manage-questions-options-section">
                      <label className="form-label">Select Correct Answer *</label>
                      <div className="true-false-grid">
                        {[
                          { val: 1, label: 'True' },
                          { val: 2, label: 'False' }
                        ].map((item) => {
                          const isCorrect = formData.correctOption === item.val;
                          return (
                            <label key={item.val} className={`tf-option-label ${isCorrect ? 'is-correct' : ''}`}>
                              <input
                                type="radio"
                                name="correctOption"
                                value={item.val}
                                checked={isCorrect}
                                onChange={handleChange}
                                className="correct-option-radio"
                              />
                              <span>{item.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {questionType === 'DESCRIPTIVE' && (
                    <div className="manage-question-descriptive-indicator">
                      ✓ Descriptive question - Students will provide long-form text answers (manually graded)
                    </div>
                  )}
                </div>

                {/* ── Form Actions / Buttons ── */}
                <div className="form-row form-actions-row manage-questions-buttons-row">
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

          {/* ── Questions List ── */}
          <div className="manage-questions-list-section">
            <div className="list-section-header">
              <h2>Added Questions ({questions.length})</h2>
            </div>

            {questions.length === 0 ? (
              <div className="card">
                <div className="card-body">
                  <div className="empty-state">
                    <div className="empty-state-text">
                      No questions yet. Add your first question above.
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
