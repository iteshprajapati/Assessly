const pool = require('./database');

const tables = {
  users: `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','teacher','student') DEFAULT 'student',
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`,

  quizzes: `CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit INT DEFAULT 10,
    status ENUM('draft','published') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  questions: `CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL,
    type ENUM('MCQ','DESCRIPTIVE','TRUE_FALSE') DEFAULT 'MCQ',
    difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
    image_path VARCHAR(255) NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB;`,

  quiz_questions: `CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_id INT NOT NULL,
    question_order INT DEFAULT 1,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE (quiz_id, question_id)
  ) ENGINE=InnoDB;`,

  options: `CREATE TABLE IF NOT EXISTS options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  quiz_attempts: `CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    attempt_number INT DEFAULT 1,
    status ENUM('in_progress','submitted') DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  answers: `CREATE TABLE IF NOT EXISTS answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT NULL,
    answer_text TEXT NULL,
    image_path VARCHAR(255) NULL,
    is_correct BOOLEAN NULL,
    marks_obtained INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES options(id) ON DELETE SET NULL,
    UNIQUE (attempt_id, question_id)
  ) ENGINE=InnoDB;`,

  results: `CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    total_score INT DEFAULT 0,
    max_score INT DEFAULT 0,
    mcq_score INT DEFAULT 0,
    descriptive_score INT DEFAULT 0,
    percentage DECIMAL(5,2),
    grading_status ENUM('pending_review','fully_graded') DEFAULT 'fully_graded',
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  answer_keys: `CREATE TABLE IF NOT EXISTS answer_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    answer_text TEXT NOT NULL,
    marks INT DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  otp_codes: `CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose ENUM('login','register','reset') DEFAULT 'login',
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`,

  admin_logs: `CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(100),
    target_id INT,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  classrooms: `CREATE TABLE IF NOT EXISTS classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(10) NOT NULL UNIQUE,
    teacher_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  classroom_students: `CREATE TABLE IF NOT EXISTS classroom_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id INT NOT NULL,
    student_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (classroom_id, student_id)
  ) ENGINE=InnoDB;`,

  classroom_quizzes: `CREATE TABLE IF NOT EXISTS classroom_quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id INT NOT NULL,
    quiz_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    UNIQUE (classroom_id, quiz_id)
  ) ENGINE=InnoDB;`
};

async function runMigrations() {
  const connection = await pool.getConnection();
  try {
    // Check if the database has transitioned to the new schema
    const [rows] = await connection.query("SHOW TABLES LIKE 'quiz_questions'");
    if (rows.length === 0) {
      console.log('⚠ Legacy schema detected. Migrating database tables to the new schema...');
      
      // Drop existing tables in reverse dependency order to prevent FK violations
      const dropQueries = [
        'DROP TABLE IF EXISTS classroom_quizzes',
        'DROP TABLE IF EXISTS classroom_students',
        'DROP TABLE IF EXISTS classrooms',
        'DROP TABLE IF EXISTS admin_logs',
        'DROP TABLE IF EXISTS results',
        'DROP TABLE IF EXISTS answers',
        'DROP TABLE IF EXISTS quiz_attempts',
        'DROP TABLE IF EXISTS options',
        'DROP TABLE IF EXISTS quiz_questions',
        'DROP TABLE IF EXISTS answer_keys',
        'DROP TABLE IF EXISTS preset_answers',
        'DROP TABLE IF EXISTS student_answers',
        'DROP TABLE IF EXISTS descriptive_answers',
        'DROP TABLE IF EXISTS questions',
        'DROP TABLE IF EXISTS quizzes',
        'DROP TABLE IF EXISTS otp_codes',
        'DROP TABLE IF EXISTS users'
      ];

      for (const query of dropQueries) {
        try {
          await connection.query(query);
        } catch (e) {
          console.warn(`Note: Could not run drop query: "${query}". Message: ${e.message}`);
        }
      }
    }

    // Create tables in order
    await connection.query(tables.users);

    // Check if username column exists in users table
    const [cols] = await connection.query("SHOW COLUMNS FROM users LIKE 'username'");
    if (cols.length === 0) {
      console.log('⚠ Migration: Adding username column to users table...');
      // 1. Add it as nullable unique column first
      await connection.query("ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL UNIQUE");
      
      // 2. Populate default usernames for existing users based on email
      const [existingUsers] = await connection.query("SELECT id, email FROM users");
      for (const u of existingUsers) {
        const emailPrefix = u.email.split('@')[0];
        const cleanPrefix = emailPrefix.replace(/[^a-zA-Z0-9_]/g, '');
        // Append ID to ensure uniqueness
        const defaultUsername = `${cleanPrefix}_${u.id}`;
        await connection.query("UPDATE users SET username = ? WHERE id = ?", [defaultUsername, u.id]);
      }
      
      // 3. Make the column NOT NULL
      await connection.query("ALTER TABLE users MODIFY COLUMN username VARCHAR(50) NOT NULL UNIQUE");
      console.log('✓ Migration: Added and populated username column successfully');
    }

    await connection.query(tables.quizzes);
    await connection.query(tables.questions);
    await connection.query(tables.quiz_questions);
    await connection.query(tables.options);
    await connection.query(tables.quiz_attempts);
    await connection.query(tables.answers);
    await connection.query(tables.results);

    // Add grading_status column to results if it does not exist yet (migration guard)
    const [gradingStatusCol] = await connection.query("SHOW COLUMNS FROM results LIKE 'grading_status'");
    if (gradingStatusCol.length === 0) {
      console.log('⚠ Migration: Adding grading_status column to results table...');
      await connection.query("ALTER TABLE results ADD COLUMN grading_status ENUM('pending_review','fully_graded') NOT NULL DEFAULT 'fully_graded'");
      console.log('✓ Migration: grading_status column added successfully');
    }

    await connection.query(tables.answer_keys);
    await connection.query(tables.otp_codes);
    await connection.query(tables.admin_logs);
    await connection.query(tables.classrooms);
    await connection.query(tables.classroom_students);
    await connection.query(tables.classroom_quizzes);

    console.log('✓ Database migrations completed successfully');
  } catch (error) {
    console.error('✗ Migration Error:', error.message);
    process.exit(1);
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
