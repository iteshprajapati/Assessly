import React, { useState, useEffect } from 'react';

export default function QuizTimer({ totalSeconds, onTimeUp, timerRef }) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    timerRef.current = remaining;
  }, [remaining, timerRef]);

  useEffect(() => {
    if (remaining <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining, onTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  let timerClass = 'quiz-timer';
  if (remaining <= 60) timerClass += ' timer-danger';
  else if (remaining <= 180) timerClass += ' timer-warning';

  return <div className={timerClass}>{formatTime}</div>;
}
