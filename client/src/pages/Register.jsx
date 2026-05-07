import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) {
      setError('Please select your role.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.register(formData);
      const { token, user } = response.data;
      login(token, user);
      navigate(user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* Shared input style */
  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: '#f3f4f6',
    border: '1px solid transparent',
    borderRadius: '10px',
    fontSize: '0.9rem',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontWeight: '600',
    fontSize: '0.85rem',
    color: '#111827',
    marginBottom: '0.45rem',
  };

  return (
    <main style={{ flex: 1, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '500px', padding: '2.5rem 2rem' }}>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <img 
            src="/logo.png" 
            alt="QuizPortal Logo" 
            style={{ width: '100px', height: 'auto', margin: '0 auto 1.25rem', display: 'block', borderRadius: '12px' }} 
          />
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
            Create Account
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
            Join QuizPortal as a Teacher or Student
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>

          {/* Full Name */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
              className="auth-input"
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="auth-input"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Min. 6 chars (letters + numbers)"
                value={formData.password}
                onChange={handleChange}
                required
                className="auth-input"
                style={{ ...inputStyle, padding: '0.75rem 2.8rem 0.75rem 1rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: '#9ca3af',
                }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.4rem', marginBottom: 0 }}>
              At least 6 characters with letters and numbers.
            </p>
          </div>

          {/* Role */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>I am a...</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="auth-input"
              style={{
                ...inputStyle,
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                cursor: 'pointer',
                color: formData.role ? '#111827' : '#9ca3af',
                paddingRight: '2.5rem',
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1em',
              }}
            >
              <option value="" disabled style={{ color: '#9ca3af' }}>Select your role</option>
              <option value="student" style={{ color: '#111827' }}>Student</option>
              <option value="teacher" style={{ color: '#111827' }}>Teacher</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="hover-black-btn"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? '#374151' : '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Creating account...' : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#111827', fontWeight: '700', textDecoration: 'none' }}>
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}
