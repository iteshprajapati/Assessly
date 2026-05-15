const { body, validationResult } = require('express-validator');
const DescriptiveAnswerModel = require('../models/DescriptiveAnswer');
const PresetAnswerModel = require('../models/PresetAnswer');
const QuestionModel = require('../models/Question');
const QuizModel = require('../models/Quiz');
const ResultModel = require('../models/Result');
const path = require('path');
const fs = require('fs');

// Submit descriptive answer
exports.submitDescriptiveAnswer = [
  body('quizId').isInt().withMessage('Quiz ID is required'),
  body('questionId').isInt().withMessage('Question ID is required'),
  body('answerText').trim().notEmpty().withMessage('Answer is required'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { quizId, questionId, answerText } = req.body;
      const studentId = req.user.userId;
      const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

      // Verify question belongs to quiz
      const question = await QuestionModel.findById(questionId);
      if (!question || question.quiz_id !== parseInt(quizId) || question.type !== 'DESCRIPTIVE') {
        return res.status(400).json({ error: 'Invalid question' });
      }

      // Check if student has already submitted answer for this question
      const existingAnswer = await DescriptiveAnswerModel.findByStudentAndQuestion(studentId, questionId);
      
      if (existingAnswer) {
        // Update existing answer
        await DescriptiveAnswerModel.update(existingAnswer.id, answerText, imagePath);
        return res.json({
          success: true,
          message: 'Answer updated successfully',
          answerId: existingAnswer.id
        });
      }

      // Create new answer
      const answerId = await DescriptiveAnswerModel.create(
        studentId,
        quizId,
        questionId,
        answerText,
        imagePath
      );

      res.status(201).json({
        success: true,
        message: 'Answer submitted successfully',
        answerId,
      });
    } catch (error) {
      // Delete uploaded file if error occurs
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  },
];

// Get descriptive answers for student (only graded ones)
exports.getStudentAnswers = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.userId;

    // Verify student has attempted quiz
    const hasAttempted = await ResultModel.hasAttempted(studentId, quizId);
    if (!hasAttempted) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const answers = await DescriptiveAnswerModel.getGradedByStudent(studentId, quizId);

    res.json({
      success: true,
      data: answers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get ungraded descriptive answers for teacher
exports.getUngradedAnswers = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user.userId;

    // Verify quiz ownership
    const quiz = await QuizModel.findByIdAndTeacher(quizId, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const answers = await DescriptiveAnswerModel.getUngradedByQuiz(quizId);

    res.json({
      success: true,
      data: answers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Grade descriptive answer
exports.gradeAnswer = [
  body('marksObtained').isInt({ min: 0 }).withMessage('Marks must be a non-negative integer'),
  body('teacherFeedback').optional().isString().withMessage('Feedback must be a string'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { answerId } = req.params;
      const { marksObtained, teacherFeedback } = req.body;
      const teacherId = req.user.userId;

      // Get answer with quiz and question details
      const answer = await DescriptiveAnswerModel.findById(answerId);
      if (!answer) {
        return res.status(404).json({ error: 'Answer not found' });
      }

      // Verify quiz ownership
      const quiz = await QuizModel.findByIdAndTeacher(answer.quiz_id, teacherId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Verify marks don't exceed question points
      const question = await QuestionModel.findById(answer.question_id);
      if (marksObtained > question.points) {
        return res.status(400).json({ error: `Marks cannot exceed ${question.points} points` });
      }

      await DescriptiveAnswerModel.grade(answerId, marksObtained, teacherFeedback || '', teacherId);

      res.json({
        success: true,
        message: 'Answer graded successfully',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Get single answer for grading
exports.getAnswerForGrading = async (req, res) => {
  try {
    const { answerId } = req.params;
    const teacherId = req.user.userId;

    const answer = await DescriptiveAnswerModel.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Verify quiz ownership
    const quiz = await QuizModel.findByIdAndTeacher(answer.quiz_id, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get preset answers for this question
    const presetAnswers = await PresetAnswerModel.getByQuestion(answer.question_id);

    res.json({
      success: true,
      data: {
        answer,
        presetAnswers
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add preset answer option for grading
exports.addPresetAnswer = [
  body('questionId').isInt().withMessage('Question ID is required'),
  body('answerText').trim().notEmpty().withMessage('Answer text is required'),
  body('marks').isInt({ min: 0 }).withMessage('Marks must be a non-negative integer'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { questionId, answerText, marks } = req.body;
      const teacherId = req.user.userId;

      // Get question
      const question = await QuestionModel.findById(questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Verify quiz ownership
      const quiz = await QuizModel.findByIdAndTeacher(question.quiz_id, teacherId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Verify marks don't exceed question points
      if (marks > question.points) {
        return res.status(400).json({ error: `Marks cannot exceed ${question.points} points` });
      }

      const presetAnswerId = await PresetAnswerModel.create(questionId, answerText, marks);

      res.status(201).json({
        success: true,
        message: 'Preset answer added successfully',
        presetAnswerId,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Get preset answers for a question
exports.getPresetAnswers = async (req, res) => {
  try {
    const { questionId } = req.params;
    const teacherId = req.user.userId;

    // Get question
    const question = await QuestionModel.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Verify quiz ownership
    const quiz = await QuizModel.findByIdAndTeacher(question.quiz_id, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const presetAnswers = await PresetAnswerModel.getByQuestion(questionId);

    res.json({
      success: true,
      data: presetAnswers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update preset answer
exports.updatePresetAnswer = [
  body('answerText').trim().notEmpty().withMessage('Answer text is required'),
  body('marks').isInt({ min: 0 }).withMessage('Marks must be a non-negative integer'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { presetAnswerId } = req.params;
      const { answerText, marks } = req.body;
      const teacherId = req.user.userId;

      const presetAnswer = await PresetAnswerModel.findById(presetAnswerId);
      if (!presetAnswer) {
        return res.status(404).json({ error: 'Preset answer not found' });
      }

      // Get question to verify ownership
      const question = await QuestionModel.findById(presetAnswer.question_id);
      const quiz = await QuizModel.findByIdAndTeacher(question.quiz_id, teacherId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Verify marks don't exceed question points
      if (marks > question.points) {
        return res.status(400).json({ error: `Marks cannot exceed ${question.points} points` });
      }

      await PresetAnswerModel.update(presetAnswerId, answerText, marks);

      res.json({
        success: true,
        message: 'Preset answer updated successfully',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Delete preset answer
exports.deletePresetAnswer = async (req, res) => {
  try {
    const { presetAnswerId } = req.params;
    const teacherId = req.user.userId;

    const presetAnswer = await PresetAnswerModel.findById(presetAnswerId);
    if (!presetAnswer) {
      return res.status(404).json({ error: 'Preset answer not found' });
    }

    // Get question to verify ownership
    const question = await QuestionModel.findById(presetAnswer.question_id);
    const quiz = await QuizModel.findByIdAndTeacher(question.quiz_id, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await PresetAnswerModel.delete(presetAnswerId);

    res.json({
      success: true,
      message: 'Preset answer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
