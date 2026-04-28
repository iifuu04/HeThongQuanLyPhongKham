/**
 * WorkSchedule Routes
 * Handles work schedule CRUD operations
 * Implements BR: Only ADMIN can add/edit/delete work schedules
 */

import express from 'express';
import WorkScheduleService from './WorkSchedule.service.js';
import { success, created, updated, notFound, error } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/work-schedules - Get all work schedules with optional filters
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const { doctor_id, work_date, specialty_id, clinic_id } = req.query;
    const filters = {};
    if (doctor_id) filters.doctor_id = doctor_id;
    if (work_date) filters.work_date = work_date;
    if (specialty_id) filters.specialty_id = specialty_id;
    if (clinic_id) filters.clinic_id = clinic_id;

    const schedules = await WorkScheduleService.getSchedulesByFilters(filters);
    return success(res, schedules, 'Work schedules retrieved successfully');
}));

// GET /api/work-schedules/:id - Get work schedule by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const schedule = await WorkScheduleService.getScheduleById(req.params.id);
    if (!schedule) {
        return notFound(res, 'Work schedule not found');
    }
    return success(res, schedule, 'Work schedule retrieved successfully');
}));

// GET /api/work-schedules/doctor/:doctorId - Get schedules by doctor
router.get('/doctor/:doctorId', asyncHandler(async (req, res) => {
    const schedules = await WorkScheduleService.getSchedulesByDoctor(req.params.doctorId);
    return success(res, schedules, 'Doctor schedules retrieved successfully');
}));

// GET /api/work-schedules/date/:date - Get schedules by date
router.get('/date/:date', asyncHandler(async (req, res) => {
    const schedules = await WorkScheduleService.getSchedulesByDate(req.params.date);
    return success(res, schedules, 'Schedules retrieved successfully');
}));

// POST /api/work-schedules - Create new work schedule (ADMIN only)
router.post('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await WorkScheduleService.createSchedule(req.body);
    if (result.success) {
        return created(res, result.data, 'Work schedule created successfully');
    }
    return error(res, result.message, 400);
}));

// PUT /api/work-schedules/:id - Update work schedule (ADMIN only)
router.put('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await WorkScheduleService.updateSchedule(req.params.id, req.body);
    if (result.success) {
        return updated(res, result.data, 'Work schedule updated successfully');
    }
    return error(res, result.message, 400);
}));

// DELETE /api/work-schedules/:id - Delete work schedule (ADMIN only)
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await WorkScheduleService.deleteSchedule(req.params.id);
    if (result.success) {
        return success(res, null, 'Work schedule deleted successfully');
    }
    return error(res, result.message, 400);
}));

export default router;
