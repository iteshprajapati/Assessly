const { body, validationResult } = require('express-validator');
const QuestionModel = require('../models/Question');
const QuizModel = require('../models/Quiz');
const ResultModel = require('../models/Result');

exports.addQuestion = [
  body('quizId').isInt().withMessage('Quiz ID is required'),
  body('question').trim().notEmpty().withMessage('Question is required'),
  body('option1').trim().notEmpty().withMessage('Option 1 is required'),
  body('option2').trim().notEmpty().withMessage('Option 2 is required'),
  body('option3').trim().notEmpty().withMessage('Option 3 is required'),
  body('option4').trim().notEmpty().withMessage('Option 4 is required'),
  body('correctOption').isInt({ min: 1, max: 4 }).withMessage('Correct option must be 1-4'),
  body('topic').optional().isLength({ max: 100 }).withMessage('Topic must be 100 characters or less'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { quizId, question, option1, option2, option3, option4, correctOption } = req.body;
      const rawTopic = typeof req.body.topic === 'string' ? req.body.topic.trim() : '';
      const topic = rawTopic || 'General';
      const teacherId = req.user.userId;

      // Verify quiz ownership
      const quiz = await QuizModel.findByIdAndTeacher(quizId, teacherId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const questionId = await QuestionModel.create(
        quizId,
        question,
        topic,
        option1,
        option2,
        option3,
        option4,
        correctOption
      );

      res.status(201).json({
        success: true,
        message: 'Question added successfully',
        questionId,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

exports.getQuestions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userId, role } = req.user;

    if (role === 'teacher') {
      const quiz = await QuizModel.findByIdAndTeacher(quizId, userId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    } else if (role === 'student') {
      const hasAttempted = await ResultModel.hasAttempted(userId, quizId);
      if (!hasAttempted) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    } else {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const questions = await QuestionModel.getByQuiz(quizId);

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateQuestion = [
  body('question').trim().notEmpty().withMessage('Question is required'),
  body('option1').trim().notEmpty().withMessage('Option 1 is required'),
  body('option2').trim().notEmpty().withMessage('Option 2 is required'),
  body('option3').trim().notEmpty().withMessage('Option 3 is required'),
  body('option4').trim().notEmpty().withMessage('Option 4 is required'),
  body('correctOption').isInt({ min: 1, max: 4 }).withMessage('Correct option must be 1-4'),
  body('topic').optional().isLength({ max: 100 }).withMessage('Topic must be 100 characters or less'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { question, option1, option2, option3, option4, correctOption } = req.body;
      const rawTopic = typeof req.body.topic === 'string' ? req.body.topic.trim() : '';
      const topic = rawTopic || 'General';
      const teacherId = req.user.userId;

      // Verify question ownership (through quiz)
      const questionData = await QuestionModel.findById(id);
      if (!questionData) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const quiz = await QuizModel.findByIdAndTeacher(questionData.quiz_id, teacherId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await QuestionModel.update(id, question, topic, option1, option2, option3, option4, correctOption);

      res.json({
        success: true,
        message: 'Question updated successfully',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.userId;

    // Verify question ownership (through quiz)
    const question = await QuestionModel.findById(id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const quiz = await QuizModel.findByIdAndTeacher(question.quiz_id, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await QuestionModel.delete(id);

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
