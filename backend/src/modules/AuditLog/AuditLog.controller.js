/**
 * AuditLog Controller
 * Handles HTTP request/response for AuditLog operations
 */

import { success, error } from '../../utils/response.js';
import AuditLogService from './AuditLog.service.js';

export class AuditLogController {
    static async getAll(req, res, next) {
        try {
            const logs = await AuditLogService.getAllLogs();
            return success(res, logs, 'Audit logs retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getByUser(req, res, next) {
        try {
            const logs = await AuditLogService.getLogsByUser(req.params.userId);
            return success(res, logs, 'User audit logs retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getByAction(req, res, next) {
        try {
            const logs = await AuditLogService.getLogsByAction(req.params.actionType);
            return success(res, logs, 'Audit logs retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getByRecord(req, res, next) {
        try {
            const logs = await AuditLogService.getLogsByRecord(req.params.tableName, req.params.recordId);
            return success(res, logs, 'Record audit logs retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getByTimeRange(req, res, next) {
        try {
            const { from, to } = req.query;
            if (!from || !to) {
                return error(res, 'from and to parameters are required', 400);
            }
            const logs = await AuditLogService.getLogsByTimeRange(from, to);
            return success(res, logs, 'Audit logs retrieved successfully');
        } catch (err) {
            next(err);
        }
    }
}

export default AuditLogController;
