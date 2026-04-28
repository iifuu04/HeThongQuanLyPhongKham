/**
 * Appointment Service (BUS Layer)
 * Business logic for Appointment operations
 * Implements BR:
 * - PATIENT or RECEPTIONIST can book appointments
 * - Appointment must be within valid work schedule
 * - No duplicate: doctor_id + work_schedule_id + start_time if not CANCELLED
 * - PATIENT only views own appointments
 * - DOCTOR only views related appointments
 * - RECEPTIONIST and ADMIN can view all appointments
 * - Cancel: PATIENT cancels own -> CANCELLED; RECEPTIONIST/DOCTOR -> create request
 * - Status flow: SCHEDULED -> WAITING -> INPROGRESS -> COMPLETED
 * - CANCELLED is terminal state
 * - Cannot skip status order
 */

import AppointmentRepository from './Appointment.repository.js';
import WorkScheduleRepository from '../WorkSchedule/WorkSchedule.repository.js';
import DoctorRepository from '../Doctor/Doctor.repository.js';
import PatientRepository from '../Patient/Patient.repository.js';
import AppointmentRequestRepository from '../AppointmentRequest/AppointmentRequest.repository.js';
import AuditLogRepository from '../AuditLog/AuditLog.repository.js';

const STATUS_ORDER = ['SCHEDULED', 'WAITING', 'INPROGRESS', 'COMPLETED', 'CANCELLED'];

class AppointmentService {
    async getAppointments(user, filters = {}) {
        let queryFilters = { ...filters };

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

    async getAppointmentById(id, user) {
        const appointment = await AppointmentRepository.getAppointmentById(id);
        if (!appointment) {
            return null;
        }

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

    async getWaitingAppointments() {
        return await AppointmentRepository.getWaitingAppointments();
    }

    async getAppointmentsByDoctor(doctorId, user) {
        if (user.role === 'DOCTOR') {
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor || doctor.id !== doctorId) {
                return [];
            }
        }

        return await AppointmentRepository.getAppointmentsByDoctor(doctorId);
    }

    async getAppointmentsByPatient(patientId, user) {
        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || patient.id !== patientId) {
                return [];
            }
        }

        return await AppointmentRepository.getAppointmentsByPatient(patientId);
    }

    async getAppointmentsByDate(date) {
        return await AppointmentRepository.getAppointmentsByDate(date);
    }

    async createAppointment(data, user) {
        try {
            const { doctor_id, work_schedule_id, start_time, end_time, reason } = data;

            if (!doctor_id) {
                return { success: false, message: 'Doctor ID is required' };
            }

            if (!work_schedule_id) {
                return { success: false, message: 'Work schedule ID is required' };
            }

            if (!start_time) {
                return { success: false, message: 'Start time is required' };
            }

            if (!end_time) {
                return { success: false, message: 'End time is required' };
            }

            let patient_id;
            if (user.role === 'PATIENT') {
                const patient = await PatientRepository.getPatientByProfileId(user.id);
                if (!patient) {
                    return { success: false, message: 'Patient profile not found' };
                }
                patient_id = patient.id;
            } else if (user.role === 'RECEPTIONIST' || user.role === 'ADMIN') {
                if (!data.patient_id) {
                    return { success: false, message: 'Patient ID is required when booking for others' };
                }
                const patient = await PatientRepository.getPatientById(data.patient_id);
                if (!patient) {
                    return { success: false, message: 'Patient not found' };
                }
                patient_id = patient.id;
            } else {
                return { success: false, message: 'Only PATIENT or RECEPTIONIST can book appointments' };
            }

            const doctor = await DoctorRepository.getDoctorById(doctor_id);
            if (!doctor) {
                return { success: false, message: 'Doctor not found' };
            }

            if (doctor.status !== 'ACTIVE') {
                return { success: false, message: 'Doctor is not active' };
            }

            const workSchedule = await WorkScheduleRepository.getScheduleById(work_schedule_id);
            if (!workSchedule) {
                return { success: false, message: 'Work schedule not found' };
            }

            if (workSchedule.doctor_id !== doctor_id) {
                return { success: false, message: 'Work schedule does not belong to this doctor' };
            }

            const workDateObj = new Date(workSchedule.work_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (workDateObj < today) {
                return { success: false, message: 'Cannot book appointment for past dates' };
            }

            const result = await AppointmentRepository.createAppointmentWithTransaction({
                patient_id,
                doctor_id,
                work_schedule_id,
                start_time,
                end_time,
                reason,
                requested_by: user.id
            });

            if (result.success) {
                await this.logAudit('CREATE', result.data.id, user.id, null, result.data, 'Create appointment');
                return { success: true, data: result.data };
            }

            return { success: false, message: 'Failed to create appointment' };
        } catch (error) {
            console.error('Error creating appointment:', error);
            if (error.message.includes('Khung gio nay da duoc dat')) {
                return { success: false, message: error.message };
            }
            return { success: false, message: error.message };
        }
    }

    async updateAppointmentStatus(id, newStatus, user) {
        try {
            const appointment = await AppointmentRepository.getAppointmentById(id);
            if (!appointment) {
                return { success: false, message: 'Appointment not found' };
            }

            const currentStatus = appointment.status;

            if (currentStatus === 'CANCELLED') {
                return { success: false, message: 'Cannot update cancelled appointment' };
            }

            if (currentStatus === 'COMPLETED') {
                return { success: false, message: 'Cannot update completed appointment' };
            }

            if (!this.isValidStatusTransition(currentStatus, newStatus)) {
                return {
                    success: false,
                    message: `Invalid status transition from ${currentStatus} to ${newStatus}`
                };
            }

            const result = await AppointmentRepository.updateAppointment(id, newStatus);
            if (result) {
                const updated = await AppointmentRepository.getAppointmentById(id);
                await this.logAudit('UPDATE', id, user.id, { status: currentStatus }, { status: newStatus }, `Update appointment status from ${currentStatus} to ${newStatus}`);
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to update appointment status' };
        } catch (error) {
            console.error('Error updating appointment status:', error);
            return { success: false, message: error.message };
        }
    }

    async checkInAppointment(id, user) {
        try {
            const appointment = await AppointmentRepository.getAppointmentById(id);
            if (!appointment) {
                return { success: false, message: 'Appointment not found' };
            }

            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Only RECEPTIONIST or ADMIN can check in patients' };
            }

            if (appointment.status !== 'SCHEDULED') {
                return { success: false, message: 'Only SCHEDULED appointments can be checked in' };
            }

            const result = await AppointmentRepository.updateAppointment(id, 'WAITING');
            if (result) {
                const updated = await AppointmentRepository.getAppointmentById(id);
                await this.logAudit('UPDATE', id, user.id, { status: 'SCHEDULED' }, { status: 'WAITING' }, 'Check in patient');
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to check in appointment' };
        } catch (error) {
            console.error('Error checking in appointment:', error);
            return { success: false, message: error.message };
        }
    }

    async cancelAppointment(id, user) {
        try {
            const appointment = await AppointmentRepository.getAppointmentById(id);
            if (!appointment) {
                return { success: false, message: 'Appointment not found' };
            }

            if (appointment.status === 'CANCELLED') {
                return { success: false, message: 'Appointment is already cancelled' };
            }

            if (appointment.status === 'COMPLETED') {
                return { success: false, message: 'Cannot cancel completed appointment' };
            }

            if (appointment.status === 'INPROGRESS') {
                return { success: false, message: 'Cannot cancel appointment that is in progress' };
            }

            if (user.role === 'PATIENT') {
                const patient = await PatientRepository.getPatientByProfileId(user.id);
                if (!patient || appointment.patient_id !== patient.id) {
                    return { success: false, message: 'You can only cancel your own appointments' };
                }

                const result = await AppointmentRepository.cancelAppointment(id);
                if (result) {
                    const updated = await AppointmentRepository.getAppointmentById(id);
                    await this.logAudit('CANCEL', id, user.id, { status: appointment.status }, { status: 'CANCELLED' }, 'Patient cancelled appointment');
                    return { success: true, data: updated };
                }
                return { success: false, message: 'Failed to cancel appointment' };
            }

            const action = appointment.status === 'SCHEDULED' ? 'CANCEL' : 'RESCHEDULE';
            const requestResult = await AppointmentRequestRepository.createRequest({
                appointment_id: id,
                patient_id: appointment.patient_id,
                doctor_id: appointment.doctor_id,
                action: action,
                reason: `Cancellation requested by ${user.role}`,
                request_by: user.id
            });

            if (requestResult) {
                return { success: true, message: 'Cancellation request submitted for admin approval', data: { request_submitted: true } };
            }
            return { success: false, message: 'Failed to submit cancellation request' };
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            return { success: false, message: error.message };
        }
    }

    async updateAppointment(id, data, user) {
        try {
            const appointment = await AppointmentRepository.getAppointmentById(id);
            if (!appointment) {
                return { success: false, message: 'Appointment not found' };
            }

            if (user.role === 'PATIENT') {
                const patient = await PatientRepository.getPatientByProfileId(user.id);
                if (!patient || appointment.patient_id !== patient.id) {
                    return { success: false, message: 'You can only update your own appointments' };
                }
            }

            if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
                return { success: false, message: 'Cannot update cancelled or completed appointment' };
            }

            if (data.start_time || data.end_time || data.work_schedule_id) {
                return { success: false, message: 'Rescheduling requires admin approval. Please submit a request.' };
            }

            return { success: false, message: 'No valid fields to update' };
        } catch (error) {
            console.error('Error updating appointment:', error);
            return { success: false, message: error.message };
        }
    }

    isValidStatusTransition(currentStatus, newStatus) {
        if (currentStatus === 'SCHEDULED' && newStatus === 'WAITING') {
            return true;
        }
        if (currentStatus === 'WAITING' && newStatus === 'INPROGRESS') {
            return true;
        }
        if (currentStatus === 'INPROGRESS' && newStatus === 'COMPLETED') {
            return true;
        }
        if (newStatus === 'CANCELLED') {
            return true;
        }
        return false;
    }

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
