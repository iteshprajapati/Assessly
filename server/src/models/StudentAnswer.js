const pool = require('../config/database');

class StudentAnswerModel {
  static async create(studentId, quizId, questionId, selectedOption) {
    const [result] = await pool.query(
      'INSERT INTO student_answers (student_id, quiz_id, question_id, selected_option) VALUES (?, ?, ?, ?)',
      [studentId, quizId, questionId, selectedOption]
    );
    return result.insertId;
  }

  static async getByQuizAndStudent(quizId, studentId) {
    const [rows] = await pool.query(
      `SELECT sa.*, q.correct_option
       FROM student_answers sa
       JOIN questions q ON sa.question_id = q.id
       WHERE sa.quiz_id = ? AND sa.student_id = ?`,
      [quizId, studentId]
    );
    return rows;
  }

  static async deleteByQuizAndStudent(quizId, studentId) {
    await pool.query(
      'DELETE FROM student_answers WHERE quiz_id = ? AND student_id = ?',
      [quizId, studentId]
    );
  }
}

module.exports = StudentAnswerModel;
