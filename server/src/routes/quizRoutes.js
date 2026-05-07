const express = require('express');
const {
  createQuiz,
  getQuiz,
  getQuizForAttempt,
  getTeacherQuizzes,
  getAllQuizzes,
  updateQuiz,
  deleteQuiz,
} = require('../controllers/quizController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, authorize('teacher'), createQuiz);
router.get('/teacher/my-quizzes', authenticate, authorize('teacher'), getTeacherQuizzes);
router.get('/all', authenticate, authorize(['teacher', 'student']), getAllQuizzes);
router.get('/:id', authenticate, getQuiz);
router.get('/:id/attempt', authenticate, authorize('student'), getQuizForAttempt);
router.patch('/:id', authenticate, authorize('teacher'), updateQuiz);
router.delete('/:id', authenticate, authorize('teacher'), deleteQuiz);

module.exports = router;
