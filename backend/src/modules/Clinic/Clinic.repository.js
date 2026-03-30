// Clinic.repository.js
import db from './../../config/db.js'

class Clinic {
    static async createClinic(clinic) {
        const {location, name, is_reserve} = clinic;

        const [result] = await db.execute(
            `INSERT INTO Clinics (location, name, is_reserve)
            VALUES (?, ?, ?)`,
            [location, name, is_reserve]
        );

        return result.affectedRows > 0;         
    }

    static async updateClinic(id, clinic) {
        const {location, name, is_reserve} = clinic;

        const [result] = await db.execute(
            `UPDATE Clinics
            SET location = ?, name = ?, is_reserve = ?
            WHERE id = ?`,
            [location, name, is_reserve, id]
        );

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
            `SELECT * FROM Clinics`
        );

        return rows.length > 0 ? rows : null;
    }
}

export default Clinic;