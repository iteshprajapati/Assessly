const pool = require('../config/database');

class ClassroomModel {
  static async create(name, description, code, teacherId) {
    const [result] = await pool.query(
      'INSERT INTO classrooms (name, description, code, teacher_id) VALUES (?, ?, ?, ?)',
      [name, description, code, teacherId]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM classrooms WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async findByCode(code) {
    const [rows] = await pool.query('SELECT * FROM classrooms WHERE code = ? LIMIT 1', [code.toUpperCase()]);
    return rows[0] || null;
  }

  static async getByTeacher(teacherId) {
    const [rows] = await pool.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM classroom_students WHERE classroom_id = c.id) AS student_count,
              (SELECT COUNT(*) FROM classroom_quizzes WHERE classroom_id = c.id) AS quiz_count
       FROM classrooms c
       WHERE c.teacher_id = ?
       ORDER BY c.created_at DESC`,
      [teacherId]
    );
    return rows;
  }

  static async getByStudent(studentId) {
    const [rows] = await pool.query(
      `SELECT c.*, u.name AS teacher_name, u.email AS teacher_email,
              (SELECT COUNT(*) FROM classroom_quizzes cq JOIN quizzes q ON cq.quiz_id = q.id WHERE cq.classroom_id = c.id AND q.status = 'published') AS quiz_count
       FROM classrooms c
       JOIN classroom_students cs ON c.id = cs.classroom_id
       JOIN users u ON c.teacher_id = u.id
       WHERE cs.student_id = ?
       ORDER BY cs.joined_at DESC`,
      [studentId]
    );
    return rows;
  }

  static async delete(id) {
    await pool.query('DELETE FROM classrooms WHERE id = ?', [id]);
  }

  static async removeStudent(classroomId, studentId) {
    await pool.query(
      'DELETE FROM classroom_students WHERE classroom_id = ? AND student_id = ?',
      [classroomId, studentId]
    );
  }

  static async isStudentEnrolled(classroomId, studentId) {
    const [rows] = await pool.query(
      'SELECT id FROM classroom_students WHERE classroom_id = ? AND student_id = ? LIMIT 1',
      [classroomId, studentId]
    );
    return rows.length > 0;
  }

  static async enrollStudent(classroomId, studentId) {
    await pool.query(
      'INSERT INTO classroom_students (classroom_id, student_id) VALUES (?, ?)',
      [classroomId, studentId]
    );
  }

  static async getStudents(classroomId) {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.username, cs.joined_at
       FROM users u
       JOIN classroom_students cs ON u.id = cs.student_id
       WHERE cs.classroom_id = ?
       ORDER BY u.name ASC`,
      [classroomId]
    );
    return rows;
  }

  static async assignQuiz(classroomId, quizId) {
    await pool.query(
      'INSERT INTO classroom_quizzes (classroom_id, quiz_id) VALUES (?, ?)',
      [classroomId, quizId]
    );
  }

  static async unassignQuiz(classroomId, quizId) {
    await pool.query(
      'DELETE FROM classroom_quizzes WHERE classroom_id = ? AND quiz_id = ?',
      [classroomId, quizId]
    );
  }

  static async isQuizAssigned(classroomId, quizId) {
    const [rows] = await pool.query(
      'SELECT id FROM classroom_quizzes WHERE classroom_id = ? AND quiz_id = ? LIMIT 1',
      [classroomId, quizId]
    );
    return rows.length > 0;
  }

  static async getQuizzes(classroomId, studentId = null) {
    let query, params;
    if (studentId) {
      // Get quizzes with student attempts/score
      query = `
        SELECT q.*, cq.assigned_at,
               (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count,
               qa.id AS attempt_id, qa.status AS attempt_status, qa.submitted_at,
               r.id AS result_id, r.total_score, r.max_score, r.percentage
        FROM quizzes q
        JOIN classroom_quizzes cq ON q.id = cq.quiz_id
        LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.student_id = ?
        LEFT JOIN results r ON qa.id = r.attempt_id
        WHERE cq.classroom_id = ? AND q.status = 'published'
        ORDER BY cq.assigned_at DESC
      `;
      params = [studentId, classroomId];
    } else {
      query = `
        SELECT q.*, cq.assigned_at,
               (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count,
               (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id AND status = 'submitted') AS attempt_count
        FROM quizzes q
        JOIN classroom_quizzes cq ON q.id = cq.quiz_id
        WHERE cq.classroom_id = ?
        ORDER BY cq.assigned_at DESC
      `;
      params = [classroomId];
    }
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getClassroomStats(classroomId) {
    // Get student details and their performance on assigned quizzes
    const students = await this.getStudents(classroomId);
    const quizzes = await this.getQuizzes(classroomId);
    
    // For each student, get their attempt status and score for each quiz
    const performance = [];
    for (const student of students) {
      const [attempts] = await pool.query(
        `SELECT qa.quiz_id, r.total_score, r.max_score, r.percentage, qa.status
         FROM quiz_attempts qa
         LEFT JOIN results r ON qa.id = r.attempt_id
         WHERE qa.student_id = ? AND qa.quiz_id IN (
           SELECT quiz_id FROM classroom_quizzes WHERE classroom_id = ?
         ) AND qa.status = 'submitted'`,
        [student.id, classroomId]
      );
      
      performance.push({
        student,
        attempts
      });
    }

    return {
      quizzes,
      performance
    };
  }

  static async getAssignedQuizzesForStudent(studentId) {
    const [rows] = await pool.query(
      `SELECT DISTINCT q.*, u.name AS teacher_name, c.name AS classroom_name,
              (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count,
              qa.id AS attempt_id, qa.status AS attempt_status, qa.submitted_at,
              r.id AS result_id, r.total_score, r.max_score, r.percentage
       FROM quizzes q
       JOIN classroom_quizzes cq ON q.id = cq.quiz_id
       JOIN classrooms c ON cq.classroom_id = c.id
       JOIN classroom_students cs ON c.id = cs.classroom_id
       JOIN users u ON q.teacher_id = u.id
       LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.student_id = ?
       LEFT JOIN results r ON qa.id = r.attempt_id
       WHERE cs.student_id = ? AND q.status = 'published'
       ORDER BY cq.assigned_at DESC`,
      [studentId, studentId]
    );
    return rows;
  }
}

module.exports = ClassroomModel;
