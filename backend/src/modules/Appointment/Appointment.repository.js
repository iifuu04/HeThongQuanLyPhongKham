// Appointment.repository.js
import db from '../../config/db.js';

class AppointmentRepository {
    static async generateAppointmentId() {
        const [rows] = await db.execute(
            `SELECT MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)) as max_num FROM Appointments WHERE id LIKE 'APT%'`
        );
        const maxNum = rows[0].max_num || 0;
        return `APT${String(maxNum + 1).padStart(6, '0')}`;
    }

    static async createAppointmentWithTransaction(appointment) {
        const { patient_id, doctor_id, work_schedule_id, start_time, end_time, reason, requested_by } = appointment;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const scheduleResult = await connection.execute(
                `SELECT ws.*, s.max_patients, s.start_time AS shift_start, s.end_time AS shift_end
                 FROM Work_Schedules ws
                 JOIN Shifts s ON ws.shift_id = s.id
                 WHERE ws.id = ? AND ws.doctor_id = ?`,
                [work_schedule_id, doctor_id]
            );

            if (scheduleResult[0].length === 0) {
                throw new Error('Work schedule not found or does not belong to this doctor');
            }

            const schedule = scheduleResult[0][0];

            const workDate = schedule.work_date;
            const [countResult] = await connection.execute(
                `SELECT COUNT(*) as count FROM Appointments
                 WHERE work_schedule_id = ? AND status NOT IN ('CANCELLED')`,
                [work_schedule_id]
            );

            if (countResult[0].count >= schedule.max_patients) {
                throw new Error('No available slots for this schedule');
            }

            const [conflictResult] = await connection.execute(
                `SELECT id FROM Appointments
                 WHERE doctor_id = ? AND work_schedule_id = ?
                 AND status NOT IN ('CANCELLED')
                 AND start_time = ?`,
                [doctor_id, work_schedule_id, start_time]
            );

            if (conflictResult.length > 0) {
                throw new Error('Khung gio nay da duoc dat, vui long chon khung gio khac');
            }

            const appointmentId = await this.generateAppointmentId();

            const [insertResult] = await connection.execute(
                `INSERT INTO Appointments (id, patient_id, doctor_id, work_schedule_id, start_time, end_time, status, reason, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED', ?, NOW(), NOW())`,
                [appointmentId, patient_id, doctor_id, work_schedule_id, start_time, end_time, reason || null]
            );

            if (insertResult.affectedRows === 0) {
                throw new Error('Failed to create appointment');
            }

            await connection.commit();

            const created = await this.getAppointmentById(appointmentId);
            return { success: true, data: created };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async createAppointment(appointment) {
        const { patient_id, doctor_id, work_schedule_id, start_time, end_time, status } = appointment;

        const [result] = await db.execute(
            `INSERT INTO Appointments (id, patient_id, doctor_id, work_schedule_id, start_time, end_time, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [await this.generateAppointmentId(), patient_id, doctor_id, work_schedule_id, start_time, end_time, status || 'SCHEDULED']
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

    static async updateAppointmentWithCheck(id, newStatus, oldStatus) {
        const [result] = await db.execute(
            `UPDATE Appointments SET status = ?, updated_at = NOW()
             WHERE id = ? AND status = ?`,
            [newStatus, id, oldStatus]
        );

        return result.affectedRows > 0;
    }

    static async checkSlotAvailability(scheduleId) {
        const [schedule] = await db.execute(
            `SELECT s.max_patients FROM Work_Schedules ws
             JOIN Shifts s ON ws.shift_id = s.id
             WHERE ws.id = ?`,
            [scheduleId]
        );

        if (schedule.length === 0) return false;

        const [appointments] = await db.execute(
            `SELECT COUNT(*) AS current_appointments FROM Appointments
             WHERE work_schedule_id = ? AND status NOT IN ('CANCELLED')`,
            [scheduleId]
        );

        return appointments[0].current_appointments < schedule[0].max_patients;
    }

    static async checkAppointmentConflict(doctorId, workScheduleId, startTime) {
        const [rows] = await db.execute(
            `SELECT id FROM Appointments
             WHERE doctor_id = ? AND work_schedule_id = ?
             AND status NOT IN ('CANCELLED')
             AND start_time = ?
             LIMIT 1`,
            [doctorId, workScheduleId, startTime]
        );

        return rows.length > 0;
    }

    static async getAppointmentById(id) {
        const [rows] = await db.execute(
            `SELECT a.*,
                    pat.id AS patient_id_ref,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    p.email AS patient_email,
                    doc.id AS doctor_id_ref,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    dp.phone AS doctor_phone,
                    CONCAT(s.start_time, ' - ', s.end_time) AS shift_name,
                    s.start_time AS shift_start,
                    s.end_time AS shift_end,
                    s.max_patients,
                    c.name AS clinic_name,
                    c.location AS clinic_location,
                    sp.name AS specialty_name,
                    ws.work_date
             FROM Appointments a
             LEFT JOIN Patients pat ON a.patient_id = pat.id
             LEFT JOIN Profiles p ON pat.profile_id = p.id
             LEFT JOIN Doctors doc ON a.doctor_id = doc.id
             LEFT JOIN Profiles dp ON doc.profile_id = dp.id
             LEFT JOIN Specialties sp ON doc.specialty_id = sp.id
             LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
             LEFT JOIN Shifts s ON ws.shift_id = s.id
             LEFT JOIN Clinics c ON ws.clinic_id = c.id
             WHERE a.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getAppointments(filters = {}) {
        let sql = `
            SELECT a.*,
                    pat.id AS patient_id_ref,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    p.email AS patient_email,
                    doc.id AS doctor_id_ref,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    dp.phone AS doctor_phone,
                    CONCAT(s.start_time, ' - ', s.end_time) AS shift_name,
                    s.start_time AS shift_start,
                    s.end_time AS shift_end,
                    c.name AS clinic_name,
                    c.location AS clinic_location,
                    sp.name AS specialty_name,
                    ws.work_date
             FROM Appointments a
             LEFT JOIN Patients pat ON a.patient_id = pat.id
             LEFT JOIN Profiles p ON pat.profile_id = p.id
             LEFT JOIN Doctors doc ON a.doctor_id = doc.id
             LEFT JOIN Profiles dp ON doc.profile_id = dp.id
             LEFT JOIN Specialties sp ON doc.specialty_id = sp.id
             LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
             LEFT JOIN Shifts s ON ws.shift_id = s.id
             LEFT JOIN Clinics c ON ws.clinic_id = c.id
             WHERE 1=1
        `;

        const params = [];

        if (filters.status) {
            if (Array.isArray(filters.status)) {
                sql += ` AND a.status IN (${filters.status.map(() => '?').join(',')})`;
                params.push(...filters.status);
            } else {
                sql += ` AND a.status = ?`;
                params.push(filters.status);
            }
        }

        if (filters.doctor_id) {
            sql += ` AND a.doctor_id = ?`;
            params.push(filters.doctor_id);
        }

        if (filters.patient_id) {
            sql += ` AND a.patient_id = ?`;
            params.push(filters.patient_id);
        }

        if (filters.date) {
            sql += ` AND DATE(ws.work_date) = ?`;
            params.push(filters.date);
        }

        if (filters.from_date) {
            sql += ` AND DATE(ws.work_date) >= ?`;
            params.push(filters.from_date);
        }

        if (filters.to_date) {
            sql += ` AND DATE(ws.work_date) <= ?`;
            params.push(filters.to_date);
        }

        sql += ` ORDER BY a.start_time DESC`;

        const [rows] = await db.execute(sql, params);

        return rows;
    }

    static async getAppointmentsByStatus(status) {
        return await this.getAppointments({ status });
    }

    static async getAppointmentsByDoctor(doctorId) {
        return await this.getAppointments({ doctor_id: doctorId });
    }

    static async getAppointmentsByPatient(patientId) {
        return await this.getAppointments({ patient_id: patientId });
    }

    static async getAppointmentsByDate(date) {
        return await this.getAppointments({ date });
    }

    static async getWaitingAppointments() {
        return await this.getAppointments({ status: ['SCHEDULED', 'WAITING'] });
    }

    static async getAppointmentsByTimeRange(startTime, endTime) {
        const [rows] = await db.execute(
            `SELECT a.*,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    s.start_time AS shift_start,
                    s.end_time AS shift_end,
                    c.name AS clinic_name
             FROM Appointments a
             LEFT JOIN Patients pat ON a.patient_id = pat.id
             LEFT JOIN Profiles p ON pat.profile_id = p.id
             LEFT JOIN Doctors doc ON a.doctor_id = doc.id
             LEFT JOIN Profiles dp ON doc.profile_id = dp.id
             LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
             LEFT JOIN Shifts s ON ws.shift_id = s.id
             LEFT JOIN Clinics c ON ws.clinic_id = c.id
             WHERE DATE(a.start_time) BETWEEN ? AND ?
             ORDER BY a.start_time`,
            [startTime, endTime]
        );

        return rows;
    }

    static async getAppointmentsByPatientStatus(patientId, status) {
        return await this.getAppointments({ patient_id: patientId, status });
    }

    static async getAppointmentWithDoctorInfo(id) {
        const [rows] = await db.execute(
            `SELECT a.*,
                    doc.profile_id AS doctor_profile_id,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    dp.phone AS doctor_phone,
                    sp.name AS specialty_name
             FROM Appointments a
             LEFT JOIN Doctors doc ON a.doctor_id = doc.id
             LEFT JOIN Profiles dp ON doc.profile_id = dp.id
             LEFT JOIN Specialties sp ON doc.specialty_id = sp.id
             WHERE a.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getAppointmentWithPatientInfo(id) {
        const [rows] = await db.execute(
            `SELECT a.*,
                    pat.profile_id AS patient_profile_id,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    p.email AS patient_email
             FROM Appointments a
             LEFT JOIN Patients pat ON a.patient_id = pat.id
             LEFT JOIN Profiles p ON pat.profile_id = p.id
             WHERE a.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }
}

export default AppointmentRepository;
