const express = require('express');
const {
  submitQuiz,
  getResult,
  getStudentResults,
  getQuizResults,
  getQuizStats,
  getQuizTopicStats,
  checkAttempted,
} = require('../controllers/resultController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.post('/submit', authenticate, authorize('student'), submitQuiz);
router.get('/student/my-results', authenticate, authorize('student'), getStudentResults);
router.get('/quiz/:quizId/results', authenticate, authorize('teacher'), getQuizResults);
router.get('/quiz/:quizId/stats', authenticate, authorize('teacher'), getQuizStats);
router.get('/quiz/:quizId/topics', authenticate, authorize('teacher'), getQuizTopicStats);
router.get('/:id', authenticate, getResult);
router.get('/check/:quizId', authenticate, authorize('student'), checkAttempted);

module.exports = router;
