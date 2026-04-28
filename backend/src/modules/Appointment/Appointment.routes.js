/**
 * Appointment Routes
 * Handles appointment CRUD operations
 * Implements BR:
 * - PATIENT or RECEPTIONIST can book appointments
 * - PATIENT only views own appointments
 * - DOCTOR only views related appointments
 * - RECEPTIONIST and ADMIN can view all appointments
 * - Status flow: SCHEDULED -> WAITING -> INPROGRESS -> COMPLETED
 */

import express from 'express';
import AppointmentService from './Appointment.service.js';
import { success, created, updated, notFound, error } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/appointments - Get appointments with filters
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'), asyncHandler(async (req, res) => {
    const { date, doctor_id, patient_id, status } = req.query;
    const filters = {};
    if (date) filters.date = date;
    if (doctor_id) filters.doctor_id = doctor_id;
    if (patient_id) filters.patient_id = patient_id;
    if (status) filters.status = status;

    const appointments = await AppointmentService.getAppointments(req.user, filters);
    return success(res, appointments, 'Appointments retrieved successfully');
}));

// GET /api/appointments/:id - Get appointment by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const appointment = await AppointmentService.getAppointmentById(req.params.id, req.user);
    if (!appointment) {
        return notFound(res, 'Appointment not found');
    }
    return success(res, appointment, 'Appointment retrieved successfully');
}));

// GET /api/appointments/waiting - Get waiting appointments
router.get('/status/waiting', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const appointments = await AppointmentService.getWaitingAppointments();
    return success(res, appointments, 'Waiting appointments retrieved successfully');
}));

// GET /api/appointments/doctor/:doctorId - Get appointments by doctor
router.get('/doctor/:doctorId', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const appointments = await AppointmentService.getAppointmentsByDoctor(req.params.doctorId, req.user);
    return success(res, appointments, 'Doctor appointments retrieved successfully');
}));

// GET /api/appointments/patient/:patientId - Get appointments by patient
router.get('/patient/:patientId', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const appointments = await AppointmentService.getAppointmentsByPatient(req.params.patientId, req.user);
    return success(res, appointments, 'Patient appointments retrieved successfully');
}));

// GET /api/appointments/date/:date - Get appointments by date
router.get('/date/:date', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const appointments = await AppointmentService.getAppointmentsByDate(req.params.date);
    return success(res, appointments, 'Appointments retrieved successfully');
}));

// POST /api/appointments - Create new appointment
router.post('/', authorizeRoles('ADMIN', 'RECEPTIONIST', 'PATIENT'), asyncHandler(async (req, res) => {
    const result = await AppointmentService.createAppointment(req.body, req.user);
    if (result.success) {
        return created(res, result.data, 'Appointment created successfully');
    }
    return error(res, result.message, 400);
}));

// PUT /api/appointments/:id - Update appointment
router.put('/:id', authorizeRoles('ADMIN', 'RECEPTIONIST', 'PATIENT'), asyncHandler(async (req, res) => {
    const result = await AppointmentService.updateAppointment(req.params.id, req.body, req.user);
    if (result.success) {
        return updated(res, result.data, 'Appointment updated successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/appointments/:id/cancel - Cancel appointment
router.patch('/:id/cancel', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'), asyncHandler(async (req, res) => {
    const result = await AppointmentService.cancelAppointment(req.params.id, req.user);
    if (result.success) {
        return success(res, result.data || null, result.message || 'Appointment cancelled successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/appointments/:id/check-in - Check in patient
router.patch('/:id/check-in', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await AppointmentService.checkInAppointment(req.params.id, req.user);
    if (result.success) {
        return updated(res, result.data, 'Patient checked in successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/appointments/:id/status - Update appointment status
router.patch('/:id/status', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    if (!req.body.status) {
        return error(res, 'Status is required', 400);
    }
    const result = await AppointmentService.updateAppointmentStatus(req.params.id, req.body.status, req.user);
    if (result.success) {
        return updated(res, result.data, 'Appointment status updated successfully');
    }
    return error(res, result.message, 400);
}));

export default router;
