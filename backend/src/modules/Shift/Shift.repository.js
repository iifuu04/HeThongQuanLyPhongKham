// Shift.repository.js
import db from './../../config/db.js'

class Shift {
    static async createShift(shift) {
        const {start_time, end_time, max_patients} = shift;

        const [result] = await db.execute(
            `INSERT INTO Shifts (start_time, end_time, max_patients, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())`,
            [start_time, end_time, max_patients]
        );

        return result.affectedRows > 0;
    }

    static async updateShift(id, shift) {
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(shift)) {
            if (value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value)
            }
        }

        if (fields.length === 0) return false;

        const sql = `
            UPDATE Shifts
            SET updated_at = NOW(), ${fields.join(', ')}
            WHERE id = ?
        `;

        values.push(id);

        const [result] = await db.execute(sql, values)

        return result.affectedRows > 0;
    }

    static async deleteShift(id) {
        const [result] = await db.execute(
            `DELETE FROM Shifts WHERE id = ?`, [id]
        );

        return result.affectedRows > 0;
    }

    static async getShiftById(id) {
        const [result] = await db.execute(
            `SELECT * FROM Shifts WHERE id = ?`, [id]
        );

        return result.length > 0 ? result[0] : null;
    }

    static async getShifts() {
        const [result] = await db.execute(
            `SELECT * FROM Shifts`
        );

        return result.length > 0 ? result : null;
    }
}

export default Shift;