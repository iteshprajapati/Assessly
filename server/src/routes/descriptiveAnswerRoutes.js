const express = require('express');
const {
  submitDescriptiveAnswer,
  getStudentAnswers,
  getUngradedAnswers,
  gradeAnswer,
  getAnswerForGrading,
  addPresetAnswer,
  getPresetAnswers,
  updatePresetAnswer,
  deletePresetAnswer,
} = require('../controllers/descriptiveAnswerController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Student routes
router.post('/submit', authenticate, authorize('student'), upload.single('image'), submitDescriptiveAnswer);
router.get('/student/:quizId', authenticate, authorize('student'), getStudentAnswers);

// Teacher routes
router.get('/ungraded/:quizId', authenticate, authorize('teacher'), getUngradedAnswers);
router.get('/grade/:answerId', authenticate, authorize('teacher'), getAnswerForGrading);
router.patch('/grade/:answerId', authenticate, authorize('teacher'), gradeAnswer);

// Preset answer routes
router.post('/preset', authenticate, authorize('teacher'), addPresetAnswer);
router.get('/preset/:questionId', authenticate, authorize('teacher'), getPresetAnswers);
router.patch('/preset/:presetAnswerId', authenticate, authorize('teacher'), updatePresetAnswer);
router.delete('/preset/:presetAnswerId', authenticate, authorize('teacher'), deletePresetAnswer);

module.exports = router;
