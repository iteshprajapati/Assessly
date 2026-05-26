const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { parseQuestionsFromText } = require('../utils/ocrParser');

exports.extractQuestionsFromImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imagePath = req.file.path;
    
    // Preprocess image for better OCR accuracy
    const processedImagePath = path.join(
      path.dirname(imagePath),
      `processed_${Date.now()}.png`
    );

    await sharp(imagePath)
      .grayscale()
      .normalize()
      .enhance()
      .png()
      .toFile(processedImagePath);

    // Extract text using Tesseract
    const { data: { text } } = await Tesseract.recognize(
      processedImagePath,
      'eng'
    );

    // Parse extracted text to identify questions and options
    const parsedQuestions = parseQuestionsFromText(text);

    // Clean up processed image
    fs.unlinkSync(processedImagePath);

    res.json({
      success: true,
      rawText: text,
      questions: parsedQuestions,
      message: `Extracted ${parsedQuestions.length} questions from image`,
    });
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing image',
      error: error.message,
    });
  }
};

exports.validateExtractedQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions)) {
      return res.status(400).json({
        message: 'Questions must be an array',
      });
    }

    // Validate each question
    const validatedQuestions = questions.map((q, index) => ({
      ...q,
      id: q.id || index,
      isValid: Boolean(q.question && q.question.trim().length > 0),
    }));

    res.json({
      success: true,
      questions: validatedQuestions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating questions',
      error: error.message,
    });
  }
};
