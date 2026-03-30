// Doctor.repository.js
import db from './../../config/db.js'

class Doctor {
    static async createDoctor(doctor) {
        const {id, profile_id, specialty_id} = doctor;

        const [result] = await db.execute(
            `INSERT INTO Doctors (id, profile_id, specialty_id)
            VALUES (?, ?, ?)`,
            [id, profile_id, specialty_id]
        );

        return result.affectedRows > 0;
    }

    static async updateDoctor(id, doctor) {
        const allowedFields = ['profile_id', 'specialty_id'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(doctor)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        const sql = `
            UPDATE Doctors
            SET ${fields.join(', ')}
            WHERE id = ?
        `;

        values.push(id);

        const [result] = await db.execute(sql, values);

        return result.affectedRows > 0;
    }

    static async deleteDoctor(id) {
        const [result] = await db.execute(
            `DELETE FROM Doctors WHERE id = ?`,
            [id]
        );

        return {
            success: result.affectedRows > 0,
            affectedRows: result.affectedRows
        };
    }

    static async getDoctorById(id) {
        const [rows] = await db.execute(
            `SELECT * FROM Doctors WHERE id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getDoctors() {
        const [rows] = await db.execute(
            `SELECT d.*, p.first_name, p.last_name, p.phone, p.email, s.name AS specialty_name
            FROM Doctors d
            LEFT JOIN Profiles p ON d.profile_id = p.id
            LEFT JOIN Specialties s ON d.specialty_id = s.id`
        );

        return rows;
    }

    static async getDoctorBySpecialty(specialtyId) {
        const [rows] = await db.execute(
            `SELECT d.*, p.first_name, p.last_name, p.phone, p.email, s.name AS specialty_name
            FROM Doctors d
            LEFT JOIN Profiles p ON d.profile_id = p.id
            LEFT JOIN Specialties s ON d.specialty_id = s.id
            WHERE d.specialty_id = ?`,
            [specialtyId]
        );

        return rows;
    }

    static async getDoctorProfile(id) {
        const [rows] = await db.execute(
            `SELECT d.id, d.profile_id, d.specialty_id,
                    p.username, p.first_name, p.last_name, p.date_of_birth, p.gender, p.email, p.phone, p.address,
                    s.name AS specialty_name, s.description AS specialty_description
            FROM Doctors d
            LEFT JOIN Profiles p ON d.profile_id = p.id
            LEFT JOIN Specialties s ON d.specialty_id = s.id
            WHERE d.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getDoctorByClinic(clinicId) {
        const [rows] = await db.execute(
            `SELECT DISTINCT d.*, p.first_name, p.last_name, p.phone, p.email, ws.clinic_id
            FROM Doctors d
            INNER JOIN Work_Schedules ws ON d.id = ws.doctor_id
            LEFT JOIN Profiles p ON d.profile_id = p.id
            WHERE ws.clinic_id = ?`,
            [clinicId]
        );

        return rows;
    }

    static async getDoctorByWorkDate(date) {
        const [rows] = await db.execute(
            `SELECT DISTINCT d.*, p.first_name, p.last_name, p.phone, p.email, ws.work_date
            FROM Doctors d
            INNER JOIN Work_Schedules ws ON d.id = ws.doctor_id
            LEFT JOIN Profiles p ON d.profile_id = p.id
            WHERE ws.work_date = ?`,
            [date]
        );

        return rows;
    }

    static async getDoctorByShift(shift) {
        const [rows] = await db.execute(
            `SELECT DISTINCT d.*, p.first_name, p.last_name, p.phone, p.email, ws.shift_id
            FROM Doctors d
            INNER JOIN Work_Schedules ws ON d.id = ws.doctor_id
            LEFT JOIN Profiles p ON d.profile_id = p.id
            WHERE ws.shift_id = ?`,
            [shift]
        );

        return rows;
    }
}

export default Doctor;