// Specialty.repository.js
import db from '../../config/db.js';

class SpecialtyRepository {
    static async createSpecialty(specialty) {
        const { name, description } = specialty;

        const [result] = await db.execute(
            `INSERT INTO Specialties (name, establish_at, description, is_deleted, status)
            VALUES (?, CURDATE(), ?, 0, 'ACTIVE')`,
            [name, description]
        );

        return result.affectedRows > 0;
    }

    static async updateSpecialty(id, specialty) {
        const fields = [];
        const values = [];

        // Only allow updating these fields
        const allowedFields = ['name', 'description', 'status'];
        for (const [key, value] of Object.entries(specialty)) {
            if (allowedFields.includes(key) && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        const sql = `
            UPDATE Specialties
            SET ${fields.join(', ')}
            WHERE id = ? AND is_deleted = 0
        `;

        values.push(id);

        const [result] = await db.execute(sql, values);

        return result.affectedRows > 0;
    }

    static async deleteSpecialty(id) {
        const [result] = await db.execute(
            `UPDATE Specialties SET is_deleted = 1 WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async getSpecialtyById(id) {
        const [result] = await db.execute(
            `SELECT * FROM Specialties WHERE id = ? AND is_deleted = 0`,
            [id]
        );

        return result.length > 0 ? result[0] : null;
    }

    static async getSpecialties(includeInactive = false) {
        let sql = `SELECT * FROM Specialties WHERE is_deleted = 0`;
        if (!includeInactive) {
            sql += ` AND status = 'ACTIVE'`;
        }
        sql += ` ORDER BY name`;

        const [result] = await db.execute(sql);

        return result.length > 0 ? result : [];
    }

    static async getActiveByName(name) {
        const [result] = await db.execute(
            `SELECT * FROM Specialties WHERE name = ? AND status = 'ACTIVE' AND is_deleted = 0`,
            [name]
        );

        return result.length > 0 ? result[0] : null;
    }

    static async getActiveByNameExcludingId(name, excludeId) {
        const [result] = await db.execute(
            `SELECT * FROM Specialties WHERE name = ? AND id != ? AND status = 'ACTIVE' AND is_deleted = 0`,
            [name, excludeId]
        );

        return result.length > 0 ? result[0] : null;
    }

    static async lockSpecialty(id) {
        const [result] = await db.execute(
            `UPDATE Specialties SET status = 'LOCKED' WHERE id = ? AND is_deleted = 0`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async unlockSpecialty(id) {
        const [result] = await db.execute(
            `UPDATE Specialties SET status = 'ACTIVE' WHERE id = ? AND is_deleted = 0`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async hasLinkedDoctors(specialtyId) {
        const [result] = await db.execute(
            `SELECT COUNT(*) as count FROM Doctors WHERE specialty_id = ?`,
            [specialtyId]
        );

        return result[0].count > 0;
    }
}

export default SpecialtyRepository;
