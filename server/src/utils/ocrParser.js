/**
 * Parse extracted OCR text to identify questions and options
 * Handles MCQ and Descriptive questions
 * Supports various formats: A/B/C/D, 1/2/3/4, i/ii/iii/iv
 */

exports.parseQuestionsFromText = (text) => {
  const questions = [];
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  let currentQuestion = null;
  let currentOptions = [];
  let lineBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Detect question number pattern (Q1., Q.1, 1., etc.)
    const questionMatch = line.match(/^(?:Q\.?\s*)?(\d+)[.):\s]+(.+)/i);
    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion) {
        currentQuestion.options = parseOptions(currentOptions);
        questions.push(currentQuestion);
      }

      currentQuestion = {
        id: questions.length + 1,
        question: questionMatch[2].trim(),
        type: 'MCQ',
        options: [],
        marks: 1,
      };
      currentOptions = [];
      lineBuffer = [];
      continue;
    }

    // Detect option pattern (A), (B), a), b), 1), 2), i), ii), etc.)
    const optionMatch = line.match(/^(?:\()?([A-Da-d]|[1-4]|[ivIV]+)\)?[\s.:]+(.+)/);
    if (optionMatch && currentQuestion) {
      currentOptions.push({
        label: optionMatch[1],
        text: optionMatch[2].trim(),
      });
      continue;
    }

    // Detect marks/points pattern
    const marksMatch = line.match(/\(?(\d+)\s*(?:marks|points|pts)\)?/i);
    if (marksMatch && currentQuestion && currentOptions.length === 0) {
      currentQuestion.marks = parseInt(marksMatch[1]);
      continue;
    }

    // Continue accumulating question text for multi-line questions
    if (currentQuestion && currentOptions.length === 0) {
      currentQuestion.question += ' ' + line;
    }
  }

  // Save last question
  if (currentQuestion) {
    currentQuestion.options = parseOptions(currentOptions);
    // If no options were found, mark as descriptive
    if (currentQuestion.options.length === 0) {
      currentQuestion.type = 'DESCRIPTIVE';
    }
    questions.push(currentQuestion);
  }

  return questions;
};

/**
 * Parse options and standardize format
 */
function parseOptions(optionsArray) {
  const parsed = [];

  for (let i = 0; i < optionsArray.length; i++) {
    parsed.push({
      label: String.fromCharCode(65 + i), // A, B, C, D
      text: optionsArray[i].text,
      isCorrect: false,
    });
  }

  // Only return options for MCQ (max 4 options)
  return parsed.slice(0, 4);
}

/**
 * Detect question type based on content
 */
exports.detectQuestionType = (question) => {
  const hasOptions = question.options && question.options.length >= 2;
  return hasOptions ? 'MCQ' : 'DESCRIPTIVE';
};

/**
 * Clean and normalize question text
 */
exports.normalizeText = (text) => {
  return text
    .replace(/[^\w\s\?\.\-\(\)]/g, '') // Remove special chars except basic punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};
