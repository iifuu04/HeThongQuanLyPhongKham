/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header
 * NFR Security - Authentication
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'clinic_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Extract Bearer token from Authorization header
 */
export function extractToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * Verify JWT token and attach user to request
 */
export function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
            first_name: decoded.first_name,
            last_name: decoded.last_name
        };
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired.'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
}

/**
 * Optional authentication - continue even without token
 */
export function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role,
                first_name: decoded.first_name,
                last_name: decoded.last_name
            };
        } catch (error) {
            // Token invalid but continue anyway
            req.user = null;
        }
    } else {
        req.user = null;
    }
    
    next();
}

/**
 * Generate JWT token
 */
export function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

export { JWT_SECRET, JWT_EXPIRES_IN };
