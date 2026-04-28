/**
 * Patient Repository (DAL Layer)
 * Database operations for Patient
 * SRS UC1 - Patient Registration
 * SRS UC2 - Patient Search
 * SRS UC3 - Patient Information Update
 * SRS UC4 - View Patient History
 */

import db from '../../config/db.js';

/**
 * Convert MySQL DATE/DATETIME to YYYY-MM-DD string
 */
function formatDateField(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof value === 'string' && value.includes('T')) {
    return value.split('T')[0];
  }
  return value;
}

class PatientRepository {
    /**
     * Transform patient row to ensure date fields are in YYYY-MM-DD format
     */
    static transformPatient(row) {
        if (!row) return row;
        return {
            ...row,
            date_of_birth: formatDateField(row.date_of_birth)
        };
    }

    /**
     * Transform array of patient rows
     */
    static transformPatients(rows) {
        if (!rows || !Array.isArray(rows)) return rows;
        return rows.map(row => this.transformPatient(row));
    }

    /**
     * Generate unique patient ID
     * Format: P00001, P00002, etc.
     */
    static async generatePatientId() {
        const [rows] = await db.query(
            `SELECT id FROM Patients ORDER BY id DESC LIMIT 1`
        );

        let nextNumber = 1;
        if (rows.length > 0) {
            const lastId = rows[0].id;
            // Extract number from format like "P00001"
            const match = lastId.match(/P(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }

        const paddedNumber = String(nextNumber).padStart(5, '0');
        return `P${paddedNumber}`;
    }

    /**
     * Create patient record
     */
    static async createPatient(patient) {
        const { id, profile_id } = patient;

        const [result] = await db.query(
            `INSERT INTO Patients (id, profile_id) VALUES (?, ?)`,
            [id, profile_id]
        );

        return result.affectedRows > 0;
    }

    /**
     * Update patient (limited to profile_id only)
     * Note: Other patient data is stored in Profiles table
     */
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

        const sql = `UPDATE Patients SET ${fields.join(', ')} WHERE id = ?`;
        values.push(id);

        const [result] = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    /**
     * Get patient by ID
     */
    static async getPatientById(id) {
        const [rows] = await db.query(
            `SELECT * FROM Patients WHERE id = ?`,
            [id]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Get patient by profile_id
     */
    static async getPatientByProfileId(profileId) {
        const [rows] = await db.query(
            `SELECT * FROM Patients WHERE profile_id = ?`,
            [profileId]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Search patients by id, name, or phone
     */
    static async searchPatients(keyword) {
        const searchTerm = `%${keyword}%`;

        const [rows] = await db.query(
            `SELECT 
                pa.id,
                pa.profile_id,
                p.first_name,
                p.last_name,
                p.date_of_birth,
                p.gender,
                p.email,
                p.phone,
                p.address
            FROM Patients pa
            INNER JOIN Profiles p ON pa.profile_id = p.id
            WHERE pa.id LIKE ?
                OR CONCAT(p.first_name, ' ', p.last_name) LIKE ?
                OR p.first_name LIKE ?
                OR p.last_name LIKE ?
                OR p.phone LIKE ?
            ORDER BY p.last_name, p.first_name`,
            [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
        );

        return this.transformPatients(rows);
    }

    /**
     * Get all patients with profile info
     */
    static async getPatients() {
        const [rows] = await db.query(
            `SELECT 
                pa.id,
                pa.profile_id,
                p.first_name,
                p.last_name,
                p.date_of_birth,
                p.gender,
                p.email,
                p.phone,
                p.address
            FROM Patients pa
            INNER JOIN Profiles p ON pa.profile_id = p.id
            ORDER BY p.last_name, p.first_name`
        );

        return this.transformPatients(rows);
    }

    /**
     * Get patient with full profile info
     */
    static async getPatientProfile(id) {
        const [rows] = await db.query(
            `SELECT 
                pa.id,
                pa.profile_id,
                p.username,
                p.first_name,
                p.last_name,
                p.date_of_birth,
                p.gender,
                p.email,
                p.phone,
                p.address,
                p.is_deleted
            FROM Patients pa
            INNER JOIN Profiles p ON pa.profile_id = p.id
            WHERE pa.id = ?`,
            [id]
        );

        return this.transformPatient(rows.length > 0 ? rows[0] : null);
    }

    /**
     * Get patient appointments history
     */
    static async getPatientAppointments(patientId) {
        const [rows] = await db.query(
            `SELECT 
                a.id,
                a.work_schedule_id,
                a.start_time,
                a.end_time,
                a.status,
                a.created_at,
                a.updated_at,
                d.id AS doctor_id,
                dp.first_name AS doctor_first_name,
                dp.last_name AS doctor_last_name,
                s.name AS specialty_name
            FROM Appointments a
            INNER JOIN Doctors d ON a.doctor_id = d.id
            INNER JOIN Profiles dp ON d.profile_id = dp.id
            LEFT JOIN Specialties s ON d.specialty_id = s.id
            WHERE a.patient_id = ?
            ORDER BY a.start_time DESC`,
            [patientId]
        );

        return rows;
    }

    /**
     * Get patient medical records history
     */
    static async getPatientMedicalRecords(patientId) {
        const [rows] = await db.query(
            `SELECT 
                mr.id,
                mr.appointment_id,
                mr.diagnosis,
                mr.prescription,
                mr.status,
                mr.created_at,
                mr.updated_at,
                d.id AS doctor_id,
                dp.first_name AS doctor_first_name,
                dp.last_name AS doctor_last_name,
                s.name AS specialty_name
            FROM Medical_Records mr
            INNER JOIN Doctors d ON mr.doctor_id = d.id
            INNER JOIN Profiles dp ON d.profile_id = dp.id
            LEFT JOIN Specialties s ON d.specialty_id = s.id
            WHERE mr.patient_id = ?
            ORDER BY mr.created_at DESC`,
            [patientId]
        );

        return rows;
    }

    /**
     * Get patient bills
     */
    static async getPatientBills(patientId) {
        const [rows] = await db.query(
            `SELECT 
                b.id,
                b.medical_record_id,
                b.total_amount,
                b.status,
                b.payment_method,
                b.payment_date,
                b.created_at,
                b.updated_at
            FROM Bills b
            INNER JOIN Medical_Records mr ON b.medical_record_id = mr.id
            WHERE mr.patient_id = ?
            ORDER BY b.created_at DESC`,
            [patientId]
        );

        return rows;
    }
}

export default PatientRepository;
