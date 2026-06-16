import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container d-flex justify-content-between align-items-center">
        <Link to="/" className="d-flex align-items-center gap-2" style={{ textDecoration: 'none' }}>
          <img src="/logo.png" alt="QuizPortal Logo" className="navbar-logo" />
          <span className="brand-name">QuizPortal</span>
        </Link>

        <div className="d-flex gap-2">
          {isLoggedIn() ? (
            <>
              <span className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="fw-600">
                  {user?.name} 
                  {user?.username && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal', marginLeft: '0.35rem' }}>
                      @{user?.username}
                    </span>
                  )}
                </span>
                <span className="role-badge" style={{ marginLeft: '0.25rem' }}>
                  {user?.role}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover-white-btn" style={{
                padding: '0.35rem 0.9rem',
                background: '#fff',
                color: '#111827',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '0.85rem',
                textDecoration: 'none',
              }}>
                Login
              </Link>
              <Link to="/register" className="hover-black-btn" style={{
                padding: '0.35rem 0.9rem',
                background: '#111827',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.85rem',
                textDecoration: 'none',
              }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
