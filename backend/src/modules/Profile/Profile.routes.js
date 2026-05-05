/**
 * Profile Routes
 * Handles account/profile CRUD operations
 * SRS UC18 - User Management
 * SRS UC19 - Role-based Access Control
 */

import express from 'express';
import ProfileService from './Profile.service.js';
import { success, created, updated, notFound, error, forbidden } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/profiles - Get all profiles (admin only)
router.get('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const profiles = await ProfileService.getAllProfiles();
    return success(res, profiles, 'Profiles retrieved successfully');
}));

// GET /api/profiles/:id - Get profile by ID
router.get('/:id', asyncHandler(async (req, res) => {
    // Users can only view their own profile, admins can view anyone
    if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(req.params.id)) {
        return forbidden(res, 'You can only view your own profile');
    }
    const profile = await ProfileService.getProfileById(req.params.id);
    if (!profile) {
        return notFound(res, 'Profile not found');
    }
    return success(res, profile, 'Profile retrieved successfully');
}));

// GET /api/profiles/role/:role - Get profiles by role (admin only)
router.get('/role/:role', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const profiles = await ProfileService.getProfilesByRole(req.params.role);
    return success(res, profiles, 'Profiles retrieved successfully');
}));

// POST /api/profiles - Create new profile (admin only)
router.post('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await ProfileService.createProfile(req.body, req.user.id);
    if (result.success) {
        return created(res, result.data, 'Profile created successfully');
    }
    return error(res, result.message, 400);
}));

// PUT /api/profiles/:id - Update profile
router.put('/:id', asyncHandler(async (req, res) => {
    // Users can only update their own profile, admins can update anyone
    if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(req.params.id)) {
        return forbidden(res, 'You can only update your own profile');
    }
    const result = await ProfileService.updateProfile(req.params.id, req.body, req.user.id);
    if (result.success) {
        return updated(res, result.data, 'Profile updated successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/profiles/:id/role - Update profile role (admin only)
router.patch('/:id/role', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await ProfileService.updateProfileRole(req.params.id, req.body.role, req.user.id);
    if (result.success) {
        return updated(res, result.data, 'Profile role updated successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/profiles/:id/status - Update profile status (lock/unlock) (admin only)
router.patch('/:id/status', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    // Cannot lock/unlock own account
    if (req.user.id === parseInt(req.params.id)) {
        return forbidden(res, 'You cannot change your own account status');
    }
    const result = await ProfileService.toggleProfileStatus(req.params.id, req.user.id);
    if (result.success) {
        return updated(res, result.data, 'Profile status updated successfully');
    }
    return error(res, result.message, 400);
}));

// DELETE /api/profiles/:id - Soft delete profile (admin only)
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    // Cannot delete own account
    if (req.user.id === parseInt(req.params.id)) {
        return forbidden(res, 'You cannot delete your own account');
    }
    const result = await ProfileService.deleteProfile(req.params.id, req.user.id);
    if (result.success) {
        return success(res, null, 'Profile deleted successfully');
    }
    return error(res, result.message, 400);
}));

export default router;
