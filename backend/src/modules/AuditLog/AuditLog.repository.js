// AuditLog.repository.js
import db from "../../config/db.js";

class AuditLog {
    // return bool
    static async createLog(log) {
        const {user_id, action_type, table_name, record_id, old_data, new_data, description, ip_address, user_agent} = log;

        const [result] = await db.execute(
            `INSERT INTO Audit_Logs (user_id, action_type, table_name, record_id, old_data, new_data, description, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [user_id, action_type, table_name, record_id, old_data, new_data, description, ip_address, user_agent]
        );

        return result.affectedRows > 0;
    }

    // return List<>
    static async getLogs() {
        const [rows] = await db.execute(
            `SELECT al.*, p.username, p.first_name, p.last_name
            FROM Audit_Logs al
            LEFT JOIN Profiles p ON al.user_id = p.id
            ORDER BY al.created_at DESC`
        );

        return rows.length > 0 ? rows : null;
    }

    static async getLogsByProfile(ProfileId) {
        const [rows] = await db.execute(
            `SELECT al.*, p.username, p.first_name, p.last_name
            FROM Audit_Logs al
            LEFT JOIN Profiles p ON al.user_id = p.id
            WHERE al.user_id = ?
            ORDER BY al.created_at DESC`,
            [ProfileId]
        );

        return rows.length > 0 ? rows : null;
    }

    static async getLogsByAction(actionType) {
        const [rows] = await db.execute(
            `SELECT al.*, p.username, p.first_name, p.last_name
            FROM Audit_Logs al
            LEFT JOIN Profiles p ON al.user_id = p.id
            WHERE al.action_type = ?
            ORDER BY al.created_at DESC`,
            [actionType]
        );

        return rows.length > 0 ? rows : null;
    }

    static async getLogsByTarget(targetTable, targetId) {
        const [rows] = await db.execute(
            `SELECT al.*, p.username, p.first_name, p.last_name
            FROM Audit_Logs al
            LEFT JOIN Profiles p ON al.user_id = p.id
            WHERE al.table_name = ? AND al.record_id = ?
            ORDER BY al.created_at DESC`,
            [targetTable, targetId]
        );

        return rows.length > 0 ? rows : null;
    }

    static async getLogsByTimeRange(from, to) {
        const [rows] = await db.execute(
            `SELECT al.*, p.username, p.first_name, p.last_name
            FROM Audit_Logs al
            LEFT JOIN Profiles p ON al.user_id = p.id
            WHERE al.created_at BETWEEN ? AND ?
            ORDER BY al.created_at DESC`,
            [from, to]
        );

        return rows.length > 0 ? rows : null;
    }
}

export default AuditLog;