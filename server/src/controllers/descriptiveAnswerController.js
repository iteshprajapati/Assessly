const { body, validationResult } = require('express-validator');
const AnswerModel = require('../db/Answer');
const AnswerKeyModel = require('../db/AnswerKey');
const QuestionModel = require('../db/Question');
const QuizModel = require('../db/Quiz');
const ResultModel = require('../db/Result');
const QuizAttemptModel = require('../db/QuizAttempt');
const AdminLogModel = require('../db/AdminLog');
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
      const imagePath = req.file ? req.file.path : null; // Cloudinary URL

      // Verify question type
      const question = await QuestionModel.findById(questionId);
      if (!question || question.type !== 'DESCRIPTIVE') {
        return res.status(400).json({ error: 'Invalid descriptive question' });
      }

      // Fetch student's latest attempt for this quiz
      const attempts = await QuizAttemptModel.getByQuizAndStudent(quizId, studentId);
      const attempt = attempts[0];
      if (!attempt) {
        return res.status(400).json({ error: 'No active attempt found' });
      }

      const existingAnswer = await AnswerModel.findByAttemptAndQuestion(attempt.id, questionId);
      let answerId;
      if (existingAnswer) {
        // Update
        await AnswerModel.update(existingAnswer.id, null, answerText, imagePath, null, 0);
        answerId = existingAnswer.id;
      } else {
        // Create
        answerId = await AnswerModel.create(attempt.id, questionId, null, answerText, imagePath, null, 0);
      }

      res.status(201).json({
        success: true,
        message: 'Answer submitted successfully',
        answerId,
      });
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  },
];

// Get descriptive answers for student (graded)
exports.getStudentAnswers = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.userId;

    const attempts = await QuizAttemptModel.getByQuizAndStudent(quizId, studentId);
    const attempt = attempts[0];
    if (!attempt) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const allAnswers = await AnswerModel.getByAttempt(attempt.id);
    const descriptiveAnswers = allAnswers.filter(
      (a) => a.question_type === 'DESCRIPTIVE' && a.is_correct !== null
    );

    res.json({
      success: true,
      data: descriptiveAnswers,
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

    const quiz = await QuizModel.findByIdAndTeacher(quizId, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const answers = await AnswerModel.getUngradedByQuiz(quizId);

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

      // Get answer details
      const answer = await AnswerModel.findById(answerId);
      if (!answer) {
        return res.status(404).json({ error: 'Answer not found' });
      }

      // Verify quiz ownership
      const quiz = await QuizModel.findByIdAndTeacher(answer.quiz_id, teacherId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Retrieve question criteria from answer keys (to verify max marks or set marks limits)
      const answerKeys = await AnswerKeyModel.getByQuestion(answer.question_id);
      const maxMarks = answerKeys.reduce((max, key) => Math.max(max, key.marks), 0) || 10; // Default limit 10 if no preset criteria

      if (marksObtained > maxMarks) {
        return res.status(400).json({ error: `Marks cannot exceed preset maximum of ${maxMarks} points` });
      }

      const isCorrect = marksObtained > 0;

      // Update descriptive answer evaluation
      await AnswerModel.grade(answerId, marksObtained, isCorrect);

      // Re-calculate the student's result scores
      const result = await ResultModel.findByAttempt(answer.attempt_id);
      if (result) {
        const attemptAnswers = await AnswerModel.getByAttempt(answer.attempt_id);
        const descriptiveScore = attemptAnswers
          .filter((a) => a.question_type === 'DESCRIPTIVE')
          .reduce((sum, a) => sum + (a.marks_obtained || 0), 0);

        const totalScore = result.mcq_score + descriptiveScore;
        const percentage = result.max_score > 0 ? ((totalScore / result.max_score) * 100).toFixed(2) : 0;

        await ResultModel.update(result.id, totalScore, descriptiveScore, percentage);

        // Auto-publish: if no more ungraded descriptive answers remain, unlock result for student
        const ungradedCount = await ResultModel.countUngradedDescriptive(answer.attempt_id);
        if (ungradedCount === 0 && result.grading_status === 'pending_review') {
          await ResultModel.updateGradingStatus(result.id, 'fully_graded');
        }
      }

      // Log grading action
      await AdminLogModel.create(
        teacherId,
        'GRADE_ANSWER',
        'answers',
        answerId,
        `Graded descriptive answer ID ${answerId} with ${marksObtained} marks`,
        req.ip,
        req.headers['user-agent']
      );

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

    const answer = await AnswerModel.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const quiz = await QuizModel.findByIdAndTeacher(answer.quiz_id, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const presetAnswers = await AnswerKeyModel.getByQuestion(answer.question_id);

    res.json({
      success: true,
      data: {
        answer,
        presetAnswers,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add preset answer key for grading criteria
exports.addPresetAnswer = [
  body('questionId').isInt().withMessage('Question ID is required'),
  body('answerText').trim().notEmpty().withMessage('Criteria text is required'),
  body('marks').isInt({ min: 0 }).withMessage('Marks must be a non-negative integer'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { questionId, answerText, marks } = req.body;
      const teacherId = req.user.userId;

      const question = await QuestionModel.findById(questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const quiz = await QuizModel.findByIdAndTeacher(question.quiz_id, teacherId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const presetAnswerId = await AnswerKeyModel.create(questionId, answerText, marks);

      res.status(201).json({
        success: true,
        message: 'Grading criteria added successfully',
        presetAnswerId,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Get preset answer keys
exports.getPresetAnswers = async (req, res) => {
  try {
    const { questionId } = req.params;
    const teacherId = req.user.userId;

    const question = await QuestionModel.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const quiz = await QuizModel.findByIdAndTeacher(question.quiz_id, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const presetAnswers = await AnswerKeyModel.getByQuestion(questionId);

    res.json({
      success: true,
      data: presetAnswers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update preset criteria
exports.updatePresetAnswer = [
  body('answerText').trim().notEmpty().withMessage('Criteria text is required'),
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

      const presetAnswer = await AnswerKeyModel.findById(presetAnswerId);
      if (!presetAnswer) {
        return res.status(404).json({ error: 'Grading criteria not found' });
      }

      const question = await QuestionModel.findById(presetAnswer.question_id);
      const quiz = await QuizModel.findByIdAndTeacher(question.quiz_id, teacherId);
      if (!quiz) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await AnswerKeyModel.update(presetAnswerId, answerText, marks);

      res.json({
        success: true,
        message: 'Grading criteria updated successfully',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// Delete preset criteria
exports.deletePresetAnswer = async (req, res) => {
  try {
    const { presetAnswerId } = req.params;
    const teacherId = req.user.userId;

    const presetAnswer = await AnswerKeyModel.findById(presetAnswerId);
    if (!presetAnswer) {
      return res.status(404).json({ error: 'Grading criteria not found' });
    }

    const question = await QuestionModel.findById(presetAnswer.question_id);
    const quiz = await QuizModel.findByIdAndTeacher(question.quiz_id, teacherId);
    if (!quiz) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await AnswerKeyModel.delete(presetAnswerId);

    res.json({
      success: true,
      message: 'Grading criteria deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
