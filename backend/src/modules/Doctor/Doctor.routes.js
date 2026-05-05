/**
 * Doctor Routes
 * Handles doctor CRUD operations
 * 
 * Permission Matrix (SRS):
 * - ADMIN: full access (create, read, update, delete, disable/enable)
 * - DOCTOR: read only (view list, view details)
 * - RECEPTIONIST: read only (view list, view details for scheduling)
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
// ADMIN, DOCTOR, RECEPTIONIST can view doctor list
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const includeInactive = req.query.include_inactive === 'true';
    const doctors = await DoctorService.getAllDoctors(includeInactive);
    return success(res, doctors, 'Lấy danh sách bác sĩ thành công');
}));

// GET /api/doctors/specialty/:specialtyId - Get doctors by specialty
router.get('/specialty/:specialtyId', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const doctors = await DoctorService.getDoctorsBySpecialty(req.params.specialtyId);
    return success(res, doctors, 'Lấy danh sách bác sĩ theo chuyên khoa thành công');
}));

// GET /api/doctors/:id/details - Get doctor with full details
router.get('/:id/details', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const doctor = await DoctorService.getDoctorWithDetails(req.params.id);
    if (!doctor) {
        return notFound(res, 'Không tìm thấy bác sĩ');
    }
    return success(res, doctor, 'Lấy chi tiết bác sĩ thành công');
}));

// GET /api/doctors/:id - Get doctor by ID
router.get('/:id', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const doctor = await DoctorService.getDoctorById(req.params.id);
    if (!doctor) {
        return notFound(res, 'Không tìm thấy bác sĩ');
    }
    return success(res, doctor, 'Lấy bác sĩ thành công');
}));

// POST /api/doctors - Create new doctor
// ADMIN only
router.post('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await DoctorService.createDoctor(req.body);
    if (result.success) {
        return created(res, result.data, 'Tạo bác sĩ thành công');
    }
    return error(res, result.message, 400);
}));

// PUT /api/doctors/:id - Update doctor
// ADMIN only
router.put('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await DoctorService.updateDoctor(req.params.id, req.body);
    if (result.success) {
        return updated(res, result.data, 'Cập nhật bác sĩ thành công');
    }
    return error(res, result.message, 400);
}));

// DELETE /api/doctors/:id - Soft delete doctor
// ADMIN only
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await DoctorService.deleteDoctor(req.params.id);
    if (result.success) {
        return success(res, null, 'Xóa bác sĩ thành công');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/doctors/:id/disable - Disable doctor
// ADMIN only
router.patch('/:id/disable', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await DoctorService.disableDoctor(req.params.id);
    if (result.success) {
        return updated(res, result.data, 'Vô hiệu hóa bác sĩ thành công');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/doctors/:id/enable - Enable doctor
// ADMIN only
router.patch('/:id/enable', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await DoctorService.enableDoctor(req.params.id);
    if (result.success) {
        return updated(res, result.data, 'Kích hoạt bác sĩ thành công');
    }
    return error(res, result.message, 400);
}));

export default router;
