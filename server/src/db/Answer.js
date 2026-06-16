const pool = require('../config/database');

class AnswerModel {
  static async create(attemptId, questionId, selectedOptionId = null, answerText = null, imagePath = null, isCorrect = null, marksObtained = 0) {
    const [result] = await pool.query(
      `INSERT INTO answers (attempt_id, question_id, selected_option_id, answer_text, image_path, is_correct, marks_obtained)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [attemptId, questionId, selectedOptionId, answerText, imagePath, isCorrect, marksObtained]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT a.*, q.question_text AS question, q.type as question_type
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       WHERE a.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByAttemptAndQuestion(attemptId, questionId) {
    const [rows] = await pool.query(
      'SELECT * FROM answers WHERE attempt_id = ? AND question_id = ? LIMIT 1',
      [attemptId, questionId]
    );
    return rows[0] || null;
  }

  static async getByAttempt(attemptId) {
    const [rows] = await pool.query(
      `SELECT a.*, q.question_text AS question, q.type as question_type, q.image_path as question_image
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       WHERE a.attempt_id = ?
       ORDER BY a.id ASC`,
      [attemptId]
    );
    return rows;
  }

  static async update(id, selectedOptionId = null, answerText = null, imagePath = null, isCorrect = null, marksObtained = 0) {
    await pool.query(
      `UPDATE answers 
       SET selected_option_id = ?, answer_text = ?, image_path = ?, is_correct = ?, marks_obtained = ?
       WHERE id = ?`,
      [selectedOptionId, answerText, imagePath, isCorrect, marksObtained, id]
    );
  }

  static async grade(id, marksObtained, isCorrect) {
    await pool.query(
      `UPDATE answers 
       SET marks_obtained = ?, is_correct = ?
       WHERE id = ?`,
      [marksObtained, isCorrect, id]
    );
  }

  static async getDescriptiveByAttempt(attemptId) {
    const [rows] = await pool.query(
      `SELECT a.*, q.question_text AS question, q.image_path as question_image
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       WHERE a.attempt_id = ? AND q.type = 'DESCRIPTIVE'
       ORDER BY a.id ASC`,
      [attemptId]
    );
    return rows;
  }

  static async getUngradedByQuiz(quizId) {
    const [rows] = await pool.query(
      `SELECT a.*, u.name as student_name, u.email, q.question_text AS question, qa.attempt_number
       FROM answers a
       JOIN quiz_attempts qa ON a.attempt_id = qa.id
       JOIN users u ON qa.student_id = u.id
       JOIN questions q ON a.question_id = q.id
       WHERE qa.quiz_id = ? AND q.type = 'DESCRIPTIVE' AND a.is_correct IS NULL
       ORDER BY a.created_at ASC`,
      [quizId]
    );
    return rows;
  }
}

module.exports = AnswerModel;
