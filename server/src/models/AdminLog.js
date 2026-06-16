const pool = require('../config/database');

class AdminLogModel {
  static async create(adminId, action, targetTable = null, targetId = null, description = null, ipAddress = null, userAgent = null) {
    const [result] = await pool.query(
      `INSERT INTO admin_logs (admin_id, action, target_table, target_id, description, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [adminId, action, targetTable, targetId, description, ipAddress, userAgent]
    );
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.query(
      `SELECT al.*, u.name as admin_name, u.email as admin_email
       FROM admin_logs al
       JOIN users u ON al.admin_id = u.id
       ORDER BY al.created_at DESC`
    );
    return rows;
  }
}

module.exports = AdminLogModel;
