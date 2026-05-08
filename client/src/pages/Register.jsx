import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import useShakeValidation from '../hooks/useShakeValidation';

export default function Register() {
  const OTP_LENGTH = 6;
  const OTP_RESEND_SECONDS = 120;
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: '' });
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpTouched, setOtpTouched] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [autoSubmitLocked, setAutoSubmitLocked] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const otpInputRef = useRef(null);
  const {
    fieldErrors,
    setFieldErrors,
    validateRequired,
    clearFieldError,
    isShaking,
    triggerShake,
  } = useShakeValidation(300);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isOtpComplete = otpDigits.every((digit) => digit.length === 1);
  const otpValue = otpDigits.join('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const formatCooldown = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpRequested && !validateRequired(formData, {
      name: 'Full name is required.',
      email: 'Email is required.',
      password: 'Password is required.',
      role: 'Please select a role.',
    })) {
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (!otpRequested) {
        await authAPI.requestOtp({ email: formData.email, purpose: 'register' });
        setOtpRequested(true);
        setResendCooldown(OTP_RESEND_SECONDS);
        setMessage('OTP sent to your email. Enter the code to finish registration.');
        setOtpError(false);
        setOtpTouched(false);
        setAutoSubmitLocked(false);
      } else {
        if (!isOtpComplete) {
          setOtpError(true);
          setOtpTouched(true);
          setFieldErrors((prev) => ({ ...prev, otp: 'Please enter the 6-digit OTP.' }));
          triggerShake();
          return;
        }
        const response = await authAPI.verifyOtp({
          ...formData,
          otp: otpValue,
          purpose: 'register',
        });
        const { token, user } = response.data;
        login(token, user);
        navigate(user.role === 'teacher' ? '/teacher' : '/student');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await authAPI.requestOtp({ email: formData.email, purpose: 'register' });
      setOtpRequested(true);
      setResendCooldown(OTP_RESEND_SECONDS);
      setMessage('OTP resent to your email.');
      setOtpError(false);
      setOtpTouched(false);
      setAutoSubmitLocked(false);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to send OTP';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInputChange = (event) => {
    const rawValue = event.target.value;
    const cleaned = rawValue.replace(/\D/g, '').slice(0, OTP_LENGTH);
    const nextDigits = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < cleaned.length; i += 1) {
      nextDigits[i] = cleaned[i];
    }
    if (autoSubmitLocked) {
      setAutoSubmitLocked(false);
    }
    setOtpDigits(nextDigits);
    if (/\D/.test(rawValue)) {
      setFieldErrors((prev) => ({ ...prev, otp: 'Only numbers are allowed in the OTP.' }));
      triggerShake();
    } else {
      setFieldErrors((prev) => ({ ...prev, otp: '' }));
    }
  };

  const handleOtpFocus = () => {
    if (!otpTouched) {
      setOtpTouched(true);
    }
  };

  useEffect(() => {
    if (otpRequested) {
      otpInputRef.current?.focus();
    }
  }, [otpRequested]);

  useEffect(() => {
    if (!otpRequested || resendCooldown <= 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpRequested, resendCooldown]);

  useEffect(() => {
    if (otpRequested && isOtpComplete && !loading && !autoSubmitLocked) {
      setError('');
      setOtpError(false);
      setAutoSubmitLocked(true);
      handleSubmit({ preventDefault: () => {} });
    }
  }, [otpRequested, isOtpComplete, loading, autoSubmitLocked]);

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
      <div className="register-shell">

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
        {message && <Alert type="info" message={message} onClose={() => setMessage('')} />}

        <form onSubmit={handleSubmit} className="register-form" noValidate>

              {/* Full Name */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  aria-required="true"
                  className="auth-input"
                  style={inputStyle}
                />
                {fieldErrors.name && (
                  <p className="field-error">{fieldErrors.name}</p>
                )}
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
                  aria-required="true"
                  className="auth-input"
                  style={inputStyle}
                />
                {fieldErrors.email && (
                  <p className="field-error">{fieldErrors.email}</p>
                )}
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
                    aria-required="true"
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
                {fieldErrors.password && (
                  <p className="field-error">{fieldErrors.password}</p>
                )}
              </div>

              {/* Role */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>I am a...</label>
                <div className="role-options">
                  <button
                    type="button"
                    className={`role-card ${formData.role === 'teacher' ? 'is-selected' : ''}`}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, role: 'teacher' }));
                      clearFieldError('role');
                    }}
                    aria-pressed={formData.role === 'teacher'}
                  >
                    Teacher
                    {formData.role === 'teacher' && (
                      <span className="role-check" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={`role-card ${formData.role === 'student' ? 'is-selected' : ''}`}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, role: 'student' }));
                      clearFieldError('role');
                    }}
                    aria-pressed={formData.role === 'student'}
                  >
                    Student
                    {formData.role === 'student' && (
                      <span className="role-check" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
                {fieldErrors.role && (
                  <p className="field-error">{fieldErrors.role}</p>
                )}
              </div>

              {/* Submit */}
              {!otpRequested && (
                <button
                  type="submit"
                  className={`hover-black-btn ${isShaking ? 'btn-shake' : ''}`}
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
                  {loading ? 'Sending OTP...' : 'Continue'}
                </button>
              )}

              {otpRequested && (
                <div className="otp-panel">
                  <div className="otp-header">
                    <h2 className="otp-title">Email Verification</h2>
                    <p className="otp-subtitle">Enter the 6-digit code sent to {formData.email || 'your email'}.</p>
                  </div>

                  <div style={{ marginBottom: '1.2rem' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otpValue}
                      onChange={handleOtpInputChange}
                      onFocus={handleOtpFocus}
                      ref={otpInputRef}
                      className="auth-input"
                      style={inputStyle}
                      placeholder="Enter 6-digit OTP"
                      aria-label="OTP code"
                    />
                    {fieldErrors.otp && (
                      <p className="field-error">{fieldErrors.otp}</p>
                    )}
                  </div>

                  <div className="otp-actions">
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={loading || resendCooldown > 0}
                      className="otp-link"
                    >
                      {resendCooldown > 0
                        ? `Resend OTP in ${formatCooldown(resendCooldown)}`
                        : 'Resend OTP'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className={`hover-black-btn ${isShaking ? 'btn-shake' : ''}`}
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
                    {loading ? 'Verifying...' : 'Verify OTP & Create Account'}
                  </button>
                </div>
              )}
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
