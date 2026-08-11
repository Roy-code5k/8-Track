import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for OTP sending endpoints (send-otp, forgot-password)
 * Max 5 OTP requests per 15 minutes per IP
 */
export const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many OTP requests. Please try again after 15 minutes.' },
});

/**
 * Rate limiter for OTP verification endpoints (verify-otp, reset-password)
 * Max 10 verification attempts per 15 minutes per IP
 */
export const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many verification attempts. Please try again after 15 minutes.' },
});

/**
 * Rate limiter for login and registration endpoints
 * Max 10 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});
