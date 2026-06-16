import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI } from '../../shared/services/api';
import Alert from '../../shared/components/Alert';
import '../styles/CreateQuiz.scss';

export default function CreateQuiz() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 10,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'timeLimit' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Quiz title is required');
      }
      if (formData.timeLimit < 1 || formData.timeLimit > 300) {
        throw new Error('Time limit must be between 1 and 300 minutes');
      }

      const response = await quizAPI.createQuiz(formData);
      navigate(`/teacher/quiz/${response.data.quizId}/questions`);
    } catch (err) {
      // Handle validation errors from backend
      let errorMsg = 'Failed to create quiz';
      
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Multiple validation errors
        errorMsg = err.response.data.errors.map(e => e.msg).join(', ');
      } else if (err.response?.data?.error) {
        // Single error message
        errorMsg = err.response.data.error;
      } else if (err.message) {
        // Client-side error
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="create-quiz-main">
      <div className="container create-quiz-wrapper">
        <div className="create-quiz-container">
          <div className="create-quiz-header">
            <h1>Create New Quiz</h1>
            <p>Set up a new timed MCQ quiz</p>
          </div>

          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Quiz Title *</label>
                  <input
                    type="text"
                    name="title"
                    className="create-quiz-input auth-input"
                    placeholder="e.g. Introduction to Mathematics"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    className="create-quiz-textarea auth-input"
                    rows="3"
                    placeholder="Brief description of the quiz..."
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className="form-label">Time Limit (minutes) *</label>
                  <input
                    type="number"
                    name="timeLimit"
                    className="create-quiz-input time-limit-input auth-input"
                    min="1"
                    max="300"
                    placeholder="e.g. 30"
                    value={formData.timeLimit}
                    onChange={handleChange}
                    required
                  />
                  <div className="form-text">Students will have this many minutes to complete the quiz.</div>
                </div>

                <div className="create-quiz-buttons-row">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Quiz'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/teacher')}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
