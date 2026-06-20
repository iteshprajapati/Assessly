const express = require('express');
const {
  createClassroom,
  getClassrooms,
  getClassroomDetails,
  joinClassroom,
  assignQuiz,
  unassignQuiz,
  deleteClassroom,
  getAssignedQuizzesForStudent,
  removeStudent,
  leaveClassroom
} = require('../controllers/classroomController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.post('/', authenticate, authorize('teacher'), createClassroom);
router.get('/', authenticate, getClassrooms);
router.post('/join', authenticate, authorize('student'), joinClassroom);
router.get('/student/quizzes', authenticate, authorize('student'), getAssignedQuizzesForStudent);
router.delete('/:id/leave', authenticate, authorize('student'), leaveClassroom);
router.get('/:id', authenticate, getClassroomDetails);
router.delete('/:id', authenticate, authorize('teacher'), deleteClassroom);
router.post('/:id/quizzes', authenticate, authorize('teacher'), assignQuiz);
router.delete('/:id/quizzes/:quizId', authenticate, authorize('teacher'), unassignQuiz);
router.delete('/:id/students/:studentId', authenticate, authorize('teacher'), removeStudent);

module.exports = router;
