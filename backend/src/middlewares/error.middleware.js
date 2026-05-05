/**
 * Error Handling Middleware
 * Centralized error handling for the application
 * NFR Security - Error handling
 */

import { AppError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.details && !isProduction && { details: err.details })
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token has expired.'
        });
    }

    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'Duplicate entry. This record already exists.'
        });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            message: 'Invalid reference. Related record does not exist.'
        });
    }

    if (err.code === 'ER_BAD_NULL_ERROR') {
        return res.status(400).json({
            success: false,
            message: 'Required field cannot be null.'
        });
    }

    if (err.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
            success: false,
            message: 'Database configuration error.'
        });
    }

    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        return res.status(500).json({
            success: false,
            message: 'Database access error.'
        });
    }

    console.error('Unhandled error:', {
        name: err.name,
        message: err.message,
        code: err.code,
        path: req.path,
        method: req.method,
        stack: isProduction ? undefined : err.stack
    });

    return res.status(500).json({
        success: false,
        message: 'Internal server error.'
    });
}

export function notFoundHandler(req, res) {
    return res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found.`
    });
}

export function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    next();
}
