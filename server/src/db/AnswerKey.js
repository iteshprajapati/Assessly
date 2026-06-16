const pool = require('../config/database');

class AnswerKeyModel {
  static async create(questionId, answerText, marks) {
    const [result] = await pool.query(
      `INSERT INTO answer_keys (question_id, answer_text, marks)
       VALUES (?, ?, ?)`,
      [questionId, answerText, marks]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM answer_keys WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  static async getByQuestion(questionId) {
    const [rows] = await pool.query(
      'SELECT * FROM answer_keys WHERE question_id = ? ORDER BY id ASC',
      [questionId]
    );
    return rows;
  }

  static async update(id, answerText, marks) {
    await pool.query(
      `UPDATE answer_keys SET answer_text = ?, marks = ? WHERE id = ?`,
      [answerText, marks, id]
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM answer_keys WHERE id = ?', [id]);
  }

  static async deleteByQuestion(questionId) {
    await pool.query('DELETE FROM answer_keys WHERE question_id = ?', [questionId]);
  }
}

module.exports = AnswerKeyModel;
