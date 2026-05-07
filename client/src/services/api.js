import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
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

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
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
  addQuestion: (data) => api.post('/questions', data),
  getQuestions: (quizId) => api.get(`/questions/${quizId}`),
  updateQuestion: (id, data) => api.patch(`/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
};

// Result APIs
export const resultAPI = {
  submitQuiz: (data) => api.post('/results/submit', data),
  getResult: (id) => api.get(`/results/${id}`),
  getStudentResults: () => api.get('/results/student/my-results'),
  getQuizResults: (quizId) => api.get(`/results/quiz/${quizId}/results`),
  getQuizStats: (quizId) => api.get(`/results/quiz/${quizId}/stats`),
  checkAttempted: (quizId) => api.get(`/results/check/${quizId}`),
};

export default api;
