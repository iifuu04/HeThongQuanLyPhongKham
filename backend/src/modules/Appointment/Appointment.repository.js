// Appointment.repository.js
import db from './../../config/db.js'

class Appointment {
    // return bool
    static async createAppointment(appointment) {
        const {patient_id, doctor_id, work_schedule_id, start_time, end_time, status} = appointment;

        const [result] = await db.execute(
            `INSERT INTO Appointments (patient_id, doctor_id, work_schedule_id, start_time, end_time, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [patient_id, doctor_id, work_schedule_id, start_time, end_time, status || 'SCHEDULED']
        );

        return result.affectedRows > 0;
    }

    static async cancelAppointment(id) {
        const [result] = await db.execute(
            `UPDATE Appointments SET status = 'CANCELLED', updated_at = NOW() WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async updateAppointment(id, status) {
        const [result] = await db.execute(
            `UPDATE Appointments SET status = ?, updated_at = NOW() WHERE id = ?`,
            [status, id]
        );

        return result.affectedRows > 0;
    }
    
    static async checkSlotAvailability(scheduleId) {
        const [schedule] = await db.execute(
            `SELECT s.max_patients FROM Work_Schedules ws
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            WHERE ws.id = ?`,
            [scheduleId]
        );

        if (schedule.length === 0) return false;

        const [appointments] = await db.execute(
            `SELECT COUNT(*) AS current_appointments FROM Appointments
            WHERE work_schedule_id = ? AND status IN ('SCHEDULED', 'WAITING', 'INPROGRESS')`,
            [scheduleId]
        );

        return appointments[0].current_appointments < schedule[0].max_patients;
    }
    
    static async checkAppointmentConflict(doctorId, startTime, endTime) {
        const [rows] = await db.execute(
            `SELECT id FROM Appointments
            WHERE doctor_id = ? 
            AND status != 'CANCELLED'
            AND start_time < ? 
            AND end_time > ?
            LIMIT 1`,
            [doctorId, endTime, startTime]
        );

        return rows.length > 0;
    }

    // return Appointment
    static async getAppointmentById(id) {
        const [rows] = await db.execute(
            `SELECT a.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name,
                    s.start_time AS shift_start, s.end_time AS shift_end, c.name AS clinic_name
            FROM Appointments a
            LEFT JOIN Patients pat ON a.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON a.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            WHERE a.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }
    
    // return List<Appointment>
    static async getAppointments() {
        const [rows] = await db.execute(
            `SELECT a.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name,
                    s.start_time AS shift_start, s.end_time AS shift_end, c.name AS clinic_name
            FROM Appointments a
            LEFT JOIN Patients pat ON a.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON a.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            ORDER BY a.start_time DESC`
        );

        return rows;
    }

    static async getAppointmentsByStatus(status) {
        const [rows] = await db.execute(
            `SELECT a.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name,
                    s.start_time AS shift_start, s.end_time AS shift_end, c.name AS clinic_name
            FROM Appointments a
            LEFT JOIN Patients pat ON a.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON a.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            WHERE a.status = ?
            ORDER BY a.start_time DESC`,
            [status]
        );

        return rows;
    }

    static async getAppointmentsByDoctor(doctorId) {
        const [rows] = await db.execute(
            `SELECT a.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name,
                    s.start_time AS shift_start, s.end_time AS shift_end, c.name AS clinic_name
            FROM Appointments a
            LEFT JOIN Patients pat ON a.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON a.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            WHERE a.doctor_id = ?
            ORDER BY a.start_time DESC`,
            [doctorId]
        );

        return rows;
    }

    static async getAppointmentsByPatient(patientId) {
        const [rows] = await db.execute(
            `SELECT a.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name,
                    s.start_time AS shift_start, s.end_time AS shift_end, c.name AS clinic_name
            FROM Appointments a
            LEFT JOIN Patients pat ON a.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON a.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            WHERE a.patient_id = ?
            ORDER BY a.start_time DESC`,
            [patientId]
        );

        return rows;
    }

    static async getAppointmentsByDate(date) {
        const [rows] = await db.execute(
            `SELECT a.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name,
                    s.start_time AS shift_start, s.end_time AS shift_end, c.name AS clinic_name
            FROM Appointments a
            LEFT JOIN Patients pat ON a.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON a.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            WHERE DATE(a.start_time) = ?
            ORDER BY a.start_time`,
            [date]
        );

        return rows;
    }

    static async getWaitingAppointments() {
        const [rows] = await db.execute(
            `SELECT a.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name,
                    s.start_time AS shift_start, s.end_time AS shift_end, c.name AS clinic_name
            FROM Appointments a
            LEFT JOIN Patients pat ON a.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON a.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            WHERE a.status IN ('WAITING', 'SCHEDULED')
            ORDER BY a.start_time ASC`
        );

        return rows;
    }

    static async getAppointmentsByTimeRange(startTime, endTime) {
        const [rows] = await db.execute(
            `SELECT a.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name,
                    s.start_time AS shift_start, s.end_time AS shift_end, c.name AS clinic_name
            FROM Appointments a
            LEFT JOIN Patients pat ON a.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON a.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            WHERE a.start_time BETWEEN ? AND ?
            ORDER BY a.start_time`,
            [startTime, endTime]
        );

        return rows;
    }

    static async getAppointmentsByPatientStatus(patientId, status) {
        const [rows] = await db.execute(
            `SELECT a.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name, dp.last_name AS doctor_last_name,
                    s.start_time AS shift_start, s.end_time AS shift_end, c.name AS clinic_name
            FROM Appointments a
            LEFT JOIN Patients pat ON a.patient_id = pat.id
            LEFT JOIN Profiles p ON pat.profile_id = p.id
            LEFT JOIN Doctors doc ON a.doctor_id = doc.id
            LEFT JOIN Profiles dp ON doc.profile_id = dp.id
            LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            WHERE a.patient_id = ? AND a.status = ?
            ORDER BY a.start_time DESC`,
            [patientId, status]
        );

        return rows;
    }

}

export default Appointment;