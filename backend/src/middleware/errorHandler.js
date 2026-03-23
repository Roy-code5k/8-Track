/**
 * Global Express Error Handler
 * Attach AFTER all routes: app.use(errorHandler)
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Log the error (skip in test env)
    if (process.env.NODE_ENV !== 'test') {
        console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, {
            status: statusCode,
            message,
            stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        });
    }

    // ── Mongoose Validation Error ────────────────────────────────────────────
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const fields = Object.values(err.errors).map((e) => e.message);
        message = fields.join(', ');
    }

    // ── Mongoose Duplicate Key ───────────────────────────────────────────────
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }

    // ── Mongoose Bad ObjectId ────────────────────────────────────────────────
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // ── JWT Errors ───────────────────────────────────────────────────────────
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token has expired';
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
