/**
 * Authentication Routes
 * Handles login, logout, and token management
 * SRS UC20 - Authentication and Authorization
 * NFR Security - RBAC
 */

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Profile from '../modules/Profile/Profile.repository.js';
import AuditLog from '../modules/AuditLog/AuditLog.repository.js';
import { asyncHandler } from '../utils/errors.js';
import { success, error, unauthorized, forbidden } from '../utils/response.js';
import { authenticateToken, generateToken, JWT_SECRET } from '../middlewares/auth.middleware.js';
import { VALID_ROLES } from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * SRS UC20 - Login
 */
router.post('/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
        return error(res, 'Username and password are required', 400);
    }
    
    // Find user by username from Profiles table
    const user = await Profile.getUserByUsername(username);
    
    if (!user) {
        return unauthorized(res, 'Invalid username or password');
    }
    
    // Check if account is locked (is_deleted = 1)
    if (user.is_deleted === 1) {
        return forbidden(res, 'Account is locked');
    }
    
    // Verify password
    let isMatch = false;
    
    // Check if password_hash is bcrypt hash (starts with $2)
    if (user.password_hash && user.password_hash.startsWith('$2')) {
        // Use bcrypt.compare for hashed passwords
        isMatch = await bcrypt.compare(password, user.password_hash);
    } else if (process.env.NODE_ENV === 'development') {
        // In development mode, allow plain text comparison for demo data
        isMatch = (password === user.password_hash);
    }
    
    if (!isMatch) {
        return unauthorized(res, 'Invalid username or password');
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Log the login action
    try {
        await AuditLog.createLog({
            user_id: user.id,
            action_type: 'LOGIN',
            table_name: 'Profiles',
            record_id: user.id,
            description: 'User logged in',
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
        });
    } catch (logError) {
        console.error('Failed to create audit log:', logError);
    }
    
    // Return response without password_hash
    return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email
            }
        }
    });
}));

/**
 * POST /api/auth/logout
 * Logout user (client should discard token)
 */
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
    try {
        await AuditLog.createLog({
            user_id: req.user.id,
            action_type: 'LOGOUT',
            table_name: 'Profiles',
            record_id: req.user.id,
            description: 'User logged out',
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
        });
    } catch (logError) {
        console.error('Failed to create audit log:', logError);
    }
    
    return success(res, null, 'Logout successful');
}));

/**
 * GET /api/auth/me
 * Get current user info from token
 * SRS UC20 - View Profile
 */
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
    const user = await Profile.getUserById(req.user.id);
    
    if (!user) {
        return error(res, 'User not found', 404);
    }
    
    // Return user info without password_hash
    return success(res, {
        id: user.id,
        username: user.username,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        date_of_birth: user.date_of_birth,
        gender: user.gender
    }, 'User retrieved successfully');
}));

/**
 * GET /api/auth/roles
 * Get list of valid roles
 */
router.get('/roles', (req, res) => {
    return success(res, VALID_ROLES, 'Roles retrieved successfully');
});

export default router;
