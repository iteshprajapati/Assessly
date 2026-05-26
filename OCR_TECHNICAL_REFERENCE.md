# OCR Implementation - Technical Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│                                                                   │
│  ManageQuestions.jsx                                             │
│  └─ ExtractQuestionsFromImage.jsx                                │
│     ├─ Image Upload UI                                           │
│     ├─ OCR Processing                                            │
│     ├─ Question Editing                                          │
│     └─ Bulk Import Handler                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP POST
                           ├─ /api/ocr/extract-questions
                           └─ /api/ocr/validate-questions
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                       Backend (Node.js)                          │
│                                                                   │
│  ocrRoutes.js                                                    │
│  └─ ocrController.js                                             │
│     ├─ extractQuestionsFromImage()                               │
│     │  ├─ Image Processing (Sharp)                               │
│     │  ├─ OCR (Tesseract.js)                                    │
│     │  └─ Parser (ocrParser.js)                                  │
│     └─ validateExtractedQuestions()                              │
│                                                                   │
│  ocrParser.js                                                    │
│  └─ parseQuestionsFromText()                                     │
│     ├─ Question Number Detection                                 │
│     ├─ Option Parsing                                            │
│     ├─ Type Detection (MCQ vs Descriptive)                       │
│     └─ Marks Extraction                                          │
│                                                                   │
│  Database                                                        │
│  └─ questions table (image_path, type, question, options...)     │
└──────────────────────────────────────────────────────────────────┘
```

## File Hierarchy

```
server/
├── src/
│   ├── controllers/
│   │   ├── ocrController.js          [NEW] OCR processing logic
│   │   └── ...other controllers
│   ├── routes/
│   │   ├── ocrRoutes.js              [NEW] OCR endpoints
│   │   └── ...other routes
│   ├── utils/
│   │   ├── ocrParser.js              [NEW] Question parsing logic
│   │   └── helpers.js
│   ├── middleware/
│   │   ├── upload.js                 [USED] File upload middleware
│   │   └── auth.js
│   └── index.js                      [MODIFIED] Added ocrRoutes
│
client/
├── src/
│   ├── components/
│   │   ├── ExtractQuestionsFromImage.jsx  [NEW] OCR UI component
│   │   └── ...other components
│   ├── pages/
│   │   ├── ManageQuestions.jsx        [MODIFIED] Added OCR modal
│   │   └── ...other pages
│   └── services/
│       └── api.js
```

## Data Flow

### 1. Image Upload & Processing

```
User uploads image
    ↓
FormData sent to /api/ocr/extract-questions
    ↓
Sharp preprocessing
├─ Convert to grayscale
├─ Normalize
├─ Enhance
└─ Save as PNG
    ↓
Tesseract OCR
├─ Run OCR on processed image
├─ Extract text (OCR result)
└─ Delete processed image
    ↓
Return raw text + parsed questions
```

### 2. Question Parsing

```
Raw OCR text
    ↓
Split into lines
    ↓
For each line:
├─ Check for question number pattern → Create new question
├─ Check for option pattern → Add to current question
├─ Check for marks pattern → Set question marks
└─ Otherwise → Append to question text
    ↓
Normalize options (A/B/C/D)
    ↓
Return structured questions array
```

### 3. Bulk Import

```
User edits extracted questions
    ↓
Click "Save & Use These Questions"
    ↓
For each question:
├─ Validate data
└─ Call appropriate API:
   ├─ For MCQ: questionAPI.addMCQQuestion()
   └─ For DESCRIPTIVE: questionAPI.addDescriptiveQuestion()
    ↓
Track success/failure
    ↓
Display results & reload quiz
```

## API Contract

### Request: POST /api/ocr/extract-questions
```javascript
Headers: {
  "Authorization": "Bearer {token}",
  "Content-Type": "multipart/form-data"
}

Body: {
  image: File // Binary image file
}
```

### Response: Success (200)
```javascript
{
  success: true,
  rawText: "Q1. What is...? (2 marks)\n(A) Option 1\n...",
  questions: [
    {
      id: 1,
      question: "What is...?",
      type: "MCQ",
      marks: 2,
      options: [
        { label: "A", text: "Option 1", isCorrect: false },
        { label: "B", text: "Option 2", isCorrect: true },
        { label: "C", text: "Option 3", isCorrect: false },
        { label: "D", text: "Option 4", isCorrect: false }
      ]
    },
    ...
  ],
  message: "Extracted 5 questions from image"
}
```

### Response: Error (400/500)
```javascript
{
  success: false,
  message: "Error processing image",
  error: "Specific error message"
}
```

## Key Functions

### ocrController.extractQuestionsFromImage()
```javascript
Purpose: Main OCR processing endpoint
Input: image file (multipart/form-data)
Process:
1. Validate file exists
2. Preprocess image with Sharp
3. Run Tesseract OCR
4. Parse extracted text
5. Return results

Returns: { success, rawText, questions, message }
```

### ocrParser.parseQuestionsFromText()
```javascript
Purpose: Parse OCR text into structured questions
Input: raw text string from OCR
Process:
1. Split text into lines
2. Detect question numbers
3. Detect option patterns
4. Extract marks
5. Create question objects

Returns: Array of question objects
```

### ExtractQuestionsFromImage Component
```javascript
Props:
- quizId: string (for bulk import context)
- onQuestionsExtracted: function (callback when user clicks save)
- onCancel: function (callback to close modal)

State:
- image: File
- extractedQuestions: Array
- rawText: string
- showRawText: boolean

Methods:
- handleImageSelect: Process image file
- handleExtractQuestions: Call OCR API
- handleEditQuestion: Update question text
- handleEditOption: Update option text
- handleSaveQuestions: Validate & callback
```

## Processing Pipeline Details

### Image Preprocessing (Sharp)
```javascript
sharp(imagePath)
  .grayscale()           // Remove colors (better for text)
  .normalize()           // Adjust histogram
  .enhance()             // Increase contrast
  .png()                 // Convert to PNG
  .toFile(outputPath)
```

Why? Cleaner B&W images → Better OCR accuracy

### Question Detection Regex Patterns

```javascript
// Question number pattern
/^(?:Q\.?\s*)?(\d+)[.):\s]+(.+)/i
Matches: Q1. Q.1 Q 1 1. 1) 1: etc.

// Option pattern
/^(?:\()?([A-Da-d]|[1-4]|[ivIV]+)\)?[\s.:]+(.+)/
Matches: (A) a) 1) i) A. 1. etc.

// Marks pattern
/\(?(\d+)\s*(?:marks|points|pts)\)?/i
Matches: (2 marks) 2 marks 2 points 2 pts etc.
```

## Error Handling

### Common Errors & Recovery

```
Error: "No image file provided"
└─ Status: 400
└─ Handle: Show alert, ask user to upload

Error: "Tesseract process timeout"
└─ Status: 500
└─ Handle: Retry or suggest image quality improvement

Error: "No questions extracted"
└─ Status: 200 (still success) but questions: []
└─ Handle: Show message to user, check image format

Error: "Question insert failed"
└─ Status: From questionAPI (original endpoint)
└─ Handle: Track failure, show partial success message
```

## Performance Optimization

### Image Processing
- Compression to reasonable size before OCR
- Grayscale conversion reduces processing
- Processing happens server-side (client sends only file)

### Bulk Import
- Sequential question insertion (not parallel)
- Individual error tracking per question
- Partial success allowed

### Memory Management
- Processed images deleted immediately
- Large OCR text handled efficiently
- State cleanup on modal close

## Testing Checklist

```
Frontend Component:
☐ Image upload works (JPG, PNG, PDF)
☐ Preview image displays
☐ Extract button calls API
☐ Loading state shows
☐ Raw text toggle works
☐ Question editing works
☐ Option add/remove works
☐ Correct answer checkbox works
☐ Save validates data
☐ Cancel closes modal

Backend Endpoints:
☐ Authentication required
☐ File size validation
☐ File type validation
☐ OCR processing works
☐ Question parsing works
☐ Multiple question formats detected
☐ Multiple option formats detected
☐ Error responses proper

Integration:
☐ OCR modal opens from ManageQuestions
☐ Extracted questions bulk import
☐ Success count accurate
☐ Questions appear in list
☐ Manual editing still works
☐ Mixed manual + OCR import works
```

## Future Enhancement Hooks

### 1. Handwriting Recognition
```
Replace Tesseract with specialized model for handwritten text
Requires: ML model or cloud service integration
```

### 2. Question Duplication Detection
```
Before bulk import:
- Check similarity with existing questions
- Warn user of potential duplicates
- Option to skip/merge
```

### 3. Batch Processing
```
Allow uploading multiple images at once
Process sequentially with progress bar
```

### 4. Language Support
```
Tesseract supports 100+ languages
Add language selector to OCR modal
Pass language parameter to OCR
```

### 5. Intelligent Validation
```
- Check question text length
- Validate option count for MCQ
- Check for duplicate options
- Suggest marks based on question complexity
```

## Dependencies

### Server
- `tesseract.js`: v5+ (Node.js version)
- `sharp`: v0.30+ (Image processing)
- `express`: for routing
- `multer`: (via upload middleware)

### Client
- `tesseract.js`: v5+ (Browser version)
- `react`: for UI
- `lucide-react`: for Camera icon

## Configuration

### Environment Variables
```
# server/.env
OCR_TIMEOUT=30000           # Max OCR processing time
IMAGE_MAX_SIZE=5242880      # 5MB in bytes
UPLOAD_DIR=./uploads        # Temporary file location
```

### Middleware Configuration
See `upload.js` for file validation rules

## Debugging Tips

### Enable Verbose Logging
```javascript
// In ocrController.js
console.log('OCR started for file:', req.file.filename);
console.log('Extracted text:', text);
console.log('Parsed questions:', parsedQuestions);
```

### Test OCR Directly
```javascript
// Quick test script
const Tesseract = require('tesseract.js');
Tesseract.recognize('./test-image.jpg', 'eng')
  .then(result => console.log(result.data.text));
```

### Check Parsing Logic
```javascript
// Test parser with sample text
const { parseQuestionsFromText } = require('./ocrParser');
const testText = "Q1. Question?\n(A) Option1\n...";
const parsed = parseQuestionsFromText(testText);
console.log(JSON.stringify(parsed, null, 2));
```
