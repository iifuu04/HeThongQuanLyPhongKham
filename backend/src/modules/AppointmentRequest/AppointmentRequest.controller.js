/**
 * AppointmentRequest Controller
 * Handles HTTP request/response for AppointmentRequest operations
 */

import { success, created, updated, notFound, error } from '../../utils/response.js';
import AppointmentRequestService from './AppointmentRequest.service.js';

export class AppointmentRequestController {
    static async getAll(req, res, next) {
        try {
            const requests = await AppointmentRequestService.getAllRequests();
            return success(res, requests, 'Requests retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const request = await AppointmentRequestService.getRequestById(req.params.id);
            if (!request) {
                return notFound(res, 'Request not found');
            }
            return success(res, request, 'Request retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getPending(req, res, next) {
        try {
            const requests = await AppointmentRequestService.getPendingRequests();
            return success(res, requests, 'Pending requests retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const result = await AppointmentRequestService.createRequest(req.body);
            if (result.success) {
                return created(res, result.data, 'Request created successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async approve(req, res, next) {
        try {
            const result = await AppointmentRequestService.approveRequest(req.params.id, req.user.id);
            if (result.success) {
                return updated(res, result.data, 'Request approved successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async reject(req, res, next) {
        try {
            const result = await AppointmentRequestService.rejectRequest(req.params.id, req.user.id);
            if (result.success) {
                return updated(res, result.data, 'Request rejected successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }
}

export default AppointmentRequestController;
