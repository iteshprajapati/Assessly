import React from 'react';
import './Tooltip.scss';

export default function Tooltip({ text, position = 'top', children }) {
  if (!text) return <>{children}</>;

  return (
    <div className="tooltip-container">
      {children}
      <div className={`tooltip-bubble tooltip-${position}`} role="tooltip">
        {text}
      </div>
    </div>
  );
}
