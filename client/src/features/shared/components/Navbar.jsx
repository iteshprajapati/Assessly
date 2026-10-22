import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="container d-flex justify-content-between align-items-center">
        <Link to="/" className="d-flex align-items-center gap-2" style={{ textDecoration: 'none' }}>
          <img src="/logo.png" alt="QuizFlow Logo" className="navbar-logo" />
          <span className="brand-name">QuizFlow</span>
        </Link>

        <div className="d-flex gap-2">
          {isLoggedIn() ? (
            <div className="profile-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
              <button 
                onClick={toggleDropdown} 
                className="profile-icon-btn" 
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  backgroundColor: '#f3f4f6',
                  color: '#111827',
                  transition: 'background-color 0.2s',
                }}
                aria-label="User Profile"
              >
                <span style={{ fontSize: '1rem', fontWeight: '700' }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </button>

              {dropdownOpen && (
                <div 
                  className="profile-dropdown-menu" 
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '46px',
                    width: '240px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    zIndex: 1000,
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
                    <span style={{ fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>{user?.name}</span>
                    {user?.username && (
                      <span style={{ color: '#6b7280', fontSize: '0.825rem', marginTop: '0.15rem' }}>@{user.username}</span>
                    )}
                    <span className="role-badge" style={{ alignSelf: 'flex-start', marginTop: '0.4rem', fontSize: '0.65rem' }}>
                      {user?.role}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="btn btn-danger btn-sm" 
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.5rem',
                      fontWeight: '600'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
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
