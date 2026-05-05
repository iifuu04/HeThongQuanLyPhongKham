// AppointmentRequest.repository.js
// Schema: Appointment_Request(id INT, apointment_id INT, patient_id VARCHAR(6), doctor_id VARCHAR(6), specialty_id INT, shift_id INT, created_at DATE, action ENUM, request_by INT, response_by INT, response_at DATETIME, status ENUM)
import db from '../../config/db.js';

class AppointmentRequestRepository {
    // Note: Column name is 'apointment_id' (typo in schema - intentionally kept)

    static async createRequest(request) {
        const { appointment_id, patient_id, doctor_id, specialty_id, shift_id, action, reason, request_by } = request;

        const [result] = await db.execute(
            `INSERT INTO Appointment_Request (apointment_id, patient_id, doctor_id, specialty_id, shift_id, action, request_by, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', CURDATE())`,
            [appointment_id || null, patient_id || null, doctor_id || null, specialty_id || null, shift_id || null, action, request_by]
        );

        return result.affectedRows > 0;
    }

    static async createRequestWithTransaction(request) {
        const { appointment_id, patient_id, doctor_id, specialty_id, shift_id, action, reason, request_by } = request;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [insertResult] = await connection.execute(
                `INSERT INTO Appointment_Request (apointment_id, patient_id, doctor_id, specialty_id, shift_id, action, request_by, status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', CURDATE())`,
                [appointment_id || null, patient_id || null, doctor_id || null, specialty_id || null, shift_id || null, action, request_by]
            );

            if (insertResult.affectedRows === 0) {
                throw new Error('Failed to create request');
            }

            await connection.commit();

            const created = await this.getRequestById(insertResult.insertId);
            return { success: true, data: created };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async approveRequest(id, approvedBy) {
        const [result] = await db.execute(
            `UPDATE Appointment_Request
             SET status = 'APPROVED', response_by = ?, response_at = NOW()
             WHERE id = ? AND status = 'PENDING'`,
            [approvedBy, id]
        );

        return result.affectedRows > 0;
    }

    static async rejectRequest(id, rejectedBy, reason) {
        const [result] = await db.execute(
            `UPDATE Appointment_Request
             SET status = 'REJECTED', response_by = ?, response_at = NOW()
             WHERE id = ? AND status = 'PENDING'`,
            [rejectedBy, id]
        );

        return result.affectedRows > 0;
    }

    static async updateRequestStatus(id, status) {
        const [result] = await db.execute(
            `UPDATE Appointment_Request
             SET status = ?
             WHERE id = ?`,
            [status, id]
        );

        return result.affectedRows > 0;
    }

    static async getRequestById(id) {
        const [rows] = await db.execute(
            `SELECT ar.*,
                    ar.id AS request_id,
                    ar.status AS request_status,
                    ar.action AS request_action,
                    pa.id AS patient_id,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    d.id AS doctor_id,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    s.name AS specialty_name,
                    sh.start_time AS shift_start,
                    sh.end_time AS shift_end,
                    req_p.username AS request_by_username,
                    req_p.first_name AS request_by_first_name,
                    req_p.last_name AS request_by_last_name,
                    res_p.username AS response_by_username,
                    res_p.first_name AS response_by_first_name,
                    res_p.last_name AS response_by_last_name,
                    a.start_time AS appointment_start_time,
                    a.end_time AS appointment_end_time,
                    a.status AS appointment_status
             FROM Appointment_Request ar
             LEFT JOIN Patients pa ON ar.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON ar.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             LEFT JOIN Specialties s ON ar.specialty_id = s.id
             LEFT JOIN Shifts sh ON ar.shift_id = sh.id
             LEFT JOIN Profiles req_p ON ar.request_by = req_p.id
             LEFT JOIN Profiles res_p ON ar.response_by = res_p.id
             LEFT JOIN Appointments a ON ar.apointment_id = a.id
             WHERE ar.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getRequests(filters = {}) {
        let sql = `
            SELECT ar.*,
                    ar.id AS request_id,
                    ar.status AS request_status,
                    ar.action AS request_action,
                    pa.id AS patient_id,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    d.id AS doctor_id,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    s.name AS specialty_name,
                    sh.start_time AS shift_start,
                    sh.end_time AS shift_end,
                    req_p.username AS request_by_username,
                    req_p.first_name AS request_by_first_name,
                    req_p.last_name AS request_by_last_name,
                    res_p.username AS response_by_username,
                    res_p.first_name AS response_by_first_name,
                    res_p.last_name AS response_by_last_name,
                    a.start_time AS appointment_start_time,
                    a.end_time AS appointment_end_time,
                    a.status AS appointment_status
             FROM Appointment_Request ar
             LEFT JOIN Patients pa ON ar.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON ar.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             LEFT JOIN Specialties s ON ar.specialty_id = s.id
             LEFT JOIN Shifts sh ON ar.shift_id = sh.id
             LEFT JOIN Profiles req_p ON ar.request_by = req_p.id
             LEFT JOIN Profiles res_p ON ar.response_by = res_p.id
             LEFT JOIN Appointments a ON ar.apointment_id = a.id
             WHERE 1=1
        `;

        const params = [];

        if (filters.status) {
            sql += ` AND ar.status = ?`;
            params.push(filters.status);
        }

        if (filters.action) {
            sql += ` AND ar.action = ?`;
            params.push(filters.action);
        }

        if (filters.patient_id) {
            sql += ` AND ar.patient_id = ?`;
            params.push(filters.patient_id);
        }

        if (filters.doctor_id) {
            sql += ` AND ar.doctor_id = ?`;
            params.push(filters.doctor_id);
        }

        sql += ` ORDER BY ar.created_at DESC`;

        const [rows] = await db.execute(sql, params);

        return rows || [];
    }

    static async getPendingRequests() {
        return await this.getRequests({ status: 'PENDING' });
    }

    static async getRequestsByStatus(status) {
        return await this.getRequests({ status });
    }

    static async getRequestsByAppointment(appointmentId) {
        const [rows] = await db.execute(
            `SELECT ar.*,
                    ar.id AS request_id,
                    ar.status AS request_status,
                    ar.action AS request_action,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    req_p.username AS request_by_username,
                    res_p.username AS response_by_username
             FROM Appointment_Request ar
             LEFT JOIN Patients pa ON ar.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON ar.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             LEFT JOIN Profiles req_p ON ar.request_by = req_p.id
             LEFT JOIN Profiles res_p ON ar.response_by = res_p.id
             WHERE ar.apointment_id = ?
             ORDER BY ar.created_at DESC`,
            [appointmentId]
        );

        return rows || [];
    }

    static async updateAppointmentStatus(appointmentId, status) {
        const [result] = await db.execute(
            `UPDATE Appointments SET status = ?, updated_at = NOW() WHERE id = ?`,
            [status, appointmentId]
        );

        return result.affectedRows > 0;
    }
}

export default AppointmentRequestRepository;
