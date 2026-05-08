import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function FeatureCard({ iconPath, iconBg, iconColor, title, description }) {
  return (
    <div style={{
      background: '#fff',
      border: 'none',
      borderRadius: '16px',
      padding: '2.25rem 1.75rem',
      textAlign: 'center',
      flex: '1 1 0',
      minWidth: '220px',
    }}>
      <div style={{
        width: '52px',
        height: '52px',
        background: iconBg,
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.25rem',
        color: iconColor,
      }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath} />
        </svg>
      </div>
      <h3 style={{
        fontSize: '1rem',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '0.6rem',
        letterSpacing: '-0.02em',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '0.85rem',
        color: '#6b7280',
        margin: 0,
        lineHeight: '1.65',
      }}>
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  const { isLoggedIn, user } = useAuth();

  const dashboardPath =
    user?.role === 'admin' ? '/admin' :
    user?.role === 'teacher' ? '/teacher' : '/student';

  return (
    <main style={{ flex: 1, background: '#f0f2f5' }}>
      <div className="home-shell">

        {/* ── Hero Card ── */}
        <div className="home-hero" style={{
          background: '#fff',
          border: 'none',
          borderRadius: '20px',
          padding: '4rem 3rem',
          textAlign: 'center',
          marginBottom: '1.75rem',
        }}>
          <div className="home-floats" aria-hidden="true">
            <img className="home-float home-float--countdown" src="/countdown.png" alt="" />
            <img className="home-float home-float--question" src="/poll.png" alt="" />
            <img className="home-float home-float--quiz" src="/question.png" alt="" />
            <img className="home-float home-float--tag" src="/questionsTag.png" alt="" />
          </div>
          <img 
            src="/logo.png" 
            alt="QuizPortal Logo" 
            style={{ width: '80px', height: 'auto', margin: '0 auto 1.25rem', display: 'block', borderRadius: '14px' }} 
          />

          <h1 style={{
            fontSize: '2.4rem',
            fontWeight: '800',
            color: '#111827',
            marginBottom: '0.75rem',
            letterSpacing: '-0.03em',
          }}>
            QuizPortal
          </h1>

          <p style={{
            fontSize: '1rem',
            color: '#6b7280',
            lineHeight: '1.7',
            maxWidth: '480px',
            margin: '0 auto 2.25rem',
          }}>
            A modern platform for creating, managing, and attempting online quizzes.<br />
            Built for educators &amp; students.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isLoggedIn() ? (
              <Link to={dashboardPath} style={{
                padding: '0.72rem 2rem',
                background: '#111827',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.95rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" style={{
                  padding: '0.72rem 2rem',
                  background: '#111827',
                  color: '#fff',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}>
                  Login
                </Link>
                <Link to="/register" style={{
                  padding: '0.72rem 2rem',
                  background: '#fff',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── Features Row ── */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          <FeatureCard
            iconPath="M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
            iconBg="#eff6ff"
            iconColor="#2563eb"
            title="Create Quizzes"
            description="Teachers build timed MCQ quizzes with full question management in minutes."
          />
          <FeatureCard
            iconPath="M12 6v6l4 2"
            iconBg="#f0fdf4"
            iconColor="#16a34a"
            title="Timed Exams"
            description="Students attempt quizzes with live countdown timers and auto-submit on expiry."
          />
          <FeatureCard
            iconPath="M4 12l5 5L20 6"
            iconBg="#faf5ff"
            iconColor="#7c3aed"
            title="Instant Results"
            description="Auto-evaluated scores with detailed color-coded answer reviews."
          />
        </div>

      </div>
    </main>
  );
}
