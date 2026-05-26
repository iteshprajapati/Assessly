import React, { useState } from 'react';
import api from '../services/api';

const ExtractQuestionsFromImage = ({ quizId, onQuestionsExtracted, onCancel }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [rawText, setRawText] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showRawText, setShowRawText] = useState(false);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractQuestions = async () => {
    if (!image) {
      alert('Please select an image first');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post('/ocr/extract-questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setExtractedQuestions(response.data.questions);
        setRawText(response.data.rawText);
        alert(`Extracted ${response.data.questions.length} questions from the image`);
      }
    } catch (error) {
      console.error('Error extracting questions:', error);
      alert('Error extracting questions from image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (index, field, value) => {
    const updated = [...extractedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedQuestions(updated);
  };

  const handleEditOption = (qIndex, oIndex, field, value) => {
    const updated = [...extractedQuestions];
    if (!updated[qIndex].options) updated[qIndex].options = [];
    if (!updated[qIndex].options[oIndex]) {
      updated[qIndex].options[oIndex] = {};
    }
    updated[qIndex].options[oIndex][field] = value;
    setExtractedQuestions(updated);
  };

  const handleAddOption = (qIndex) => {
    const updated = [...extractedQuestions];
    if (!updated[qIndex].options) updated[qIndex].options = [];
    updated[qIndex].options.push({
      label: String.fromCharCode(65 + updated[qIndex].options.length),
      text: '',
      isCorrect: false,
    });
    setExtractedQuestions(updated);
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const updated = [...extractedQuestions];
    updated[qIndex].options.splice(oIndex, 1);
    setExtractedQuestions(updated);
  };

  const handleSetCorrectOption = (qIndex, oIndex) => {
    const updated = [...extractedQuestions];
    updated[qIndex].options.forEach((opt, idx) => {
      opt.isCorrect = idx === oIndex;
    });
    setExtractedQuestions(updated);
  };

  const handleRemoveQuestion = (index) => {
    const updated = extractedQuestions.filter((_, i) => i !== index);
    setExtractedQuestions(updated);
  };

  const handleSaveQuestions = async () => {
    if (extractedQuestions.length === 0) {
      alert('No questions to save');
      return;
    }

    try {
      setLoading(true);
      // Validate questions
      const response = await api.post('/ocr/validate-questions', {
        questions: extractedQuestions,
      });

      if (response.data.success) {
        onQuestionsExtracted(extractedQuestions);
      }
    } catch (error) {
      console.error('Error saving questions:', error);
      alert('Error saving questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ocr-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Extract Questions from Image</h2>

      {/* Upload Section */}
      <div className="upload-section" style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Step 1: Upload Image</h3>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ marginBottom: '10px' }}
          disabled={loading}
        />

        {preview && (
          <div style={{ marginTop: '10px' }}>
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: '300px', maxHeight: '300px', border: '1px solid #ccc' }}
            />
          </div>
        )}

        <button
          onClick={handleExtractQuestions}
          disabled={!image || loading}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Extracting...' : 'Extract Questions'}
        </button>
      </div>

      {/* Raw Text Toggle */}
      {rawText && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowRawText(!showRawText)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {showRawText ? 'Hide' : 'Show'} Extracted Text
          </button>

          {showRawText && (
            <div
              style={{
                marginTop: '10px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                maxHeight: '300px',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {rawText}
            </div>
          )}
        </div>
      )}

      {/* Edit Questions Section */}
      {extractedQuestions.length > 0 && (
        <div className="edit-section" style={{ marginBottom: '30px' }}>
          <h3>Step 2: Review & Edit Questions ({extractedQuestions.length} found)</h3>

          {extractedQuestions.map((question, qIndex) => (
            <div
              key={qIndex}
              style={{
                marginBottom: '20px',
                padding: '15px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
              }}
            >
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Question {qIndex + 1}</strong>
                <button
                  onClick={() => handleRemoveQuestion(qIndex)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Question Text:
                </label>
                <textarea
                  value={question.question}
                  onChange={(e) => handleEditQuestion(qIndex, 'question', e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'Arial',
                  }}
                />
              </div>

              <div style={{ marginBottom: '10px', display: 'flex', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: 'bold' }}>Type:</label>
                  <select
                    value={question.type}
                    onChange={(e) => handleEditQuestion(qIndex, 'type', e.target.value)}
                    style={{ padding: '5px', marginLeft: '8px' }}
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="DESCRIPTIVE">Descriptive</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 'bold' }}>Marks:</label>
                  <input
                    type="number"
                    value={question.marks || 1}
                    onChange={(e) => handleEditQuestion(qIndex, 'marks', parseInt(e.target.value))}
                    style={{ padding: '5px', marginLeft: '8px', width: '60px' }}
                    min="1"
                  />
                </div>
              </div>

              {question.type === 'MCQ' && (
                <div style={{ marginTop: '15px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                    Options:
                  </label>
                  {question.options && question.options.map((option, oIndex) => (
                    <div
                      key={oIndex}
                      style={{
                        marginBottom: '10px',
                        padding: '10px',
                        backgroundColor: 'white',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={option.isCorrect || false}
                        onChange={() => handleSetCorrectOption(qIndex, oIndex)}
                        style={{ marginTop: '5px' }}
                        title="Mark as correct answer"
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleEditOption(qIndex, oIndex, 'text', e.target.value)}
                        placeholder={`Option ${option.label}`}
                        style={{
                          flex: 1,
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                        }}
                      />
                      <button
                        onClick={() => handleRemoveOption(qIndex, oIndex)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddOption(qIndex)}
                    disabled={question.options && question.options.length >= 4}
                    style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Option
                  </button>
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSaveQuestions}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Save & Use These Questions
            </button>
            <button
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractQuestionsFromImage;
