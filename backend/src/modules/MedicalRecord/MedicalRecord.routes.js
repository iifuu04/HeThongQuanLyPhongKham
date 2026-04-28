/**
 * MedicalRecord Routes
 * Handles medical record CRUD operations
 * Implements BR:
 * - Only DOCTOR can create/update medical records
 * - Doctor can only update records for their appointments
 * - Patient can only view their own medical history
 * - RECEPTIONIST can only view necessary info, cannot edit
 * - ADMIN can view for admin purposes
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
router.get('/', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const { doctor_id, patient_id, status } = req.query;
    const filters = {};
    if (doctor_id) filters.doctor_id = doctor_id;
    if (patient_id) filters.patient_id = patient_id;
    if (status) filters.status = status;

    const records = await MedicalRecordService.getMedicalRecords(req.user, filters);
    return success(res, records, 'Medical records retrieved successfully');
}));

// GET /api/medical-records/patient/:patientId/history - Get patient medical history
router.get('/patient/:patientId/history', asyncHandler(async (req, res) => {
    const records = await MedicalRecordService.getMedicalRecordsByPatient(req.params.patientId, req.user);
    return success(res, records, 'Patient medical history retrieved successfully');
}));

// GET /api/medical-records/appointment/:appointmentId - Get medical record by appointment
router.get('/appointment/:appointmentId', asyncHandler(async (req, res) => {
    const record = await MedicalRecordService.getMedicalRecordByAppointment(req.params.appointmentId, req.user);
    if (!record) {
        return notFound(res, 'Medical record not found');
    }
    return success(res, record, 'Medical record retrieved successfully');
}));

// GET /api/medical-records/:id - Get medical record by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const record = await MedicalRecordService.getMedicalRecordById(req.params.id, req.user);
    if (!record) {
        return notFound(res, 'Medical record not found');
    }
    return success(res, record, 'Medical record retrieved successfully');
}));

// POST /api/medical-records - Create new medical record (DOCTOR only)
router.post('/', authorizeRoles('ADMIN', 'DOCTOR'), asyncHandler(async (req, res) => {
    const result = await MedicalRecordService.createMedicalRecord(req.body, req.user);
    if (result.success) {
        return created(res, result.data, 'Medical record created successfully');
    }
    return error(res, result.message, 400);
}));

// PUT /api/medical-records/:id - Update medical record (DOCTOR only)
router.put('/:id', authorizeRoles('ADMIN', 'DOCTOR'), asyncHandler(async (req, res) => {
    const result = await MedicalRecordService.updateMedicalRecord(req.params.id, req.body, req.user);
    if (result.success) {
        return updated(res, result.data, 'Medical record updated successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/medical-records/:id/finalize - Finalize medical record (DOCTOR only)
router.patch('/:id/finalize', authorizeRoles('ADMIN', 'DOCTOR'), asyncHandler(async (req, res) => {
    const result = await MedicalRecordService.finalizeMedicalRecord(req.params.id, req.user);
    if (result.success) {
        return updated(res, result.data, 'Medical record finalized successfully');
    }
    return error(res, result.message, 400);
}));

// DELETE /api/medical-records/:id - Soft delete medical record (ADMIN only)
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await MedicalRecordService.deleteMedicalRecord(req.params.id, req.user);
    if (result.success) {
        return success(res, null, 'Medical record deleted successfully');
    }
    return error(res, result.message, 400);
}));

export default router;
