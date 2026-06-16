const { body, validationResult } = require('express-validator');
const ResultModel = require('../models/Result');
const QuizAttemptModel = require('../models/QuizAttempt');
const QuestionModel = require('../models/Question');
const AnswerModel = require('../models/Answer');
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

      // Check if student has already submitted this quiz
      const hasAttempted = await QuizAttemptModel.hasAttempted(studentId, quizId);
      if (hasAttempted) {
        await connection.rollback();
        return res.status(409).json({ error: 'Quiz already submitted' });
      }

      // Get or start active attempt
      let attempt = await QuizAttemptModel.findActiveAttempt(studentId, quizId);
      if (!attempt) {
        const attemptId = await QuizAttemptModel.startAttempt(quizId, studentId);
        attempt = await QuizAttemptModel.findById(attemptId);
      }

      const questions = await QuestionModel.getByQuiz(quizId);
      if (!questions.length) {
        await connection.rollback();
        return res.status(400).json({ error: 'Quiz has no questions' });
      }

      let mcqScore = 0;
      let mcqCount = 0;

      for (const q of questions) {
        if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
          mcqCount++;
          const selectedOptionId = answers[q.id] ? parseInt(answers[q.id]) : null;
          
          let isCorrect = false;
          if (selectedOptionId) {
            // Find option and check correctness
            const option = q.options.find(o => o.id === selectedOptionId);
            if (option && option.is_correct) {
              isCorrect = true;
              mcqScore++;
            }
          }

          // Save answer in answers table
          const existingAnswer = await AnswerModel.findByAttemptAndQuestion(attempt.id, q.id);
          if (existingAnswer) {
            await AnswerModel.update(existingAnswer.id, selectedOptionId, null, null, isCorrect, isCorrect ? 1 : 0);
          } else {
            await AnswerModel.create(attempt.id, q.id, selectedOptionId, null, null, isCorrect, isCorrect ? 1 : 0);
          }
        }
      }

      // Calculate scores
      const totalScore = mcqScore; // initially only MCQ score is graded
      const maxScore = questions.length; // 1 mark per question
      const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(2) : 0;

      // Create result
      const resultId = await ResultModel.create(
        attempt.id,
        totalScore,
        maxScore,
        mcqScore,
        0, // descriptive score initially 0
        percentage
      );

      // Submit attempt
      await QuizAttemptModel.submitAttempt(attempt.id);

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Quiz submitted successfully',
        resultId,
        score: totalScore,
        totalQuestions: questions.length,
        percentage: Math.round(percentage),
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

    // Get student answers for this attempt
    const answers = await AnswerModel.getByAttempt(result.attempt_id);

    res.json({
      success: true,
      data: {
        ...result,
        answers,
        percentage: Math.round(result.percentage),
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

    const rows = await ResultModel.getDifficultyStats(quizId);
    const data = rows.map((row) => {
      const totalAnswers = row.total_answers || 0;
      const correctAnswers = row.correct_answers || 0;
      const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
      return {
        topic: row.difficulty.toUpperCase(), // Map difficulty to topic field for frontend compatibility
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

    const hasAttempted = await QuizAttemptModel.hasAttempted(studentId, quizId);

    res.json({
      success: true,
      hasAttempted,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
