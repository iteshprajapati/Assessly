const pool = require('../config/database');

class QuizAttemptModel {
  static async startAttempt(quizId, studentId) {
    // 1. Get the max attempt number
    const [rows] = await pool.query(
      'SELECT MAX(attempt_number) AS max_attempt FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?',
      [quizId, studentId]
    );
    const nextAttemptNumber = (rows[0]?.max_attempt || 0) + 1;

    // 2. Create the attempt
    const [result] = await pool.query(
      `INSERT INTO quiz_attempts (quiz_id, student_id, attempt_number, status)
       VALUES (?, ?, ?, 'in_progress')`,
      [quizId, studentId, nextAttemptNumber]
    );

    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT qa.*, q.title as quiz_title, q.time_limit, u.name as student_name
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       JOIN users u ON qa.student_id = u.id
       WHERE qa.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findActiveAttempt(studentId, quizId) {
    const [rows] = await pool.query(
      `SELECT * FROM quiz_attempts 
       WHERE student_id = ? AND quiz_id = ? AND status = 'in_progress'
       LIMIT 1`,
      [studentId, quizId]
    );
    return rows[0] || null;
  }

  static async getByQuizAndStudent(quizId, studentId) {
    const [rows] = await pool.query(
      `SELECT * FROM quiz_attempts 
       WHERE quiz_id = ? AND student_id = ?
       ORDER BY attempt_number DESC`,
      [quizId, studentId]
    );
    return rows;
  }

  static async submitAttempt(id) {
    await pool.query(
      `UPDATE quiz_attempts 
       SET status = 'submitted', submitted_at = NOW() 
       WHERE id = ?`,
      [id]
    );
  }

  static async hasAttempted(studentId, quizId) {
    const [rows] = await pool.query(
      `SELECT id FROM quiz_attempts 
       WHERE student_id = ? AND quiz_id = ? AND status = 'submitted'
       LIMIT 1`,
      [studentId, quizId]
    );
    return rows.length > 0;
  }
}

module.exports = QuizAttemptModel;
