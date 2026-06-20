import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resultAPI, classroomAPI } from '../../shared/services/api';
import { BookOpen } from 'lucide-react';
import '../styles/StudentDashboard.scss';

export default function StudentDashboard() {
  const [classrooms, setClassrooms] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('available');
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classroomsRes, resultsRes, quizzesRes] = await Promise.all([
        classroomAPI.getClassrooms(),
        resultAPI.getStudentResults(),
        classroomAPI.getAssignedQuizzes(),
      ]);
      setClassrooms(classroomsRes.data.data);
      setResults(resultsRes.data.data);
      setQuizzes(quizzesRes.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClassroom = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError('');
    setJoinSuccess('');
    try {
      await classroomAPI.joinClassroom(joinCode);
      setJoinSuccess('Successfully joined the classroom!');
      setJoinCode('');
      // Dismiss success alert after 4 seconds
      setTimeout(() => setJoinSuccess(''), 4000);
      loadData();
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Failed to join classroom');
    } finally {
      setJoining(false);
    }
  };

  if (loading && classrooms.length === 0) {
    return (
      <main className="student-main">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="student-main">
      <div className="container">
        <div className="student-wrapper">
          <div className="student-header">
            <h1>Student Dashboard</h1>
            <p>Attempt quizzes and track your progress</p>
          </div>

          {/* Tabs */}
          <div className="student-tabs">
            <button
              onClick={() => setTab('available')}
              className={`student-tab-btn ${tab === 'available' ? 'active' : ''}`}
            >
              Available Quizzes
            </button>
            <button
              onClick={() => setTab('classrooms')}
              className={`student-tab-btn ${tab === 'classrooms' ? 'active' : ''}`}
            >
              Classrooms
            </button>
            <button
              onClick={() => setTab('results')}
              className={`student-tab-btn ${tab === 'results' ? 'active' : ''}`}
            >
              My Results
            </button>
          </div>

          {/* Available Quizzes Tab */}
          {tab === 'available' && (
            <div>
              {quizzes.length > 0 ? (
                <div className="quizzes-grid-compact">
                  {quizzes.map((quiz) => {
                    const isSubmitted = quiz.attempt_status === 'submitted';
                    const isInProgress = quiz.attempt_status === 'in_progress';
                    const badgeColor = quiz.percentage >= 75 ? 'high' : quiz.percentage >= 50 ? 'medium' : 'low';

                    return (
                      <div key={quiz.id} className={`card quiz-assignment-card ${isSubmitted ? 'submitted' : ''}`}>
                        <div className="card-body d-flex flex-column justify-content-between h-100">
                          <div>
                            <div className="quiz-card-header">
                              <h4 style={{ margin: 0 }}>{quiz.title}</h4>
                              {isSubmitted ? (
                                <span className="status-badge submitted">Completed</span>
                              ) : isInProgress ? (
                                <span className="status-badge in-progress">In Progress</span>
                              ) : (
                                <span className="status-badge available">Available</span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', display: 'block', marginBottom: '0.5rem' }}>
                              Classroom: {quiz.classroom_name}
                            </span>
                            <p className="quiz-desc" style={{ marginBottom: '1rem' }}>
                              {quiz.description || 'No description provided.'}
                            </p>
                            <div className="quiz-stats-row mb-3">
                              <span>⏱ {quiz.time_limit} min</span>
                              <span>📖 {quiz.question_count} Questions</span>
                            </div>
                          </div>
                          
                          <div className="quiz-card-footer-row" style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
                            {isSubmitted ? (
                              <div className="quiz-result-score-preview" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <span className={`score-badge ${badgeColor}`} style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                  Score: {quiz.total_score}/{quiz.max_score} ({Math.round(quiz.percentage)}%)
                                </span>
                                <Link
                                  to={`/student/result/${quiz.result_id}`}
                                  className="btn btn-sm btn-black"
                                >
                                  View Details
                                </Link>
                              </div>
                            ) : (
                              <Link
                                  to={`/student/attempt/${quiz.id}`}
                                  className="btn btn-sm btn-black w-100 text-center"
                                >
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
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state text-center py-5">
                      <BookOpen size={48} className="text-muted mb-3" />
                      <h3>No Quizzes Available</h3>
                      <p className="text-muted">You have no quizzes assigned yet. Try joining a classroom using a code.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Classrooms Tab */}
          {tab === 'classrooms' && (
            <div>
              {/* Join Classroom Panel */}
              <div className="card mb-4 join-classroom-card">
                <div className="card-body">
                  <h4>Join a New Classroom</h4>
                  <p className="text-muted">Enter the 6-character code shared by your teacher to join their classroom group.</p>
                  
                  {joinError && <div className="alert alert-error mb-3">{joinError}</div>}
                  {joinSuccess && <div className="alert alert-success mb-3">{joinSuccess}</div>}
                  
                  <form onSubmit={handleJoinClassroom} className="join-classroom-form">
                    <input
                      type="text"
                      className="manage-questions-input join-code-input"
                      placeholder="Class Code (e.g. MATH01)"
                      maxLength={10}
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      required
                    />
                    <button
                      type="submit"
                      disabled={joining}
                      className="btn btn-primary btn-black join-submit-btn"
                    >
                      {joining ? 'Joining...' : 'Join Classroom'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Classrooms List */}
              {classrooms.length > 0 ? (
                <div className="student-classrooms-grid">
                  {classrooms.map((cls) => (
                    <div key={cls.id} className="card student-classroom-card">
                      <div className="classroom-card-banner">
                        <h4>{cls.name}</h4>
                        <span className="teacher-lbl">Teacher: {cls.teacher_name}</span>
                      </div>
                      <div className="card-body d-flex flex-column justify-content-between h-100">
                        <div>
                          <p className="classroom-desc">
                            {cls.description || 'No description provided.'}
                          </p>
                          <div className="classroom-stats-row mb-3">
                            <span>📖 {cls.quiz_count} Quizzes Assigned</span>
                          </div>
                        </div>
                        <Link
                          to={`/student/classroom/${cls.id}`}
                          className="btn btn-sm btn-black text-center w-100"
                          style={{ textDecoration: 'none' }}
                        >
                          Enter Classroom
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <div className="empty-state-text">You haven't joined any classrooms yet.</div>
                      <p className="text-muted">Enter a classroom code above to get started.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {tab === 'results' && (
            <div>
              {results.length > 0 ? (
                <div className="student-results-container">
                  <table className="student-results-table">
                    <thead>
                      <tr>
                        <th>Quiz Title</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => {
                        const badge = result.percentage >= 75 ? 'badge-success' : result.percentage >= 50 ? 'badge-warning' : 'badge-danger';
                        return (
                          <tr key={result.id}>
                            <td>{result.quiz_title}</td>
                            <td>{result.score}/{result.total_questions}</td>
                            <td>
                              <span className={`badge ${badge}`}>{result.percentage}%</span>
                            </td>
                            <td>
                              {new Date(result.submitted_at).toLocaleDateString()}
                            </td>
                            <td>
                              <Link
                                to={`/student/result/${result.id}`}
                                className="btn btn-primary btn-sm"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card">
                  <div className="card-body">
                    <div className="empty-state">
                      <div className="empty-state-text">No results yet. Attempt a quiz to see your results</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
