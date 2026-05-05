/**
 * Appointment Routes
 * Handles appointment CRUD operations
 * 
 * Permission Matrix (SRS):
 * - ADMIN: full access
 * - DOCTOR: view own appointments, start/complete examination for own appointments
 * - RECEPTIONIST: view all, check-in, cancel appointments
 * - PATIENT: create own appointments, view own appointments, cancel own SCHEDULED appointments
 * 
 * Implements BR:
 * 1. No duplicate: doctor_id + work_schedule_id + start_time
 * 2. Cannot exceed max_patients per shift
 * 3. Only valid work_schedule can be booked
 * 4. Cancel frees up the slot
 * 5. Status flow: SCHEDULED -> WAITING -> INPROGRESS -> COMPLETED
 * 6. Race condition handling with transaction + FOR UPDATE
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
// ADMIN, DOCTOR, RECEPTIONIST, PATIENT can view (filtered by role)
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'), asyncHandler(async (req, res) => {
    const { date, doctor_id, patient_id, status, from_date, to_date } = req.query;
    const filters = {};
    if (date) filters.date = date;
    if (doctor_id) filters.doctor_id = doctor_id;
    if (patient_id) filters.patient_id = patient_id;
    if (status) filters.status = status;
    if (from_date) filters.from_date = from_date;
    if (to_date) filters.to_date = to_date;

    const appointments = await AppointmentService.getAppointments(req.user, filters);
    return success(res, appointments, 'Lấy danh sách lịch hẹn thành công');
}));

// GET /api/appointments/waiting - Get waiting appointments
// ADMIN, DOCTOR, RECEPTIONIST can view
router.get('/waiting', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const appointments = await AppointmentService.getWaitingAppointments();
    return success(res, appointments, 'Lấy lịch chờ thành công');
}));

// GET /api/appointments/doctor/:doctorId - Get appointments by doctor
// ADMIN, DOCTOR, RECEPTIONIST can view
router.get('/doctor/:doctorId', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const appointments = await AppointmentService.getAppointmentsByDoctor(req.params.doctorId, req.user);
    return success(res, appointments, 'Lấy lịch hẹn theo bác sĩ thành công');
}));

// GET /api/appointments/date/:date - Get appointments by date
// ADMIN, DOCTOR, RECEPTIONIST can view
router.get('/date/:date', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const appointments = await AppointmentService.getAppointmentsByDate(req.params.date);
    return success(res, appointments, 'Lấy lịch hẹn theo ngày thành công');
}));

// GET /api/appointments/:id - Get appointment by ID
router.get('/:id', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'), asyncHandler(async (req, res) => {
    const appointment = await AppointmentService.getAppointmentById(req.params.id, req.user);
    if (!appointment) {
        return notFound(res, 'Không tìm thấy lịch hẹn');
    }
    return success(res, appointment, 'Lấy chi tiết lịch hẹn thành công');
}));

// POST /api/appointments - Create new appointment
// ADMIN, RECEPTIONIST can create for any patient; PATIENT can create for themselves
router.post('/', authorizeRoles('ADMIN', 'RECEPTIONIST', 'PATIENT'), asyncHandler(async (req, res) => {
    const result = await AppointmentService.createAppointment(req.body, req.user);
    if (result.success) {
        return created(res, result.data, 'Đặt lịch hẹn thành công');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/appointments/:id/check-in - Check in patient (SCHEDULED -> WAITING)
// ADMIN, RECEPTIONIST can check-in
router.patch('/:id/check-in', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await AppointmentService.checkInAppointment(req.params.id, req.user);
    if (result.success) {
        return updated(res, result.data, 'Check-in thành công');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/appointments/:id/start - Start examination (WAITING -> INPROGRESS)
// ADMIN, DOCTOR can start (DOCTOR only for own appointments)
router.patch('/:id/start', authorizeRoles('ADMIN', 'DOCTOR'), asyncHandler(async (req, res) => {
    const result = await AppointmentService.startExamination(req.params.id, req.user);
    if (result.success) {
        return updated(res, result.data, 'Bắt đầu khám thành công');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/appointments/:id/complete - Complete examination (INPROGRESS -> COMPLETED)
// ADMIN, DOCTOR can complete (DOCTOR only for own appointments)
router.patch('/:id/complete', authorizeRoles('ADMIN', 'DOCTOR'), asyncHandler(async (req, res) => {
    const result = await AppointmentService.completeExamination(req.params.id, req.user);
    if (result.success) {
        return updated(res, result.data, 'Hoàn tất khám thành công');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/appointments/:id/status - Update appointment status
// ADMIN, DOCTOR, RECEPTIONIST can update status
router.patch('/:id/status', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    if (!req.body.status) {
        return error(res, 'Trạng thái là bắt buộc', 400);
    }
    const result = await AppointmentService.updateAppointmentStatus(req.params.id, req.body.status, req.user);
    if (result.success) {
        return updated(res, result.data, 'Cập nhật trạng thái thành công');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/appointments/:id/cancel - Cancel appointment
// ADMIN, RECEPTIONIST can cancel any; PATIENT can cancel own SCHEDULED
router.patch('/:id/cancel', authorizeRoles('ADMIN', 'RECEPTIONIST', 'PATIENT'), asyncHandler(async (req, res) => {
    const result = await AppointmentService.cancelAppointment(req.params.id, req.user);
    if (result.success) {
        return success(res, result.data || null, 'Hủy lịch hẹn thành công');
    }
    return error(res, result.message, 400);
}));

export default router;
