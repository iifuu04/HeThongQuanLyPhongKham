/**
 * MedicalService Controller
 * Handles HTTP request/response for MedicalService operations
 */

import { success, created, updated, notFound, error } from '../../utils/response.js';
import MedicalServiceService from './MedicalService.service.js';

export class MedicalServiceController {
    static async getAll(req, res, next) {
        try {
            const services = await MedicalServiceService.getAllServices();
            return success(res, services, 'Services retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const service = await MedicalServiceService.getServiceById(req.params.id);
            if (!service) {
                return notFound(res, 'Service not found');
            }
            return success(res, service, 'Service retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const result = await MedicalServiceService.createService(req.body);
            if (result.success) {
                return created(res, result.data, 'Service created successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async update(req, res, next) {
        try {
            const result = await MedicalServiceService.updateService(req.params.id, req.body);
            if (result.success) {
                return updated(res, result.data, 'Service updated successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async delete(req, res, next) {
        try {
            const result = await MedicalServiceService.deleteService(req.params.id);
            if (result.success) {
                return success(res, null, 'Service deleted successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }
}

export default MedicalServiceController;
