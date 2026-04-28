/**
 * Shift Routes
 * Handles shift CRUD operations
 * Implements BR: Only ADMIN can add/edit/delete shifts
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
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const shifts = await ShiftService.getAllShifts();
    return success(res, shifts, 'Shifts retrieved successfully');
}));

// GET /api/shifts/:id - Get shift by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const shift = await ShiftService.getShiftById(req.params.id);
    if (!shift) {
        return notFound(res, 'Shift not found');
    }
    return success(res, shift, 'Shift retrieved successfully');
}));

// POST /api/shifts - Create new shift (ADMIN only)
router.post('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await ShiftService.createShift(req.body);
    if (result.success) {
        return created(res, result.data, 'Shift created successfully');
    }
    return error(res, result.message, 400);
}));

// PUT /api/shifts/:id - Update shift (ADMIN only)
router.put('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await ShiftService.updateShift(req.params.id, req.body);
    if (result.success) {
        return updated(res, result.data, 'Shift updated successfully');
    }
    return error(res, result.message, 400);
}));

// DELETE /api/shifts/:id - Delete shift (ADMIN only)
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await ShiftService.deleteShift(req.params.id);
    if (result.success) {
        return success(res, null, 'Shift deleted successfully');
    }
    return error(res, result.message, 400);
}));

export default router;
