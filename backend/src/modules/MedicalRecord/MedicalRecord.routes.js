/**
 * MedicalRecord Routes
 * Handles medical record CRUD operations
 * 
 * Permission Matrix (SRS):
 * - ADMIN: full access (view all, create, update, delete)
 * - DOCTOR: create, update medical records for own appointments; view all records
 * - RECEPTIONIST: view all records (for billing)
 * - PATIENT: view own medical history
 */

import express from 'express';
import MedicalRecordService from './MedicalRecord.service.js';
import { success, created, updated, notFound, error } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/medical-records - Get all medical records
// ADMIN, DOCTOR, RECEPTIONIST can view all
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const { doctor_id, patient_id, status } = req.query;
    const filters = {};
    if (doctor_id) filters.doctor_id = doctor_id;
    if (patient_id) filters.patient_id = patient_id;
    if (status) filters.status = status;

    const records = await MedicalRecordService.getMedicalRecords(req.user, filters);
    return success(res, records, 'Lấy danh sách bệnh án thành công');
}));

// GET /api/medical-records/patient/:patientId/history - Get patient medical history
// PATIENT can view own history; DOCTOR can view patient history; ADMIN/RECEPTIONIST can view all
router.get('/patient/:patientId/history', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'), asyncHandler(async (req, res) => {
    const records = await MedicalRecordService.getMedicalRecordsByPatient(req.params.patientId, req.user);
    return success(res, records, 'Lấy lịch sử bệnh án thành công');
}));

// GET /api/medical-records/appointment/:appointmentId - Get medical record by appointment
router.get('/appointment/:appointmentId', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'), asyncHandler(async (req, res) => {
    const record = await MedicalRecordService.getMedicalRecordByAppointment(req.params.appointmentId, req.user);
    if (!record) {
        return notFound(res, 'Không tìm thấy bệnh án');
    }
    return success(res, record, 'Lấy bệnh án thành công');
}));

// GET /api/medical-records/:id - Get medical record by ID
router.get('/:id', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'), asyncHandler(async (req, res) => {
    const record = await MedicalRecordService.getMedicalRecordById(req.params.id, req.user);
    if (!record) {
        return notFound(res, 'Không tìm thấy bệnh án');
    }
    return success(res, record, 'Lấy chi tiết bệnh án thành công');
}));

// POST /api/medical-records - Create new medical record
// ADMIN, DOCTOR can create (DOCTOR only for own appointments)
router.post('/', authorizeRoles('ADMIN', 'DOCTOR'), asyncHandler(async (req, res) => {
    const result = await MedicalRecordService.createMedicalRecord(req.body, req.user);
    if (result.success) {
        return created(res, result.data, 'Tạo bệnh án thành công');
    }
    return error(res, result.message, 400);
}));

// PUT /api/medical-records/:id - Update medical record
// ADMIN, DOCTOR can update (DOCTOR only for own records)
router.put('/:id', authorizeRoles('ADMIN', 'DOCTOR'), asyncHandler(async (req, res) => {
    const result = await MedicalRecordService.updateMedicalRecord(req.params.id, req.body, req.user);
    if (result.success) {
        return updated(res, result.data, 'Cập nhật bệnh án thành công');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/medical-records/:id/finalize - Finalize medical record
// ADMIN, DOCTOR can finalize (DOCTOR only for own records)
router.patch('/:id/finalize', authorizeRoles('ADMIN', 'DOCTOR'), asyncHandler(async (req, res) => {
    const result = await MedicalRecordService.finalizeMedicalRecord(req.params.id, req.user);
    if (result.success) {
        return updated(res, result.data, 'Hoàn tất bệnh án thành công');
    }
    return error(res, result.message, 400);
}));

// DELETE /api/medical-records/:id - Soft delete medical record
// ADMIN only
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await MedicalRecordService.deleteMedicalRecord(req.params.id, req.user);
    if (result.success) {
        return success(res, null, 'Xóa bệnh án thành công');
    }
    return error(res, result.message, 400);
}));

export default router;
