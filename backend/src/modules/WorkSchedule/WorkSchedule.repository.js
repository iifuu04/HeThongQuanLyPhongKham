// WorkSchedule.repository.js
import db from "../../config/db.js";

class WorkSchedule {
    // return bool
    static async createSchedule(schedule) {
        const {doctor_id, clinic_id, shift_id, work_date} = schedule;

        const [result] = await db.execute(
            `INSERT INTO Work_Schedules (doctor_id, clinic_id, shift_id, work_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [doctor_id, clinic_id, shift_id, work_date]
        );

        return result.affectedRows > 0;
    }
    
    static async updateSchedule(id, schedule) {
        const allowedFields = ['doctor_id', 'clinic_id', 'shift_id', 'work_date'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(schedule)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        const sql = `
            UPDATE Work_Schedules
            SET updated_at = NOW(), ${fields.join(', ')}
            WHERE id = ?
        `;

        values.push(id);

        const [result] = await db.execute(sql, values);

        return result.affectedRows > 0;
    }
    
    static async deleteSchedule(id) {
        const [result] = await db.execute(
            `DELETE FROM Work_Schedules WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }
    
    static async checkScheduleConflict(doctorId, date, shiftId) {
        // nếu những tham số truyền vào mà query ra được là đã tồn tại lịch r => conflict
        const [rows] = await db.execute(
            `SELECT id FROM Work_Schedules
            WHERE doctor_id = ? AND work_date = ? AND shift_id = ?`,
            [doctorId, date, shiftId]
        );

        return rows.length > 0;
    }
    
    // return Schedule
    static async getScheduleById(id) {
        const [rows] = await db.execute(
            `SELECT ws.*, d.id AS doctor_id_ref, dp.first_name, dp.last_name,
                    c.name AS clinic_name, c.location, s.start_time, s.end_time, s.max_patients
            FROM Work_Schedules ws
            LEFT JOIN Doctors d ON ws.doctor_id = d.id
            LEFT JOIN Profiles dp ON d.profile_id = dp.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            WHERE ws.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }
    
    // return List<Schedule>
    static async getScheduleByDoctor(doctorId) {
        const [rows] = await db.execute(
            `SELECT ws.*, d.id AS doctor_id_ref, dp.first_name, dp.last_name,
                    c.name AS clinic_name, c.location, s.start_time, s.end_time, s.max_patients
            FROM Work_Schedules ws
            LEFT JOIN Doctors d ON ws.doctor_id = d.id
            LEFT JOIN Profiles dp ON d.profile_id = dp.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            WHERE ws.doctor_id = ?
            ORDER BY ws.work_date, s.start_time`,
            [doctorId]
        );

        return rows;
    }
    
    static async getScheduleByDate(date) {
        const [rows] = await db.execute(
            `SELECT ws.*, d.id AS doctor_id_ref, dp.first_name, dp.last_name,
                    c.name AS clinic_name, c.location, s.start_time, s.end_time, s.max_patients
            FROM Work_Schedules ws
            LEFT JOIN Doctors d ON ws.doctor_id = d.id
            LEFT JOIN Profiles dp ON d.profile_id = dp.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            WHERE ws.work_date = ?
            ORDER BY s.start_time`,
            [date]
        );

        return rows;
    }
    
    static async getSchedules() {
        const [rows] = await db.execute(
            `SELECT ws.*, d.id AS doctor_id_ref, dp.first_name, dp.last_name,
                    c.name AS clinic_name, c.location, s.start_time, s.end_time, s.max_patients
            FROM Work_Schedules ws
            LEFT JOIN Doctors d ON ws.doctor_id = d.id
            LEFT JOIN Profiles dp ON d.profile_id = dp.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            ORDER BY ws.work_date, s.start_time`
        );

        return rows;
    }
    
    static async getScheduleByShift(shiftId) {
        const [rows] = await db.execute(
            `SELECT ws.*, d.id AS doctor_id_ref, dp.first_name, dp.last_name,
                    c.name AS clinic_name, c.location, s.start_time, s.end_time, s.max_patients
            FROM Work_Schedules ws
            LEFT JOIN Doctors d ON ws.doctor_id = d.id
            LEFT JOIN Profiles dp ON d.profile_id = dp.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            WHERE ws.shift_id = ?
            ORDER BY ws.work_date, s.start_time`,
            [shiftId]
        );

        return rows;
    }
}

export default WorkSchedule;