import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { classroomAPI, quizAPI } from '../../shared/services/api';
import { ArrowLeft, Copy, Check, BookOpen, Users, Trash2, Plus, X, Award } from 'lucide-react';
import '../styles/ClassroomDetails.scss';

export default function TeacherClassroomDetails() {
  const { classroomId } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [students, setStudents] = useState([]);
  const [teacherQuizzes, setTeacherQuizzes] = useState([]); // All quizzes by teacher
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('quizzes');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadClassroomDetails();
    loadTeacherQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  const loadClassroomDetails = async () => {
    try {
      setLoading(true);
      const res = await classroomAPI.getClassroom(classroomId);
      setClassroom(res.data.data.classroom);
      setQuizzes(res.data.data.quizzes);
      setStudents(res.data.data.students);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load classroom details');
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherQuizzes = async () => {
    try {
      const res = await quizAPI.getTeacherQuizzes();
      setTeacherQuizzes(res.data.data);
    } catch (err) {
      console.error('Failed to load teacher quizzes:', err);
    }
  };

  const handleCopyCode = () => {
    if (!classroom) return;
    navigator.clipboard.writeText(classroom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAssignQuiz = async (quizId) => {
    setAssigning(true);
    setError('');
    setSuccess('');
    try {
      await classroomAPI.assignQuiz(classroomId, quizId);
      setSuccess('Quiz assigned successfully!');
      setShowAssignModal(false);
      loadClassroomDetails();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign quiz');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to unassign this quiz?')) return;
    setError('');
    setSuccess('');
    try {
      await classroomAPI.unassignQuiz(classroomId, quizId);
      setSuccess('Quiz unassigned successfully!');
      loadClassroomDetails();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unassign quiz');
    }
  };

  const handleDeenrollStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName} from this classroom? All their classroom performance analytics will be unlinked.`)) return;
    setError('');
    setSuccess('');
    try {
      await classroomAPI.removeStudent(classroomId, studentId);
      setSuccess(`Successfully removed ${studentName} from the classroom.`);
      loadClassroomDetails();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to remove ${studentName}`);
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

  // Get quizzes that are NOT already assigned to this classroom
  const unassignedQuizzes = teacherQuizzes.filter(
    (tq) => !quizzes.some((q) => q.id === tq.id)
  );

  return (
    <main className="classroom-details-main">
      <div className="container">
        {/* Back Link */}
        <Link to="/teacher" className="btn-back">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {classroom && (
          <>
            {/* Header Banner */}
            <div className="classroom-banner">
              <div className="banner-content">
                <h1>{classroom.name}</h1>
                <p>{classroom.description || 'No description provided.'}</p>
                <div className="classroom-meta-row">
                  <div className="meta-item">
                    <Users size={16} />
                    <span>{students.length} Students</span>
                  </div>
                  <div className="meta-item">
                    <BookOpen size={16} />
                    <span>{quizzes.length} Quizzes</span>
                  </div>
                </div>
              </div>
              <div className="banner-code-box">
                <span className="code-label">Classroom Join Code</span>
                <div className="code-display" onClick={handleCopyCode}>
                  <span className="code-value">{classroom.code}</span>
                  <button className="btn-copy" aria-label="Copy code">
                    {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                  </button>
                </div>
                {copied && <span className="copy-tooltip">Copied to clipboard!</span>}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="classroom-tabs">
              <button
                className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
                onClick={() => setActiveTab('quizzes')}
              >
                <BookOpen size={18} />
                Quizzes ({quizzes.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                <Users size={18} />
                Students & Performance ({students.length})
              </button>
            </div>

            {/* Quizzes Tab Content */}
            {activeTab === 'quizzes' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Assigned Quizzes</h2>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="btn btn-primary btn-black d-flex align-items-center gap-1"
                  >
                    <Plus size={16} />
                    Assign Quiz
                  </button>
                </div>

                {quizzes.length > 0 ? (
                  <div className="quizzes-grid-compact">
                    {quizzes.map((quiz) => (
                      <div key={quiz.id} className="card quiz-assignment-card">
                        <div className="card-body">
                          <div className="quiz-card-header">
                            <h4>{quiz.title}</h4>
                            <span className={`status-badge ${quiz.status}`}>
                              {quiz.status?.toUpperCase()}
                            </span>
                          </div>
                          <p className="quiz-desc">{quiz.description || 'No description'}</p>
                          <div className="quiz-stats-row">
                            <span>⏱ {quiz.time_limit} min</span>
                            <span>📖 {quiz.question_count} Questions</span>
                            <span>👥 {quiz.attempt_count} Attempts</span>
                          </div>
                          <div className="quiz-card-actions">
                            <Link
                              to={`/teacher/quiz/${quiz.id}/results`}
                              className="btn btn-sm btn-outline"
                            >
                              <Award size={14} />
                              Results
                            </Link>
                            <button
                              onClick={() => handleUnassignQuiz(quiz.id)}
                              className="btn btn-sm btn-danger-outline"
                            >
                              <Trash2 size={14} />
                              Unassign
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card empty-state-card">
                    <div className="card-body text-center py-5">
                      <BookOpen size={48} className="text-muted mb-3" />
                      <h3>No Quizzes Assigned</h3>
                      <p>Assign quizzes created by you to make them available for students in this class.</p>
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="btn btn-primary mt-3"
                      >
                        Assign Your First Quiz
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Students Tab Content */}
            {activeTab === 'students' && (
              <div className="tab-content">
                <div className="section-header">
                  <h2>Student Enrolment & Performance</h2>
                </div>

                {students.length > 0 ? (
                  <div className="table-responsive">
                    <table className="classroom-students-table">
                      <thead>
                        <tr>
                          <th>Student Details</th>
                          <th>Joined Date</th>
                          {quizzes.map((q) => (
                            <th key={q.id} className="text-center quiz-column-header">
                              <span title={q.title}>{q.title}</span>
                            </th>
                          ))}
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(({ student, attempts }) => (
                          <tr key={student.id}>
                            <td>
                              <div className="student-profile-cell">
                                <div className="student-avatar">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="student-info">
                                  <div className="name">{student.name}</div>
                                  <div className="email">@{student.username} · {student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>{new Date(student.joined_at).toLocaleDateString()}</td>
                            {quizzes.map((q) => {
                              const attempt = attempts.find((a) => a.quiz_id === q.id);
                              if (!attempt) {
                                return (
                                  <td key={q.id} className="text-center text-muted score-cell">
                                    -
                                  </td>
                                );
                              }
                              return (
                                <td key={q.id} className="text-center score-cell">
                                  <div className="score-badge-wrapper">
                                    <span className={`score-badge ${attempt.percentage >= 75 ? 'high' : attempt.percentage >= 50 ? 'medium' : 'low'}`}>
                                      {attempt.total_score}/{attempt.max_score} ({Math.round(attempt.percentage)}%)
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="text-center">
                              <button
                                onClick={() => handleDeenrollStudent(student.id, student.name)}
                                className="btn btn-sm btn-danger-outline d-inline-flex align-items-center gap-1"
                                title="Remove student from class"
                                style={{ padding: '0.35rem 0.65rem' }}
                              >
                                <Trash2 size={12} />
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="card empty-state-card">
                    <div className="card-body text-center py-5">
                      <Users size={48} className="text-muted mb-3" />
                      <h3>No Students Enrolled Yet</h3>
                      <p>Share your Classroom Join Code <strong>{classroom.code}</strong> with your students so they can join.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Assign Quiz Modal Overlay */}
            {showAssignModal && (
              <div className="modal-backdrop">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3>Assign Quiz to Classroom</h3>
                    <button className="btn-close" onClick={() => setShowAssignModal(false)}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="modal-body">
                    {unassignedQuizzes.length > 0 ? (
                      <div className="modal-quiz-list">
                        {unassignedQuizzes.map((quiz) => (
                          <div key={quiz.id} className="modal-quiz-row">
                            <div className="row-info">
                              <h5>{quiz.title}</h5>
                              <p>⏱ {quiz.time_limit} min · {quiz.question_count} Qs · {quiz.status}</p>
                            </div>
                            <button
                              disabled={assigning}
                              onClick={() => handleAssignQuiz(quiz.id)}
                              className="btn btn-sm btn-black"
                            >
                              Assign
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted">All your quizzes are already assigned or you haven't created any quizzes yet.</p>
                        <Link to="/teacher/create-quiz" className="btn btn-primary mt-2">
                          Create New Quiz
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
