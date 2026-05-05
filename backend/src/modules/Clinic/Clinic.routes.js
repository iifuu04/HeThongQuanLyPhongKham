/**
 * Clinic Routes
 * Handles clinic CRUD operations
 * 
 * Permission Matrix (SRS):
 * - ADMIN: full access (create, read, update)
 * - DOCTOR: read only
 * - RECEPTIONIST: read only
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
// ADMIN, DOCTOR, RECEPTIONIST can view
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const clinics = await ClinicService.getAllClinics();
    return success(res, clinics, 'Lấy danh sách phòng khám thành công');
}));

// GET /api/clinics/:id - Get clinic by ID
router.get('/:id', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const clinic = await ClinicService.getClinicById(req.params.id);
    if (!clinic) {
        return notFound(res, 'Không tìm thấy phòng khám');
    }
    return success(res, clinic, 'Lấy chi tiết phòng khám thành công');
}));

// POST /api/clinics - Create new clinic
// ADMIN only
router.post('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await ClinicService.createClinic(req.body);
    if (result.success) {
        return created(res, result.data, 'Tạo phòng khám thành công');
    }
    return error(res, result.message, 400);
}));

// PUT /api/clinics/:id - Update clinic
// ADMIN only
router.put('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await ClinicService.updateClinic(req.params.id, req.body);
    if (result.success) {
        return updated(res, result.data, 'Cập nhật phòng khám thành công');
    }
    return error(res, result.message, 400);
}));

export default router;
