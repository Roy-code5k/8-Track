import express from 'express';
import { register, login, refreshToken, logout, getProfile, updateProfile, sendOtp, verifyOtpAndRegister, googleAuthUrl, googleCallback, forgotPassword, resetPassword  } from '../controllers/authController.js';
import { protect  } from '../middleware/auth.js';
import { otpLimiter, otpVerifyLimiter, authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', otpVerifyLimiter, verifyOtpAndRegister);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', otpVerifyLimiter, resetPassword);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Google OAuth login
router.get('/google', googleAuthUrl);
router.get('/google/callback', googleCallback);

export default router;
