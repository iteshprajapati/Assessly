import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/api';
import Alert from '../components/Alert';

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
      const response = await quizAPI.createQuiz(formData);
      navigate(`/teacher/quiz/${response.data.quizId}/questions`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ flex: 1 }}>
      <div className="container" style={{ padding: '2rem 0' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1>Create New Quiz</h1>
            <p style={{ color: 'var(--text-muted)' }}>Set up a new timed MCQ quiz</p>
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
                    className="form-control"
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
                    className="form-control"
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
                    className="form-control"
                    min="1"
                    max="300"
                    placeholder="e.g. 30"
                    value={formData.timeLimit}
                    onChange={handleChange}
                    required
                  />
                  <div className="form-text">Students will have this many minutes to complete the quiz.</div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
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
