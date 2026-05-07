const { body, validationResult } = require('express-validator');
const UserModel = require('../models/User');
const { hashPassword, verifyPassword, generateToken } = require('../utils/helpers');

exports.register = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain letters')
    .matches(/[0-9]/)
    .withMessage('Password must contain numbers'),
  body('role').isIn(['teacher', 'student']).withMessage('Invalid role'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password, role } = req.body;

      // Check if email exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const userId = await UserModel.create(name, email, hashedPassword, role);

      // Generate token
      const token = generateToken(userId, role);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: { id: userId, name, email, role },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

exports.login = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check password
      const isMatch = await verifyPassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check status
      if (user.status === 'inactive') {
        return res.status(403).json({ error: 'Your account has been deactivated' });
      }

      // Generate token
      const token = generateToken(user.id, user.role);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
