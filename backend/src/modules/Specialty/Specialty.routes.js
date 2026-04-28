/**
 * Specialty Routes
 * Handles specialty CRUD operations
 */

import express from 'express';
import SpecialtyService from './Specialty.service.js';
import { success, created, updated, notFound, error } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/specialties - Get all specialties
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const specialties = await SpecialtyService.getAllSpecialties();
    return success(res, specialties, 'Specialties retrieved successfully');
}));

// GET /api/specialties/:id - Get specialty by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const specialty = await SpecialtyService.getSpecialtyById(req.params.id);
    if (!specialty) {
        return notFound(res, 'Specialty not found');
    }
    return success(res, specialty, 'Specialty retrieved successfully');
}));

// POST /api/specialties - Create new specialty
router.post('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await SpecialtyService.createSpecialty(req.body);
    if (result.success) {
        return created(res, result.data, 'Specialty created successfully');
    }
    return error(res, result.message, 400);
}));

// PUT /api/specialties/:id - Update specialty
router.put('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await SpecialtyService.updateSpecialty(req.params.id, req.body);
    if (result.success) {
        return updated(res, result.data, 'Specialty updated successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/specialties/:id/disable - Disable specialty
router.patch('/:id/disable', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await SpecialtyService.disableSpecialty(req.params.id);
    if (result.success) {
        return updated(res, result.data, 'Specialty disabled successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/specialties/:id/lock - Lock specialty (alias for disable)
router.patch('/:id/lock', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await SpecialtyService.lockSpecialty(req.params.id);
    if (result.success) {
        return updated(res, result.data, 'Specialty locked successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/specialties/:id/unlock - Unlock specialty
router.patch('/:id/unlock', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await SpecialtyService.unlockSpecialty(req.params.id);
    if (result.success) {
        return updated(res, result.data, 'Specialty unlocked successfully');
    }
    return error(res, result.message, 400);
}));

// DELETE /api/specialties/:id - Soft delete specialty
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await SpecialtyService.deleteSpecialty(req.params.id);
    if (result.success) {
        return success(res, null, 'Specialty deleted successfully');
    }
    return error(res, result.message, 400);
}));

export default router;
