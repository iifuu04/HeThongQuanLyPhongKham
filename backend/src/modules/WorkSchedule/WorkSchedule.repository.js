// WorkSchedule.repository.js
import db from '../../config/db.js';

/**
 * Convert MySQL DATE to YYYY-MM-DD string
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

class WorkScheduleRepository {
    /**
     * Transform schedule row to ensure date fields are in YYYY-MM-DD format
     */
    static transformSchedule(row) {
        if (!row) return row;
        return {
            ...row,
            work_date: formatDateField(row.work_date)
        };
    }

    /**
     * Transform array of schedule rows
     */
    static transformSchedules(rows) {
        if (!rows || !Array.isArray(rows)) return rows;
        return rows.map(row => this.transformSchedule(row));
    }

    static async createSchedule(schedule) {
        const { doctor_id, clinic_id, shift_id, work_date } = schedule;

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

        fields.push('updated_at = NOW()');
        const sql = `
            UPDATE Work_Schedules
            SET ${fields.join(', ')}
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

    static async checkScheduleConflict(doctorId, shiftId, workDate) {
        const [rows] = await db.execute(
            `SELECT id FROM Work_Schedules
            WHERE doctor_id = ? AND shift_id = ? AND work_date = ?`,
            [doctorId, shiftId, workDate]
        );

        return rows.length > 0;
    }

    static async checkScheduleConflictExcludingId(doctorId, shiftId, workDate, excludeId) {
        const [rows] = await db.execute(
            `SELECT id FROM Work_Schedules
            WHERE doctor_id = ? AND shift_id = ? AND work_date = ? AND id != ?`,
            [doctorId, shiftId, workDate, excludeId]
        );

        return rows.length > 0;
    }

    static async getScheduleById(id) {
        const [rows] = await db.execute(
            `SELECT ws.*, d.profile_id,
                    p.first_name, p.last_name, p.phone, p.email,
                    c.name AS clinic_name, c.location AS clinic_location,
                    CONCAT(s.start_time, ' - ', s.end_time) AS shift_name, s.start_time, s.end_time, s.max_patients,
                    sp.name AS specialty_name, sp.id AS specialty_id
            FROM Work_Schedules ws
            LEFT JOIN Doctors d ON ws.doctor_id = d.id
            LEFT JOIN Profiles p ON d.profile_id = p.id
            LEFT JOIN Specialties sp ON d.specialty_id = sp.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            WHERE ws.id = ?`,
            [id]
        );
        return this.transformSchedule(rows.length > 0 ? rows[0] : null);
    }

    static async getSchedulesByDoctor(doctorId) {
        const [rows] = await db.execute(
            `SELECT ws.*, d.profile_id,
                    p.first_name, p.last_name, p.phone, p.email,
                    c.name AS clinic_name, c.location AS clinic_location,
                    CONCAT(s.start_time, ' - ', s.end_time) AS shift_name, s.start_time, s.end_time, s.max_patients,
                    sp.name AS specialty_name, sp.id AS specialty_id
            FROM Work_Schedules ws
            LEFT JOIN Doctors d ON ws.doctor_id = d.id
            LEFT JOIN Profiles p ON d.profile_id = p.id
            LEFT JOIN Specialties sp ON d.specialty_id = sp.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            WHERE ws.doctor_id = ?
            ORDER BY ws.work_date, s.start_time`,
            [doctorId]
        );
        return this.transformSchedules(rows);
    }

    static async getSchedulesByDate(date) {
        const [rows] = await db.execute(
            `SELECT ws.*, d.profile_id,
                    p.first_name, p.last_name, p.phone, p.email,
                    c.name AS clinic_name, c.location AS clinic_location,
                    CONCAT(s.start_time, ' - ', s.end_time) AS shift_name, s.start_time, s.end_time, s.max_patients,
                    sp.name AS specialty_name, sp.id AS specialty_id
            FROM Work_Schedules ws
            LEFT JOIN Doctors d ON ws.doctor_id = d.id
            LEFT JOIN Profiles p ON d.profile_id = p.id
            LEFT JOIN Specialties sp ON d.specialty_id = sp.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            WHERE ws.work_date = ?
            ORDER BY s.start_time`,
            [date]
        );
        return this.transformSchedules(rows);
    }

    static async getSchedules(filters = {}) {
        const [rows] = await db.execute(
            `SELECT ws.*, d.profile_id,
                    p.first_name, p.last_name, p.phone, p.email,
                    c.name AS clinic_name, c.location AS clinic_location,
                    CONCAT(s.start_time, ' - ', s.end_time) AS shift_name, s.start_time, s.end_time, s.max_patients,
                    sp.name AS specialty_name, sp.id AS specialty_id
            FROM Work_Schedules ws
            LEFT JOIN Doctors d ON ws.doctor_id = d.id
            LEFT JOIN Profiles p ON d.profile_id = p.id
            LEFT JOIN Specialties sp ON d.specialty_id = sp.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            WHERE 1=1
            ORDER BY ws.work_date, s.start_time`
        );

        return this.transformSchedules(rows);
    }

    static async getSchedulesByFilters(filters) {
        let sql = `
            SELECT ws.*, d.profile_id,
                    p.first_name, p.last_name, p.phone, p.email,
                    c.name AS clinic_name, c.location AS clinic_location,
                    CONCAT(s.start_time, ' - ', s.end_time) AS shift_name, s.start_time, s.end_time, s.max_patients,
                    sp.name AS specialty_name, sp.id AS specialty_id
            FROM Work_Schedules ws
            LEFT JOIN Doctors d ON ws.doctor_id = d.id
            LEFT JOIN Profiles p ON d.profile_id = p.id
            LEFT JOIN Specialties sp ON d.specialty_id = sp.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            WHERE 1=1
        `;

        const params = [];

        if (filters.doctor_id) {
            sql += ` AND ws.doctor_id = ?`;
            params.push(filters.doctor_id);
        }

        if (filters.work_date) {
            sql += ` AND ws.work_date = ?`;
            params.push(filters.work_date);
        }

        if (filters.specialty_id) {
            sql += ` AND sp.id = ?`;
            params.push(filters.specialty_id);
        }

        if (filters.clinic_id) {
            sql += ` AND ws.clinic_id = ?`;
            params.push(filters.clinic_id);
        }

        sql += ` ORDER BY ws.work_date, s.start_time`;

        const [rows] = await db.execute(sql, params);

        return this.transformSchedules(rows);
    }

    static async getScheduleByShift(shiftId) {
        const [rows] = await db.execute(
            `SELECT ws.*, d.profile_id,
                    p.first_name, p.last_name, p.phone, p.email,
                    c.name AS clinic_name, c.location AS clinic_location,
                    CONCAT(s.start_time, ' - ', s.end_time) AS shift_name, s.start_time, s.end_time, s.max_patients,
                    sp.name AS specialty_name, sp.id AS specialty_id
            FROM Work_Schedules ws
            LEFT JOIN Doctors d ON ws.doctor_id = d.id
            LEFT JOIN Profiles p ON d.profile_id = p.id
            LEFT JOIN Specialties sp ON d.specialty_id = sp.id
            LEFT JOIN Clinics c ON ws.clinic_id = c.id
            LEFT JOIN Shifts s ON ws.shift_id = s.id
            WHERE ws.shift_id = ?
            ORDER BY ws.work_date, s.start_time`,
            [shiftId]
        );

        return this.transformSchedules(rows);
    }

    static async hasLinkedAppointments(scheduleId) {
        const [result] = await db.execute(
            `SELECT COUNT(*) as count FROM Appointments WHERE work_schedule_id = ?`,
            [scheduleId]
        );

        return result[0].count > 0;
    }
}

export default WorkScheduleRepository;
