// Profile.repository.js
import db from './../../config/db.js';
import Patient from '../Patient/Patient.repository.js';
import Doctor from '../Doctor/Doctor.repository.js';
import bcrypt from 'bcrypt';

class Profile {
    static async generateId(role) {
        let tableName;
        let prefix;

        switch (role) {
            case `PATIENT`:
                tableName = `Patients`;
                prefix = `P`
                break;
            case `DOCTOR`:
                tableName = `Doctors`;
                prefix = `D`;
                break;
        }

        const [rows] = await db.execute(
            `SELECT id 
            FROM ${tableName} 
            ORDER BY id DESC 
            LIMIT 1`
        );

        let nextNumber = 1;

        if (rows.length > 0) {
            const lastId = rows[0].id;
            const numberPart = parseInt(lastId.slice(1)); // cắt chữ đầu, chuyển 5 char sau sang số
            nextNumber = numberPart + 1;
        }

        const paddedNumber = String(nextNumber).padStart(5, '0');

        return `${prefix}${paddedNumber}`;
    }

    static async createProfile(profile) {
        const {username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address} = profile;

        const [result] = await db.execute(
            `INSERT INTO Profiles (username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address, created_at, updated_at, is_deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 0)`,
            [username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address]
        );

        const profile_id = result.insertId;
        switch (role) {
            case `PATIENT`:
                await Patient.createPatient({
                    id: await this.generateId(role),
                    profile_id
                });
                break;
            case `DOCTOR`:
                await Doctor.createDoctor({
                    id: await this.generateId(role),
                    profile_id,
                    specialty_id: null
                });
                break;
        }

        return result.affectedRows > 0;
    }
    
    static async updateProfile(id, profile) {
        const allowedFields = [
            'username',
            'password_hash',
            'first_name',
            'last_name',
            'date_of_birth',
            'gender',
            'email',
            'phone',
            'address'
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

        const sql = `
            UPDATE Profiles
            SET updated_at = NOW(), ${fields.join(', ')}
            WHERE id = ?
        `;

        values.push(id);

        const [result] = await db.execute(sql, values);

        return result.affectedRows > 0;
    }
    
    static async deleteProfile(id) {
        const [result] = await db.execute(
            `UPDATE Profiles SET is_deleted = 1, updated_at = NOW() WHERE id = ?`, [id]
        );

        return result.affectedRows > 0;
    }
    
    static async getUserById(id) {
        const [result] = await db.execute(
            `SELECT * FROM Profiles WHERE id = ?`, [id]
        );

        return result.length > 0 ? result[0] : null;
    }
    
    static async getUserByUsername(username) {
        const [result] = await db.execute(
            `SELECT * FROM Profiles WHERE username = ?`, [username]
        );

        return result.length > 0 ? result[0] : null;
    }
    
    static async getProfiles() {
        const [result] = await db.execute(
            `SELECT * FROM Profiles`
        );

        return result.length > 0 ? result : null;
    }
    
    static async getProfilesByRole(role) {
        const [result] = await db.execute(
            `SELECT * FROM Profiles WHERE role = ?`, [role]
        );

        return result.length > 0 ? result : null;
    }
    
    static async updateProfileRole(id, role) {
        const [result] = await db.execute(
            `UPDATE Profiles SET role = ?, updated_at = NOW() WHERE id = ?`, [role, id]
        );

        return result.affectedRows > 0;
    }
    
    static async lockProfile(id) {
        const [result] = await db.execute(
            `UPDATE Profiles SET is_deleted = 1, updated_at = NOW() WHERE id = ?`, [id]
        );

        return result.length > 0 ? result : null;
    }
    
    static async unlockProfile(id) {
        const [result] = await db.execute(
            `UPDATE Profiles SET is_deleted = 0, updated_at = NOW() WHERE id = ?`, [id]
        );

        return result.affectedRows > 0;
    }
    
    static async login(username, password) {
        const user = await this.getUserByUsername(username);
        if (!user) return null;
        
        const isMatch = await bcrypt.compare(password, user.password_hash);

        return isMatch ? user : null;
    }
}

export default Profile;