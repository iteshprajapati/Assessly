const pool = require('../config/database');

class DescriptiveAnswerModel {
  static async create(studentId, quizId, questionId, answerText, imagePath = null) {
    const [result] = await pool.query(
      `INSERT INTO descriptive_answers (student_id, quiz_id, question_id, answer_text, image_path)
       VALUES (?, ?, ?, ?, ?)`,
      [studentId, quizId, questionId, answerText, imagePath]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM descriptive_answers WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  static async findByStudentAndQuestion(studentId, questionId) {
    const [rows] = await pool.query(
      'SELECT * FROM descriptive_answers WHERE student_id = ? AND question_id = ? LIMIT 1',
      [studentId, questionId]
    );
    return rows[0] || null;
  }

  static async getByQuiz(quizId) {
    const [rows] = await pool.query(
      `SELECT da.*, u.name as student_name, q.question, q.points
       FROM descriptive_answers da
       JOIN users u ON da.student_id = u.id
       JOIN questions q ON da.question_id = q.id
       WHERE da.quiz_id = ?
       ORDER BY da.submitted_at DESC`,
      [quizId]
    );
    return rows;
  }

  static async getByStudent(studentId, quizId) {
    const [rows] = await pool.query(
      `SELECT da.*, q.question, q.points, q.image_path as question_image
       FROM descriptive_answers da
       JOIN questions q ON da.question_id = q.id
       WHERE da.student_id = ? AND da.quiz_id = ?
       ORDER BY da.id ASC`,
      [studentId, quizId]
    );
    return rows;
  }

  static async getByQuestion(questionId) {
    const [rows] = await pool.query(
      `SELECT da.*, u.name as student_name
       FROM descriptive_answers da
       JOIN users u ON da.student_id = u.id
       WHERE da.question_id = ?
       ORDER BY da.submitted_at DESC`,
      [questionId]
    );
    return rows;
  }

  static async grade(id, marksObtained, teacherFeedback, gradedBy) {
    await pool.query(
      `UPDATE descriptive_answers 
       SET marks_obtained = ?, is_graded = 1, teacher_feedback = ?, graded_by = ?, graded_at = NOW()
       WHERE id = ?`,
      [marksObtained, teacherFeedback, gradedBy, id]
    );
  }

  static async update(id, answerText, imagePath = null) {
    await pool.query(
      `UPDATE descriptive_answers SET answer_text = ?, image_path = ? WHERE id = ?`,
      [answerText, imagePath, id]
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM descriptive_answers WHERE id = ?', [id]);
  }

  static async getUngradedByQuiz(quizId) {
    const [rows] = await pool.query(
      `SELECT da.*, u.name as student_name, u.email, q.question, q.points
       FROM descriptive_answers da
       JOIN users u ON da.student_id = u.id
       JOIN questions q ON da.question_id = q.id
       WHERE da.quiz_id = ? AND da.is_graded = 0
       ORDER BY da.submitted_at ASC`,
      [quizId]
    );
    return rows;
  }

  static async getGradedByStudent(studentId, quizId) {
    const [rows] = await pool.query(
      `SELECT da.*, q.question, q.points, q.image_path as question_image,
              u.name as teacher_name
       FROM descriptive_answers da
       JOIN questions q ON da.question_id = q.id
       LEFT JOIN users u ON da.graded_by = u.id
       WHERE da.student_id = ? AND da.quiz_id = ? AND da.is_graded = 1
       ORDER BY da.id ASC`,
      [studentId, quizId]
    );
    return rows;
  }
}

module.exports = DescriptiveAnswerModel;
