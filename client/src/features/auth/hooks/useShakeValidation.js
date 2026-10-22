import { useEffect, useState } from 'react';

export default function useShakeValidation(resetDelay = 300) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!isShaking) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setIsShaking(false);
    }, resetDelay);
    return () => clearTimeout(timer);
  }, [isShaking, resetDelay]);

  const triggerShake = () => setIsShaking(true);

  const clearFieldError = (name) => {
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateRequired = (values, messages) => {
    const nextErrors = {};
    Object.keys(messages).forEach((key) => {
      const value = values[key];
      if (typeof value === 'string') {
        if (!value.trim()) {
          nextErrors[key] = messages[key];
        }
      } else if (!value) {
        nextErrors[key] = messages[key];
      }
    });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setIsShaking(true);
    }
    return Object.keys(nextErrors).length === 0;
  };

  return {
    fieldErrors,
    setFieldErrors,
    validateRequired,
    clearFieldError,
    isShaking,
    triggerShake,
  };
}
