const pool = require('../config/database');

class QuestionModel {
  // Create MCQ question
  static async create(quizId, question, topic, type, points, imagePath, option1, option2, option3, option4, correctOption) {
    const [result] = await pool.query(
      `INSERT INTO questions (quiz_id, question, topic, type, points, image_path, option1, option2, option3, option4, correct_option)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [quizId, question, topic, type || 'MCQ', points || 1, imagePath || null, option1, option2, option3, option4, correctOption]
    );
    return result.insertId;
  }

  // Create Descriptive question
  static async createDescriptive(quizId, question, topic, points, imagePath) {
    const [result] = await pool.query(
      `INSERT INTO questions (quiz_id, question, topic, type, points, image_path)
       VALUES (?, ?, ?, 'DESCRIPTIVE', ?, ?)`,
      [quizId, question, topic, points || 1, imagePath || null]
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
      `SELECT id, quiz_id, question, type, points, image_path, topic, option1, option2, option3, option4 
       FROM questions 
       WHERE quiz_id = ? 
       ORDER BY id ASC`,
      [quizId]
    );
    return rows;
  }

  static async update(id, question, topic, points, imagePath, option1, option2, option3, option4, correctOption) {
    // For MCQ questions
    if (option1 && correctOption) {
      await pool.query(
        `UPDATE questions SET question = ?, topic = ?, points = ?, image_path = ?, option1 = ?, option2 = ?, option3 = ?, option4 = ?, correct_option = ? 
         WHERE id = ?`,
        [question, topic, points || 1, imagePath || null, option1, option2, option3, option4, correctOption, id]
      );
    } else {
      // For descriptive questions
      await pool.query(
        `UPDATE questions SET question = ?, topic = ?, points = ?, image_path = ? 
         WHERE id = ?`,
        [question, topic, points || 1, imagePath || null, id]
      );
    }
  }

  static async updateImage(id, imagePath) {
    await pool.query(
      `UPDATE questions SET image_path = ? WHERE id = ?`,
      [imagePath, id]
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM questions WHERE id = ?', [id]);
  }

  static async deleteByQuiz(quizId) {
    await pool.query('DELETE FROM questions WHERE quiz_id = ?', [quizId]);
  }

  static async getDescriptiveByQuiz(quizId) {
    const [rows] = await pool.query(
      `SELECT * FROM questions WHERE quiz_id = ? AND type = 'DESCRIPTIVE' ORDER BY id ASC`,
      [quizId]
    );
    return rows;
  }

  static async getMCQByQuiz(quizId) {
    const [rows] = await pool.query(
      `SELECT * FROM questions WHERE quiz_id = ? AND type = 'MCQ' ORDER BY id ASC`,
      [quizId]
    );
    return rows;
  }
}

module.exports = QuestionModel;
