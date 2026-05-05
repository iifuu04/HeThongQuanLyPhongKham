/**
 * Appointment Service (BUS Layer)
 * Business logic for Appointment operations
 * 
 * Implements BR:
 * 1. No duplicate: doctor_id + work_schedule_id + start_time
 * 2. Cannot exceed max_patients per shift
 * 3. Only valid work_schedule can be booked
 * 4. Cancel frees up the slot
 * 5. Status flow: SCHEDULED -> WAITING -> INPROGRESS -> COMPLETED
 * 6. Race condition handling with transaction + FOR UPDATE
 */

import AppointmentRepository from './Appointment.repository.js';
import WorkScheduleRepository from '../WorkSchedule/WorkSchedule.repository.js';
import DoctorRepository from '../Doctor/Doctor.repository.js';
import PatientRepository from '../Patient/Patient.repository.js';
import AppointmentRequestRepository from '../AppointmentRequest/AppointmentRequest.repository.js';
import AuditLogRepository from '../AuditLog/AuditLog.repository.js';

// Valid status values and transitions
const STATUS_VALUES = ['SCHEDULED', 'WAITING', 'INPROGRESS', 'COMPLETED', 'CANCELLED'];

// Status transition rules: from -> [allowed to]
const STATUS_TRANSITIONS = {
    'SCHEDULED': ['WAITING', 'CANCELLED'],
    'WAITING': ['INPROGRESS', 'CANCELLED'],
    'INPROGRESS': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [], // Terminal state
    'CANCELLED': []  // Terminal state
};

class AppointmentService {
    /**
     * Get appointments with role-based filtering
     */
    async getAppointments(user, filters = {}) {
        let queryFilters = { ...filters };

        // Role-based filtering
        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient) {
                return [];
            }
            queryFilters.patient_id = patient.id;
        } else if (user.role === 'DOCTOR') {
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor) {
                return [];
            }
            queryFilters.doctor_id = doctor.id;
        }

        const appointments = await AppointmentRepository.getAppointments(queryFilters);
        return appointments || [];
    }

    /**
     * Get appointment by ID with access control
     */
    async getAppointmentById(id, user) {
        const appointment = await AppointmentRepository.getAppointmentById(id);
        if (!appointment) {
            return null;
        }

        // Access control
        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || appointment.patient_id !== patient.id) {
                return null;
            }
        } else if (user.role === 'DOCTOR') {
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor || appointment.doctor_id !== doctor.id) {
                return null;
            }
        }

        return appointment;
    }

    /**
     * Get waiting appointments (SCHEDULED + WAITING)
     */
    async getWaitingAppointments() {
        return await AppointmentRepository.getWaitingAppointments();
    }

    /**
     * Get appointments by doctor
     */
    async getAppointmentsByDoctor(doctorId, user) {
        if (user.role === 'DOCTOR') {
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor || doctor.id !== doctorId) {
                return [];
            }
        }
        return await AppointmentRepository.getAppointmentsByDoctor(doctorId);
    }

    /**
     * Get appointments by patient
     */
    async getAppointmentsByPatient(patientId, user) {
        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || patient.id !== patientId) {
                return [];
            }
        }
        return await AppointmentRepository.getAppointmentsByPatient(patientId);
    }

    /**
     * Get appointments by date
     */
    async getAppointmentsByDate(date) {
        return await AppointmentRepository.getAppointmentsByDate(date);
    }

    /**
     * Create new appointment with race condition protection
     * Uses transaction with FOR UPDATE lock
     */
    async createAppointment(data, user) {
        try {
            const { doctor_id, work_schedule_id, start_time, end_time, reason } = data;

            // Validate required fields
            if (!doctor_id) {
                return { success: false, message: 'ID bác sĩ là bắt buộc' };
            }

            if (!work_schedule_id) {
                return { success: false, message: 'ID lịch làm việc là bắt buộc' };
            }

            if (!start_time) {
                return { success: false, message: 'Giờ bắt đầu là bắt buộc' };
            }

            if (!end_time) {
                return { success: false, message: 'Giờ kết thúc là bắt buộc' };
            }

            // Determine patient_id based on user role
            let patient_id;
            if (user.role === 'PATIENT') {
                const patient = await PatientRepository.getPatientByProfileId(user.id);
                if (!patient) {
                    return { success: false, message: 'Không tìm thấy hồ sơ bệnh nhân' };
                }
                patient_id = patient.id;
            } else if (user.role === 'RECEPTIONIST' || user.role === 'ADMIN') {
                if (!data.patient_id) {
                    return { success: false, message: 'ID bệnh nhân là bắt buộc khi đặt cho người khác' };
                }
                const patient = await PatientRepository.getPatientById(data.patient_id);
                if (!patient) {
                    return { success: false, message: 'Không tìm thấy bệnh nhân' };
                }
                patient_id = patient.id;
            } else {
                return { success: false, message: 'Chỉ BỆNH NHÂN hoặc LỄ TÂN mới được đặt lịch' };
            }

            // Verify doctor exists
            const doctor = await DoctorRepository.getDoctorById(doctor_id);
            if (!doctor) {
                return { success: false, message: 'Không tìm thấy bác sĩ' };
            }

            // Verify work schedule exists and belongs to doctor
            const workSchedule = await WorkScheduleRepository.getScheduleById(work_schedule_id);
            if (!workSchedule) {
                return { success: false, message: 'Không tìm thấy lịch làm việc' };
            }

            if (workSchedule.doctor_id !== doctor_id) {
                return { success: false, message: 'Lịch làm việc không thuộc bác sĩ này' };
            }

            // Cannot book for past dates
            const workDateObj = new Date(workSchedule.work_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (workDateObj < today) {
                return { success: false, message: 'Không thể đặt lịch cho ngày đã qua' };
            }

            // Create appointment with transaction (handles all validations and locking)
            const result = await AppointmentRepository.createAppointmentWithTransaction({
                patient_id,
                doctor_id,
                work_schedule_id,
                start_time,
                end_time,
                reason
            });

            if (result.success) {
                await this.logAudit('CREATE', result.data.appointment_id || result.data.id, user.id, null, result.data, 'Tạo lịch hẹn');
                return { success: true, data: result.data };
            }

            return { success: false, message: 'Không thể tạo lịch hẹn' };
        } catch (error) {
            console.error('Error creating appointment:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Check in patient: SCHEDULED -> WAITING
     * Only RECEPTIONIST or ADMIN can check in
     */
    async checkInAppointment(id, user) {
        try {
            // Access control
            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Chỉ LỄ TÂN hoặc QUẢN TRỊ mới được check-in' };
            }

            const appointment = await AppointmentRepository.getAppointmentById(id);
            if (!appointment) {
                return { success: false, message: 'Không tìm thấy lịch hẹn' };
            }

            if (appointment.status !== 'SCHEDULED') {
                return { success: false, message: 'Chỉ lịch hẹn có trạng thái CHỜ CHECK-IN mới được check-in' };
            }

            const result = await AppointmentRepository.updateAppointmentStatus(id, 'WAITING');
            if (result) {
                const updated = await AppointmentRepository.getAppointmentById(id);
                await this.logAudit('UPDATE', id, user.id, { status: 'SCHEDULED' }, { status: 'WAITING' }, 'Check-in bệnh nhân');
                return { success: true, data: updated };
            }
            return { success: false, message: 'Không thể check-in lịch hẹn' };
        } catch (error) {
            console.error('Error checking in appointment:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Start examination: WAITING -> INPROGRESS
     * Only DOCTOR or ADMIN can start
     */
    async startExamination(id, user) {
        try {
            if (user.role !== 'DOCTOR' && user.role !== 'ADMIN') {
                return { success: false, message: 'Chỉ BÁC SĨ mới được bắt đầu khám' };
            }

            const appointment = await AppointmentRepository.getAppointmentById(id);
            if (!appointment) {
                return { success: false, message: 'Không tìm thấy lịch hẹn' };
            }

            if (appointment.status !== 'WAITING') {
                return { success: false, message: 'Chỉ lịch hẹn có trạng thái CHỜ KHÁM mới được bắt đầu' };
            }

            // Verify the doctor is the assigned doctor
            if (user.role === 'DOCTOR') {
                const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
                if (!doctor || appointment.doctor_id !== doctor.id) {
                    return { success: false, message: 'Bạn không phải bác sĩ được phân công' };
                }
            }

            const result = await AppointmentRepository.updateAppointmentStatus(id, 'INPROGRESS');
            if (result) {
                const updated = await AppointmentRepository.getAppointmentById(id);
                await this.logAudit('UPDATE', id, user.id, { status: 'WAITING' }, { status: 'INPROGRESS' }, 'Bắt đầu khám');
                return { success: true, data: updated };
            }
            return { success: false, message: 'Không thể bắt đầu khám' };
        } catch (error) {
            console.error('Error starting examination:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Complete examination: INPROGRESS -> COMPLETED
     * Only DOCTOR or ADMIN can complete
     */
    async completeExamination(id, user) {
        try {
            if (user.role !== 'DOCTOR' && user.role !== 'ADMIN') {
                return { success: false, message: 'Chỉ BÁC SĨ mới được hoàn tất khám' };
            }

            const appointment = await AppointmentRepository.getAppointmentById(id);
            if (!appointment) {
                return { success: false, message: 'Không tìm thấy lịch hẹn' };
            }

            if (appointment.status !== 'INPROGRESS') {
                return { success: false, message: 'Chỉ lịch hẹn đang khám mới được hoàn tất' };
            }

            // Verify the doctor is the assigned doctor
            if (user.role === 'DOCTOR') {
                const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
                if (!doctor || appointment.doctor_id !== doctor.id) {
                    return { success: false, message: 'Bạn không phải bác sĩ được phân công' };
                }
            }

            const result = await AppointmentRepository.updateAppointmentStatus(id, 'COMPLETED');
            if (result) {
                const updated = await AppointmentRepository.getAppointmentById(id);
                await this.logAudit('UPDATE', id, user.id, { status: 'INPROGRESS' }, { status: 'COMPLETED' }, 'Hoàn tất khám');
                return { success: true, data: updated };
            }
            return { success: false, message: 'Không thể hoàn tất khám' };
        } catch (error) {
            console.error('Error completing examination:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Update appointment status with transition validation
     */
    async updateAppointmentStatus(id, newStatus, user) {
        try {
            // Validate new status is valid
            if (!STATUS_VALUES.includes(newStatus)) {
                return { success: false, message: 'Trạng thái không hợp lệ' };
            }

            const appointment = await AppointmentRepository.getAppointmentById(id);
            if (!appointment) {
                return { success: false, message: 'Không tìm thấy lịch hẹn' };
            }

            const currentStatus = appointment.status;

            // Check if transition is allowed
            if (!this.isValidStatusTransition(currentStatus, newStatus)) {
                return {
                    success: false,
                    message: `Không thể chuyển từ ${currentStatus} sang ${newStatus}`
                };
            }

            const result = await AppointmentRepository.updateAppointmentStatus(id, newStatus);
            if (result) {
                const updated = await AppointmentRepository.getAppointmentById(id);
                await this.logAudit('UPDATE', id, user.id, { status: currentStatus }, { status: newStatus }, `Đổi trạng thái: ${currentStatus} -> ${newStatus}`);
                return { success: true, data: updated };
            }
            return { success: false, message: 'Không thể cập nhật trạng thái' };
        } catch (error) {
            console.error('Error updating appointment status:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Cancel appointment
     * - PATIENT can cancel own SCHEDULED appointments
     * - RECEPTIONIST/ADMIN can cancel any appointment (except COMPLETED)
     * - Cancellation frees up the slot (CANCELLED status is excluded from max_patients count)
     */
    async cancelAppointment(id, user) {
        try {
            const appointment = await AppointmentRepository.getAppointmentById(id);
            if (!appointment) {
                return { success: false, message: 'Không tìm thấy lịch hẹn' };
            }

            const currentStatus = appointment.status;

            // Cannot cancel COMPLETED appointments
            if (currentStatus === 'COMPLETED') {
                return { success: false, message: 'Không thể hủy lịch hẹn đã hoàn thành' };
            }

            // CANCELLED appointments cannot be cancelled again
            if (currentStatus === 'CANCELLED') {
                return { success: false, message: 'Lịch hẹn đã bị hủy trước đó' };
            }

            // Patient can only cancel their own SCHEDULED appointments
            if (user.role === 'PATIENT') {
                const patient = await PatientRepository.getPatientByProfileId(user.id);
                if (!patient || appointment.patient_id !== patient.id) {
                    return { success: false, message: 'Bạn chỉ có thể hủy lịch hẹn của mình' };
                }

                if (currentStatus !== 'SCHEDULED') {
                    return { success: false, message: 'Bạn chỉ có thể hủy lịch hẹn CHỜ CHECK-IN' };
                }

                const result = await AppointmentRepository.cancelAppointment(id);
                if (result) {
                    const updated = await AppointmentRepository.getAppointmentById(id);
                    await this.logAudit('CANCEL', id, user.id, { status: currentStatus }, { status: 'CANCELLED' }, 'Bệnh nhân hủy lịch hẹn');
                    return { success: true, data: updated };
                }
                return { success: false, message: 'Không thể hủy lịch hẹn' };
            }

            // RECEPTIONIST/ADMIN can cancel any non-COMPLETED appointment
            if (user.role === 'RECEPTIONIST' || user.role === 'ADMIN') {
                const result = await AppointmentRepository.cancelAppointment(id);
                if (result) {
                    const updated = await AppointmentRepository.getAppointmentById(id);
                    await this.logAudit('CANCEL', id, user.id, { status: currentStatus }, { status: 'CANCELLED' }, `${user.role} hủy lịch hẹn`);
                    return { success: true, data: updated };
                }
                return { success: false, message: 'Không thể hủy lịch hẹn' };
            }

            return { success: false, message: 'Bạn không có quyền hủy lịch hẹn' };
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Check if status transition is valid
     */
    isValidStatusTransition(currentStatus, newStatus) {
        // CANCELLED can always be the target
        if (newStatus === 'CANCELLED') {
            return currentStatus !== 'COMPLETED'; // Cannot cancel completed
        }

        // Check transition rules
        const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
        if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
            return false;
        }

        return true;
    }

    /**
     * Audit logging helper
     */
    async logAudit(actionType, recordId, userId, oldData, newData, description) {
        try {
            await AuditLogRepository.createLog({
                user_id: userId,
                action_type: actionType,
                table_name: 'Appointments',
                record_id: recordId,
                old_data: oldData ? JSON.stringify(oldData) : null,
                new_data: newData ? JSON.stringify(newData) : null,
                description: description,
                ip_address: null,
                user_agent: null
            });
        } catch (error) {
            console.error('Error logging audit:', error);
        }
    }
}

export default new AppointmentService();
