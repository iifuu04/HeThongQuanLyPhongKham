/**
 * AuditLog Routes
 * Handles audit log read operations
 * NFR Security - Audit Logging
 * Only ADMIN can view audit logs
 */

import express from 'express';
import AuditLogService, { VALID_ACTION_TYPES, LOGGABLE_TABLES } from './AuditLog.service.js';
import { success, error } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/audit-logs - Get all logs with filters
router.get('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const { user_id, table_name, action_type, record_id, from_date, to_date, limit, offset } = req.query;
    const filters = {};

    if (user_id) filters.user_id = user_id;
    if (table_name) filters.table_name = table_name;
    if (action_type) filters.action_type = action_type;
    if (record_id) filters.record_id = record_id;
    if (from_date) filters.from_date = from_date;
    if (to_date) filters.to_date = to_date;
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const logs = await AuditLogService.getLogs(filters);
    return success(res, logs, 'Audit logs retrieved successfully');
}));

// GET /api/audit-logs/stats - Get log statistics
router.get('/stats', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const { from_date, to_date, user_id } = req.query;
    const filters = {};

    if (from_date) filters.from_date = from_date;
    if (to_date) filters.to_date = to_date;
    if (user_id) filters.user_id = user_id;

    const stats = await AuditLogService.getLogStats(filters);
    return success(res, stats, 'Audit log statistics retrieved successfully');
}));

// GET /api/audit-logs/recent - Get recent activity
router.get('/recent', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const logs = await AuditLogService.getRecentActivity(limit ? parseInt(limit) : 50);
    return success(res, logs, 'Recent activity retrieved successfully');
}));

// GET /api/audit-logs/user/:userId - Get logs by user
router.get('/user/:userId', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const logs = await AuditLogService.getLogsByUser(req.params.userId);
    return success(res, logs, 'User audit logs retrieved successfully');
}));

// GET /api/audit-logs/record/:tableName/:recordId - Get logs by record
router.get('/record/:tableName/:recordId', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const { tableName, recordId } = req.params;
    const logs = await AuditLogService.getLogsByRecord(tableName, recordId);
    return success(res, logs, 'Record audit logs retrieved successfully');
}));

// GET /api/audit-logs/action/:actionType - Get logs by action type
router.get('/action/:actionType', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const logs = await AuditLogService.getLogsByAction(req.params.actionType);
    return success(res, logs, 'Audit logs retrieved successfully');
}));

// GET /api/audit-logs/range - Get logs by time range
router.get('/range', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) {
        return error(res, 'from and to parameters are required', 400);
    }
    const logs = await AuditLogService.getLogsByTimeRange(from, to);
    return success(res, logs, 'Audit logs retrieved successfully');
}));

// GET /api/audit-logs/valid-actions - Get valid action types
router.get('/valid-actions', authorizeRoles('ADMIN'), (req, res) => {
    return success(res, VALID_ACTION_TYPES, 'Valid action types retrieved successfully');
});

// GET /api/audit-logs/valid-tables - Get valid table names
router.get('/valid-tables', authorizeRoles('ADMIN'), (req, res) => {
    return success(res, LOGGABLE_TABLES, 'Valid table names retrieved successfully');
});

export default router;
