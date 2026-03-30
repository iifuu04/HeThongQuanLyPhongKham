// MedicalService.repository.js
import db from './../../config/db.js'

class MedicalService {
    static async createService(service) {
        const {name, price} = service;

        const [result] = await db.execute(
            `INSERT INTO Services (name, price)
            VALUES (?, ?)`,
            [name, price]
        );

        return result.affectedRows > 0;
    }

    static async updateService(id, service) {
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(service)) {
            if (value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        const sql = `
            UPDATE Services 
            SET ${fields.join(', ')}
            WHERE id = ?
        `;

        const [result] = await db.execute(sql, values);

        return result.affectedRows > 0;
    }

    static async deleteService(id) {
        const [result] = await db.execute(
            `DELETE FROM Services WHERE id = ?`, [id]
        );

        return result.affectedRows > 0;
    }

    static async getServiceById(id) {
        const [result] = await db.execute(
            `SELECT * FROM Services WHERE id = ?`, [id]
        );

        return result.length > 0 ? result[0] : null;
    }

    static async getServices() {
        const [result] = await db.execute(
            `SELECT * FROM Services`
        );

        return result.length > 0 ? result : null;
    }
}

export default MedicalService;