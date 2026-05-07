const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});

// Test connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✓ MySQL Database Connected');
    connection.release();
  } catch (error) {
    console.error('✗ Database Connection Error:', error.message);
    process.exit(1);
  }
})();

module.exports = pool;
