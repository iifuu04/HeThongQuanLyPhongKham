/**
 * AuditLog Service (BUS Layer)
 * Business logic for AuditLog operations
 * NFR Security - Audit Logging
 * Logs important actions:
 * CREATE, UPDATE, DELETE, LOGIN, LOGOUT, PAYMENT, APPROVE, REJECT
 */

import AuditLogRepository from './AuditLog.repository.js';

const VALID_ACTION_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYMENT', 'APPROVE', 'REJECT', 'CANCEL', 'FINALIZE'];
const LOGGABLE_TABLES = ['Profiles', 'Patients', 'Doctors', 'Appointments', 'Appointment_Request', 'Medical_Records', 'Bills', 'Bill_Items', 'Services', 'Work_Schedules', 'Specialties', 'Clinics', 'Shifts'];

class AuditLogService {
    async getLogs(filters = {}) {
        if (filters.action_type && !VALID_ACTION_TYPES.includes(filters.action_type)) {
            return [];
        }

        if (filters.table_name && !LOGGABLE_TABLES.includes(filters.table_name)) {
            return [];
        }

        const logs = await AuditLogRepository.getLogs(filters);
        return logs || [];
    }

    async getLogById(id) {
        return await AuditLogRepository.getLogById(id);
    }

    async getLogsByUser(userId) {
        const logs = await AuditLogRepository.getLogsByProfile(userId);
        return logs || [];
    }

    async getLogsByAction(actionType) {
        if (!VALID_ACTION_TYPES.includes(actionType)) {
            return [];
        }
        const logs = await AuditLogRepository.getLogsByAction(actionType);
        return logs || [];
    }

    async getLogsByRecord(tableName, recordId) {
        if (!LOGGABLE_TABLES.includes(tableName)) {
            return [];
        }
        const logs = await AuditLogRepository.getLogsByTarget(tableName, recordId);
        return logs || [];
    }

    async getLogsByTimeRange(from, to) {
        const logs = await AuditLogRepository.getLogsByTimeRange(from, to);
        return logs || [];
    }

    async getLogStats(filters = {}) {
        return await AuditLogRepository.getLogStats(filters);
    }

    async getUserActivity(userId, limit = 10) {
        const logs = await AuditLogRepository.getUserActivity(userId, limit);
        return logs || [];
    }

    async getRecentActivity(limit = 50) {
        const logs = await AuditLogRepository.getRecentActivity(limit);
        return logs || [];
    }

    async createLog(logData) {
        try {
            if (logData.action_type && !VALID_ACTION_TYPES.includes(logData.action_type)) {
                console.warn('Invalid action_type for audit log:', logData.action_type);
                return { success: false, message: 'Invalid action type' };
            }

            if (logData.table_name && !LOGGABLE_TABLES.includes(logData.table_name)) {
                console.warn('Invalid table_name for audit log:', logData.table_name);
                return { success: false, message: 'Invalid table name' };
            }

            const result = await AuditLogRepository.createLog(logData);
            return { success: result, message: result ? 'Log created' : 'Failed to create log' };
        } catch (error) {
            console.error('Error creating audit log:', error);
            return { success: false, message: error.message };
        }
    }
}

export { VALID_ACTION_TYPES, LOGGABLE_TABLES };
export default new AuditLogService();
