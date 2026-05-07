const pool = require('../config/database');

class QuizModel {
  static async create(teacherId, title, description, timeLimit) {
    const [result] = await pool.query(
      'INSERT INTO quizzes (teacher_id, title, description, time_limit) VALUES (?, ?, ?, ?)',
      [teacherId, title, description, timeLimit]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM quizzes WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async findByIdAndTeacher(id, teacherId) {
    const [rows] = await pool.query(
      'SELECT * FROM quizzes WHERE id = ? AND teacher_id = ? LIMIT 1',
      [id, teacherId]
    );
    return rows[0] || null;
  }

  static async getByTeacher(teacherId) {
    const [rows] = await pool.query(
      `SELECT q.*, (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count,
              (SELECT COUNT(*) FROM results WHERE quiz_id = q.id) AS attempt_count
       FROM quizzes q
       WHERE q.teacher_id = ?
       ORDER BY q.created_at DESC`,
      [teacherId]
    );
    return rows;
  }

  static async getAll() {
    const [rows] = await pool.query(
      `SELECT q.*, u.name AS teacher_name,
              (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count,
              (SELECT COUNT(*) FROM results WHERE quiz_id = q.id) AS attempt_count
       FROM quizzes q
       JOIN users u ON q.teacher_id = u.id
       ORDER BY q.created_at DESC`
    );
    return rows;
  }

  static async update(id, title, description, timeLimit) {
    await pool.query(
      'UPDATE quizzes SET title = ?, description = ?, time_limit = ? WHERE id = ?',
      [title, description, timeLimit, id]
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM quizzes WHERE id = ?', [id]);
  }
}

module.exports = QuizModel;
