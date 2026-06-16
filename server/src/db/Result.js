const pool = require('../config/database');

class ResultModel {
  static async create(attemptId, totalScore, maxScore, mcqScore, descriptiveScore, percentage) {
    const [result] = await pool.query(
      `INSERT INTO results (attempt_id, total_score, max_score, mcq_score, descriptive_score, percentage)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [attemptId, totalScore, maxScore, mcqScore, descriptiveScore, percentage]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*, qa.quiz_id, qa.student_id, qa.attempt_number, qa.submitted_at, 
              q.title AS quiz_title, q.time_limit, u.name AS student_name
       FROM results r
       JOIN quiz_attempts qa ON r.attempt_id = qa.id
       JOIN quizzes q ON qa.quiz_id = q.id
       JOIN users u ON qa.student_id = u.id
       WHERE r.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByAttempt(attemptId) {
    const [rows] = await pool.query(
      'SELECT * FROM results WHERE attempt_id = ? LIMIT 1',
      [attemptId]
    );
    return rows[0] || null;
  }

  static async getByStudent(studentId) {
    const [rows] = await pool.query(
      `SELECT r.*, qa.quiz_id, qa.attempt_number, qa.submitted_at, q.title AS quiz_title
       FROM results r
       JOIN quiz_attempts qa ON r.attempt_id = qa.id
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE qa.student_id = ?
       ORDER BY qa.submitted_at DESC`,
      [studentId]
    );
    return rows;
  }

  static async getByQuiz(quizId) {
    const [rows] = await pool.query(
      `SELECT r.*, qa.attempt_number, qa.submitted_at, u.name AS student_name, u.email
       FROM results r
       JOIN quiz_attempts qa ON r.attempt_id = qa.id
       JOIN users u ON qa.student_id = u.id
       WHERE qa.quiz_id = ?
       ORDER BY qa.submitted_at DESC`,
      [quizId]
    );
    return rows;
  }

  static async update(id, totalScore, descriptiveScore, percentage) {
    await pool.query(
      'UPDATE results SET total_score = ?, descriptive_score = ?, percentage = ? WHERE id = ?',
      [totalScore, descriptiveScore, percentage, id]
    );
  }

  static async updateByAttempt(attemptId, totalScore, descriptiveScore, percentage) {
    await pool.query(
      'UPDATE results SET total_score = ?, descriptive_score = ?, percentage = ? WHERE attempt_id = ?',
      [totalScore, descriptiveScore, percentage, attemptId]
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

  static async getQuizStats(quizId) {
    const [rows] = await pool.query(
      `SELECT 
        COUNT(*) AS total_attempts,
        COALESCE(AVG(total_score), 0) AS average_score,
        COALESCE(MIN(total_score), 0) AS min_score,
        COALESCE(MAX(total_score), 0) AS max_score
      FROM results r
      JOIN quiz_attempts qa ON r.attempt_id = qa.id
      WHERE qa.quiz_id = ?`,
      [quizId]
    );
    return rows[0] || { total_attempts: 0, average_score: 0, min_score: 0, max_score: 0 };
  }

  static async getDifficultyStats(quizId) {
    const [rows] = await pool.query(
      `SELECT
        q.difficulty,
        COUNT(DISTINCT q.id) AS question_count,
        COUNT(a.id) AS total_answers,
        SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_answers
       FROM questions q
       JOIN quiz_questions qq ON q.id = qq.question_id
       LEFT JOIN answers a ON a.question_id = q.id
       LEFT JOIN quiz_attempts qa ON a.attempt_id = qa.id AND qa.status = 'submitted'
       WHERE qq.quiz_id = ?
       GROUP BY q.difficulty
       ORDER BY q.difficulty ASC`,
      [quizId]
    );
    return rows;
  }
}

module.exports = ResultModel;
