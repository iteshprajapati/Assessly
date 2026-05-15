const express = require('express');
const {
  addMCQQuestion,
  addDescriptiveQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// MCQ routes
router.post('/mcq', authenticate, authorize('teacher'), upload.single('image'), addMCQQuestion);

// Descriptive routes
router.post('/descriptive', authenticate, authorize('teacher'), upload.single('image'), addDescriptiveQuestion);

// Common routes
router.get('/:quizId', authenticate, authorize(['teacher', 'student']), getQuestions);
router.patch('/:id', authenticate, authorize('teacher'), upload.single('image'), updateQuestion);
router.delete('/:id', authenticate, authorize('teacher'), deleteQuestion);

module.exports = router;
