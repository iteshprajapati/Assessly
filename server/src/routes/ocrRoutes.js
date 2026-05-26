const express = require('express');
const router = express.Router();
const ocrController = require('../controllers/ocrController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Extract questions from uploaded image
router.post(
  '/extract-questions',
  authenticate,
  upload.single('image'),
  ocrController.extractQuestionsFromImage
);

// Validate extracted questions before saving
router.post(
  '/validate-questions',
  authenticate,
  ocrController.validateExtractedQuestions
);

module.exports = router;
