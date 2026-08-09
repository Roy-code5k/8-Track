import jwt from 'jsonwebtoken';

const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = {
            _id: decoded.id,
            id: decoded.id,
        };
        next();
    } catch {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

export { protect };

