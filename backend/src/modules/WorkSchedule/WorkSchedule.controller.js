/**
 * WorkSchedule Controller
 * Handles HTTP request/response for WorkSchedule operations
 */

import { success, created, updated, notFound, error } from '../../utils/response.js';
import WorkScheduleService from './WorkSchedule.service.js';

export class WorkScheduleController {
    static async getAll(req, res, next) {
        try {
            const schedules = await WorkScheduleService.getAllSchedules();
            return success(res, schedules, 'Work schedules retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const schedule = await WorkScheduleService.getScheduleById(req.params.id);
            if (!schedule) {
                return notFound(res, 'Work schedule not found');
            }
            return success(res, schedule, 'Work schedule retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getByDoctor(req, res, next) {
        try {
            const schedules = await WorkScheduleService.getSchedulesByDoctor(req.params.doctorId);
            return success(res, schedules, 'Doctor schedules retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getByDate(req, res, next) {
        try {
            const schedules = await WorkScheduleService.getSchedulesByDate(req.params.date);
            return success(res, schedules, 'Schedules retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const result = await WorkScheduleService.createSchedule(req.body);
            if (result.success) {
                return created(res, result.data, 'Work schedule created successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async update(req, res, next) {
        try {
            const result = await WorkScheduleService.updateSchedule(req.params.id, req.body);
            if (result.success) {
                return updated(res, result.data, 'Work schedule updated successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async delete(req, res, next) {
        try {
            const result = await WorkScheduleService.deleteSchedule(req.params.id);
            if (result.success) {
                return success(res, null, 'Work schedule deleted successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }
}

export default WorkScheduleController;
