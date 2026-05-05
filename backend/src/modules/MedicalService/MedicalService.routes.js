/**
 * MedicalService Routes
 * Handles medical service CRUD operations
 * 
 * Permission Matrix (SRS):
 * - ADMIN: full access (create, read, update, delete)
 * - DOCTOR: read only
 * - RECEPTIONIST: read only
 */

import express from 'express';
import MedicalServiceService from './MedicalService.service.js';
import { success, created, updated, notFound, error } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/services - Get all services
// ADMIN, DOCTOR, RECEPTIONIST can view
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;

    const services = await MedicalServiceService.getAllServices(filters);
    return success(res, services, 'Lấy danh sách dịch vụ thành công');
}));

// GET /api/services/:id - Get service by ID
router.get('/:id', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const service = await MedicalServiceService.getServiceById(req.params.id);
    if (!service) {
        return notFound(res, 'Không tìm thấy dịch vụ');
    }
    return success(res, service, 'Lấy chi tiết dịch vụ thành công');
}));

// POST /api/services - Create new service
// ADMIN only
router.post('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await MedicalServiceService.createService(req.body, req.user);
    if (result.success) {
        return created(res, result.data, 'Tạo dịch vụ thành công');
    }
    return error(res, result.message, 400);
}));

// PUT /api/services/:id - Update service
// ADMIN only
router.put('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await MedicalServiceService.updateService(req.params.id, req.body, req.user);
    if (result.success) {
        return updated(res, result.data, 'Cập nhật dịch vụ thành công');
    }
    return error(res, result.message, 400);
}));

// DELETE /api/services/:id - Delete service
// ADMIN only
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await MedicalServiceService.deleteService(req.params.id, req.user);
    if (result.success) {
        return success(res, null, 'Xóa dịch vụ thành công');
    }
    return error(res, result.message, 400);
}));

export default router;
