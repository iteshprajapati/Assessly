import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-card)',
      marginTop: 'auto',
      padding: '2rem 0'
    }}>
      <div className="container text-center">
        <p style={{ margin: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          &copy; {currentYear} QuizFlow. All rights reserved.
        </p>
        <p style={{ margin: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          A modern online quiz and exam platform
        </p>
      </div>
    </footer>
  );
}
