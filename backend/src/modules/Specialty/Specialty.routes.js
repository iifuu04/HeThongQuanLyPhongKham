/**
 * Specialty Routes
 * Handles specialty CRUD operations
 * 
 * Permission Matrix (SRS):
 * - ADMIN: full access (create, read, update, delete, disable/enable)
 * - DOCTOR: read only
 * - RECEPTIONIST: read only
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
// ADMIN, DOCTOR, RECEPTIONIST can view
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const specialties = await SpecialtyService.getAllSpecialties();
    return success(res, specialties, 'Lấy danh sách chuyên khoa thành công');
}));

// GET /api/specialties/:id - Get specialty by ID
router.get('/:id', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const specialty = await SpecialtyService.getSpecialtyById(req.params.id);
    if (!specialty) {
        return notFound(res, 'Không tìm thấy chuyên khoa');
    }
    return success(res, specialty, 'Lấy chi tiết chuyên khoa thành công');
}));

// POST /api/specialties - Create new specialty
// ADMIN only
router.post('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await SpecialtyService.createSpecialty(req.body);
    if (result.success) {
        return created(res, result.data, 'Tạo chuyên khoa thành công');
    }
    return error(res, result.message, 400);
}));

// PUT /api/specialties/:id - Update specialty
// ADMIN only
router.put('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await SpecialtyService.updateSpecialty(req.params.id, req.body);
    if (result.success) {
        return updated(res, result.data, 'Cập nhật chuyên khoa thành công');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/specialties/:id/disable - Disable specialty
// ADMIN only
router.patch('/:id/disable', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await SpecialtyService.disableSpecialty(req.params.id);
    if (result.success) {
        return updated(res, result.data, 'Vô hiệu hóa chuyên khoa thành công');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/specialties/:id/lock - Lock specialty
// ADMIN only
router.patch('/:id/lock', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await SpecialtyService.lockSpecialty(req.params.id);
    if (result.success) {
        return updated(res, result.data, 'Khóa chuyên khoa thành công');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/specialties/:id/unlock - Unlock specialty
// ADMIN only
router.patch('/:id/unlock', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await SpecialtyService.unlockSpecialty(req.params.id);
    if (result.success) {
        return updated(res, result.data, 'Mở khóa chuyên khoa thành công');
    }
    return error(res, result.message, 400);
}));

// DELETE /api/specialties/:id - Soft delete specialty
// ADMIN only
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await SpecialtyService.deleteSpecialty(req.params.id);
    if (result.success) {
        return success(res, null, 'Xóa chuyên khoa thành công');
    }
    return error(res, result.message, 400);
}));

export default router;
