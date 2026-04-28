/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

/**
 * Not Found Error (404)
 */
export class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.status = 404;
        this.name = 'NotFoundError';
    }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends Error {
    constructor(message = 'Validation failed', details = null) {
        super(message);
        this.status = 400;
        this.name = 'ValidationError';
        this.details = details;
    }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends Error {
    constructor(message = 'Authentication required') {
        super(message);
        this.status = 401;
        this.name = 'AuthenticationError';
    }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends Error {
    constructor(message = 'Access denied') {
        super(message);
        this.status = 403;
        this.name = 'AuthorizationError';
    }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends Error {
    constructor(message = 'Resource conflict') {
        super(message);
        this.status = 409;
        this.name = 'ConflictError';
    }
}

/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
    console.error('Error:', {
        name: err.name,
        message: err.message,
        status: err.status,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    const status = err.status || 500;
    const response = {
        status: 'ERROR',
        message: err.message || 'Internal server error'
    };
    
    if (err.details) {
        response.details = err.details;
    }
    
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }
    
    res.status(status).json(response);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
