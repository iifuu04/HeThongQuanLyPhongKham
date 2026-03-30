// Specialty.repository.js
import db from './../../config/db.js'

class Specialty {
    static async createSpecialty(specialty) {
        const {name, description} = specialty;
        
        const [result] = await db.execute(
            `INSERT INTO Specialties (name, establish_at, description, updated_at, is_deleted, status)
            VALUES (?, NOW(), ?, NOW(), 0, 'ACTIVE')`,
            [name, description]
        );

        return result.affectedRows > 0;
    }

    static async updateSpecialty(id, specialty) {
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(specialty)) {
            if (value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        const sql = `
            UPDATE Specialties
            SET updated_at = NOW(), ${fields.join(', ')}
            WHERE id = ?
        `;

        values.push(id);

        const [result] = await db.execute(sql, values);

        return result.affectedRows > 0;
    }

    static async deleteSpecialty(id) {
        const [result] = await db.execute(
            `UPDATE Specialties SET is_deleted = 1, updated_at = NOW() WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async getSpecialtyById(id) {
        const [result] = await db.execute(
            `SELECT * FROM Specialties WHERE id = ?`,
            [id]
        );

        return result.length > 0 ? result : null;
    }

    static async getSpecialties() {
        const [result] = await db.execute(
            `SELECT * FROM Specialties WHERE is_deleted != 1`
        );

        return result.length > 0 ? result : null;
    }

    static async lockSpecialty(id) {
        const [result] = await db.execute(
            `UPDATE Specialties SET status = 'LOCKED', updated_at = NOW() WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async unlockSpecialty(id) {
        const [result] = await db.execute(
            `UPDATE Specialties SET status = 'ACTIVE', updated_at = NOW() WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }
}

export default Specialty;