const express = require('express');
const {
  submitQuiz,
  getResult,
  getStudentResults,
  getQuizResults,
  getQuizStats,
  checkAttempted,
} = require('../controllers/resultController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/submit', authenticate, authorize('student'), submitQuiz);
router.get('/student/my-results', authenticate, authorize('student'), getStudentResults);
router.get('/quiz/:quizId/results', authenticate, authorize('teacher'), getQuizResults);
router.get('/quiz/:quizId/stats', authenticate, authorize('teacher'), getQuizStats);
router.get('/:id', authenticate, getResult);
router.get('/check/:quizId', authenticate, authorize('student'), checkAttempted);

module.exports = router;
