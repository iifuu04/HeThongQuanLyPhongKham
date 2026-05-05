/**
 * AppointmentRequest Service (BUS Layer)
 * Business logic for AppointmentRequest operations
 * Implements BR:
 * - RECEPTIONIST or DOCTOR creates request when cancelling/changing
 * - ADMIN approves/rejects requests
 * - When approved CANCEL action: cancel the appointment
 * - When approved RESCHEDULE action: update the appointment
 */

import AppointmentRequestRepository from './AppointmentRequest.repository.js';
import AppointmentRepository from '../Appointment/Appointment.repository.js';
import AuditLogRepository from '../AuditLog/AuditLog.repository.js';

class AppointmentRequestService {
    async getRequests(user, filters = {}) {
        if (user.role !== 'ADMIN') {
            return [];
        }

        const requests = await AppointmentRequestRepository.getRequests(filters);
        return requests || [];
    }

    async getRequestById(id, user) {
        const request = await AppointmentRequestRepository.getRequestById(id);
        if (!request) {
            return null;
        }

        if (user.role !== 'ADMIN') {
            return null;
        }

        return request;
    }

    async getPendingRequests(user) {
        if (user.role !== 'ADMIN') {
            return [];
        }

        const requests = await AppointmentRequestRepository.getPendingRequests();
        return requests || [];
    }

    async createRequest(data, user) {
        try {
            const { appointment_id, patient_id, doctor_id, action, reason, new_data } = data;

            if (!action) {
                return { success: false, message: 'Action is required' };
            }

            if (!['CANCEL', 'RESCHEDULE'].includes(action)) {
                return { success: false, message: 'Invalid action. Must be CANCEL or RESCHEDULE' };
            }

            if (user.role === 'PATIENT') {
                return { success: false, message: 'Patient cannot create appointment requests' };
            }

            if (appointment_id) {
                const appointment = await AppointmentRepository.getAppointmentById(appointment_id);
                if (!appointment) {
                    return { success: false, message: 'Appointment not found' };
                }

                if (appointment.status === 'CANCELLED') {
                    return { success: false, message: 'Appointment is already cancelled' };
                }

                if (appointment.status === 'COMPLETED') {
                    return { success: false, message: 'Cannot modify completed appointment' };
                }
            }

            const result = await AppointmentRequestRepository.createRequestWithTransaction({
                appointment_id,
                patient_id,
                doctor_id,
                action,
                reason,
                request_by: user.id,
                new_data
            });

            if (result.success) {
                await this.logAudit('CREATE', result.data.id, user.id, null, result.data, `Create ${action.toLowerCase()} request`);
                return { success: true, data: result.data };
            }

            return { success: false, message: 'Failed to create request' };
        } catch (error) {
            console.error('Error creating request:', error);
            return { success: false, message: error.message };
        }
    }

    async approveRequest(id, user) {
        try {
            if (user.role !== 'ADMIN') {
                return { success: false, message: 'Only ADMIN can approve requests' };
            }

            const request = await AppointmentRequestRepository.getRequestById(id);
            if (!request) {
                return { success: false, message: 'Request not found' };
            }

            if (request.status !== 'PENDING') {
                return { success: false, message: 'Request is not pending' };
            }

            if (request.action === 'CANCEL' && request.appointment_id) {
                await AppointmentRepository.cancelAppointment(request.appointment_id);
            }

            if (request.action === 'RESCHEDULE' && request.appointment_id && request.new_data) {
                const newData = JSON.parse(request.new_data);
                if (newData.start_time) {
                    await AppointmentRepository.updateAppointment(
                        request.appointment_id,
                        newData.status || 'SCHEDULED'
                    );
                }
            }

            const result = await AppointmentRequestRepository.approveRequest(id, user.id);
            if (result) {
                const updated = await AppointmentRequestRepository.getRequestById(id);
                await this.logAudit('APPROVE', id, user.id, { status: 'PENDING' }, { status: 'APPROVED' }, `Approve ${request.action.toLowerCase()} request`);
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to approve request' };
        } catch (error) {
            console.error('Error approving request:', error);
            return { success: false, message: error.message };
        }
    }

    async rejectRequest(id, user, reason) {
        try {
            if (user.role !== 'ADMIN') {
                return { success: false, message: 'Only ADMIN can reject requests' };
            }

            const request = await AppointmentRequestRepository.getRequestById(id);
            if (!request) {
                return { success: false, message: 'Request not found' };
            }

            if (request.status !== 'PENDING') {
                return { success: false, message: 'Request is not pending' };
            }

            const result = await AppointmentRequestRepository.rejectRequest(id, user.id, reason);
            if (result) {
                const updated = await AppointmentRequestRepository.getRequestById(id);
                await this.logAudit('REJECT', id, user.id, { status: 'PENDING' }, { status: 'REJECTED' }, `Reject ${request.action.toLowerCase()} request: ${reason || 'No reason provided'}`);
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to reject request' };
        } catch (error) {
            console.error('Error rejecting request:', error);
            return { success: false, message: error.message };
        }
    }

    async logAudit(actionType, recordId, userId, oldData, newData, description) {
        try {
            await AuditLogRepository.createLog({
                user_id: userId,
                action_type: actionType,
                table_name: 'Appointment_Request',
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

export default new AppointmentRequestService();
