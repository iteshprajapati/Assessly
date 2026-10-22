import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { answerAPI, quizAPI } from '../services/api';
import Alert from '../components/Alert';
import { ChevronLeft, ChevronRight, Save, X } from 'lucide-react';

export default function GradeDescriptiveAnswers() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [marksInput, setMarksInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [presetAnswers, setPresetAnswers] = useState([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPreset, setNewPreset] = useState({ answerText: '', marks: 0 });

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

  useEffect(() => {
    if (answers[currentIndex]) {
      loadPresetAnswers(answers[currentIndex].question_id);
      setMarksInput(answers[currentIndex].marks_obtained || '');
      setFeedbackInput(answers[currentIndex].teacher_feedback || '');
    }
  }, [currentIndex, answers]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizRes, answersRes] = await Promise.all([
        quizAPI.getQuiz(quizId),
        answerAPI.getUngradedAnswers(quizId),
      ]);
      setQuiz(quizRes.data);
      setAnswers(answersRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPresetAnswers = async (questionId) => {
    try {
      const res = await answerAPI.getPresetAnswers(questionId);
      setPresetAnswers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load preset answers');
    }
  };

  const currentAnswer = answers[currentIndex];
  const maxMarks = presetAnswers.length > 0 ? Math.max(...presetAnswers.map(p => p.marks)) : 10;

  const handleGrade = async () => {
    setError('');
    setSuccess('');

    // Validate marks
    const marks = parseInt(marksInput);
    if (isNaN(marks) || marks < 0 || marks > maxMarks) {
      setError(`Marks must be between 0 and ${maxMarks}`);
      return;
    }

    setSaving(true);
    try {
      await answerAPI.gradeAnswer(currentAnswer.id, {
        marksObtained: marks,
        teacherFeedback: feedbackInput,
      });

      setSuccess('Answer graded successfully!');
      
      // Move to next ungraded answer
      const nextIndex = currentIndex + 1;
      if (nextIndex < answers.length) {
        setCurrentIndex(nextIndex);
      } else {
        // All answers graded - reload or go back
        setTimeout(() => {
          loadData();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to grade answer');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPreset = async () => {
    if (!newPreset.answerText || isNaN(parseInt(newPreset.marks))) {
      setError('Please fill in all preset answer fields');
      return;
    }

    try {
      await answerAPI.addPresetAnswer({
        questionId: currentAnswer.question_id,
        answerText: newPreset.answerText,
        marks: parseInt(newPreset.marks),
      });
      
      setSuccess('Preset answer added!');
      setNewPreset({ answerText: '', marks: 0 });
      setShowPresetModal(false);
      loadPresetAnswers(currentAnswer.question_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add preset');
    }
  };

  const handleDeletePreset = async (presetId) => {
    if (!window.confirm('Delete this preset answer?')) return;
    
    try {
      await answerAPI.deletePresetAnswer(presetId);
      setSuccess('Preset deleted!');
      loadPresetAnswers(currentAnswer.question_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete preset');
    }
  };

  const applyPresetMarks = (marks) => {
    setMarksInput(String(marks));
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

  if (!answers.length) {
    return (
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', margin: '2rem', textAlign: 'center' }}>
          <div className="card-body" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>No Answers to Grade</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              All descriptive answers for this quiz have been graded.
            </p>
            <Link to="/teacher" className="btn btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ flex: 1, background: 'var(--bg-secondary, #f8f9fa)' }}>
      <div className="container" style={{ padding: '1.5rem 0 2rem' }}>
        {/* Header */}
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
              Grade Descriptive Answers
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
              {quiz?.title} · {answers.length} answer{answers.length !== 1 ? 's' : ''} to grade
            </p>
          </div>
          <Link to="/teacher" className="btn btn-outline-secondary btn-sm">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
          {/* Main grading area */}
          <div className="card">
            <div className="card-body">
              {/* Progress */}
              <div style={{
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                    Answer {currentIndex + 1} of {answers.length}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {currentAnswer?.student_name} ({currentAnswer?.email})
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: '#e5e7eb',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${((currentIndex + 1) / answers.length) * 100}%`,
                    height: '100%',
                    background: '#10b981',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>

              {/* Question */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Question</h3>
                {currentAnswer?.question_image && (
                  <div style={{ marginBottom: '1rem' }}>
                    <img
                      src={currentAnswer.question_image}
                      alt="Question"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                )}
                <p style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  borderLeft: '4px solid #6366f1',
                  margin: 0
                }}>
                  {currentAnswer?.question}
                </p>
              </div>

              {/* Student Answer */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Student's Answer</h3>
                {currentAnswer?.image_path && (
                  <div style={{ marginBottom: '1rem' }}>
                    <img
                      src={currentAnswer.image_path}
                      alt="Student's upload"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                )}
                <div style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  borderLeft: '4px solid #10b981',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {currentAnswer?.answer_text || '(No text answer provided)'}
                </div>
              </div>

              {/* Grading form */}
              <div style={{
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border)'
              }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Grade This Answer</h3>

                {/* Marks */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Marks Obtained <span style={{ color: '#6b7280' }}>/ {maxMarks}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={maxMarks}
                    value={marksInput}
                    onChange={(e) => setMarksInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="0"
                  />
                </div>

                {/* Feedback */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="Enter feedback for the student..."
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Navigation buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleGrade}
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}
                  >
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Grade'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={currentIndex === answers.length - 1}
                    onClick={() => setCurrentIndex(Math.min(answers.length - 1, currentIndex + 1))}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preset answers sidebar */}
          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '1rem' }}>
            <div className="card-header">
              Preset Answers
            </div>
            <div className="card-body">
              {presetAnswers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {presetAnswers.map((preset) => (
                    <div
                      key={preset.id}
                      style={{
                        padding: '0.75rem',
                        background: '#f3f4f6',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                          {preset.marks} marks
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: '1.3' }}>
                          {preset.answer_text.substring(0, 50)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => applyPresetMarks(preset.marks)}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                        >
                          Use
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(preset.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  No preset answers yet
                </p>
              )}
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => setShowPresetModal(true)}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                Add Preset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Preset Modal */}
      {showPresetModal && (
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
          onClick={(e) => e.target === e.currentTarget && setShowPresetModal(false)}
        >
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            maxWidth: '500px',
            width: '100%',
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
            }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>
                Add Preset Answer
              </h2>
              <button
                onClick={() => setShowPresetModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Answer Text *
                </label>
                <textarea
                  value={newPreset.answerText}
                  onChange={(e) => setNewPreset({ ...newPreset, answerText: e.target.value })}
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter the answer text..."
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Marks *
                </label>
                <input
                  type="number"
                  min="0"
                  max={maxMarks}
                  value={newPreset.marks}
                  onChange={(e) => setNewPreset({ ...newPreset, marks: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPresetModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddPreset}
                  style={{ flex: 1 }}
                >
                  Add Preset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
