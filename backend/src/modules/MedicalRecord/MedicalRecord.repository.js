// MedicalRecord.repository.js
// Schema: Medical_Records(id INT, patient_id VARCHAR(6), doctor_id VARCHAR(6), appointment_id INT UNIQUE, note TEXT, symptoms TEXT, diagnosis TEXT, result TEXT, prescription TEXT, status ENUM)
// Join: Medical_Records + Patients + Profiles + Doctors + Profiles + Specialties + Appointments + Work_Schedules + Clinics
import db from '../../config/db.js';

class MedicalRecordRepository {
    static async generateMedicalRecordId() {
        const [rows] = await db.execute(
            `SELECT MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)) as max_num FROM Medical_Records WHERE id LIKE 'MR%'`
        );
        const maxNum = rows[0].max_num || 0;
        return `MR${String(maxNum + 1).padStart(6, '0')}`;
    }

    static async createMedicalRecord(record) {
        const { patient_id, doctor_id, appointment_id, note, symptoms, diagnosis, result, prescription } = record;

        const [result_] = await db.execute(
            `INSERT INTO Medical_Records (patient_id, doctor_id, appointment_id, note, symptoms, diagnosis, result, prescription, created_at, updated_at, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 'INCOMPLETE')`,
            [patient_id, doctor_id, appointment_id, note || null, symptoms || null, diagnosis || null, result || null, prescription || null]
        );

        return result_.affectedRows > 0 ? result_.insertId : false;
    }

    static async updateMedicalRecord(id, record) {
        const allowedFields = ['note', 'symptoms', 'diagnosis', 'result', 'prescription'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(record)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        fields.push('updated_at = NOW()');
        const sql = `
            UPDATE Medical_Records
            SET ${fields.join(', ')}
            WHERE id = ? AND status != 'COMPLETED'
        `;

        values.push(id);

        const [result_] = await db.execute(sql, values);

        return result_.affectedRows > 0;
    }

    static async finalizeMedicalRecord(id) {
        const [result_] = await db.execute(
            `UPDATE Medical_Records SET updated_at = NOW(), status = 'COMPLETED' WHERE id = ? AND status != 'COMPLETED'`,
            [id]
        );

        return result_.affectedRows > 0;
    }

    static async softDeleteMedicalRecord(id) {
        const [result_] = await db.execute(
            `DELETE FROM Medical_Records WHERE id = ?`,
            [id]
        );

        return result_.affectedRows > 0;
    }

    static async isMedicalRecordLocked(id) {
        const [rows] = await db.execute(
            `SELECT status FROM Medical_Records WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return false;
        }

        return rows[0].status === 'COMPLETED';
    }

    static async getMedicalRecordById(id) {
        const [rows] = await db.execute(
            `SELECT mr.*,
                    mr.id AS medical_record_id,
                    pa.id AS patient_id,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.date_of_birth AS patient_dob,
                    p.gender AS patient_gender,
                    p.phone AS patient_phone,
                    p.email AS patient_email,
                    d.id AS doctor_id,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    s.name AS specialty_name,
                    a.start_time AS appointment_start_time,
                    a.end_time AS appointment_end_time,
                    a.status AS appointment_status,
                    c.name AS clinic_name,
                    c.location AS clinic_location
             FROM Medical_Records mr
             LEFT JOIN Patients pa ON mr.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON mr.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             LEFT JOIN Specialties s ON d.specialty_id = s.id
             LEFT JOIN Appointments a ON mr.appointment_id = a.id
             LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
             LEFT JOIN Clinics c ON ws.clinic_id = c.id
             WHERE mr.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getMedicalRecordByAppointment(appointmentId) {
        const [rows] = await db.execute(
            `SELECT mr.*,
                    mr.id AS medical_record_id,
                    pa.id AS patient_id,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    p.email AS patient_email,
                    d.id AS doctor_id,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    s.name AS specialty_name,
                    a.start_time AS appointment_start_time,
                    a.end_time AS appointment_end_time,
                    a.status AS appointment_status,
                    c.name AS clinic_name
             FROM Medical_Records mr
             LEFT JOIN Patients pa ON mr.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON mr.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             LEFT JOIN Specialties s ON d.specialty_id = s.id
             LEFT JOIN Appointments a ON mr.appointment_id = a.id
             LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
             LEFT JOIN Clinics c ON ws.clinic_id = c.id
             WHERE mr.appointment_id = ?`,
            [appointmentId]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getMedicalRecords(filters = {}) {
        let sql = `
            SELECT mr.*,
                    mr.id AS medical_record_id,
                    pa.id AS patient_id,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    p.email AS patient_email,
                    d.id AS doctor_id,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    s.name AS specialty_name,
                    a.start_time AS appointment_start_time,
                    a.end_time AS appointment_end_time,
                    a.status AS appointment_status,
                    c.name AS clinic_name
             FROM Medical_Records mr
             LEFT JOIN Patients pa ON mr.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON mr.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             LEFT JOIN Specialties s ON d.specialty_id = s.id
             LEFT JOIN Appointments a ON mr.appointment_id = a.id
             LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
             LEFT JOIN Clinics c ON ws.clinic_id = c.id
             WHERE 1=1
        `;

        const params = [];

        if (filters.doctor_id) {
            sql += ` AND mr.doctor_id = ?`;
            params.push(filters.doctor_id);
        }

        if (filters.patient_id) {
            sql += ` AND mr.patient_id = ?`;
            params.push(filters.patient_id);
        }

        if (filters.status) {
            sql += ` AND mr.status = ?`;
            params.push(filters.status);
        }

        sql += ` ORDER BY mr.created_at DESC`;

        const [rows] = await db.execute(sql, params);

        return rows || [];
    }

    static async getMedicalRecordsByPatient(patientId) {
        return await this.getMedicalRecords({ patient_id: patientId });
    }

    static async getMedicalRecordsByDoctor(doctorId) {
        return await this.getMedicalRecords({ doctor_id: doctorId });
    }

    static async getPatientHistory(patientId) {
        const [rows] = await db.execute(
            `SELECT mr.*,
                    mr.id AS medical_record_id,
                    pa.id AS patient_id,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    d.id AS doctor_id,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    s.name AS specialty_name,
                    a.start_time AS appointment_start_time,
                    a.end_time AS appointment_end_time,
                    a.status AS appointment_status
             FROM Medical_Records mr
             LEFT JOIN Patients pa ON mr.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON mr.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             LEFT JOIN Specialties s ON d.specialty_id = s.id
             LEFT JOIN Appointments a ON mr.appointment_id = a.id
             WHERE mr.patient_id = ?
             ORDER BY mr.created_at DESC`,
            [patientId]
        );

        return rows || [];
    }

    static async getPatientHistoryWithSensitiveData(patientId) {
        const [rows] = await db.execute(
            `SELECT mr.*,
                    mr.id AS medical_record_id,
                    pa.id AS patient_id,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.date_of_birth AS patient_dob,
                    p.gender AS patient_gender,
                    d.id AS doctor_id,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    s.name AS specialty_name,
                    a.start_time AS appointment_start_time,
                    a.end_time AS appointment_end_time,
                    a.status AS appointment_status
             FROM Medical_Records mr
             LEFT JOIN Patients pa ON mr.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON mr.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             LEFT JOIN Specialties s ON d.specialty_id = s.id
             LEFT JOIN Appointments a ON mr.appointment_id = a.id
             WHERE mr.patient_id = ?
             ORDER BY mr.created_at DESC`,
            [patientId]
        );

        return rows || [];
    }

    static async checkMedicalRecordExistsForAppointment(appointmentId) {
        const [rows] = await db.execute(
            `SELECT id FROM Medical_Records WHERE appointment_id = ?`,
            [appointmentId]
        );

        return rows.length > 0;
    }
}

export default MedicalRecordRepository;