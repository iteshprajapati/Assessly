import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../shared/services/api';
import { useAuth } from '../context/AuthContext';
import Alert from '../../shared/components/Alert';
import useShakeValidation from '../hooks/useShakeValidation';
import '../styles/Login.scss';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    fieldErrors,
    validateRequired,
    clearFieldError,
    isShaking,
  } = useShakeValidation(300);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateRequired(formData, {
      email: 'Email or Username is required.',
      password: 'Password is required.',
    })) {
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.login(formData);
      const { token, user } = response.data;
      login(token, user);
      navigate(user.role === 'admin' ? '/admin' : user.role === 'teacher' ? `/teacher/${user.username}` : '/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-main">
      <div className="login-container">

        {/* Icon */}
        <div className="login-header">
          <img 
            src="/logo.png" 
            alt="QuizPortal Logo" 
            className="login-logo"
          />
          <h1 className="login-title">
            Welcome back
          </h1>
          <p className="login-subtitle">
            Sign in to your QuizPortal account
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {/* Email or Username */}
          <div className="login-form-group">
            <label className="login-label">
              Email or Username
            </label>
            <input
              type="text"
              name="email"
              className="login-input auth-input"
              placeholder="you@example.com or username"
              value={formData.email}
              onChange={handleChange}
              aria-required="true"
            />
            {fieldErrors.email && (
              <p className="field-error">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="login-form-group password-group">
            <label className="login-label">
              Password
            </label>
            <div className="login-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="login-input-password auth-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="login-eye-button"
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
            {fieldErrors.password && (
              <p className="field-error">{fieldErrors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`login-submit-btn ${isShaking ? 'btn-shake' : ''}`}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <hr className="login-divider" />

        {/* Footer */}
        <p className="login-footer-text">
          Don't have an account?{' '}
          <Link to="/register" className="login-register-link">
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
}
