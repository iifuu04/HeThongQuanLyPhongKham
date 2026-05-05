/**
 * Patient Controller
 * Handles HTTP request/response for Patient operations
 */

import { success, created, updated, notFound, error } from '../../utils/response.js';
import PatientService from './Patient.service.js';

export class PatientController {
    static async getAll(req, res, next) {
        try {
            const patients = await PatientService.getAllPatients();
            return success(res, patients, 'Patients retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const patient = await PatientService.getPatientById(req.params.id);
            if (!patient) {
                return notFound(res, 'Patient not found');
            }
            return success(res, patient, 'Patient retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const result = await PatientService.createPatient(req.body);
            if (result.success) {
                return created(res, result.data, 'Patient created successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async update(req, res, next) {
        try {
            const result = await PatientService.updatePatient(req.params.id, req.body);
            if (result.success) {
                return updated(res, result.data, 'Patient updated successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async delete(req, res, next) {
        try {
            const result = await PatientService.deletePatient(req.params.id);
            if (result.success) {
                return success(res, null, 'Patient deleted successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }
}

export default PatientController;
