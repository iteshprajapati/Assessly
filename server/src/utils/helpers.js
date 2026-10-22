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
 * Generate a numeric OTP code
 */
function generateOtpCode(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * Hash an OTP code
 */
async function hashOtp(otpCode) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otpCode, salt);
}

/**
 * Compare OTP with hash
 */
async function verifyOtp(otpCode, hash) {
  return bcrypt.compare(otpCode, hash);
}

/**
 * Get OTP expiry date
 */
function getOtpExpiry(minutes = Number(process.env.OTP_EXPIRE_MINUTES || 10)) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  return expiresAt;
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
  generateOtpCode,
  hashOtp,
  verifyOtp,
  getOtpExpiry,
  generateToken,
  verifyToken,
  sanitizeUser,
  formatDate,
  calculatePercentage,
  getScoreBadge,
};
