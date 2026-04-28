/**
 * Clinic Routes
 * Handles clinic CRUD operations
 * Note: No DELETE endpoint per SRS requirements
 */

import express from 'express';
import ClinicService from './Clinic.service.js';
import { success, created, updated, notFound, error } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/clinics - Get all clinics
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const clinics = await ClinicService.getAllClinics();
    return success(res, clinics, 'Clinics retrieved successfully');
}));

// GET /api/clinics/:id - Get clinic by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const clinic = await ClinicService.getClinicById(req.params.id);
    if (!clinic) {
        return notFound(res, 'Clinic not found');
    }
    return success(res, clinic, 'Clinic retrieved successfully');
}));

// POST /api/clinics - Create new clinic
router.post('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await ClinicService.createClinic(req.body);
    if (result.success) {
        return created(res, result.data, 'Clinic created successfully');
    }
    return error(res, result.message, 400);
}));

// PUT /api/clinics/:id - Update clinic
router.put('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await ClinicService.updateClinic(req.params.id, req.body);
    if (result.success) {
        return updated(res, result.data, 'Clinic updated successfully');
    }
    return error(res, result.message, 400);
}));

export default router;
