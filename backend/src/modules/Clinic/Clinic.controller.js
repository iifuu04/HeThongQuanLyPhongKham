/**
 * Clinic Controller
 * Handles HTTP request/response for Clinic operations
 */

import { success, created, updated, notFound, error } from '../../utils/response.js';
import ClinicService from './Clinic.service.js';

export class ClinicController {
    static async getAll(req, res, next) {
        try {
            const clinics = await ClinicService.getAllClinics();
            return success(res, clinics, 'Clinics retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const clinic = await ClinicService.getClinicById(req.params.id);
            if (!clinic) {
                return notFound(res, 'Clinic not found');
            }
            return success(res, clinic, 'Clinic retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const result = await ClinicService.createClinic(req.body);
            if (result.success) {
                return created(res, result.data, 'Clinic created successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async update(req, res, next) {
        try {
            const result = await ClinicService.updateClinic(req.params.id, req.body);
            if (result.success) {
                return updated(res, result.data, 'Clinic updated successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async delete(req, res, next) {
        try {
            const result = await ClinicService.deleteClinic(req.params.id);
            if (result.success) {
                return success(res, null, 'Clinic deleted successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }
}

export default ClinicController;
