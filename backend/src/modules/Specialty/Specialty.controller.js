/**
 * Specialty Controller
 * Handles HTTP request/response for Specialty operations
 */

import { success, created, updated, notFound, error } from '../../utils/response.js';
import SpecialtyService from './Specialty.service.js';

export class SpecialtyController {
    static async getAll(req, res, next) {
        try {
            const specialties = await SpecialtyService.getAllSpecialties();
            return success(res, specialties, 'Specialties retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const specialty = await SpecialtyService.getSpecialtyById(req.params.id);
            if (!specialty) {
                return notFound(res, 'Specialty not found');
            }
            return success(res, specialty, 'Specialty retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const result = await SpecialtyService.createSpecialty(req.body);
            if (result.success) {
                return created(res, result.data, 'Specialty created successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async update(req, res, next) {
        try {
            const result = await SpecialtyService.updateSpecialty(req.params.id, req.body);
            if (result.success) {
                return updated(res, result.data, 'Specialty updated successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async lock(req, res, next) {
        try {
            const result = await SpecialtyService.lockSpecialty(req.params.id);
            if (result.success) {
                return updated(res, result.data, 'Specialty locked successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async unlock(req, res, next) {
        try {
            const result = await SpecialtyService.unlockSpecialty(req.params.id);
            if (result.success) {
                return updated(res, result.data, 'Specialty unlocked successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async delete(req, res, next) {
        try {
            const result = await SpecialtyService.deleteSpecialty(req.params.id);
            if (result.success) {
                return success(res, null, 'Specialty deleted successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }
}

export default SpecialtyController;
