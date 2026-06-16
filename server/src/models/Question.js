const pool = require('../config/database');

class QuestionModel {
  // Create a base question
  static async create(questionText, type, difficulty = 'medium', imagePath = null, createdBy = null) {
    const [result] = await pool.query(
      `INSERT INTO questions (question_text, type, difficulty, image_path, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [questionText, type, difficulty, imagePath, createdBy]
    );
    return result.insertId;
  }

  // Add an option for MCQ/TRUE_FALSE
  static async addOption(questionId, optionText, isCorrect = false) {
    const [result] = await pool.query(
      `INSERT INTO options (question_id, option_text, is_correct)
       VALUES (?, ?, ?)`,
      [questionId, optionText, isCorrect]
    );
    return result.insertId;
  }

  // Clear options (useful before updating)
  static async deleteOptions(questionId) {
    await pool.query('DELETE FROM options WHERE question_id = ?', [questionId]);
  }

  // Retrieve options for a question
  static async getOptions(questionId) {
    const [rows] = await pool.query(
      'SELECT id, option_text, is_correct FROM options WHERE question_id = ? ORDER BY id ASC',
      [questionId]
    );
    return rows;
  }

  // Link a question to a quiz via quiz_questions
  static async linkToQuiz(quizId, questionId, order = 1) {
    // Find the current max order in the quiz questions
    const [rows] = await pool.query(
      'SELECT MAX(question_order) AS max_order FROM quiz_questions WHERE quiz_id = ?',
      [quizId]
    );
    const nextOrder = (rows[0]?.max_order || 0) + 1;

    await pool.query(
      `INSERT INTO quiz_questions (quiz_id, question_id, question_order)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE question_order = VALUES(question_order)`,
      [quizId, questionId, order || nextOrder]
    );
  }

  // Unlink a question from a quiz
  static async unlinkFromQuiz(quizId, questionId) {
    await pool.query(
      'DELETE FROM quiz_questions WHERE quiz_id = ? AND question_id = ?',
      [quizId, questionId]
    );
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, question_text AS question, type, difficulty, image_path, created_by, created_at 
       FROM questions WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  // Get questions linked to a quiz (for teachers, including correct answers)
  static async getByQuiz(quizId) {
    const [rows] = await pool.query(
      `SELECT q.id, q.question_text AS question, q.type, q.difficulty, q.image_path, q.created_by, q.created_at, qq.question_order, qq.quiz_id
       FROM questions q
       JOIN quiz_questions qq ON q.id = qq.question_id
       WHERE qq.quiz_id = ?
       ORDER BY qq.question_order ASC, q.id ASC`,
      [quizId]
    );

    // Fetch options for each question
    for (const q of rows) {
      q.options = await this.getOptions(q.id);
    }
    return rows;
  }

  // Get questions for students attempting a quiz (excludes options.is_correct)
  static async getByQuizWithoutAnswers(quizId) {
    const [rows] = await pool.query(
      `SELECT q.id, q.question_text, q.type, q.difficulty, q.image_path, qq.question_order
       FROM questions q
       JOIN quiz_questions qq ON q.id = qq.question_id
       WHERE qq.quiz_id = ?
       ORDER BY qq.question_order ASC, q.id ASC`,
      [quizId]
    );

    for (const q of rows) {
      const [options] = await pool.query(
        'SELECT id, option_text FROM options WHERE question_id = ? ORDER BY id ASC',
        [q.id]
      );
      q.options = options;
    }
    return rows;
  }

  static async update(id, questionText, type, difficulty, imagePath) {
    await pool.query(
      `UPDATE questions 
       SET question_text = ?, type = ?, difficulty = ?, image_path = ? 
       WHERE id = ?`,
      [questionText, type, difficulty, imagePath, id]
    );
  }

  static async updateImage(id, imagePath) {
    await pool.query(
      `UPDATE questions SET image_path = ? WHERE id = ?`,
      [imagePath, id]
    );
  }

  static async delete(id) {
    // Cascade deletes options and quiz_questions automatically due to DB foreign keys
    await pool.query('DELETE FROM questions WHERE id = ?', [id]);
  }

  static async deleteByQuiz(quizId) {
    // Unlink and delete all questions created directly for this quiz
    const [rows] = await pool.query(
      'SELECT question_id FROM quiz_questions WHERE quiz_id = ?',
      [quizId]
    );
    for (const row of rows) {
      await this.delete(row.question_id);
    }
  }
}

module.exports = QuestionModel;
