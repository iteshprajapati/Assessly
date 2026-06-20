import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { classroomAPI } from '../../shared/services/api';
import { ArrowLeft, BookOpen, User, Mail, CheckCircle, Play, LogOut } from 'lucide-react';
import '../styles/ClassroomDetails.scss';

export default function StudentClassroomDetails() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    loadClassroomDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  const loadClassroomDetails = async () => {
    try {
      setLoading(true);
      const res = await classroomAPI.getClassroom(classroomId);
      setClassroom(res.data.data.classroom);
      setQuizzes(res.data.data.quizzes);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load classroom details');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClassroom = async () => {
    if (!window.confirm('Are you sure you want to leave this classroom? You will lose access to all its assigned quizzes.')) {
      return;
    }

    setLeaving(true);
    setError('');
    try {
      await classroomAPI.leaveClassroom(classroomId);
      navigate('/student', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to leave classroom');
      setLeaving(false);
    }
  };

  if (loading && !classroom) {
    return (
      <main className="classroom-details-main">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !classroom) {
    return (
      <main className="classroom-details-main">
        <div className="container">
          <Link to="/student" className="btn-back">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="alert alert-error mt-3">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="classroom-details-main">
      <div className="container">
        {/* Back Link */}
        <Link to="/student" className="btn-back">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        {classroom && (
          <>
            {/* Header Banner */}
            <div className="classroom-banner student">
              <div className="banner-content">
                <h1>{classroom.name}</h1>
                <p>{classroom.description || 'No description provided.'}</p>
                <div className="classroom-meta-row">
                  <div className="meta-item">
                    <User size={16} />
                    <span>Teacher: <strong>{classroom.teacher_name}</strong></span>
                  </div>
                  <div className="meta-item">
                    <Mail size={16} />
                    <span>{classroom.teacher_email}</span>
                  </div>
                </div>
              </div>
              <div className="banner-actions">
                <button
                  onClick={handleLeaveClassroom}
                  className="btn btn-sm btn-danger-outline d-inline-flex align-items-center gap-1"
                  disabled={leaving}
                >
                  <LogOut size={14} />
                  {leaving ? 'Leaving...' : 'Leave Class'}
                </button>
              </div>
            </div>

            {/* Quizzes Section */}
            <div className="classroom-section-header mt-4">
              <h2>Quizzes in this Classroom</h2>
            </div>

            {quizzes.length > 0 ? (
              <div className="quizzes-grid-compact">
                {quizzes.map((quiz) => {
                  const isSubmitted = quiz.attempt_status === 'submitted';
                  const isInProgress = quiz.attempt_status === 'in_progress';
                  const badgeColor = quiz.percentage >= 75 ? 'high' : quiz.percentage >= 50 ? 'medium' : 'low';

                  return (
                    <div key={quiz.id} className={`card quiz-assignment-card ${isSubmitted ? 'submitted' : ''}`}>
                      <div className="card-body">
                        <div className="quiz-card-header">
                          <h4>{quiz.title}</h4>
                          {isSubmitted ? (
                            <span className="status-badge submitted d-flex align-items-center gap-1">
                              <CheckCircle size={12} />
                              Completed
                            </span>
                          ) : isInProgress ? (
                            <span className="status-badge in-progress">
                              In Progress
                            </span>
                          ) : (
                            <span className="status-badge available">
                              Available
                            </span>
                          )}
                        </div>
                        <p className="quiz-desc">{quiz.description || 'No description provided'}</p>
                        
                        <div className="quiz-stats-row">
                          <span>⏱ {quiz.time_limit} min</span>
                          <span>📖 {quiz.question_count} Questions</span>
                        </div>

                        <div className="quiz-card-footer-row mt-3">
                          {isSubmitted ? (
                            <div className="quiz-result-score-preview">
                              <span className={`score-badge ${badgeColor}`}>
                                Score: {quiz.total_score}/{quiz.max_score} ({Math.round(quiz.percentage)}%)
                              </span>
                              <Link
                                to={`/student/result/${quiz.result_id}`}
                                className="btn btn-sm btn-black d-flex align-items-center gap-1"
                              >
                                View Details
                              </Link>
                            </div>
                          ) : (
                            <Link
                              to={`/student/attempt/${quiz.id}`}
                              className="btn btn-sm btn-black w-100 d-flex align-items-center justify-content-center gap-1"
                            >
                              <Play size={14} fill="currentColor" />
                              {isInProgress ? 'Resume Attempt' : 'Attempt Quiz'}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card empty-state-card">
                <div className="card-body text-center py-5">
                  <BookOpen size={48} className="text-muted mb-3" />
                  <h3>No Quizzes Available</h3>
                  <p>Your teacher hasn't assigned any quizzes to this classroom yet.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
