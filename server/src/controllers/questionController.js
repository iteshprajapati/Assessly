const { body, validationResult } = require('express-validator');
const QuestionModel = require('../db/Question');
const QuizModel = require('../db/Quiz');
const QuizAttemptModel = require('../db/QuizAttempt');
const ResultModel = require('../db/Result');
const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

// Add MCQ / TRUE_FALSE question
exports.addMCQQuestion = [
  body('quizId').isInt().withMessage('Quiz ID is required'),
  body('question').trim().notEmpty().withMessage('Question is required'),
  body('option1').trim().notEmpty().withMessage('Option 1 is required'),
  body('option2').trim().notEmpty().withMessage('Option 2 is required'),
  body('option3').optional().trim(),
  body('option4').optional().trim(),
  body('correctOption').isInt({ min: 1, max: 4 }).withMessage('Correct option must be 1-4'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  body('type').optional().isIn(['MCQ', 'TRUE_FALSE']).withMessage('Invalid type'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { quizId, question, option1, option2, option3, option4, correctOption, difficulty, type } = req.body;
      const teacherId = req.user.userId;
      const imagePath = req.file ? req.file.path : null; // Cloudinary URL

      // Verify quiz ownership
      const quiz = await QuizModel.findByIdAndTeacher(quizId, teacherId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const qType = type || 'MCQ';

      // 1. Create the question record
      const questionId = await QuestionModel.create(
        question,
        qType,
        difficulty || 'medium',
        imagePath,
        teacherId
      );

      // 2. Add options
      await QuestionModel.addOption(questionId, option1, parseInt(correctOption) === 1);
      await QuestionModel.addOption(questionId, option2, parseInt(correctOption) === 2);
      
      if (qType === 'MCQ') {
        if (option3) await QuestionModel.addOption(questionId, option3, parseInt(correctOption) === 3);
        if (option4) await QuestionModel.addOption(questionId, option4, parseInt(correctOption) === 4);
      }

      // 3. Link to quiz
      await QuestionModel.linkToQuiz(quizId, questionId);

      res.status(201).json({
        success: true,
        message: 'Question added successfully',
        questionId,
      });
    } catch (error) {
      // Cloudinary handles storage — no local cleanup needed
      res.status(500).json({ error: error.message });
    }
  },
];

// Add Descriptive question
exports.addDescriptiveQuestion = [
  body('quizId').isInt().withMessage('Quiz ID is required'),
  body('question').trim().notEmpty().withMessage('Question is required'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { quizId, question, difficulty } = req.body;
      const teacherId = req.user.userId;
      const imagePath = req.file ? req.file.path : null; // Cloudinary URL

      // Verify quiz ownership
      const quiz = await QuizModel.findByIdAndTeacher(quizId, teacherId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // 1. Create the descriptive question
      const questionId = await QuestionModel.create(
        question,
        'DESCRIPTIVE',
        difficulty || 'medium',
        imagePath,
        teacherId
      );

      // 2. Link to quiz
      await QuestionModel.linkToQuiz(quizId, questionId);

      res.status(201).json({
        success: true,
        message: 'Descriptive question added successfully',
        questionId,
      });
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  },
];

exports.getQuestions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userId, role } = req.user;

    // Check permissions
    if (role === 'teacher') {
      const quiz = await QuizModel.findByIdAndTeacher(quizId, userId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      const questions = await QuestionModel.getByQuiz(quizId);
      const mappedQuestions = questions.map((q) => {
        const mapped = { ...q };
        if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
          mapped.option1 = q.options[0]?.option_text || '';
          mapped.option2 = q.options[1]?.option_text || '';
          mapped.option3 = q.options[2]?.option_text || '';
          mapped.option4 = q.options[3]?.option_text || '';
          const correctIdx = q.options.findIndex((o) => o.is_correct);
          mapped.correct_option = correctIdx !== -1 ? correctIdx + 1 : 1;
        }
        return mapped;
      });
      return res.json({
        success: true,
        data: mappedQuestions,
      });
    } else if (role === 'student') {
      // Students should be allowed to load questions if they are attempting it
      // or if they already have completed it and want to view results.
      const hasAttempted = await QuizAttemptModel.hasAttempted(userId, quizId);
      const activeAttempt = await QuizAttemptModel.findActiveAttempt(userId, quizId);
      
      if (!hasAttempted && !activeAttempt) {
        return res.status(403).json({ error: 'Not authorized to view questions' });
      }

      // If active attempt exists or quiz attempted, serve questions without correct answers marked
      const questions = await QuestionModel.getByQuizWithoutAnswers(quizId);
      return res.json({
        success: true,
        data: questions,
      });
    } else {
      return res.status(403).json({ error: 'Not authorized' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateQuestion = [
  body('question').trim().notEmpty().withMessage('Question is required'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  body('type').optional().isIn(['MCQ', 'DESCRIPTIVE', 'TRUE_FALSE']).withMessage('Invalid question type'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { question, difficulty, type } = req.body;
      const teacherId = req.user.userId;

      // Verify question ownership (through quiz association)
      const questionData = await QuestionModel.findById(id);
      if (!questionData) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const [association] = await pool.query(
        'SELECT quiz_id FROM quiz_questions WHERE question_id = ? LIMIT 1',
        [id]
      );
      if (!association.length) {
        return res.status(403).json({ error: 'Not authorized: Question is not linked to any quiz' });
      }
      const quizId = association[0].quiz_id;

      const quiz = await QuizModel.findByIdAndTeacher(quizId, teacherId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      let imagePath = questionData.image_path;
      if (req.file) {
        // Cloudinary handles storage — new URL replaces old one
        imagePath = req.file.path; // Cloudinary URL
      }

      const qType = type || questionData.type;

      // Update question text, type, difficulty
      await QuestionModel.update(id, question, qType, difficulty || 'medium', imagePath);

      // Handle Options for MCQ / TRUE_FALSE
      if (qType === 'MCQ' || qType === 'TRUE_FALSE') {
        const { option1, option2, option3, option4, correctOption } = req.body;
        if (!option1 || !option2 || !correctOption) {
          return res.status(400).json({ error: 'Options 1 & 2 and correct option index are required' });
        }

        // Delete old options and insert new ones
        await QuestionModel.deleteOptions(id);
        await QuestionModel.addOption(id, option1, parseInt(correctOption) === 1);
        await QuestionModel.addOption(id, option2, parseInt(correctOption) === 2);

        if (qType === 'MCQ') {
          if (option3) await QuestionModel.addOption(id, option3, parseInt(correctOption) === 3);
          if (option4) await QuestionModel.addOption(id, option4, parseInt(correctOption) === 4);
        }
      } else {
        // Descriptive -> Clear any legacy options
        await QuestionModel.deleteOptions(id);
      }

      res.json({
        success: true,
        message: 'Question updated successfully',
      });
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  },
];

exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.userId;

    // Verify question ownership (through quiz association)
    const question = await QuestionModel.findById(id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const [association] = await pool.query(
      'SELECT quiz_id FROM quiz_questions WHERE question_id = ? LIMIT 1',
      [id]
    );
    if (!association.length) {
      return res.status(403).json({ error: 'Not authorized: Question is not linked to any quiz' });
    }
    const quizId = association[0].quiz_id;

    const quiz = await QuizModel.findByIdAndTeacher(quizId, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete associated image
    if (question.image_path) {
      const imagePath = path.join(__dirname, '../../', question.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
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
