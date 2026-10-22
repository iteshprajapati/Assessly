const express = require('express');
const {
	register,
	login,
	requestOtp,
	verifyOtpRegister,
	getCurrentUser,
	checkUsername,
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/otp/request', requestOtp);
router.post('/otp/verify', verifyOtpRegister);
router.get('/check-username/:username', checkUsername);
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
