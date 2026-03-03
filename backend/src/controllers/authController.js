const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
const register = async (req, res) => {
    const { name, email, password, institution, branch, semester } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const user = await User.create({ name, email, password, institution, branch, semester });

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        user.refreshToken = refreshToken;
        await user.save();

        setRefreshCookie(res, refreshToken);

        return res.status(201).json({
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                institution: user.institution,
                branch: user.branch,
                semester: user.semester,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: 'Server error during registration' });
    }
};

// Login
const login = async (req, res) => {
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
        const refreshToken = generateRefreshToken(user.id);

        user.refreshToken = refreshToken;
        await user.save();

        setRefreshCookie(res, refreshToken);

        return res.json({
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                institution: user.institution,
                branch: user.branch,
                semester: user.semester,
            },
        });
    } catch {
        return res.status(500).json({ message: 'Server error during login' });
    }
};

// Refresh Token
const refreshToken = async (req, res) => {
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
const logout = async (req, res) => {
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
const getProfile = async (req, res) => {
    res.json({ user: req.user });
};

// Update Profile
const updateProfile = async (req, res) => {
    const { name, institution, branch, semester } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, institution, branch, semester },
            { new: true, runValidators: true }
        ).select('-password -refreshToken');
        res.json({ user });
    } catch {
        res.status(500).json({ message: 'Failed to update profile' });
    }
};

module.exports = { register, login, refreshToken, logout, getProfile, updateProfile };
