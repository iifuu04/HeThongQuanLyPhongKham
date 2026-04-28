// Doctor.repository.js
import db from '../../config/db.js';

class DoctorRepository {
    static async generateDoctorId() {
        const [rows] = await db.execute(
            `SELECT MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)) as max_num FROM Doctors WHERE id LIKE 'D%'`
        );
        const maxNum = rows[0].max_num || 0;
        return `D${String(maxNum + 1).padStart(5, '0')}`;
    }

    static async createDoctor(doctor) {
        const { id, profile_id, specialty_id } = doctor;

        const [result] = await db.execute(
            `INSERT INTO Doctors (id, profile_id, specialty_id)
            VALUES (?, ?, ?)`,
            [id, profile_id, specialty_id || null]
        );

        return result.affectedRows > 0;
    }

    static async updateDoctor(id, doctor) {
        const allowedFields = ['profile_id', 'specialty_id'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(doctor)) {
            if (allowedFields.includes(key) && key !== 'id') {
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

        return result.affectedRows > 0;
    }

    static async getDoctorById(id) {
        const [rows] = await db.execute(
            `SELECT d.id, d.profile_id, d.specialty_id,
                    p.first_name, p.last_name, p.phone, p.email, p.gender, p.date_of_birth,
                    s.name AS specialty_name, s.description AS specialty_description
            FROM Doctors d
            LEFT JOIN Profiles p ON d.profile_id = p.id
            LEFT JOIN Specialties s ON d.specialty_id = s.id
            WHERE d.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getDoctors(includeInactive = false) {
        const sql = `
            SELECT d.id, d.profile_id, d.specialty_id,
                    p.first_name, p.last_name, p.phone, p.email, p.gender, p.date_of_birth,
                    s.name AS specialty_name, s.description AS specialty_description
            FROM Doctors d
            LEFT JOIN Profiles p ON d.profile_id = p.id
            LEFT JOIN Specialties s ON d.specialty_id = s.id
            ORDER BY p.last_name, p.first_name
        `;

        const [rows] = await db.execute(sql);

        return rows;
    }

    static async getDoctorsBySpecialty(specialtyId) {
        const [rows] = await db.execute(
            `SELECT d.id, d.profile_id, d.specialty_id,
                    p.first_name, p.last_name, p.phone, p.email, p.gender, p.date_of_birth,
                    s.name AS specialty_name, s.description AS specialty_description
            FROM Doctors d
            LEFT JOIN Profiles p ON d.profile_id = p.id
            LEFT JOIN Specialties s ON d.specialty_id = s.id
            WHERE d.specialty_id = ?
            ORDER BY p.last_name, p.first_name`,
            [specialtyId]
        );

        return rows;
    }

    static async getDoctorWithDetails(id) {
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

    static async getDoctorByProfileId(profileId) {
        const [rows] = await db.execute(
            `SELECT * FROM Doctors WHERE profile_id = ?`,
            [profileId]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getDoctorByClinic(clinicId) {
        const [rows] = await db.execute(
            `SELECT DISTINCT d.id, d.profile_id, d.specialty_id,
                    p.first_name, p.last_name, p.phone, p.email, ws.clinic_id
            FROM Doctors d
            INNER JOIN Work_Schedules ws ON d.id = ws.doctor_id
            LEFT JOIN Profiles p ON d.profile_id = p.id
            WHERE ws.clinic_id = ?
            ORDER BY p.last_name, p.first_name`,
            [clinicId]
        );

        return rows;
    }

    static async getDoctorByWorkDate(date) {
        const [rows] = await db.execute(
            `SELECT DISTINCT d.id, d.profile_id, d.specialty_id,
                    p.first_name, p.last_name, p.phone, p.email, ws.work_date
            FROM Doctors d
            INNER JOIN Work_Schedules ws ON d.id = ws.doctor_id
            LEFT JOIN Profiles p ON d.profile_id = p.id
            WHERE ws.work_date = ?
            ORDER BY p.last_name, p.first_name`,
            [date]
        );

        return rows;
    }

    static async getDoctorByShift(shiftId) {
        const [rows] = await db.execute(
            `SELECT DISTINCT d.id, d.profile_id, d.specialty_id,
                    p.first_name, p.last_name, p.phone, p.email, ws.shift_id
            FROM Doctors d
            INNER JOIN Work_Schedules ws ON d.id = ws.doctor_id
            LEFT JOIN Profiles p ON d.profile_id = p.id
            WHERE ws.shift_id = ?
            ORDER BY p.last_name, p.first_name`,
            [shiftId]
        );

        return rows;
    }

    static async hasLinkedSchedules(doctorId) {
        const [result] = await db.execute(
            `SELECT COUNT(*) as count FROM Work_Schedules WHERE doctor_id = ?`,
            [doctorId]
        );

        return result[0].count > 0;
    }
}

export default DoctorRepository;
