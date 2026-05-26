# Image-Based Question Extraction (OCR) - Implementation Guide

## Overview
Teachers can now upload images of question papers (exam papers, screenshots, handwritten notes) to automatically extract questions and options using Tesseract OCR technology.

## Features Implemented

### 1. **Backend Setup**
- **Controller**: `server/src/controllers/ocrController.js`
  - `extractQuestionsFromImage()` - Processes uploaded images and extracts text
  - `validateExtractedQuestions()` - Validates extracted questions before saving
  
- **Parser Utility**: `server/src/utils/ocrParser.js`
  - Parses OCR text to identify questions and options
  - Detects question types (MCQ vs Descriptive)
  - Supports multiple question formats: Q1., Q.1, 1., etc.
  - Supports multiple option formats: (A), (B), a), b), 1), 2), i), ii), etc.
  - Extracts marks/points information

- **Routes**: `server/src/routes/ocrRoutes.js`
  - `POST /api/ocr/extract-questions` - Upload image and extract questions
  - `POST /api/ocr/validate-questions` - Validate extracted questions

- **Image Processing**
  - Uses Sharp library to enhance images for better OCR accuracy
  - Converts to grayscale, normalizes, and enhances before OCR
  - Supports JPG, PNG, and PDF formats

### 2. **Frontend Component**
- **Component**: `client/src/components/ExtractQuestionsFromImage.jsx`
  - Upload image interface
  - Real-time preview of uploaded image
  - OCR text extraction display
  - Manual editing of extracted questions
  - Add/remove/edit options
  - Mark correct answers for MCQ
  - Support for both MCQ and Descriptive questions

### 3. **Integration with ManageQuestions**
- Added "Extract from Image" button in quiz management header
- Modal dialog for OCR workflow
- Bulk question import with success/failure tracking
- Seamless integration with existing question management

## How It Works

### For Teachers:

1. **Navigate to Manage Questions**
   - Go to a quiz and click "Manage Questions"

2. **Click "Extract from Image"**
   - Opens the OCR extraction modal
   - Upload an image of a question paper

3. **Review Extracted Questions**
   - System automatically extracts questions and options
   - Review raw OCR text if needed
   - Edit questions, options, and marks as needed

4. **Save Questions**
   - Click "Save & Use These Questions"
   - Questions are bulk-imported to the quiz

## Supported Question Formats

### Question Number Patterns:
```
Q1. Question text...
Q.1 Question text...
1. Question text...
```

### Option Patterns (MCQ):
```
(A) Option text
a) Option text
1) Option text
i) Option text
(1) Option text
```

### Marks/Points:
```
Q1. Question? (2 marks)
Q1. Question? (2 points)
```

## Installation & Setup

### Prerequisites
```bash
# Backend dependencies (already installed)
- tesseract.js (npm package for Node.js OCR)
- sharp (image processing)

# Frontend dependencies (already installed)
- tesseract.js
```

### Verify Installation
```bash
cd server && npm list tesseract.js sharp
cd client && npm list tesseract.js
```

## API Endpoints

### Extract Questions
```
POST /api/ocr/extract-questions
Headers: Authorization: Bearer <token>
Body: multipart/form-data with 'image' file

Response:
{
  success: true,
  rawText: "extracted text...",
  questions: [
    {
      id: 1,
      question: "What is 2+2?",
      type: "MCQ",
      options: [
        { label: "A", text: "4", isCorrect: true },
        { label: "B", text: "5", isCorrect: false },
        ...
      ],
      marks: 1
    }
  ]
}
```

### Validate Questions
```
POST /api/ocr/validate-questions
Headers: Authorization: Bearer <token>
Body: {
  questions: [{ question: "...", type: "MCQ", ... }]
}

Response:
{
  success: true,
  questions: [validated questions with isValid flag]
}
```

## File Structure

```
server/
├── src/
│   ├── controllers/
│   │   └── ocrController.js (NEW)
│   ├── routes/
│   │   └── ocrRoutes.js (NEW)
│   └── utils/
│       └── ocrParser.js (NEW)

client/
└── src/
    └── components/
        └── ExtractQuestionsFromImage.jsx (NEW)
```

## Usage Example

### Manual Question Addition (Existing Flow)
Still works as before - teachers can add questions one by one.

### Bulk Import (New Flow)
1. Click "Extract from Image" button
2. Upload question paper image
3. Edit any misdetected questions
4. Click "Save & Use These Questions"
5. All questions automatically added to quiz

## Limitations & Notes

1. **OCR Accuracy**
   - Handwritten notes may have lower accuracy
   - Clear, printed text works best
   - Images should be well-lit and in focus

2. **Question Detection**
   - Questions must follow standard numbering patterns
   - Options must use common formats
   - Multi-line questions are supported

3. **Manual Editing**
   - After extraction, teachers can edit any question
   - Add/remove options, change marks, update text
   - Verify correct answers before saving

4. **File Size**
   - Maximum file size: 5MB (can be adjusted in upload middleware)
   - Supports: JPG, PNG, PDF

## Performance Considerations

- OCR processing may take 5-10 seconds depending on image size
- Image preprocessing is automatic and transparent
- Questions are validated before bulk insertion
- Failed insertions don't affect successful ones

## Future Enhancements

1. Support for handwriting recognition (requires specialized models)
2. Batch processing of multiple images
3. Question similarity detection to prevent duplicates
4. Auto-mapping to curriculum standards
5. Support for non-English languages
6. Image cropping for specific page regions

## Troubleshooting

### Common Issues:

**"No questions extracted"**
- Ensure image is clear and well-lit
- Check that questions follow standard formats
- Try different image formats (JPG/PNG)

**"Some questions failed to import"**
- Check individual question validation
- Ensure all required fields are filled
- Review edited questions for completeness

**"Image processing timeout"**
- Reduce image resolution
- Crop image to only question sections
- Check server logs for Tesseract errors

## Database Schema

The `questions` table already supports image_path:
```sql
CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question TEXT NOT NULL,
  topic VARCHAR(100) NOT NULL DEFAULT 'General',
  type ENUM('MCQ','DESCRIPTIVE') NOT NULL DEFAULT 'MCQ',
  image_path VARCHAR(255),
  points INT NOT NULL DEFAULT 1,
  option1 VARCHAR(255),
  option2 VARCHAR(255),
  option3 VARCHAR(255),
  option4 VARCHAR(255),
  correct_option INT,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

## Security

- All OCR endpoints require authentication
- File uploads are validated for type and size
- Processed images are cleaned up after OCR
- User can only extract questions for their own quizzes
