// MedicalRecord.repository.js
import db from "../../config/db.js";

class MedicalRecord {
    // return bool
    static async createMedicalRecord(record) {
        const {patient_id, doctor_id, appointment_id, note, symptoms, diagnosis, result, prescription} = record;

        const [result_] = await db.execute(
            `INSERT INTO Medical_Records (patient_id, doctor_id, appointment_id, note, symptoms, diagnosis, result, prescription, created_at, updated_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 'INCOMPLETE')`,
            [patient_id, doctor_id, appointment_id, note, symptoms, diagnosis, result, prescription]
        );

        return result_.affectedRows > 0;
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

        const sql = `
            UPDATE Medical_Records
            SET updated_at = NOW(), ${fields.join(', ')}
            WHERE id = ?
        `;

        values.push(id);

        const [result_] = await db.execute(sql, values);

        return result_.affectedRows > 0;
    }
    
    static async finalizeMedicalRecord(id) {
        const [result_] = await db.execute(
            `UPDATE Medical_Records SET updated_at = NOW(), status = 'COMPLETED' WHERE id = ?`,
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
    
    // return MedicalRecord
    static async getMedicalRecordById(id) {
        const [rows] = await db.execute(
            `
            WITH patient_profile AS (
                SELECT 
                    mr.id                                       AS id,
                    mr.patient_id                               AS patient_id,
                    CONCAT(p.first_name, ' ', p.last_name)      AS patient_name
                FROM Medical_Records mr
                JOIN Patients pa    ON mr.patient_id = pa.id
                JOIN Profiles p     ON pa.profile_id = p.id
                WHERE mr.id = ?
            ),
            
            doctor_profile AS (
                SELECT 
                    mr.id                                       AS id,
                    mr.doctor_id                                AS doctor_id,
                    CONCAT(p.first_name, ' ', p.last_name)      AS doctor_name
                FROM Medical_Records mr
                JOIN Doctors  d     ON mr.doctor_id = d.id
                JOIN Profiles p     ON d.profile_id = p.id
                WHERE mr.id = ?
            )

            SELECT 
                mr.*, 
                pp.patient_name         AS patient_name,
                dp.doctor_id            AS doctor_id_ref, 
                dp.doctor_name          AS doctor_name
            FROM Medical_Records mr
            LEFT JOIN patient_profile pp ON mr.id = pp.id
            LEFT JOIN doctor_profile dp ON mr.id = dp.id
            WHERE mr.id = ?`,
            [id,id,id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getMedicalRecordByAppointment(appointmentId) {
        const [rows] = await db.execute(
            `WITH patient_profile AS (
                SELECT 
                    mr.appointment_id                           AS appointment_id,
                    mr.patient_id                               AS patient_id,
                    CONCAT(p.first_name, ' ', p.last_name)      AS patient_name
                FROM Medical_Records mr
                JOIN Patients pa    ON mr.patient_id = pa.id
                JOIN Profiles p     ON pa.profile_id = p.id
                WHERE mr.appointment_id = ?
            ),
            
            doctor_profile AS (
                SELECT 
                    mr.appointment_id                           AS appointment_id,
                    mr.doctor_id                                AS doctor_id,
                    CONCAT(p.first_name, ' ', p.last_name)      AS doctor_name
                FROM Medical_Records mr
                JOIN Doctors  d     ON mr.doctor_id = d.id
                JOIN Profiles p     ON d.profile_id = p.id
                WHERE mr.appointment_id = ?
            )

            SELECT 
                mr.*, 
                pp.patient_name         AS patient_name,
                dp.doctor_id            AS doctor_id_ref, 
                dp.doctor_name          AS doctor_name
            FROM Medical_Records mr
            LEFT JOIN patient_profile pp ON mr.appointment_id = pp.appointment_id
            LEFT JOIN doctor_profile dp ON mr.appointment_id = dp.appointment_id
            WHERE mr.appointment_id = ?`,
            [appointmentId,appointmentId,appointmentId]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getMedicalRecordDetails(id) {
        const [rows] = await db.execute(
            `SELECT 
                mr.*, 
                a.start_time, 
                a.end_time, 
                a.status AS appointment_status,
                p.first_name AS patient_first_name, 
                p.last_name AS patient_last_name, 
                p.email AS patient_email,
                dp.first_name AS doctor_first_name, 
                dp.last_name AS doctor_last_name, 
                dp.email AS doctor_email
            FROM Medical_Records mr
            LEFT JOIN Appointments a ON mr.appointment_id = a.id
            LEFT JOIN Patients pat ON mr.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON mr.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            WHERE mr.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    // return List<MedicalRecord>
    static async getMedicalRecordsByPatient(patientId) {
        const [rows] = await db.execute(
            `SELECT 
                mr.*, 
                p.first_name AS patient_first_name, 
                p.last_name AS patient_last_name,
                dp.first_name AS doctor_first_name, 
                dp.last_name AS doctor_last_name
            FROM Medical_Records mr
            LEFT JOIN Patients pat ON mr.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON mr.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            WHERE mr.patient_id = ?
            ORDER BY mr.created_at DESC`,
            [patientId]
        );

        return rows;
    }

    static async getMedicalRecords() {
        const [rows] = await db.execute(
            `SELECT mr.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name
            FROM Medical_Records mr
            LEFT JOIN Patients pat ON mr.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON mr.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            ORDER BY mr.created_at DESC`
        );

        return rows;
    }

    static async getPatientHistory(patientId) {
        const [rows] = await db.execute(
            `SELECT mr.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name,
                    a.start_time, a.end_time, a.status AS appointment_status
            FROM Medical_Records mr
            LEFT JOIN Appointments a ON mr.appointment_id = a.id
            LEFT JOIN Patients pat ON mr.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON mr.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            WHERE mr.patient_id = ?
            ORDER BY mr.created_at DESC`,
            [patientId]
        );

        return rows;
    }

    static async getMedicalRecordsByDoctor(doctorId) {
        const [rows] = await db.execute(
            `SELECT mr.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name
            FROM Medical_Records mr
            LEFT JOIN Patients pat ON mr.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON mr.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            WHERE mr.doctor_id = ?
            ORDER BY mr.created_at DESC`,
            [doctorId]
        );

        return rows;
    }

    static async getMedRecordByPatientAndDate(patientId, date) {
        const [rows] = await db.execute(
            `SELECT mr.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name
            FROM Medical_Records mr
            LEFT JOIN Patients pat ON mr.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON mr.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            WHERE mr.patient_id = ? AND DATE(mr.created_at) = ?
            ORDER BY mr.created_at DESC`,
            [patientId, date]
        );

        return rows;
    }
}

export default MedicalRecord;