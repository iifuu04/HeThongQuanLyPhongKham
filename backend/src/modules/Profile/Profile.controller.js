/**
 * Profile Controller
 * Handles HTTP request/response for Profile operations
 */

import { success, created, updated, notFound, error } from '../../utils/response.js';
import ProfileService from './Profile.service.js';

export class ProfileController {
    /**
     * Get all profiles
     * GET /api/profiles
     */
    static async getAll(req, res, next) {
        try {
            const profiles = await ProfileService.getAllProfiles();
            return success(res, profiles, 'Profiles retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get profile by ID
     * GET /api/profiles/:id
     */
    static async getById(req, res, next) {
        try {
            const profile = await ProfileService.getProfileById(req.params.id);
            if (!profile) {
                return notFound(res, 'Profile not found');
            }
            return success(res, profile, 'Profile retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    /**
     * Create new profile
     * POST /api/profiles
     */
    static async create(req, res, next) {
        try {
            const result = await ProfileService.createProfile(req.body);
            if (result.success) {
                return created(res, result.data, 'Profile created successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Update profile
     * PUT /api/profiles/:id
     */
    static async update(req, res, next) {
        try {
            const result = await ProfileService.updateProfile(req.params.id, req.body);
            if (result.success) {
                return updated(res, result.data, 'Profile updated successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Toggle profile status
     * PATCH /api/profiles/:id/toggle-status
     */
    static async toggleStatus(req, res, next) {
        try {
            const result = await ProfileService.toggleProfileStatus(req.params.id);
            if (result.success) {
                return updated(res, result.data, 'Profile status updated successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Delete profile
     * DELETE /api/profiles/:id
     */
    static async delete(req, res, next) {
        try {
            const result = await ProfileService.deleteProfile(req.params.id);
            if (result.success) {
                return success(res, null, 'Profile deleted successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }
}

export default ProfileController;
