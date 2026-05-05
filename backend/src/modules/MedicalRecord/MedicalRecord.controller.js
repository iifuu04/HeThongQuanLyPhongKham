/**
 * MedicalRecord Controller
 * Handles HTTP request/response for MedicalRecord operations
 */

import { success, created, updated, notFound, error } from '../../utils/response.js';
import MedicalRecordService from './MedicalRecord.service.js';

export class MedicalRecordController {
    static async getAll(req, res, next) {
        try {
            const records = await MedicalRecordService.getAllMedicalRecords();
            return success(res, records, 'Medical records retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const record = await MedicalRecordService.getMedicalRecordById(req.params.id);
            if (!record) {
                return notFound(res, 'Medical record not found');
            }
            return success(res, record, 'Medical record retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getByPatient(req, res, next) {
        try {
            const records = await MedicalRecordService.getMedicalRecordsByPatient(req.params.patientId);
            return success(res, records, 'Patient medical records retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getByDoctor(req, res, next) {
        try {
            const records = await MedicalRecordService.getMedicalRecordsByDoctor(req.params.doctorId);
            return success(res, records, 'Doctor medical records retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getByAppointment(req, res, next) {
        try {
            const record = await MedicalRecordService.getMedicalRecordByAppointment(req.params.appointmentId);
            if (!record) {
                return notFound(res, 'Medical record not found');
            }
            return success(res, record, 'Medical record retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const result = await MedicalRecordService.createMedicalRecord(req.body);
            if (result.success) {
                return created(res, result.data, 'Medical record created successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async update(req, res, next) {
        try {
            const result = await MedicalRecordService.updateMedicalRecord(req.params.id, req.body);
            if (result.success) {
                return updated(res, result.data, 'Medical record updated successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async finalize(req, res, next) {
        try {
            const result = await MedicalRecordService.finalizeMedicalRecord(req.params.id);
            if (result.success) {
                return updated(res, result.data, 'Medical record finalized successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }
}

export default MedicalRecordController;
