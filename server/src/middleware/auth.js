const { verifyToken } = require('../utils/helpers');

/**
 * Authenticate JWT token
 */
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Authorize specific roles
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.message.includes('Duplicate entry')) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};

module.exports = {
  authenticate,
  authorize,
  errorHandler,
};
