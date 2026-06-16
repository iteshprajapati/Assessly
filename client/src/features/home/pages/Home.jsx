import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import '../styles/Home.scss';

function FeatureCard({ iconPath, iconBg, iconColor, title, description }) {
  return (
    <div className="home-feature-card">
      <div 
        className="home-feature-icon-wrapper"
        style={{
          background: iconBg,
          color: iconColor,
        }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath} />
        </svg>
      </div>
      <h3 className="home-feature-title">
        {title}
      </h3>
      <p className="home-feature-desc">
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
    <main className="home-main">
      <div className="home-shell">

        {/* ── Hero Card ── */}
        <div className="home-hero-card">
          <div className="home-floats" aria-hidden="true">
            <img className="home-float home-float--countdown" src="/countdown.png" alt="" />
            <img className="home-float home-float--question" src="/poll.png" alt="" />
            <img className="home-float home-float--quiz" src="/question.png" alt="" />
            <img className="home-float home-float--tag" src="/questionsTag.png" alt="" />
          </div>
          <img 
            src="/logo.png" 
            alt="QuizPortal Logo" 
            className="home-logo"
          />

          <h1 className="home-title">
            QuizPortal
          </h1>

          <p className="home-tagline">
            A modern platform for creating, managing, and attempting online quizzes.<br />
            Built for educators &amp; students.
          </p>

          <div className="home-btn-group">
            {isLoggedIn() ? (
              <Link to={dashboardPath} className="home-btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="home-btn-primary">
                  Login
                </Link>
                <Link to="/register" className="home-btn-secondary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── Features Row ── */}
        <div className="home-features-row">
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
