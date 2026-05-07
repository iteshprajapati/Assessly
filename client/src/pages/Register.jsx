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
    fontSize: '0.95rem',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontWeight: '600',
    fontSize: '0.9rem',
    color: '#111827',
    marginBottom: '0.45rem',
  };

  return (
    <main style={{ flex: 1, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', padding: '2rem 1.5rem' }}>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 1.1rem',
            background: 'linear-gradient(135deg, #7c6ff7, #6366f1)',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.8rem',
            boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
          }}>
            👤
          </div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: '700', color: '#111827', marginBottom: '0.3rem' }}>
            Create Account
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
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
                appearance: 'auto',
                WebkitAppearance: 'auto',
                MozAppearance: 'auto',
                cursor: 'pointer',
                color: formData.role ? '#111827' : '#9ca3af',
                paddingRight: '2rem',
              }}
            >
              <option value="" disabled>Select your role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.8rem',
              background: loading ? '#374151' : '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
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
