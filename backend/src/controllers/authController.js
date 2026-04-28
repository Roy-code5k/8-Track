import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { google  } from 'googleapis';
import User from '../models/User.js';
import Otp from '../models/OTP.js';
import { sendOtpEmail  } from '../utils/emailService.js';

const generateAccessToken = (id) =>
    jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

const generateRefreshToken = (id) =>
    jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

const setRefreshCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

// Register
const register = async (req, res, next) => {
    const { name, email, password, institution, branch, semester } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
    }

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const user = await User.create({ 
            name, email, password, institution, branch, semester,
            avatarSeed: name, // Default seed is user name
            avatarStyle: 'avataaars'
        });

        const accessToken = generateAccessToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);

        user.refreshToken = newRefreshToken;
        await user.save();

        setRefreshCookie(res, newRefreshToken);

        return res.status(201).json({
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                institution: user.institution,
                branch: user.branch,
                semester: user.semester,
                dob: user.dob,
                phone: user.phone,
                avatarStyle: user.avatarStyle,
                avatarSeed: user.avatarSeed,
            },
        });
    } catch (err) {
        return next(err);
    }
};

// Login
const login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const accessToken = generateAccessToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);

        user.refreshToken = newRefreshToken;
        await user.save();

        setRefreshCookie(res, newRefreshToken);

        return res.json({
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                institution: user.institution,
                branch: user.branch,
                semester: user.semester,
                dob: user.dob,
                phone: user.phone,
                avatarStyle: user.avatarStyle,
                avatarSeed: user.avatarSeed,
            },
        });
    } catch (err) {
        return next(err);
    }
};

// Refresh Token
const refreshToken = async (req, res, next) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
        return res.status(401).json({ message: 'No refresh token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== token) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        const newAccessToken = generateAccessToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);

        user.refreshToken = newRefreshToken;
        await user.save();

        setRefreshCookie(res, newRefreshToken);

        return res.json({ accessToken: newAccessToken });
    } catch {
        return res.status(403).json({ message: 'Refresh token expired or invalid' });
    }
};

// Logout
const logout = async (req, res, next) => {
    const token = req.cookies?.refreshToken;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            const user = await User.findById(decoded.id);
            if (user) {
                user.refreshToken = undefined;
                await user.save();
            }
        } catch {
            // Token already invalid — still clear cookie
        }
    }

    res.clearCookie('refreshToken');
    return res.json({ message: 'Logged out successfully' });
};

// Get Profile
const getProfile = async (req, res, next) => {
    res.json({ user: req.user });
};

// Update Profile
const updateProfile = async (req, res, next) => {
    const { name, institution, dob, phone, semester, avatarStyle, avatarSeed } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, institution, dob, phone, semester, avatarStyle, avatarSeed },
            { new: true, runValidators: true }
        ).select('-password -refreshToken');
        res.json({ user });
    } catch (err) {
        return next(err);
    }
};

// Send OTP for registration
const sendOtp = async (req, res, next) => {
    const { name, email, password, institution, branch, semester } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
    }

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES) || 10;
        const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

        // Remove any previous pending OTPs for this email
        await Otp.deleteMany({ email });

        await Otp.create({
            email,
            otpHash,
            userData: { name, email, password, institution, branch, semester },
            expiresAt,
        });

        await sendOtpEmail(email, otp);

        return res.status(200).json({ message: 'OTP sent to your email. It expires in ' + expiresMinutes + ' minutes.' });
    } catch (err) {
        console.error('sendOtp error:', err);
        return next(err);
    }
};

// Verify OTP and create account
const verifyOtpAndRegister = async (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    try {
        const record = await Otp.findOne({ email });
        if (!record) {
            return res.status(400).json({ message: 'OTP not found or has expired. Please request a new one.' });
        }

        if (record.expiresAt < new Date()) {
            await Otp.deleteOne({ email });
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        const isMatch = await bcrypt.compare(otp, record.otpHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        // OTP valid — create the user
        const { name, password, institution, branch, semester } = record.userData;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await Otp.deleteOne({ email });
            return res.status(409).json({ message: 'Email already registered' });
        }

        const user = await User.create({ 
            name, email, password, institution, branch, semester,
            avatarSeed: name,
            avatarStyle: 'avataaars'
        });

        const accessToken = generateAccessToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);

        user.refreshToken = newRefreshToken;
        await user.save();

        setRefreshCookie(res, newRefreshToken);

        // Cleanup the OTP record
        await Otp.deleteOne({ email });

        return res.status(201).json({
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                institution: user.institution,
                branch: user.branch,
                semester: user.semester,
                dob: user.dob,
                phone: user.phone,
                avatarStyle: user.avatarStyle,
                avatarSeed: user.avatarSeed,
            },
        });
    } catch (err) {
        console.error('verifyOtpAndRegister error:', err);
        return next(err);
    }
};

// ─── Google OAuth Login helpers ───────────────────────────────────────────────
function buildLoginOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_OAUTH_LOGIN_REDIRECT_URI,
    );
}

// GET /api/auth/google — returns the Google consent URL
const googleAuthUrl = (req, res) => {
    const oauth2Client = buildLoginOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'select_account',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
    });
    res.json({ url });
};

// GET /api/auth/google/callback — handles the redirect from Google
const googleCallback = async (req, res, next) => {
    const { code, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (error || !code) {
        return res.redirect(`${frontendUrl}/auth?error=google_cancelled`);
    }

    try {
        const oauth2Client = buildLoginOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch the user's Google profile
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: profile } = await oauth2.userinfo.get();
        // profile: { id, email, name, picture, ... }

        const { id: googleId, email, name } = profile;

        if (!email) {
            return res.redirect(`${frontendUrl}/auth?error=google_no_email`);
        }

        // Find by googleId first, then fall back to email (to link existing accounts)
        let user = await User.findOne({ googleId });
        if (!user) {
            user = await User.findOne({ email });
        }

        if (user) {
            // Link googleId if not already set
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Create a new Google-only account (no password)
            user = await User.create({ 
                name, email, googleId, 
                avatarSeed: name,
                avatarStyle: 'avataaars'
            });
        }

        const accessToken = generateAccessToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);

        user.refreshToken = newRefreshToken;
        await user.save();

        setRefreshCookie(res, newRefreshToken);

        // Redirect to frontend callback page with access token in query
        const userPayload = encodeURIComponent(JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            institution: user.institution,
            branch: user.branch,
            semester: user.semester,
            dob: user.dob,
            phone: user.phone,
            avatarStyle: user.avatarStyle,
            avatarSeed: user.avatarSeed,
        }));

        return res.redirect(
            `${frontendUrl}/auth/google/callback?token=${accessToken}&user=${userPayload}`
        );
    } catch (err) {
        console.error('Google login callback error:', err.message);
        return res.redirect(`${frontendUrl}/auth?error=google_failed`);
    }
};

export {  register, login, refreshToken, logout, getProfile, updateProfile, sendOtp, verifyOtpAndRegister, googleAuthUrl, googleCallback  };
