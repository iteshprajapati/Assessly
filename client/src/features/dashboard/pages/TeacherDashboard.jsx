import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { quizAPI, classroomAPI } from '../../shared/services/api';
import { useAuth } from '../../auth/context/AuthContext';
import { LayoutDashboard, BookOpen, HelpCircle, Users, Plus, Edit2, BarChart3, Trash2, X } from 'lucide-react';
import '../styles/TeacherDashboard.scss';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('quizzes');
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [classError, setClassError] = useState('');
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalQuestions: 0,
    totalAttempts: 0,
  });

  useEffect(() => {
    if (user && user.role === 'teacher') {
      if (!username || username !== user.username) {
        navigate(`/teacher/${user.username}`, { replace: true });
      }
    }
  }, [username, user, navigate]);

  useEffect(() => {
    loadQuizzes();
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      const response = await classroomAPI.getClassrooms();
      setClassrooms(response.data.data);
    } catch (error) {
      console.error('Failed to load classrooms:', error);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setCreatingClass(true);
    setClassError('');
    try {
      await classroomAPI.createClassroom({
        name: newClassName,
        description: newClassDesc,
      });
      setNewClassName('');
      setNewClassDesc('');
      setShowClassModal(false);
      loadClassrooms();
    } catch (err) {
      setClassError(err.response?.data?.error || 'Failed to create classroom');
    } finally {
      setCreatingClass(false);
    }
  };

  const handleDeleteClassroom = async (classroomId) => {
    if (!window.confirm('Delete this classroom? Enrolled students and quiz assignments will be removed.')) return;
    try {
      await classroomAPI.deleteClassroom(classroomId);
      loadClassrooms();
    } catch (error) {
      console.error('Failed to delete classroom:', error);
    }
  };

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getTeacherQuizzes();
      const quizzesData = response.data.data;
      setQuizzes(quizzesData);

      // Calculate stats
      const totalQuestions = quizzesData.reduce((sum, q) => sum + (q.question_count || 0), 0);
      const totalAttempts = quizzesData.reduce((sum, q) => sum + (q.attempt_count || 0), 0);

      setStats({
        totalQuizzes: quizzesData.length,
        totalQuestions,
        totalAttempts,
      });
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Delete this quiz? This action cannot be undone.')) return;
    try {
      await quizAPI.deleteQuiz(quizId);
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
      loadQuizzes();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    }
  };

  if (loading && quizzes.length === 0) {
    return (
      <main className="teacher-main">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="teacher-main">
      <div className="container">
        <div className="teacher-wrapper">
          {/* Welcome Section */}
          <div className="teacher-header">
            <div className="teacher-header-title">
              <LayoutDashboard size={28} strokeWidth={1.5} />
              <h2>Teacher Dashboard</h2>
            </div>
            <p>
              Welcome back, <strong>{user?.name || 'Teacher'}</strong>
            </p>
          </div>

          {/* Stats Cards */}
          <div className="teacher-stats-grid">
            <div className="teacher-stat-box">
              <div className="teacher-stat-icon-wrapper blue">
                <BookOpen size={24} strokeWidth={1.5} />
              </div>
              <div className="teacher-stat-val">{stats.totalQuizzes}</div>
              <div className="teacher-stat-lbl">My Quizzes</div>
            </div>
            <div className="teacher-stat-box">
              <div className="teacher-stat-icon-wrapper gray">
                <HelpCircle size={24} strokeWidth={1.5} />
              </div>
              <div className="teacher-stat-val">{stats.totalQuestions}</div>
              <div className="teacher-stat-lbl">Total Questions</div>
            </div>
            <div className="teacher-stat-box">
              <div className="teacher-stat-icon-wrapper green">
                <Users size={24} strokeWidth={1.5} />
              </div>
              <div className="teacher-stat-val">{stats.totalAttempts}</div>
              <div className="teacher-stat-lbl">Student Attempts</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="teacher-tabs">
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`teacher-tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
            >
              My Quizzes
            </button>
            <button
              onClick={() => setActiveTab('classrooms')}
              className={`teacher-tab-btn ${activeTab === 'classrooms' ? 'active' : ''}`}
            >
              My Classrooms
            </button>
          </div>

          {activeTab === 'quizzes' && (
            <div className="teacher-quizzes-section">
              <div className="teacher-section-header">
                <h3>My Recent Quizzes</h3>
                <Link to="/teacher/create-quiz" className="btn btn-primary btn-black">
                  + Create Quiz
                </Link>
              </div>

              {quizzes.length > 0 ? (
                <div className="teacher-quizzes-grid">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} className="card teacher-quiz-card">
                      <div className="card-body teacher-card-body">
                        <h4>{quiz.title}</h4>
                        <p>
                          {quiz.description || 'No description'}
                        </p>

                        {/* Quiz Info */}
                        <div className="teacher-quiz-info-row">
                          <div className="teacher-info-item">
                            <span className="icon-gray" title="Time Limit">⏱</span>
                            <span>{quiz.time_limit} min</span>
                          </div>
                          <div className="teacher-info-item">
                            <HelpCircle size={16} strokeWidth={2} className="icon-gray" />
                            <span>{quiz.question_count} Qs</span>
                          </div>
                          <div className="teacher-info-item">
                            <Users size={16} strokeWidth={2} className="icon-gray" />
                            <span>{quiz.attempt_count} attempts</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="teacher-quiz-actions">
                          <Link to={`/teacher/quiz/${quiz.id}/questions`} className="btn btn-sm btn-black">
                            <Plus size={16} strokeWidth={2} />
                            Add Q
                          </Link>
                          <Link to={`/teacher/quiz/${quiz.id}`} className="btn btn-sm btn-gray-toggle">
                            <Edit2 size={16} strokeWidth={2} />
                            Edit
                          </Link>
                          <Link to={`/teacher/quiz/${quiz.id}/results`} className="btn btn-sm btn-gray-toggle">
                            <BarChart3 size={16} strokeWidth={2} />
                            Results
                          </Link>
                          <button
                            onClick={() => handleDelete(quiz.id)}
                            className="btn btn-danger btn-sm btn-delete"
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <div style={{ marginBottom: '1rem' }}>
                        <BookOpen size={48} strokeWidth={1.5} style={{ color: '#ccc' }} />
                      </div>
                      <div className="empty-state-text" style={{ marginBottom: '1rem' }}>No quizzes yet</div>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Create your first quiz to get started with the Quiz System
                      </p>
                      <Link to="/teacher/create-quiz" className="btn btn-primary">
                        Create Your First Quiz
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'classrooms' && (
            <div className="teacher-quizzes-section">
              <div className="teacher-section-header">
                <h3>My Classrooms</h3>
                <button
                  onClick={() => setShowClassModal(true)}
                  className="btn btn-primary btn-black"
                >
                  + Create Classroom
                </button>
              </div>

              {classrooms.length > 0 ? (
                <div className="teacher-classrooms-grid">
                  {classrooms.map((cls) => (
                    <div key={cls.id} className="card classroom-card">
                      <div className="classroom-card-banner">
                        <h4>{cls.name}</h4>
                        <span className="classroom-card-code">Code: {cls.code}</span>
                      </div>
                      <div className="card-body">
                        <p className="classroom-desc">
                          {cls.description || 'No description provided.'}
                        </p>
                        <div className="classroom-stats-row">
                          <div className="classroom-stat-item">
                            <span className="val">{cls.student_count}</span>
                            <span className="lbl">Students</span>
                          </div>
                          <div className="classroom-stat-item">
                            <span className="val">{cls.quiz_count}</span>
                            <span className="lbl">Quizzes</span>
                          </div>
                        </div>
                        <div className="classroom-card-actions">
                          <Link
                            to={`/teacher/classroom/${cls.id}`}
                            className="btn btn-sm btn-black w-100 text-center"
                            style={{ textDecoration: 'none' }}
                          >
                            Manage Classroom
                          </Link>
                          <button
                            onClick={() => handleDeleteClassroom(cls.id)}
                            className="btn btn-danger btn-sm btn-delete-cls"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <div style={{ marginBottom: '1rem' }}>
                        <Users size={48} strokeWidth={1.5} style={{ color: '#ccc' }} />
                      </div>
                      <div className="empty-state-text" style={{ marginBottom: '1rem' }}>No classrooms yet</div>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Create a classroom to share quiz assignments with your students.
                      </p>
                      <button
                        onClick={() => setShowClassModal(true)}
                        className="btn btn-primary"
                      >
                        Create Classroom
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Classroom Modal */}
      {showClassModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Classroom</h3>
              <button className="btn-close" onClick={() => setShowClassModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateClassroom}>
              <div className="modal-body">
                {classError && <div className="alert alert-error">{classError}</div>}
                <div className="form-group mb-3">
                  <label className="form-label">Classroom Name *</label>
                  <input
                    type="text"
                    className="manage-questions-input"
                    placeholder="e.g. Science - Grade 10"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="manage-questions-textarea"
                    rows="3"
                    placeholder="e.g. Syllabus and announcements for Grade 10 Science."
                    value={newClassDesc}
                    onChange={(e) => setNewClassDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowClassModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-black"
                  disabled={creatingClass}
                >
                  {creatingClass ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
