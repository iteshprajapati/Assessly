import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../../shared/services/api';
import { useAuth } from '../../auth/context/AuthContext';
import '../styles/AdminDashboard.scss';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, teachers: 0, students: 0 });
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadUsers();
  }, [filterRole, filterStatus, search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers({ role: filterRole, status: filterStatus, search });
      const userData = response.data.data;
      setUsers(userData);

      // Calculate stats
      const totalUsers = userData.length;
      const activeUsers = userData.filter((u) => u.status === 'active').length;
      const teachers = userData.filter((u) => u.role === 'teacher').length;
      const students = userData.filter((u) => u.role === 'student').length;

      setStats({ totalUsers, activeUsers, teachers, students });
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await userAPI.updateUserStatus(userId, { status: newStatus });
      loadUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userAPI.deleteUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  if (loading && users.length === 0) {
    return (
      <main className="admin-main">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-main">
      <div className="container">
        <div className="admin-wrapper">
          <div className="admin-header">
            <h1>Admin Dashboard</h1>
            <p>Manage all users and monitor system activity</p>
          </div>

          {/* Stats */}
          <div className="row mb-4">
            <div className="col-3">
              <div className="stat-card">
                <div className="stat-icon dark">U</div>
                <div>
                  <div className="stat-value">{stats.totalUsers}</div>
                  <div className="stat-label">Total Users</div>
                </div>
              </div>
            </div>
            <div className="col-3">
              <div className="stat-card">
                <div className="stat-icon green">✓</div>
                <div>
                  <div className="stat-value">{stats.activeUsers}</div>
                  <div className="stat-label">Active Users</div>
                </div>
              </div>
            </div>
            <div className="col-3">
              <div className="stat-card">
                <div className="stat-icon blue">T</div>
                <div>
                  <div className="stat-value">{stats.teachers}</div>
                  <div className="stat-label">Teachers</div>
                </div>
              </div>
            </div>
            <div className="col-3">
              <div className="stat-card">
                <div className="stat-icon orange">S</div>
                <div>
                  <div className="stat-value">{stats.students}</div>
                  <div className="stat-label">Students</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <label className="form-label">Search</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="col-3">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div className="col-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card">
            <div className="card-body admin-table-container">
              {users.length > 0 ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userData) => (
                      <tr key={userData.id}>
                        <td>{userData.name}</td>
                        <td>{userData.email}</td>
                        <td>
                          <span className={`role-badge role-${userData.role}`}>{userData.role}</span>
                        </td>
                        <td>
                          <select
                            value={userData.status}
                            onChange={(e) => handleStatusChange(userData.id, e.target.value)}
                            className="form-select status-select"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDelete(userData.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-text">No users found</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
