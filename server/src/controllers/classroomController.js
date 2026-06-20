const { body, validationResult } = require('express-validator');
const ClassroomModel = require('../db/Classroom');
const QuizModel = require('../db/Quiz');
const AdminLogModel = require('../db/AdminLog');

// Helper to generate a unique 6-character code
const generateUniqueCode = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await ClassroomModel.findByCode(code);
    if (!existing) {
      isUnique = true;
    }
  }
  return code;
};

// Create Classroom
exports.createClassroom = [
  body('name').trim().notEmpty().withMessage('Classroom name is required'),
  body('description').optional().trim(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description } = req.body;
      const teacherId = req.user?.userId;

      if (!teacherId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
      }

      const code = await generateUniqueCode();
      const classroomId = await ClassroomModel.create(name, description || '', code, teacherId);

      // Log action
      await AdminLogModel.create(
        teacherId,
        'CREATE_CLASSROOM',
        'classrooms',
        classroomId,
        `Classroom "${name}" created with code ${code}`,
        req.ip,
        req.headers['user-agent']
      );

      res.status(201).json({
        success: true,
        message: 'Classroom created successfully',
        data: {
          id: classroomId,
          name,
          description,
          code
        }
      });
    } catch (error) {
      console.error('Error creating classroom:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
];

// Get Classrooms
exports.getClassrooms = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    let classrooms = [];

    if (role === 'teacher') {
      classrooms = await ClassroomModel.getByTeacher(userId);
    } else if (role === 'student') {
      classrooms = await ClassroomModel.getByStudent(userId);
    } else {
      return res.status(403).json({ error: 'Role not allowed' });
    }

    res.json({
      success: true,
      data: classrooms
    });
  } catch (error) {
    console.error('Error getting classrooms:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get Classroom Details
exports.getClassroomDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    const classroom = await ClassroomModel.findById(id);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    if (role === 'teacher') {
      // Must be the owner
      if (classroom.teacher_id !== userId) {
        return res.status(403).json({ error: 'Access denied: You are not the teacher of this classroom' });
      }

      const { quizzes, performance } = await ClassroomModel.getClassroomStats(id);

      return res.json({
        success: true,
        data: {
          classroom,
          quizzes,
          students: performance
        }
      });
    } else if (role === 'student') {
      // Must be enrolled
      const isEnrolled = await ClassroomModel.isStudentEnrolled(id, userId);
      if (!isEnrolled) {
        return res.status(403).json({ error: 'Access denied: You are not enrolled in this classroom' });
      }

      // Fetch teacher details
      const pool = require('../config/database');
      const [teachers] = await pool.query('SELECT name, email FROM users WHERE id = ?', [classroom.teacher_id]);
      const teacher = teachers[0] || { name: 'Unknown Teacher', email: '' };

      const quizzes = await ClassroomModel.getQuizzes(id, userId);

      return res.json({
        success: true,
        data: {
          classroom: {
            ...classroom,
            teacher_name: teacher.name,
            teacher_email: teacher.email
          },
          quizzes
        }
      });
    }

    res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    console.error('Error getting classroom details:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Join Classroom (Student)
exports.joinClassroom = [
  body('code').trim().toUpperCase().notEmpty().withMessage('Classroom code is required'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { code } = req.body;
      const studentId = req.user.userId;

      const classroom = await ClassroomModel.findByCode(code);
      if (!classroom) {
        return res.status(404).json({ error: 'Classroom not found. Please verify the code.' });
      }

      const isEnrolled = await ClassroomModel.isStudentEnrolled(classroom.id, studentId);
      if (isEnrolled) {
        return res.status(400).json({ error: 'You are already enrolled in this classroom' });
      }

      await ClassroomModel.enrollStudent(classroom.id, studentId);

      // Log action
      await AdminLogModel.create(
        studentId,
        'JOIN_CLASSROOM',
        'classroom_students',
        classroom.id,
        `Student joined classroom "${classroom.name}" (ID ${classroom.id})`,
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        message: 'Successfully enrolled in the classroom',
        data: classroom
      });
    } catch (error) {
      console.error('Error joining classroom:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
];

// Assign Quiz to Classroom (Teacher)
exports.assignQuiz = async (req, res) => {
  try {
    const { id } = req.params; // classroomId
    const { quizId } = req.body;
    const teacherId = req.user.userId;

    const classroom = await ClassroomModel.findById(id);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    if (classroom.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const quiz = await QuizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Access denied: You can only assign quizzes that you created' });
    }

    const isAssigned = await ClassroomModel.isQuizAssigned(id, quizId);
    if (isAssigned) {
      return res.status(400).json({ error: 'Quiz is already assigned to this classroom' });
    }

    await ClassroomModel.assignQuiz(id, quizId);

    // Log action
    await AdminLogModel.create(
      teacherId,
      'ASSIGN_QUIZ_CLASSROOM',
      'classroom_quizzes',
      quizId,
      `Quiz ID ${quizId} assigned to Classroom ID ${id}`,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Quiz assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning quiz:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Unassign Quiz from Classroom (Teacher)
exports.unassignQuiz = async (req, res) => {
  try {
    const { id, quizId } = req.params;
    const teacherId = req.user.userId;

    const classroom = await ClassroomModel.findById(id);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    if (classroom.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const isAssigned = await ClassroomModel.isQuizAssigned(id, quizId);
    if (!isAssigned) {
      return res.status(400).json({ error: 'Quiz is not assigned to this classroom' });
    }

    await ClassroomModel.unassignQuiz(id, quizId);

    // Log action
    await AdminLogModel.create(
      teacherId,
      'UNASSIGN_QUIZ_CLASSROOM',
      'classroom_quizzes',
      quizId,
      `Quiz ID ${quizId} unassigned from Classroom ID ${id}`,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Quiz unassigned successfully'
    });
  } catch (error) {
    console.error('Error unassigning quiz:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Delete Classroom (Teacher)
exports.deleteClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.userId;

    const classroom = await ClassroomModel.findById(id);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    if (classroom.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Access denied: You are not authorized to delete this classroom' });
    }

    await ClassroomModel.delete(id);

    // Log action
    await AdminLogModel.create(
      teacherId,
      'DELETE_CLASSROOM',
      'classrooms',
      id,
      `Classroom "${classroom.name}" deleted`,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Classroom deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting classroom:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get Assigned Quizzes for Student Dashboard
exports.getAssignedQuizzesForStudent = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const quizzes = await ClassroomModel.getAssignedQuizzesForStudent(studentId);
    res.json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    console.error('Error getting student assigned quizzes:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Remove Student from Classroom (Teacher)
exports.removeStudent = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const teacherId = req.user.userId;

    const classroom = await ClassroomModel.findById(id);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    if (classroom.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Access denied: You are not authorized to manage this classroom' });
    }

    const isEnrolled = await ClassroomModel.isStudentEnrolled(id, studentId);
    if (!isEnrolled) {
      return res.status(400).json({ error: 'Student is not enrolled in this classroom' });
    }

    await ClassroomModel.removeStudent(id, studentId);

    // Log action
    await AdminLogModel.create(
      teacherId,
      'REMOVE_STUDENT_CLASSROOM',
      'classroom_students',
      studentId,
      `Student ID ${studentId} removed from Classroom ID ${id}`,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Student de-enrolled successfully'
    });
  } catch (error) {
    console.error('Error removing student:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Leave Classroom (Student)
exports.leaveClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.userId;

    const isEnrolled = await ClassroomModel.isStudentEnrolled(id, studentId);
    if (!isEnrolled) {
      return res.status(400).json({ error: 'You are not enrolled in this classroom' });
    }

    await ClassroomModel.removeStudent(id, studentId);

    // Log action
    await AdminLogModel.create(
      studentId,
      'LEAVE_CLASSROOM',
      'classroom_students',
      id,
      `Student left classroom ID ${id}`,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Successfully left the classroom'
    });
  } catch (error) {
    console.error('Error leaving classroom:', error.message);
    res.status(500).json({ error: error.message });
  }
};
