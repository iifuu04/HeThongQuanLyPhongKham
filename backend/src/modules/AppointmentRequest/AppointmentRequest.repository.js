// AppointmentRequest.repository.js
import db from '../../config/db.js';

class AppointmentRequestRepository {
    static async generateRequestId() {
        const [rows] = await db.execute(
            `SELECT MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)) as max_num FROM Appointment_Request WHERE id LIKE 'REQ%'`
        );
        const maxNum = rows[0].max_num || 0;
        return `REQ${String(maxNum + 1).padStart(6, '0')}`;
    }

    static async createRequest(request) {
        const { appointment_id, patient_id, doctor_id, action, reason, request_by, new_data } = request;

        // Note: Column name is 'apointment_id' (typo in schema)
        const [result] = await db.execute(
            `INSERT INTO Appointment_Request (id, apointment_id, patient_id, doctor_id, action, reason, new_data, request_by, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', CURDATE())`,
            [await this.generateRequestId(), appointment_id || null, patient_id || null, doctor_id || null, action, reason || null, new_data ? JSON.stringify(new_data) : null, request_by]
        );

        return result.affectedRows > 0;
    }

    static async createRequestWithTransaction(request) {
        const { appointment_id, patient_id, doctor_id, action, reason, request_by, new_data } = request;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const requestId = await this.generateRequestId();

            const [insertResult] = await connection.execute(
                `INSERT INTO Appointment_Request (id, appointment_id, patient_id, doctor_id, action, reason, new_data, request_by, status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
                [requestId, appointment_id || null, patient_id || null, doctor_id || null, action, reason || null, new_data ? JSON.stringify(new_data) : null, request_by]
            );

            if (insertResult.affectedRows === 0) {
                throw new Error('Failed to create request');
            }

            await connection.commit();

            const created = await this.getRequestById(requestId);
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
            `SELECT
                ar.*,
                pat.id AS patient_id_ref,
                p.first_name AS patient_first_name,
                p.last_name AS patient_last_name,
                p.phone AS patient_phone,
                doc.id AS doctor_id_ref,
                dp.first_name AS doctor_first_name,
                dp.last_name AS doctor_last_name,
                sp.name AS specialty_name,
                req_p.username AS request_by_username,
                req_p.first_name AS request_by_first_name,
                req_p.last_name AS request_by_last_name,
                app_p.username AS response_by_username,
                app_p.first_name AS response_by_first_name,
                app_p.last_name AS response_by_last_name,
                a.start_time AS appointment_start_time,
                a.end_time AS appointment_end_time,
                a.status AS appointment_status
             FROM Appointment_Request ar
             LEFT JOIN Patients pat ON ar.patient_id = pat.id
             LEFT JOIN Profiles p ON pat.profile_id = p.id
             LEFT JOIN Doctors doc ON ar.doctor_id = doc.id
             LEFT JOIN Profiles dp ON doc.profile_id = dp.id
             LEFT JOIN Specialties sp ON doc.specialty_id = sp.id
             LEFT JOIN Profiles req_p ON ar.request_by = req_p.id
             LEFT JOIN Profiles app_p ON ar.response_by = app_p.id
             LEFT JOIN Appointments a ON ar.apointment_id = a.id
             WHERE ar.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getRequests(filters = {}) {
        let sql = `
            SELECT
                ar.*,
                pat.id AS patient_id_ref,
                p.first_name AS patient_first_name,
                p.last_name AS patient_last_name,
                p.phone AS patient_phone,
                doc.id AS doctor_id_ref,
                dp.first_name AS doctor_first_name,
                dp.last_name AS doctor_last_name,
                sp.name AS specialty_name,
                req_p.username AS request_by_username,
                req_p.first_name AS request_by_first_name,
                req_p.last_name AS request_by_last_name,
                app_p.username AS response_by_username,
                a.start_time AS appointment_start_time,
                a.end_time AS appointment_end_time,
                a.status AS appointment_status
             FROM Appointment_Request ar
             LEFT JOIN Patients pat ON ar.patient_id = pat.id
             LEFT JOIN Profiles p ON pat.profile_id = p.id
             LEFT JOIN Doctors doc ON ar.doctor_id = doc.id
             LEFT JOIN Profiles dp ON doc.profile_id = dp.id
             LEFT JOIN Specialties sp ON doc.specialty_id = sp.id
             LEFT JOIN Profiles req_p ON ar.request_by = req_p.id
             LEFT JOIN Profiles app_p ON ar.response_by = app_p.id
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

        return rows;
    }

    static async getPendingRequests() {
        return await this.getRequests({ status: 'PENDING' });
    }

    static async getRequestsByStatus(status) {
        return await this.getRequests({ status });
    }

    static async getRequestsByAppointment(appointmentId) {
        const [rows] = await db.execute(
            `SELECT
                ar.*,
                p.first_name AS patient_first_name,
                p.last_name AS patient_last_name,
                dp.first_name AS doctor_first_name,
                dp.last_name AS doctor_last_name,
                req_p.username AS request_by_username,
                app_p.username AS response_by_username
             FROM Appointment_Request ar
             LEFT JOIN Patients pat ON ar.patient_id = pat.id
             LEFT JOIN Profiles p ON pat.profile_id = p.id
             LEFT JOIN Doctors doc ON ar.doctor_id = doc.id
             LEFT JOIN Profiles dp ON doc.profile_id = dp.id
             LEFT JOIN Profiles req_p ON ar.request_by = req_p.id
             LEFT JOIN Profiles app_p ON ar.response_by = app_p.id
             WHERE ar.apointment_id = ?
             ORDER BY ar.created_at DESC`,
            [appointmentId]
        );

        return rows;
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
