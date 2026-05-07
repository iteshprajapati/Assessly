const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Hash a password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
function generateToken(userId, role) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Sanitize user data
 */
function sanitizeUser(user) {
  const { password, ...sanitized } = user;
  return sanitized;
}

/**
 * Format date
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate percentage
 */
function calculatePercentage(score, total) {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

/**
 * Get score badge
 */
function getScoreBadge(percentage) {
  if (percentage >= 75) return 'success';
  if (percentage >= 50) return 'warning';
  return 'danger';
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  sanitizeUser,
  formatDate,
  calculatePercentage,
  getScoreBadge,
};
