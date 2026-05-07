const { body, validationResult } = require('express-validator');
const UserModel = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const users = await UserModel.getAll(role || null, status || null, search || null);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUserStatus = [
  body('status').isIn(['active', 'inactive']).withMessage('Invalid status'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { status } = req.body;

      // Prevent deactivating admin accounts
      const user = await UserModel.findById(id);
      if (user.role === 'admin') {
        return res.status(403).json({ error: 'Cannot modify admin accounts' });
      }

      await UserModel.updateStatus(id, status);

      res.json({
        success: true,
        message: `User status updated to ${status}`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting admin accounts
    const user = await UserModel.findById(id);
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin accounts' });
    }

    await UserModel.delete(id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await UserModel.getStats(id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
