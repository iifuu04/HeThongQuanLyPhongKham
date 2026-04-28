// MedicalService.repository.js
import db from '../../config/db.js';

class MedicalServiceRepository {
    static async createService(service) {
        const { name, price, description } = service;

        const [result] = await db.execute(
            `INSERT INTO Services (name, price)
             VALUES (?, ?)`,
            [name, price || 0]
        );

        return result.affectedRows > 0;
    }

    static async updateService(id, service) {
        const allowedFields = ['name', 'price'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(service)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        const sql = `UPDATE Services SET ${fields.join(', ')} WHERE id = ?`;
        values.push(id);

        const [result] = await db.execute(sql, values);

        return result.affectedRows > 0;
    }

    static async deleteService(id) {
        const [result] = await db.execute(
            `DELETE FROM Services WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async getServiceById(id) {
        const [rows] = await db.execute(
            `SELECT * FROM Services WHERE id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getServices(filters = {}) {
        let sql = `SELECT * FROM Services`;
        const params = [];

        if (filters.search) {
            sql += ` WHERE (name LIKE ? OR id LIKE ?)`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
        }

        sql += ` ORDER BY name`;

        const [rows] = await db.execute(sql, params);

        return rows;
    }

    static async getActiveServices() {
        return await this.getServices();
    }
}

export default MedicalServiceRepository;
