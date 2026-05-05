// Appointment.repository.js
// Schema: Appointments(id INT, patient_id VARCHAR(6), doctor_id VARCHAR(6), work_schedule_id INT, start_time DATETIME, end_time DATETIME, status ENUM)
import db from '../../config/db.js';

class AppointmentRepository {
    /**
     * Generate unique appointment ID
     */
    static async generateAppointmentId() {
        const [rows] = await db.execute(
            `SELECT MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)) as max_num FROM Appointments WHERE id LIKE 'APT%'`
        );
        const maxNum = rows[0].max_num || 0;
        return `APT${String(maxNum + 1).padStart(6, '0')}`;
    }

    /**
     * Create appointment with transaction and row locking to prevent race conditions
     * Uses SELECT ... FOR UPDATE to lock the work_schedule row
     * Checks:
     * 1. Work schedule exists and belongs to doctor
     * 2. Max patients not exceeded
     * 3. No duplicate doctor_id + work_schedule_id + start_time
     * 
     * Logic yêu cầu:
     * Nếu 2 người cùng đặt 1 giờ, 1 bác sĩ:
     * - Người bấm xác nhận trước sẽ được tạo lịch trước
     * - Người bấm sau sẽ bị báo trùng lịch
     */
    static async createAppointmentWithTransaction(appointment) {
        const { patient_id, doctor_id, work_schedule_id, start_time, end_time } = appointment;

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Khóa dòng Work_Schedules.
            // Khi 2 người cùng xác nhận một lúc, transaction nào vào trước sẽ giữ khóa trước.
            // Transaction còn lại phải chờ transaction đầu commit/rollback xong mới được kiểm tra tiếp.
            const [scheduleResult] = await connection.execute(
                `SELECT ws.id, ws.doctor_id, ws.work_date, ws.shift_id,
                        s.start_time AS shift_start_time,
                        s.end_time AS shift_end_time,
                        s.max_patients
                 FROM Work_Schedules ws
                 JOIN Shifts s ON ws.shift_id = s.id
                 WHERE ws.id = ? AND ws.doctor_id = ?
                 FOR UPDATE`,
                [work_schedule_id, doctor_id]
            );

            if (scheduleResult.length === 0) {
                throw new Error('Lịch làm việc không tồn tại hoặc không thuộc bác sĩ này');
            }

            const schedule = scheduleResult[0];

            // 2. Kiểm tra giờ bắt đầu có nằm trong ca làm việc không
            const shiftStart = schedule.shift_start_time;
            const shiftEnd = schedule.shift_end_time;

            // Extract HH:mm:ss from "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss..."
            const startTimePart = String(start_time).replace('T', ' ').split(' ')[1] || start_time;

            if (startTimePart < shiftStart || startTimePart > shiftEnd) {
                throw new Error('Giờ bắt đầu không nằm trong ca làm việc');
            }

            // 3. Kiểm tra ca khám đã đầy chưa
            // Vì đang giữ khóa Work_Schedules nên count này an toàn hơn khi nhiều người đặt cùng lúc.
            const [countResult] = await connection.execute(
                `SELECT COUNT(*) AS count
                 FROM Appointments
                 WHERE work_schedule_id = ?
                   AND status NOT IN ('CANCELLED')`,
                [work_schedule_id]
            );

            if (countResult[0].count >= schedule.max_patients) {
                throw new Error('Ca khám đã đầy, vui lòng chọn ca khác');
            }

            // 4. Kiểm tra trùng giờ cùng bác sĩ.
            // Người xác nhận trước insert thành công.
            // Người xác nhận sau sẽ kiểm tra lại sau khi khóa được nhả và thấy conflict.
            const [conflictResult] = await connection.execute(
                `SELECT id
                 FROM Appointments
                 WHERE doctor_id = ?
                   AND work_schedule_id = ?
                   AND start_time = ?
                   AND status NOT IN ('CANCELLED')
                 LIMIT 1`,
                [doctor_id, work_schedule_id, start_time]
            );

            if (conflictResult.length > 0) {
                throw new Error('Khung giờ này vừa được người khác xác nhận trước. Vui lòng chọn giờ khác.');
            }

            // 5. Tạo lịch hẹn
            const [insertResult] = await connection.execute(
                `INSERT INTO Appointments 
                    (patient_id, doctor_id, work_schedule_id, start_time, end_time, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, 'SCHEDULED', NOW(), NOW())`,
                [patient_id, doctor_id, work_schedule_id, start_time, end_time]
            );

            if (insertResult.affectedRows === 0) {
                throw new Error('Không thể tạo lịch hẹn');
            }

            const appointmentId = insertResult.insertId;

            await connection.commit();

            // Fetch and return the created appointment
            const created = await this.getAppointmentByIdWithConnection(connection, appointmentId);

            return {
                success: true,
                data: created,
            };
        } catch (error) {
            await connection.rollback();

            // Nếu đã chạy unique index ở database, lỗi duplicate cũng được đổi thành thông báo dễ hiểu.
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Khung giờ này vừa được người khác xác nhận trước. Vui lòng chọn giờ khác.');
            }

            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Generate appointment ID using a specific connection (for transaction)
     */
    static async generateAppointmentIdWithConnection(connection) {
        const [rows] = await connection.execute(
            `SELECT MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)) as max_num FROM Appointments WHERE id LIKE 'APT%'`
        );
        const maxNum = rows[0].max_num || 0;
        return `APT${String(maxNum + 1).padStart(6, '0')}`;
    }

    /**
     * Get appointment by ID using a specific connection (for transaction)
     */
    static async getAppointmentByIdWithConnection(connection, id) {
        const [rows] = await connection.execute(
            `SELECT a.*,
                    a.id AS appointment_id,
                    pa.id AS patient_id,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    d.id AS doctor_id,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    s.name AS specialty_name,
                    ws.work_date,
                    sh.start_time AS shift_start,
                    sh.end_time AS shift_end,
                    sh.max_patients,
                    c.name AS clinic_name,
                    c.location AS clinic_location
             FROM Appointments a
             LEFT JOIN Patients pa ON a.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON a.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             LEFT JOIN Specialties s ON d.specialty_id = s.id
             LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
             LEFT JOIN Shifts sh ON ws.shift_id = sh.id
             LEFT JOIN Clinics c ON ws.clinic_id = c.id
             WHERE a.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Get appointment by ID
     */
    static async getAppointmentById(id) {
        const [rows] = await db.execute(
            `SELECT a.*,
                    a.id AS appointment_id,
                    pa.id AS patient_id,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    p.email AS patient_email,
                    d.id AS doctor_id,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    dp.phone AS doctor_phone,
                    s.name AS specialty_name,
                    s.id AS specialty_id,
                    ws.work_date,
                    sh.start_time AS shift_start,
                    sh.end_time AS shift_end,
                    sh.max_patients,
                    c.name AS clinic_name,
                    c.location AS clinic_location,
                    c.id AS clinic_id
             FROM Appointments a
             LEFT JOIN Patients pa ON a.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON a.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             LEFT JOIN Specialties s ON d.specialty_id = s.id
             LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
             LEFT JOIN Shifts sh ON ws.shift_id = sh.id
             LEFT JOIN Clinics c ON ws.clinic_id = c.id
             WHERE a.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Get all appointments with filters
     */
    static async getAppointments(filters = {}) {
        let sql = `
            SELECT a.*,
                    a.id AS appointment_id,
                    pa.id AS patient_id,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    p.email AS patient_email,
                    d.id AS doctor_id,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    dp.phone AS doctor_phone,
                    s.name AS specialty_name,
                    s.id AS specialty_id,
                    ws.work_date,
                    sh.start_time AS shift_start,
                    sh.end_time AS shift_end,
                    sh.max_patients,
                    c.name AS clinic_name,
                    c.location AS clinic_location,
                    c.id AS clinic_id
             FROM Appointments a
             LEFT JOIN Patients pa ON a.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON a.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             LEFT JOIN Specialties s ON d.specialty_id = s.id
             LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
             LEFT JOIN Shifts sh ON ws.shift_id = sh.id
             LEFT JOIN Clinics c ON ws.clinic_id = c.id
             WHERE 1=1
        `;

        const params = [];

        if (filters.status) {
            if (Array.isArray(filters.status)) {
                const placeholders = filters.status.map(() => '?').join(',');
                sql += ` AND a.status IN (${placeholders})`;
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
        return rows || [];
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
                    sh.start_time AS shift_start,
                    sh.end_time AS shift_end,
                    c.name AS clinic_name
             FROM Appointments a
             LEFT JOIN Patients pa ON a.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON a.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
             LEFT JOIN Shifts sh ON ws.shift_id = sh.id
             LEFT JOIN Clinics c ON ws.clinic_id = c.id
             WHERE DATE(a.start_time) BETWEEN ? AND ?
             ORDER BY a.start_time`,
            [startTime, endTime]
        );

        return rows || [];
    }

    /**
     * Cancel appointment - sets status to CANCELLED
     * This frees up the slot for max_patients check
     */
    static async cancelAppointment(id) {
        const [result] = await db.execute(
            `UPDATE Appointments SET status = 'CANCELLED', updated_at = NOW() WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    /**
     * Update appointment status with validation
     */
    static async updateAppointmentStatus(id, newStatus) {
        const [result] = await db.execute(
            `UPDATE Appointments SET status = ?, updated_at = NOW() WHERE id = ?`,
            [newStatus, id]
        );

        return result.affectedRows > 0;
    }

    /**
     * Update appointment status only if current status matches expected
     * Prevents race conditions in status updates
     */
    static async updateAppointmentWithStatusCheck(id, newStatus, expectedStatus) {
        const [result] = await db.execute(
            `UPDATE Appointments SET status = ?, updated_at = NOW()
             WHERE id = ? AND status = ?`,
            [newStatus, id, expectedStatus]
        );

        return result.affectedRows > 0;
    }

    /**
     * Check if slot is available for booking
     * Returns: { available: boolean, reason?: string }
     */
    static async checkSlotAvailability(workScheduleId, doctorId, startTime) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Khóa lịch làm việc để tránh race condition khi nhiều người kiểm tra cùng lúc.
            const [scheduleResult] = await connection.execute(
                `SELECT s.max_patients,
                        (
                            SELECT COUNT(*)
                            FROM Appointments
                            WHERE work_schedule_id = ?
                              AND status NOT IN ('CANCELLED')
                        ) AS current_count
                 FROM Work_Schedules ws
                 JOIN Shifts s ON ws.shift_id = s.id
                 WHERE ws.id = ? AND ws.doctor_id = ?
                 FOR UPDATE`,
                [workScheduleId, workScheduleId, doctorId]
            );

            if (scheduleResult.length === 0) {
                await connection.rollback();
                return {
                    available: false,
                    reason: 'Lịch làm việc không tồn tại',
                };
            }

            const { max_patients, current_count } = scheduleResult[0];

            if (current_count >= max_patients) {
                await connection.rollback();
                return {
                    available: false,
                    reason: 'Ca khám đã đầy',
                };
            }

            // Kiểm tra trùng giờ cùng bác sĩ.
            const [conflictResult] = await connection.execute(
                `SELECT id
                 FROM Appointments
                 WHERE doctor_id = ?
                   AND work_schedule_id = ?
                   AND start_time = ?
                   AND status NOT IN ('CANCELLED')
                 LIMIT 1`,
                [doctorId, workScheduleId, startTime]
            );

            if (conflictResult.length > 0) {
                await connection.rollback();
                return {
                    available: false,
                    reason: 'Khung giờ này vừa được người khác xác nhận trước. Vui lòng chọn giờ khác.',
                };
            }

            await connection.commit();

            return {
                available: true,
            };
        } catch (error) {
            await connection.rollback();

            if (error.code === 'ER_DUP_ENTRY') {
                return {
                    available: false,
                    reason: 'Khung giờ này vừa được người khác xác nhận trước. Vui lòng chọn giờ khác.',
                };
            }

            throw error;
        } finally {
            connection.release();
        }
    }
}

export default AppointmentRepository;