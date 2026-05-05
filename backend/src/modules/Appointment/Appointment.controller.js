/**
 * Appointment Controller
 * Handles HTTP request/response for Appointment operations
 */

import { success, created, updated, notFound, error } from '../../utils/response.js';
import AppointmentService from './Appointment.service.js';

export class AppointmentController {
    static async getAll(req, res, next) {
        try {
            const appointments = await AppointmentService.getAllAppointments();
            return success(res, appointments, 'Appointments retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const appointment = await AppointmentService.getAppointmentById(req.params.id);
            if (!appointment) {
                return notFound(res, 'Appointment not found');
            }
            return success(res, appointment, 'Appointment retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getWaiting(req, res, next) {
        try {
            const appointments = await AppointmentService.getWaitingAppointments();
            return success(res, appointments, 'Waiting appointments retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getByDoctor(req, res, next) {
        try {
            const appointments = await AppointmentService.getAppointmentsByDoctor(req.params.doctorId);
            return success(res, appointments, 'Doctor appointments retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getByPatient(req, res, next) {
        try {
            const appointments = await AppointmentService.getAppointmentsByPatient(req.params.patientId);
            return success(res, appointments, 'Patient appointments retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getByDate(req, res, next) {
        try {
            const appointments = await AppointmentService.getAppointmentsByDate(req.params.date);
            return success(res, appointments, 'Appointments retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const result = await AppointmentService.createAppointment(req.body);
            if (result.success) {
                return created(res, result.data, 'Appointment created successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async updateStatus(req, res, next) {
        try {
            const result = await AppointmentService.updateAppointmentStatus(req.params.id, req.body.status);
            if (result.success) {
                return updated(res, result.data, 'Appointment status updated successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async cancel(req, res, next) {
        try {
            const result = await AppointmentService.cancelAppointment(req.params.id);
            if (result.success) {
                return success(res, null, 'Appointment cancelled successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }
}

export default AppointmentController;
