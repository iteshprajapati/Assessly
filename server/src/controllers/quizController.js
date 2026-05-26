const { body, validationResult } = require('express-validator');
const QuizModel = require('../models/Quiz');
const QuestionModel = require('../models/Question');

exports.createQuiz = [
  body('title').trim().notEmpty().withMessage('Quiz title is required'),
  body('timeLimit').isInt({ min: 1, max: 300 }).withMessage('Time limit must be between 1 and 300 minutes'),
  body('description').trim(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array().map(e => e.msg).join('; '),
        errors: errors.array() 
      });
    }

    try {
      const { title, description, timeLimit } = req.body;
      const teacherId = req.user?.userId;

      if (!teacherId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
      }

      const quizId = await QuizModel.create(teacherId, title, description || '', timeLimit);

      res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        quizId,
      });
    } catch (error) {
      console.error('Error creating quiz:', error);
      res.status(500).json({ error: error.message || 'Failed to create quiz' });
    }
  },
];

exports.getQuiz = async (req, res) => {
  try {
    const quiz = await QuizModel.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = await QuestionModel.getByQuizWithoutAnswers(quiz.id);
    quiz.questions = questions;

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQuizForAttempt = async (req, res) => {
  try {
    const quiz = await QuizModel.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = await QuestionModel.getByQuizWithoutAnswers(quiz.id);
    quiz.questions = questions;

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTeacherQuizzes = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const quizzes = await QuizModel.getByTeacher(teacherId);

    res.json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await QuizModel.getAll();

    res.json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateQuiz = [
  body('title').trim().notEmpty().withMessage('Quiz title is required'),
  body('timeLimit').isInt({ min: 1, max: 300 }).withMessage('Time limit must be between 1 and 300 minutes'),
  body('description').trim(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { title, description, timeLimit } = req.body;
      const teacherId = req.user.userId;

      // Verify ownership
      const quiz = await QuizModel.findByIdAndTeacher(id, teacherId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized to update this quiz' });
      }

      await QuizModel.update(id, title, description || '', timeLimit);

      res.json({
        success: true,
        message: 'Quiz updated successfully',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.userId;

    // Verify ownership
    const quiz = await QuizModel.findByIdAndTeacher(id, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized to delete this quiz' });
    }

    await QuizModel.delete(id);

    res.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
