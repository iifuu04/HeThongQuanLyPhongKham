// AppointmentRequest.repository.js
import db from "../../config/db.js";

class AppointmentRequest {
    // return bool
    static async createRequest(request) {
        // appointment_id có thể null, khi được duyệt request thì cập nhật appointment_id sau
        const {apointment_id, patient_id, doctor_id, specialty_id, shift_id, action, request_by} = request;

        const [result] = await db.execute(
            `INSERT INTO Appointment_Request (apointment_id, patient_id, doctor_id, specialty_id, shift_id, created_at, action, request_by, status)
            VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, 'PENDING')`,
            [apointment_id, patient_id, doctor_id, specialty_id, shift_id, action, request_by]
        );

        return result.affectedRows > 0;
    }

    static async approveRequest(id, approvedBy) {
        const [result] = await db.execute(
            `UPDATE Appointment_Request
            SET status = 'APPROVED', response_by = ?, response_at = NOW()
            WHERE id = ?`,
            [approvedBy, id]
        );

        return result.affectedRows > 0;
    }

    static async rejectRequest(id, approvedBy) {
        const [result] = await db.execute(
            `UPDATE Appointment_Request
            SET status = 'REJECTED', response_by = ?, response_at = NOW()
            WHERE id = ?`,
            [approvedBy, id]
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

    // return Request
    static async getRequestById(id) {
        const [rows] = await db.execute(
            `SELECT 
                ar.*, 
                p.first_name AS patient_first_name, 
                p.last_name AS patient_last_name,
                d.first_name AS doctor_first_name, 
                d.last_name AS doctor_last_name,
                req_p.username AS request_by_username, 
                app_p.username AS response_by_username
            FROM Appointment_Request ar
            LEFT JOIN Patients pat ON ar.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON ar.doctor_id = doc.id
            LEFT JOIN Profiles d ON doc.profile_id = d.id
            LEFT JOIN Profiles req_p ON ar.request_by = req_p.id
            LEFT JOIN Profiles app_p ON ar.response_by = app_p.id
            WHERE ar.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    // return List<Request>
    static async getRequests() {
        const [rows] = await db.execute(
            `SELECT 
                ar.*, 
                p.first_name AS patient_first_name, 
                p.last_name AS patient_last_name,
                d.first_name AS doctor_first_name, 
                d.last_name AS doctor_last_name,
                req_p.username AS request_by_username, 
                app_p.username AS response_by_username
            FROM Appointment_Request ar
            LEFT JOIN Patients pat ON ar.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON ar.doctor_id = doc.id
            LEFT JOIN Profiles d ON doc.profile_id = d.id
            LEFT JOIN Profiles req_p ON ar.request_by = req_p.id
            LEFT JOIN Profiles app_p ON ar.response_by = app_p.id
            ORDER BY ar.created_at DESC`
        );

        return rows;
    }

    static async getPendingRequests() {
        const [rows] = await db.execute(
            `SELECT 
                ar.*, 
                p.first_name AS patient_first_name, 
                p.last_name AS patient_last_name,
                d.first_name AS doctor_first_name,
                d.last_name AS doctor_last_name,
                req_p.username AS request_by_username
            FROM Appointment_Request ar
            LEFT JOIN Patients pat ON ar.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON ar.doctor_id = doc.id
            LEFT JOIN Profiles d ON doc.profile_id = d.id
            LEFT JOIN Profiles req_p ON ar.request_by = req_p.id
            WHERE ar.status = 'PENDING'
            ORDER BY ar.created_at ASC`
        );

        return rows;
    }

    static async getRequestsByStatus(status) {
        const [rows] = await db.execute(
            `SELECT
                ar.*, p.first_name AS patient_first_name, 
                p.last_name AS patient_last_name,
                d.first_name AS doctor_first_name, 
                d.last_name AS doctor_last_name,
                req_p.username AS request_by_username, 
                app_p.username AS response_by_username
            FROM Appointment_Request ar
            LEFT JOIN Patients pat ON ar.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON ar.doctor_id = doc.id
            LEFT JOIN Profiles d ON doc.profile_id = d.id
            LEFT JOIN Profiles req_p ON ar.request_by = req_p.id
            LEFT JOIN Profiles app_p ON ar.response_by = app_p.id
            WHERE ar.status = ?
            ORDER BY ar.created_at DESC`,
            [status]
        );

        return rows;
    }

    static async getRequestsByAppointment(appointmentId) {
        const [rows] = await db.execute(
            `SELECT
                ar.*, 
                p.first_name AS patient_first_name, 
                p.last_name AS patient_last_name,
                d.first_name AS doctor_first_name, 
                d.last_name AS doctor_last_name,
                req_p.username AS request_by_username, 
                app_p.username AS response_by_username
            FROM Appointment_Request ar
            LEFT JOIN Patients pat ON ar.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON ar.doctor_id = doc.id
            LEFT JOIN Profiles d ON doc.profile_id = d.id
            LEFT JOIN Profiles req_p ON ar.request_by = req_p.id
            LEFT JOIN Profiles app_p ON ar.response_by = app_p.id
            WHERE ar.apointment_id = ?
            ORDER BY ar.created_at DESC`,
            [appointmentId]
        );

        return rows;
    }
}

export default AppointmentRequest;