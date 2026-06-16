const { body, validationResult } = require('express-validator');
const QuizModel = require('../models/Quiz');
const QuizAttemptModel = require('../models/QuizAttempt');
const AdminLogModel = require('../models/AdminLog');

// Create quiz
exports.createQuiz = [
  body('title').trim().notEmpty().withMessage('Quiz title is required'),
  body('timeLimit').isInt({ min: 1, max: 300 }).withMessage('Time limit must be between 1 and 300 minutes'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Invalid status value'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array().map(e => e.msg).join('; '),
        errors: errors.array() 
      });
    }

    try {
      const { title, description, timeLimit, status } = req.body;
      const teacherId = req.user?.userId;

      if (!teacherId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
      }

      const quizId = await QuizModel.create(
        teacherId,
        title,
        description || '',
        timeLimit,
        status || 'draft'
      );

      // Log action
      await AdminLogModel.create(
        teacherId,
        'CREATE_QUIZ',
        'quizzes',
        quizId,
        `Quiz "${title}" created`,
        req.ip,
        req.headers['user-agent']
      );

      res.status(201).json({
        success: true,
        message: 'Quiz created successfully',
        quizId,
      });
    } catch (error) {
      console.error('Error creating quiz:', error.message);
      res.status(500).json({ error: error.message });
    }
  },
];

// Get quiz details
exports.getQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await QuizModel.findById(id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Retrieve questions count and details
    const QuestionModel = require('../models/Question');
    const questions = await QuestionModel.getByQuiz(id);

    res.json({
      success: true,
      data: {
        ...quiz,
        questions,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Student pre-attempt check & load questions
exports.getQuizForAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.userId;

    const quiz = await QuizModel.findById(id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.status === 'draft') {
      return res.status(403).json({ error: 'This quiz is not published yet' });
    }

    // Check if student has already submitted
    const hasAttempted = await QuizAttemptModel.hasAttempted(studentId, id);
    if (hasAttempted) {
      return res.status(400).json({ error: 'You have already attempted this quiz' });
    }

    // Get active attempt or start a new one
    let attempt = await QuizAttemptModel.findActiveAttempt(studentId, id);
    if (!attempt) {
      const attemptId = await QuizAttemptModel.startAttempt(id, studentId);
      attempt = await QuizAttemptModel.findById(attemptId);
    }

    const QuestionModel = require('../models/Question');
    const questions = await QuestionModel.getByQuizWithoutAnswers(id);

    res.json({
      success: true,
      data: {
        ...quiz,
        attemptId: attempt.id,
        attemptNumber: attempt.attempt_number,
        questions,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all quizzes for current teacher
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

// Get all published quizzes for students
exports.getAllQuizzes = async (req, res) => {
  try {
    const allQuizzes = await QuizModel.getAll();
    
    // Students should only see published quizzes
    const filteredQuizzes = req.user.role === 'student'
      ? allQuizzes.filter(q => q.status === 'published')
      : allQuizzes;

    res.json({
      success: true,
      data: filteredQuizzes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update quiz
exports.updateQuiz = [
  body('title').trim().notEmpty().withMessage('Quiz title is required'),
  body('timeLimit').isInt({ min: 1, max: 300 }).withMessage('Time limit must be between 1 and 300 minutes'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Invalid status value'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { title, description, timeLimit, status } = req.body;
      const teacherId = req.user.userId;

      // Verify quiz ownership
      const quiz = await QuizModel.findByIdAndTeacher(id, teacherId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await QuizModel.update(id, title, description || '', timeLimit, status || 'draft');

      // Log action
      await AdminLogModel.create(
        teacherId,
        'UPDATE_QUIZ',
        'quizzes',
        id,
        `Quiz ID ${id} updated to status "${status}"`,
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        message: 'Quiz updated successfully',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Delete quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.userId;

    // Verify quiz ownership
    const quiz = await QuizModel.findByIdAndTeacher(id, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await QuizModel.delete(id);

    // Log action
    await AdminLogModel.create(
      teacherId,
      'DELETE_QUIZ',
      'quizzes',
      id,
      `Quiz "${quiz.title}" deleted`,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
