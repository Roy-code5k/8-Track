const express = require('express');
const { register, login, refreshToken, logout, getProfile, updateProfile, sendOtp, verifyOtpAndRegister, googleAuthUrl, googleCallback } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndRegister);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Google OAuth login
router.get('/google', googleAuthUrl);
router.get('/google/callback', googleCallback);

module.exports = router;
