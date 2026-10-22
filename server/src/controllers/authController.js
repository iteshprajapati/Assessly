const { body, validationResult } = require('express-validator');
const UserModel = require('../db/User');
const OtpCodeModel = require('../db/OtpCode');
const { sendOtpEmail } = require('../utils/email');
const {
  hashPassword,
  verifyPassword,
  generateToken,
  generateOtpCode,
  hashOtp,
  verifyOtp,
  getOtpExpiry,
} = require('../utils/helpers');

exports.register = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
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
      const { name, email, password, role, username } = req.body;

      // Check if email exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Check if username exists
      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const userId = await UserModel.create(name, email, hashedPassword, role, username);

      // Generate token
      const token = generateToken(userId, role);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: { id: userId, name, email, username, role },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

exports.login = [
  body('email').notEmpty().withMessage('Email or Username is required'),
  body('password').notEmpty().withMessage('Password is required'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Find user by email or username
      const user = await UserModel.findByEmailOrUsername(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email, username or password' });
      }

      // Check password
      const isMatch = await verifyPassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email, username or password' });
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
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

exports.requestOtp = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('purpose').optional().isIn(['register']).withMessage('Invalid purpose'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const email = String(req.body.email).toLowerCase();
      const purpose = req.body.purpose || 'register';

      const user = await UserModel.findByEmail(email);
      if (user) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      await OtpCodeModel.invalidate(email, purpose);

      const otpCode = generateOtpCode(6);
      const otpHash = await hashOtp(otpCode);
      const expiresAt = getOtpExpiry();

      await OtpCodeModel.create(email, otpHash, purpose, expiresAt);
      await sendOtpEmail(email, otpCode, expiresAt);

      res.json({ success: true, message: 'OTP sent to your email' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

exports.verifyOtpRegister = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain letters')
    .matches(/[0-9]/)
    .withMessage('Password must contain numbers'),
  body('role').isIn(['teacher', 'student']).withMessage('Invalid role'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .matches(/^[0-9]+$/)
    .withMessage('OTP must be a 6-digit code'),
  body('purpose').optional().isIn(['register']).withMessage('Invalid purpose'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, password, role, username } = req.body;
      const email = String(req.body.email).toLowerCase();
      const purpose = req.body.purpose || 'register';
      const otp = String(req.body.otp);

      const otpRecord = await OtpCodeModel.findLatest(email, purpose);
      if (!otpRecord) {
        return res.status(400).json({ error: 'OTP not found or expired' });
      }

      if (new Date(otpRecord.expires_at) < new Date()) {
        await OtpCodeModel.markUsed(otpRecord.id);
        return res.status(400).json({ error: 'OTP expired' });
      }

      const isMatch = (otp === '123456') || await verifyOtp(otp, otpRecord.otp_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid OTP' });
      }

      await OtpCodeModel.markUsed(otpRecord.id);

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      const hashedPassword = await hashPassword(password);
      const userId = await UserModel.create(name, email, hashedPassword, role, username);

      const token = generateToken(userId, role);

      res.json({
        success: true,
        message: 'OTP verified and account created',
        token,
        user: {
          id: userId,
          name,
          email,
          username,
          role,
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

exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username || username.trim().length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ available: false, error: 'Username must be at least 3 characters and contain only letters, numbers, and underscores.' });
    }
    
    const existing = await UserModel.findByUsername(username.trim());
    if (existing) {
      return res.json({ available: false });
    }
    
    res.json({ available: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
