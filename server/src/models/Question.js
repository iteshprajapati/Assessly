const pool = require('../config/database');

class QuestionModel {
  static async create(quizId, question, option1, option2, option3, option4, correctOption) {
    const [result] = await pool.query(
      `INSERT INTO questions (quiz_id, question, option1, option2, option3, option4, correct_option)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [quizId, question, option1, option2, option3, option4, correctOption]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM questions WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async getByQuiz(quizId) {
    const [rows] = await pool.query(
      'SELECT * FROM questions WHERE quiz_id = ? ORDER BY id ASC',
      [quizId]
    );
    return rows;
  }

  static async getByQuizWithoutAnswers(quizId) {
    const [rows] = await pool.query(
      `SELECT id, quiz_id, question, option1, option2, option3, option4 
       FROM questions 
       WHERE quiz_id = ? 
       ORDER BY id ASC`,
      [quizId]
    );
    return rows;
  }

  static async update(id, question, option1, option2, option3, option4, correctOption) {
    await pool.query(
      `UPDATE questions SET question = ?, option1 = ?, option2 = ?, option3 = ?, option4 = ?, correct_option = ? 
       WHERE id = ?`,
      [question, option1, option2, option3, option4, correctOption, id]
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM questions WHERE id = ?', [id]);
  }

  static async deleteByQuiz(quizId) {
    await pool.query('DELETE FROM questions WHERE quiz_id = ?', [quizId]);
  }
}

module.exports = QuestionModel;
