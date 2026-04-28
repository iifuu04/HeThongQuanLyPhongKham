/**
 * Shift Controller
 * Handles HTTP request/response for Shift operations
 */

import { success, created, updated, notFound, error } from '../../utils/response.js';
import ShiftService from './Shift.service.js';

export class ShiftController {
    static async getAll(req, res, next) {
        try {
            const shifts = await ShiftService.getAllShifts();
            return success(res, shifts, 'Shifts retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const shift = await ShiftService.getShiftById(req.params.id);
            if (!shift) {
                return notFound(res, 'Shift not found');
            }
            return success(res, shift, 'Shift retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const result = await ShiftService.createShift(req.body);
            if (result.success) {
                return created(res, result.data, 'Shift created successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async update(req, res, next) {
        try {
            const result = await ShiftService.updateShift(req.params.id, req.body);
            if (result.success) {
                return updated(res, result.data, 'Shift updated successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async delete(req, res, next) {
        try {
            const result = await ShiftService.deleteShift(req.params.id);
            if (result.success) {
                return success(res, null, 'Shift deleted successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }
}

export default ShiftController;
