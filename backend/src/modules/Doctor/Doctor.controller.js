/**
 * Doctor Controller
 * Handles HTTP request/response for Doctor operations
 */

import { success, created, updated, notFound, error } from '../../utils/response.js';
import DoctorService from './Doctor.service.js';

export class DoctorController {
    static async getAll(req, res, next) {
        try {
            const doctors = await DoctorService.getAllDoctors();
            return success(res, doctors, 'Doctors retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const doctor = await DoctorService.getDoctorById(req.params.id);
            if (!doctor) {
                return notFound(res, 'Doctor not found');
            }
            return success(res, doctor, 'Doctor retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const result = await DoctorService.createDoctor(req.body);
            if (result.success) {
                return created(res, result.data, 'Doctor created successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async update(req, res, next) {
        try {
            const result = await DoctorService.updateDoctor(req.params.id, req.body);
            if (result.success) {
                return updated(res, result.data, 'Doctor updated successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async delete(req, res, next) {
        try {
            const result = await DoctorService.deleteDoctor(req.params.id);
            if (result.success) {
                return success(res, null, 'Doctor deleted successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }
}

export default DoctorController;
