const pool = require('../config/database');

class OtpCodeModel {
  static async create(email, otpHash, purpose, expiresAt) {
    const [result] = await pool.query(
      'INSERT INTO otp_codes (email, otp_hash, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [email, otpHash, purpose, expiresAt]
    );
    return result.insertId;
  }

  static async findLatest(email, purpose) {
    const [rows] = await pool.query(
      'SELECT * FROM otp_codes WHERE email = ? AND purpose = ? AND used = 0 ORDER BY created_at DESC LIMIT 1',
      [email, purpose]
    );
    return rows[0] || null;
  }

  static async markUsed(id) {
    await pool.query('UPDATE otp_codes SET used = 1 WHERE id = ?', [id]);
  }

  static async invalidate(email, purpose) {
    await pool.query(
      'UPDATE otp_codes SET used = 1 WHERE email = ? AND purpose = ? AND used = 0',
      [email, purpose]
    );
  }
}

module.exports = OtpCodeModel;
