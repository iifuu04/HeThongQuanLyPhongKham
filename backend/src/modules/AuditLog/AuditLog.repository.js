// AuditLog.repository.js
import db from '../../config/db.js';

class AuditLogRepository {
    static async generateLogId() {
        const [rows] = await db.execute(
            `SELECT MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)) as max_num FROM Audit_Logs WHERE id LIKE 'LOG%'`
        );
        const maxNum = rows[0].max_num || 0;
        return `LOG${String(maxNum + 1).padStart(8, '0')}`;
    }

    static async createLog(log) {
        const { user_id, action_type, table_name, record_id, old_data, new_data, description, ip_address, user_agent } = log;

        try {
            const [result] = await db.execute(
                `INSERT INTO Audit_Logs (id, user_id, action_type, table_name, record_id, old_data, new_data, description, ip_address, user_agent, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    await this.generateLogId(),
                    user_id ?? null,
                    action_type ?? null,
                    table_name ?? null,
                    record_id ?? null,
                    old_data ?? null,
                    new_data ?? null,
                    description ?? null,
                    ip_address ?? null,
                    user_agent ?? null
                ]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error creating audit log:', error);
            return false;
        }
    }

    static async getLogs(filters = {}) {
        let sql = `
            SELECT al.*,
                    p.username AS user_username,
                    p.first_name AS user_first_name,
                    p.last_name AS user_last_name,
                    p.role AS user_role
             FROM Audit_Logs al
             LEFT JOIN Profiles p ON al.user_id = p.id
             WHERE 1=1
        `;

        const params = [];

        if (filters.user_id) {
            sql += ` AND al.user_id = ?`;
            params.push(filters.user_id);
        }

        if (filters.table_name) {
            sql += ` AND al.table_name = ?`;
            params.push(filters.table_name);
        }

        if (filters.action_type) {
            sql += ` AND al.action_type = ?`;
            params.push(filters.action_type);
        }

        if (filters.record_id) {
            sql += ` AND al.record_id = ?`;
            params.push(filters.record_id);
        }

        if (filters.from_date) {
            sql += ` AND DATE(al.created_at) >= ?`;
            params.push(filters.from_date);
        }

        if (filters.to_date) {
            sql += ` AND DATE(al.created_at) <= ?`;
            params.push(filters.to_date);
        }

        if (filters.from_time) {
            sql += ` AND al.created_at >= ?`;
            params.push(filters.from_time);
        }

        if (filters.to_time) {
            sql += ` AND al.created_at <= ?`;
            params.push(filters.to_time);
        }

        sql += ` ORDER BY al.created_at DESC`;

        if (filters.limit) {
            sql += ` LIMIT ?`;
            params.push(parseInt(filters.limit));
        }

        if (filters.offset) {
            sql += ` OFFSET ?`;
            params.push(parseInt(filters.offset));
        }

        const [rows] = await db.execute(sql, params);

        return rows;
    }

    static async getLogsByProfile(profileId) {
        return await this.getLogs({ user_id: profileId });
    }

    static async getLogsByAction(actionType) {
        return await this.getLogs({ action_type: actionType });
    }

    static async getLogsByTarget(targetTable, targetId) {
        return await this.getLogs({ table_name: targetTable, record_id: targetId });
    }

    static async getLogsByTimeRange(from, to) {
        return await this.getLogs({ from_time: from, to_time: to });
    }

    static async getLogById(id) {
        const [rows] = await db.execute(
            `SELECT al.*,
                    p.username AS user_username,
                    p.first_name AS user_first_name,
                    p.last_name AS user_last_name,
                    p.role AS user_role
             FROM Audit_Logs al
             LEFT JOIN Profiles p ON al.user_id = p.id
             WHERE al.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getLogStats(filters = {}) {
        let sql = `
            SELECT
                action_type,
                table_name,
                COUNT(*) as count,
                MAX(created_at) as last_occurrence
             FROM Audit_Logs
             WHERE 1=1
        `;

        const params = [];

        if (filters.from_date) {
            sql += ` AND DATE(created_at) >= ?`;
            params.push(filters.from_date);
        }

        if (filters.to_date) {
            sql += ` AND DATE(created_at) <= ?`;
            params.push(filters.to_date);
        }

        if (filters.user_id) {
            sql += ` AND user_id = ?`;
            params.push(filters.user_id);
        }

        sql += ` GROUP BY action_type, table_name ORDER BY count DESC`;

        const [rows] = await db.execute(sql, params);

        return rows;
    }

    static async getUserActivity(userId, limit = 10) {
        const [rows] = await db.execute(
            `SELECT al.*,
                    p.username AS user_username
             FROM Audit_Logs al
             LEFT JOIN Profiles p ON al.user_id = p.id
             WHERE al.user_id = ?
             ORDER BY al.created_at DESC
             LIMIT ?`,
            [userId, limit]
        );

        return rows;
    }

    static async getRecentActivity(limit = 50) {
        return await this.getLogs({ limit });
    }
}

export default AuditLogRepository;
