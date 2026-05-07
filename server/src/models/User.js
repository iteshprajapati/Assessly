const pool = require('../config/database');

class UserModel {
  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, status, created_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  static async create(name, email, password, role = 'student') {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, "active")',
      [name, email, password, role]
    );
    return result.insertId;
  }

  static async getAll(role = null, status = null, search = null) {
    let query = 'SELECT id, name, email, role, status, created_at FROM users WHERE role != "admin"';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async updateStatus(id, status) {
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
  }

  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
  }

  static async getStats(userId) {
    const [rows] = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM quizzes WHERE teacher_id = ?) AS quiz_count,
        (SELECT COUNT(*) FROM results WHERE student_id = ?) AS attempt_count`,
      [userId, userId]
    );
    return rows[0] || { quiz_count: 0, attempt_count: 0 };
  }
}

module.exports = UserModel;
