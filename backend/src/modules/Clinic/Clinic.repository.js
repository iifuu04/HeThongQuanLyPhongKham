// Clinic.repository.js
import db from '../../config/db.js';

class ClinicRepository {
    static async createClinic(clinic) {
        const { name, location, is_reserve } = clinic;

        const [result] = await db.execute(
            `INSERT INTO Clinics (name, location, is_reserve)
            VALUES (?, ?, ?)`,
            [name, location, is_reserve ? 1 : 0]
        );

        return result.affectedRows > 0;
    }

    static async updateClinic(id, clinic) {
        const fields = [];
        const values = [];

        // Only allow updating these fields - Clinics has no updated_at column
        const allowedFields = ['name', 'location', 'is_reserve'];
        for (const [key, value] of Object.entries(clinic)) {
            if (allowedFields.includes(key) && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
                fields.push(`${key} = ?`);
                // Convert boolean to number for MySQL
                values.push(key === 'is_reserve' ? (value ? 1 : 0) : value);
            }
        }

        if (fields.length === 0) return false;

        const sql = `
            UPDATE Clinics
            SET ${fields.join(', ')}
            WHERE id = ?
        `;

        values.push(id);

        const [result] = await db.execute(sql, values);

        return result.affectedRows > 0;
    }

    static async deleteClinic(id) {
        const [result] = await db.execute(
            `DELETE FROM Clinics WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async getClinicById(id) {
        const [row] = await db.execute(
            `SELECT * FROM Clinics WHERE id = ?`,
            [id]
        );

        return row.length > 0 ? row[0] : null;
    }

    static async getClinics() {
        const [rows] = await db.execute(
            `SELECT * FROM Clinics ORDER BY name`
        );

        return rows.length > 0 ? rows : [];
    }

    static async getByName(name) {
        const [result] = await db.execute(
            `SELECT * FROM Clinics WHERE name = ?`,
            [name]
        );

        return result.length > 0 ? result[0] : null;
    }

    static async getByNameExcludingId(name, excludeId) {
        const [result] = await db.execute(
            `SELECT * FROM Clinics WHERE name = ? AND id != ?`,
            [name, excludeId]
        );

        return result.length > 0 ? result[0] : null;
    }

    static async hasLinkedSchedules(clinicId) {
        const [result] = await db.execute(
            `SELECT COUNT(*) as count FROM Work_Schedules WHERE clinic_id = ?`,
            [clinicId]
        );

        return result[0].count > 0;
    }
}

export default ClinicRepository;
