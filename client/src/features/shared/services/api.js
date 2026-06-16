import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate instance for multipart/form-data (file uploads)
const fileApi = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

fileApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

fileApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  requestOtp: (data) => api.post('/auth/otp/request', data),
  verifyOtp: (data) => api.post('/auth/otp/verify', data),
  checkUsername: (username) => api.get(`/auth/check-username/${username}`),
  getCurrentUser: () => api.get('/auth/me'),
};

// User APIs
export const userAPI = {
  getAllUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUserStatus: (id, data) => api.patch(`/users/${id}/status`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserStats: (id) => api.get(`/users/${id}/stats`),
};

// Quiz APIs
export const quizAPI = {
  createQuiz: (data) => api.post('/quizzes', data),
  getQuiz: (id) => api.get(`/quizzes/${id}`),
  getQuizForAttempt: (id) => api.get(`/quizzes/${id}/attempt`),
  getTeacherQuizzes: () => api.get('/quizzes/teacher/my-quizzes'),
  getAllQuizzes: () => api.get('/quizzes/all'),
  updateQuiz: (id, data) => api.patch(`/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/quizzes/${id}`),
};

// Question APIs
export const questionAPI = {
  addMCQQuestion: (data) => {
    const formData = new FormData();
    formData.append('quizId', data.quizId);
    formData.append('question', data.question);
    formData.append('topic', data.topic || 'General');
    formData.append('option1', data.option1);
    formData.append('option2', data.option2);
    formData.append('option3', data.option3);
    formData.append('option4', data.option4);
    formData.append('correctOption', data.correctOption);
    formData.append('points', data.points || 1);
    if (data.image) {
      formData.append('image', data.image);
    }
    return fileApi.post('/questions/mcq', formData);
  },
  addDescriptiveQuestion: (data) => {
    const formData = new FormData();
    formData.append('quizId', data.quizId);
    formData.append('question', data.question);
    formData.append('topic', data.topic || 'General');
    formData.append('points', data.points || 1);
    if (data.image) {
      formData.append('image', data.image);
    }
    return fileApi.post('/questions/descriptive', formData);
  },
  addQuestion: (data) => api.post('/questions', data), // Keep for backward compatibility
  getQuestions: (quizId) => api.get(`/questions/${quizId}`),
  updateQuestion: (id, data) => api.patch(`/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
};

// Descriptive Answer APIs
export const answerAPI = {
  submitAnswer: (data) => {
    const formData = new FormData();
    formData.append('quizId', data.quizId);
    formData.append('questionId', data.questionId);
    formData.append('answerText', data.answerText);
    if (data.image) {
      formData.append('image', data.image);
    }
    return fileApi.post('/answers/submit', formData);
  },
  getStudentAnswers: (quizId) => api.get(`/answers/student/${quizId}`),
  getUngradedAnswers: (quizId) => api.get(`/answers/ungraded/${quizId}`),
  getAnswerForGrading: (answerId) => api.get(`/answers/grade/${answerId}`),
  gradeAnswer: (answerId, data) => api.patch(`/answers/grade/${answerId}`, data),
  addPresetAnswer: (data) => api.post('/answers/preset', data),
  getPresetAnswers: (questionId) => api.get(`/answers/preset/${questionId}`),
  updatePresetAnswer: (presetAnswerId, data) => api.patch(`/answers/preset/${presetAnswerId}`, data),
  deletePresetAnswer: (presetAnswerId) => api.delete(`/answers/preset/${presetAnswerId}`),
};

// Result APIs
export const resultAPI = {
  submitQuiz: (data) => api.post('/results/submit', data),
  getResult: (id) => api.get(`/results/${id}`),
  getStudentResults: () => api.get('/results/student/my-results'),
  getQuizResults: (quizId) => api.get(`/results/quiz/${quizId}/results`),
  getQuizStats: (quizId) => api.get(`/results/quiz/${quizId}/stats`),
  getQuizTopicStats: (quizId) => api.get(`/results/quiz/${quizId}/topics`),
  checkAttempted: (quizId) => api.get(`/results/check/${quizId}`),
};

export default api;
