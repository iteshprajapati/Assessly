const express = require('express');
const {
  addQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, authorize('teacher'), addQuestion);
router.get('/:quizId', authenticate, authorize('teacher'), getQuestions);
router.patch('/:id', authenticate, authorize('teacher'), updateQuestion);
router.delete('/:id', authenticate, authorize('teacher'), deleteQuestion);

module.exports = router;
