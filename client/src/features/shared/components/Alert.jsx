import React from 'react';

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;

  const alertClass = {
    success: 'alert-success',
    error: 'alert-danger',
    warning: 'alert-warning',
    info: 'alert-info',
  }[type] || 'alert-info';

  return (
    <div className={`alert ${alertClass}`} role="alert">
      <div style={{ flex: 1 }}>{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'inherit',
            fontSize: '1.25rem',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
