const pool = require('./database');

const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','teacher','student') NOT NULL DEFAULT 'student',
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question TEXT NOT NULL,
    topic VARCHAR(100) NOT NULL DEFAULT 'General',
    option1 VARCHAR(255) NOT NULL,
    option2 VARCHAR(255) NOT NULL,
    option3 VARCHAR(255) NOT NULL,
    option4 VARCHAR(255) NOT NULL,
    correct_option INT NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    quiz_id INT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_student_quiz (student_id, quiz_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    quiz_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option INT,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose ENUM('login','register','reset') NOT NULL DEFAULT 'login',
    expires_at DATETIME NOT NULL,
    used TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_otp_email (email),
    INDEX idx_otp_email_purpose (email, purpose),
    INDEX idx_otp_expires (expires_at)
  ) ENGINE=InnoDB;`
];

async function runMigrations() {
  const connection = await pool.getConnection();
  try {
    for (const migration of migrations) {
      await connection.query(migration);
    }

    const [indexes] = await connection.query(
      "SHOW INDEX FROM results WHERE Key_name = 'uniq_student_quiz'"
    );
    if (indexes.length === 0) {
      await connection.query(
        'ALTER TABLE results ADD UNIQUE KEY uniq_student_quiz (student_id, quiz_id)'
      );
    }

    const [topicColumn] = await connection.query(
      "SHOW COLUMNS FROM questions LIKE 'topic'"
    );
    if (topicColumn.length === 0) {
      await connection.query(
        "ALTER TABLE questions ADD COLUMN topic VARCHAR(100) NOT NULL DEFAULT 'General'"
      );
    }
    await connection.query("UPDATE questions SET topic = 'General' WHERE topic IS NULL OR topic = ''");
    console.log('✓ Database migrations completed');
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
