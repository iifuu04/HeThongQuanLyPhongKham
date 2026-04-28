/**
 * Doctor Routes
 * Handles doctor CRUD operations
 * Implements BR:
 * - Only ADMIN can add/edit/delete/disable doctors
 * - Each doctor has unique ID
 * - Doctor must be linked with Profile role DOCTOR
 * - Doctor must be linked with valid Specialty
 */

import express from 'express';
import DoctorService from './Doctor.service.js';
import { success, created, updated, notFound, error } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/doctors - Get all doctors
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const includeInactive = req.query.include_inactive === 'true';
    const doctors = await DoctorService.getAllDoctors(includeInactive);
    return success(res, doctors, 'Doctors retrieved successfully');
}));

// GET /api/doctors/specialty/:specialtyId - Get doctors by specialty
router.get('/specialty/:specialtyId', asyncHandler(async (req, res) => {
    const doctors = await DoctorService.getDoctorsBySpecialty(req.params.specialtyId);
    return success(res, doctors, 'Doctors retrieved successfully');
}));

// GET /api/doctors/:id/details - Get doctor with full details
router.get('/:id/details', asyncHandler(async (req, res) => {
    const doctor = await DoctorService.getDoctorWithDetails(req.params.id);
    if (!doctor) {
        return notFound(res, 'Doctor not found');
    }
    return success(res, doctor, 'Doctor details retrieved successfully');
}));

// GET /api/doctors/:id - Get doctor by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const doctor = await DoctorService.getDoctorById(req.params.id);
    if (!doctor) {
        return notFound(res, 'Doctor not found');
    }
    return success(res, doctor, 'Doctor retrieved successfully');
}));

// POST /api/doctors - Create new doctor (ADMIN only)
router.post('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await DoctorService.createDoctor(req.body);
    if (result.success) {
        return created(res, result.data, 'Doctor created successfully');
    }
    return error(res, result.message, 400);
}));

// PUT /api/doctors/:id - Update doctor (ADMIN only)
router.put('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await DoctorService.updateDoctor(req.params.id, req.body);
    if (result.success) {
        return updated(res, result.data, 'Doctor updated successfully');
    }
    return error(res, result.message, 400);
}));

// DELETE /api/doctors/:id - Soft delete doctor (ADMIN only)
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await DoctorService.deleteDoctor(req.params.id);
    if (result.success) {
        return success(res, null, 'Doctor deleted successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/doctors/:id/disable - Disable doctor (ADMIN only)
router.patch('/:id/disable', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await DoctorService.disableDoctor(req.params.id);
    if (result.success) {
        return updated(res, result.data, 'Doctor disabled successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/doctors/:id/enable - Enable doctor (ADMIN only)
router.patch('/:id/enable', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await DoctorService.enableDoctor(req.params.id);
    if (result.success) {
        return updated(res, result.data, 'Doctor enabled successfully');
    }
    return error(res, result.message, 400);
}));

export default router;
