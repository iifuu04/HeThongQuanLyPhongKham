/**
 * Profile Repository (DAL Layer)
 * Database operations for Profile/Account
 * SRS UC18 - User Management
 */

import db from '../../config/db.js';
import Patient from '../Patient/Patient.repository.js';
import Doctor from '../Doctor/Doctor.repository.js';

/**
 * Convert MySQL DATE/DATETIME to YYYY-MM-DD string
 * mysql2 returns dates as Date objects which serialize to ISO strings
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

class Profile {
    /**
     * Transform profile row to ensure date fields are in YYYY-MM-DD format
     */
    static transformProfile(row) {
        if (!row) return row;
        return {
            ...row,
            date_of_birth: formatDateField(row.date_of_birth)
        };
    }

    /**
     * Transform array of profile rows
     */
    static transformProfiles(rows) {
        if (!rows || !Array.isArray(rows)) return rows;
        return rows.map(row => this.transformProfile(row));
    }

    /**
     * Generate unique ID for Patient or Doctor
     */
    static async generateId(role) {
        let tableName;
        let prefix;

        switch (role) {
            case 'PATIENT':
                tableName = 'Patients';
                prefix = 'P';
                break;
            case 'DOCTOR':
                tableName = 'Doctors';
                prefix = 'D';
                break;
            default:
                return null;
        }

        const [rows] = await db.query(
            `SELECT id FROM ${tableName} ORDER BY id DESC LIMIT 1`
        );

        let nextNumber = 1;
        if (rows.length > 0) {
            const lastId = rows[0].id;
            const numberPart = parseInt(lastId.slice(1));
            nextNumber = numberPart + 1;
        }

        const paddedNumber = String(nextNumber).padStart(5, '0');
        return `${prefix}${paddedNumber}`;
    }

    /**
     * Create new profile
     */
    static async createProfile(profile) {
        const { username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address } = profile;

        const [result] = await db.query(
            `INSERT INTO Profiles (username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address, created_at, updated_at, is_deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 0)`,
            [username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address]
        );

        const profile_id = result.insertId;

        // Create corresponding Patient or Doctor record
        switch (role) {
            case 'PATIENT':
                const patientId = await this.generateId('PATIENT');
                if (patientId) {
                    await Patient.createPatient({ id: patientId, profile_id });
                }
                break;
            case 'DOCTOR':
                const doctorId = await this.generateId('DOCTOR');
                if (doctorId) {
                    await Doctor.createDoctor({ id: doctorId, profile_id, specialty_id: null });
                }
                break;
        }

        return result.affectedRows > 0;
    }

    /**
     * Update profile - dynamic fields
     */
    static async updateProfile(id, profile) {
        const allowedFields = [
            'username', 'password_hash', 'first_name', 'last_name',
            'date_of_birth', 'gender', 'email', 'phone', 'address'
        ];

        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(profile)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        const sql = `UPDATE Profiles SET updated_at = NOW(), ${fields.join(', ')} WHERE id = ?`;
        values.push(id);

        const [result] = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    /**
     * Soft delete profile (set is_deleted = 1)
     */
    static async deleteProfile(id) {
        const [result] = await db.query(
            `UPDATE Profiles SET is_deleted = 1, updated_at = NOW() WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    /**
     * Get profile by ID (excluding password_hash)
     */
    static async getUserById(id) {
        const [result] = await db.query(
            `SELECT id, username, role, first_name, last_name, date_of_birth, gender, email, phone, address, created_at, updated_at, is_deleted
             FROM Profiles WHERE id = ?`,
            [id]
        );
        return this.transformProfile(result.length > 0 ? result[0] : null);
    }

    /**
     * Get profile by username (excluding password_hash)
     */
    static async getUserByUsername(username) {
        const [result] = await db.query(
            `SELECT id, username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address, created_at, updated_at, is_deleted
             FROM Profiles WHERE username = ?`,
            [username]
        );
        return this.transformProfile(result.length > 0 ? result[0] : null);
    }

    /**
     * Get all profiles (excluding password_hash)
     */
    static async getProfiles() {
        const [result] = await db.query(
            `SELECT id, username, role, first_name, last_name, date_of_birth, gender, email, phone, address, created_at, updated_at, is_deleted
             FROM Profiles ORDER BY id DESC`
        );
        return this.transformProfiles(result);
    }

    /**
     * Get profiles by role (excluding password_hash)
     */
    static async getProfilesByRole(role) {
        const [result] = await db.query(
            `SELECT id, username, role, first_name, last_name, date_of_birth, gender, email, phone, address, created_at, updated_at, is_deleted
             FROM Profiles WHERE role = ? ORDER BY id DESC`,
            [role]
        );
        return this.transformProfiles(result);
    }

    /**
     * Update profile role
     */
    static async updateProfileRole(id, role) {
        const [result] = await db.query(
            `UPDATE Profiles SET role = ?, updated_at = NOW() WHERE id = ?`,
            [role, id]
        );
        return result.affectedRows > 0;
    }

    /**
     * Lock profile (set is_deleted = 1)
     */
    static async lockProfile(id) {
        const [result] = await db.query(
            `UPDATE Profiles SET is_deleted = 1, updated_at = NOW() WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    /**
     * Unlock profile (set is_deleted = 0)
     */
    static async unlockProfile(id) {
        const [result] = await db.query(
            `UPDATE Profiles SET is_deleted = 0, updated_at = NOW() WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }
}

export default Profile;
