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

const FAQ_ITEMS = [
  {
    question: "How do I create a new quiz?",
    answer: "Educators can register as a teacher, go to their dashboard, and click the 'Create Quiz' button. You can specify a time limit and easily add multiple-choice questions."
  },
  {
    question: "Can students review their answers after submission?",
    answer: "Yes! As soon as a student submits a quiz, the system automatically grades it and provides a color-coded interface to review which questions were correct, incorrect, or left unattempted."
  },
  {
    question: "What happens if my internet disconnects during a quiz?",
    answer: "QuizPortal has built-in auto-saving. If your connection drops, your completed answers are safe. However, the quiz timer continues on the server and will auto-submit once the time runs out."
  },
  {
    question: "How is quiz duration enforced?",
    answer: "Every quiz features a visible live countdown timer. When the timer hits zero, the system automatically submits the student's attempt immediately, ensuring exam integrity."
  },
  {
    question: "Is there a limit to the number of students who can take a quiz?",
    answer: "No, the platform is designed to scale dynamically and handle dozens of concurrent attempts, making it suitable for both small classrooms and large exam/quiz batches."
  }
];

export default function Home() {
  const { isLoggedIn, user } = useAuth();
  const [activeFaq, setActiveFaq] = React.useState(null);

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

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

        {/* ── FAQ Section ── */}
        <div className="home-faq-section">
          <div className="home-faq-header">
            <h2 className="home-faq-title">Frequently Asked Questions</h2>
            <p className="home-faq-subtitle">Everything you need to know about the QuizPortal platform.</p>
          </div>
          <div className="home-faq-list">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className={`home-faq-item ${isOpen ? 'is-open' : ''}`}>
                  <button 
                    className="home-faq-trigger" 
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="home-faq-question">{faq.question}</span>
                    <span className="home-faq-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </button>
                  <div className="home-faq-answer-wrapper">
                    <div className="home-faq-answer">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </main>
  );
}
