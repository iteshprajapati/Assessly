import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
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
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.login(formData);
      const { token, user } = response.data;
      login(token, user);
      navigate(user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
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
            ❓
          </div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: '700', color: '#111827', marginBottom: '0.3rem' }}>
            Welcome back
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
            Sign in to your QuizPortal account
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          {/* Email */}
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', color: '#111827', marginBottom: '0.45rem' }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              className="auth-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#f3f4f6',
                border: '1px solid transparent',
                borderRadius: '10px',
                fontSize: '0.95rem',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', color: '#111827', marginBottom: '0.45rem' }}>
              Password<span style={{ color: '#ef4444', marginLeft: '2px' }}>•</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="auth-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 2.8rem 0.75rem 1rem',
                  background: '#f3f4f6',
                  border: '1px solid transparent',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
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
                  /* Eye-off */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  /* Eye */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#111827', fontWeight: '700', textDecoration: 'none' }}>
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
}
