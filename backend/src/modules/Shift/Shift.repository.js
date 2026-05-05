// Shift.repository.js
import db from '../../config/db.js';

class ShiftRepository {
    static async createShift(shift) {
        const { start_time, end_time, max_patients } = shift;

        const [result] = await db.execute(
            `INSERT INTO Shifts (start_time, end_time, max_patients)
            VALUES (?, ?, ?)`,
            [start_time, end_time, max_patients || 20]
        );

        return result.affectedRows > 0;
    }

    static async updateShift(id, shift) {
        const fields = [];
        const values = [];

        // Only allow updating these fields - Shifts has start_time, end_time, max_patients
        const allowedFields = ['start_time', 'end_time', 'max_patients'];
        for (const [key, value] of Object.entries(shift)) {
            if (allowedFields.includes(key) && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        const sql = `
            UPDATE Shifts
            SET ${fields.join(', ')}
            WHERE id = ?
        `;

        values.push(id);

        const [result] = await db.execute(sql, values);

        return result.affectedRows > 0;
    }

    static async deleteShift(id) {
        const [result] = await db.execute(
            `DELETE FROM Shifts WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async getShiftById(id) {
        const [result] = await db.execute(
            `SELECT * FROM Shifts WHERE id = ?`,
            [id]
        );

        return result.length > 0 ? result[0] : null;
    }

    static async getShifts() {
        const [result] = await db.execute(
            `SELECT * FROM Shifts ORDER BY start_time`
        );

        return result.length > 0 ? result : [];
    }

    static async getShiftByTime(startTime, endTime) {
        const [result] = await db.execute(
            `SELECT * FROM Shifts WHERE start_time = ? AND end_time = ?`,
            [startTime, endTime]
        );

        return result.length > 0 ? result[0] : null;
    }

    static async hasLinkedSchedules(shiftId) {
        const [result] = await db.execute(
            `SELECT COUNT(*) as count FROM Work_Schedules WHERE shift_id = ?`,
            [shiftId]
        );

        return result[0].count > 0;
    }
}

export default ShiftRepository;
