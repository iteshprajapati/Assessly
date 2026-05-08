const express = require('express');
const {
	register,
	login,
	requestOtp,
	verifyOtpRegister,
	getCurrentUser,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/otp/request', requestOtp);
router.post('/otp/verify', verifyOtpRegister);
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
