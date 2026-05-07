const { body, validationResult } = require('express-validator');
const ResultModel = require('../models/Result');
const QuestionModel = require('../models/Question');
const StudentAnswerModel = require('../models/StudentAnswer');
const pool = require('../config/database');

exports.submitQuiz = [
  body('quizId').isInt().withMessage('Quiz ID is required'),
  body('answers').isObject().withMessage('Answers must be an object'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { quizId, answers } = req.body;
      const studentId = req.user.userId;

      const hasAttempted = await ResultModel.hasAttempted(studentId, quizId);
      if (hasAttempted) {
        await connection.rollback();
        return res.status(409).json({ error: 'Quiz already submitted' });
      }

      // Get questions
      const questions = await QuestionModel.getByQuiz(quizId);
      if (!questions.length) {
        await connection.rollback();
        return res.status(400).json({ error: 'Quiz has no questions' });
      }

      // Calculate score
      let score = 0;
      for (const q of questions) {
        const selectedOption = answers[q.id];
        if (selectedOption === q.correct_option) {
          score++;
        }

        // Store answer
        await StudentAnswerModel.create(studentId, quizId, q.id, selectedOption || null);
      }

      // Create result
      const resultId = await ResultModel.create(studentId, quizId, score, questions.length);

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Quiz submitted successfully',
        resultId,
        score,
        totalQuestions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
      });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  },
];

exports.getResult = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ResultModel.findById(id);

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Get student answers
    const answers = await StudentAnswerModel.getByQuizAndStudent(result.quiz_id, result.student_id);

    res.json({
      success: true,
      data: {
        ...result,
        answers,
        percentage: Math.round((result.score / result.total_questions) * 100),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudentResults = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const results = await ResultModel.getByStudent(studentId);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user.userId;

    // Verify quiz ownership
    const QuizModel = require('../models/Quiz');
    const quiz = await QuizModel.findByIdAndTeacher(quizId, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const results = await ResultModel.getByQuiz(quizId);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQuizStats = async (req, res) => {
  try {
    const { quizId } = req.params;
    const stats = await ResultModel.getQuizStats(quizId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQuizTopicStats = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user.userId;

    const QuizModel = require('../models/Quiz');
    const quiz = await QuizModel.findByIdAndTeacher(quizId, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const rows = await ResultModel.getTopicStats(quizId);
    const data = rows.map((row) => {
      const totalAnswers = row.total_answers || 0;
      const correctAnswers = row.correct_answers || 0;
      const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
      return {
        topic: row.topic,
        questionCount: row.question_count,
        totalAnswers,
        correctAnswers,
        accuracy,
      };
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkAttempted = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.userId;

    const hasAttempted = await ResultModel.hasAttempted(studentId, quizId);

    res.json({
      success: true,
      hasAttempted,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
