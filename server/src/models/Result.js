const pool = require('../config/database');

class ResultModel {
  static async create(studentId, quizId, score, totalQuestions) {
    const [result] = await pool.query(
      'INSERT INTO results (student_id, quiz_id, score, total_questions) VALUES (?, ?, ?, ?)',
      [studentId, quizId, score, totalQuestions]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*, q.title AS quiz_title, u.name AS student_name
       FROM results r
       JOIN quizzes q ON r.quiz_id = q.id
       JOIN users u ON r.student_id = u.id
       WHERE r.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async getByStudent(studentId) {
    const [rows] = await pool.query(
      `SELECT r.*, q.title AS quiz_title, 
              ROUND((r.score / r.total_questions) * 100) AS percentage
       FROM results r
       JOIN quizzes q ON r.quiz_id = q.id
       WHERE r.student_id = ?
       ORDER BY r.submitted_at DESC`,
      [studentId]
    );
    return rows;
  }

  static async getByQuiz(quizId) {
    const [rows] = await pool.query(
      `SELECT r.*, u.name AS student_name, u.email,
              ROUND((r.score / r.total_questions) * 100) AS percentage
       FROM results r
       JOIN users u ON r.student_id = u.id
       WHERE r.quiz_id = ?
       ORDER BY r.submitted_at DESC`,
      [quizId]
    );
    return rows;
  }

  static async update(id, score) {
    await pool.query('UPDATE results SET score = ? WHERE id = ?', [score, id]);
  }

  static async hasAttempted(studentId, quizId) {
    const [rows] = await pool.query(
      'SELECT id FROM results WHERE student_id = ? AND quiz_id = ? LIMIT 1',
      [studentId, quizId]
    );
    return rows.length > 0;
  }

  static async getQuizStats(quizId) {
    const [rows] = await pool.query(
      `SELECT 
        COUNT(*) AS total_attempts,
        AVG(score) AS average_score,
        MIN(score) AS min_score,
        MAX(score) AS max_score
       FROM results
       WHERE quiz_id = ?`,
      [quizId]
    );
    return rows[0] || { total_attempts: 0, average_score: 0, min_score: 0, max_score: 0 };
  }
}

module.exports = ResultModel;
