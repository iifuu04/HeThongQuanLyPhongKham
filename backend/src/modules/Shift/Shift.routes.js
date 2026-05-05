/**
 * Shift Routes
 * Handles shift CRUD operations
 * 
 * Permission Matrix (SRS):
 * - ADMIN: full access (create, read, update, delete)
 * - DOCTOR: read only
 * - RECEPTIONIST: read only
 */

import express from 'express';
import ShiftService from './Shift.service.js';
import { success, created, updated, notFound, error } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/shifts - Get all shifts
// ADMIN, DOCTOR, RECEPTIONIST can view
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const shifts = await ShiftService.getAllShifts();
    return success(res, shifts, 'Lấy danh sách ca làm việc thành công');
}));

// GET /api/shifts/:id - Get shift by ID
router.get('/:id', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const shift = await ShiftService.getShiftById(req.params.id);
    if (!shift) {
        return notFound(res, 'Không tìm thấy ca làm việc');
    }
    return success(res, shift, 'Lấy chi tiết ca làm việc thành công');
}));

// POST /api/shifts - Create new shift
// ADMIN only
router.post('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await ShiftService.createShift(req.body);
    if (result.success) {
        return created(res, result.data, 'Tạo ca làm việc thành công');
    }
    return error(res, result.message, 400);
}));

// PUT /api/shifts/:id - Update shift
// ADMIN only
router.put('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await ShiftService.updateShift(req.params.id, req.body);
    if (result.success) {
        return updated(res, result.data, 'Cập nhật ca làm việc thành công');
    }
    return error(res, result.message, 400);
}));

// DELETE /api/shifts/:id - Delete shift
// ADMIN only
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await ShiftService.deleteShift(req.params.id);
    if (result.success) {
        return success(res, null, 'Xóa ca làm việc thành công');
    }
    return error(res, result.message, 400);
}));

export default router;
