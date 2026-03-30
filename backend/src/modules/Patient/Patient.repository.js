// Patient.repository.js
import db from './../../config/db.js'

class Patient {
    static async createPatient(patient) {
        const {id, profile_id} = patient;

        const [result] = await db.execute(
            `INSERT INTO Patients (id, profile_id)
            VALUES (?, ?)`,
            [id, profile_id]
        );

        return result.affectedRows > 0;
    }

    static async updatePatient(id, patient) {
        const allowedFields = ['profile_id'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(patient)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        const sql = `
            UPDATE Patients
            SET ${fields.join(', ')}
            WHERE id = ?
        `;

        values.push(id);

        const [result] = await db.execute(sql, values);

        return result.affectedRows > 0;
    }

    static async getPatientById(id) {
        const [rows] = await db.execute(
            `SELECT * FROM Patients WHERE id = ?`, [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async searchPatientByName(name) {
        const keyword = `%${name}%`;

        const [rows] = await db.execute(
            `SELECT pa.*, p.first_name, p.last_name, p.phone, p.email, p.date_of_birth, p.gender, p.address
            FROM Patients pa
            INNER JOIN Profiles p ON pa.profile_id = p.id
            WHERE CONCAT(p.first_name, ' ', p.last_name) LIKE ?
                    OR p.first_name LIKE ?
                    OR p.last_name LIKE ?`,
            [keyword, keyword, keyword]
        );

        return rows;
    }

    static async searchPatientByPhone(phone) {
        const keyword = `%${phone}%`;

        const [rows] = await db.execute(
            `SELECT pa.*, p.first_name, p.last_name, p.phone, p.email, p.date_of_birth, p.gender, p.address
            FROM Patients pa
            INNER JOIN Profiles p ON pa.profile_id = p.id
            WHERE p.phone LIKE ?`,
            [keyword]
        );

        return rows;
    }

    static async getPatients() {
        const [rows] = await db.execute(
            `SELECT pa.*, p.first_name, p.last_name, p.phone, p.email, p.date_of_birth, p.gender, p.address
            FROM Patients pa
            LEFT JOIN Profiles p ON pa.profile_id = p.id`
        );

        return rows;
    }

    static async getPatientProfile(id) {
        const [rows] = await db.execute(
            `SELECT pa.id, pa.profile_id,
                    p.username, p.first_name, p.last_name, p.date_of_birth, p.gender, p.email, p.phone, p.address,
                    p.created_at, p.updated_at
            FROM Patients pa
            INNER JOIN Profiles p ON pa.profile_id = p.id
            WHERE pa.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getPatientHistory(id) {
        const [rows] = await db.execute(
            `SELECT mr.*, a.start_time AS appointment_start_time, a.end_time AS appointment_end_time,
                    d.id AS doctor_id, dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name
            FROM Medical_Records mr
            LEFT JOIN Appointments a ON mr.appointment_id = a.id
            LEFT JOIN Doctors d ON mr.doctor_id = d.id
            LEFT JOIN Profiles dp ON d.profile_id = dp.id
            WHERE mr.patient_id = ?
            ORDER BY mr.created_at DESC`,
            [id]
        );

        return rows;
    }
}

export default Patient;