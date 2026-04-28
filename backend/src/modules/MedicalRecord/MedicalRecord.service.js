/**
 * MedicalRecord Service (BUS Layer)
 * Business logic for MedicalRecord operations
 * Implements BR:
 * - Only DOCTOR can create/update medical records
 * - Doctor can only update records for their appointments
 * - Patient can only view their own medical history
 * - Doctor can view patient history for treatment
 * - RECEPTIONIST can only view necessary info, cannot edit
 * - ADMIN can view for admin purposes
 * - Each appointment has one medical record (unique constraint)
 * - Cannot create record if appointment not WAITING/INPROGRESS/COMPLETED
 * - After saving record, can update appointment status to COMPLETED
 */

import MedicalRecordRepository from './MedicalRecord.repository.js';
import AppointmentRepository from '../Appointment/Appointment.repository.js';
import DoctorRepository from '../Doctor/Doctor.repository.js';
import PatientRepository from '../Patient/Patient.repository.js';
import AuditLogRepository from '../AuditLog/AuditLog.repository.js';

class MedicalRecordService {
    async getMedicalRecords(user, filters = {}) {
        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient) {
                return [];
            }
            return await MedicalRecordRepository.getMedicalRecordsByPatient(patient.id);
        }

        if (user.role === 'DOCTOR') {
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor) {
                return [];
            }
            return await MedicalRecordRepository.getMedicalRecordsByDoctor(doctor.id);
        }

        if (user.role === 'RECEPTIONIST') {
            return await MedicalRecordRepository.getMedicalRecords(filters);
        }

        if (user.role === 'ADMIN') {
            return await MedicalRecordRepository.getMedicalRecords(filters);
        }

        return [];
    }

    async getMedicalRecordById(id, user) {
        const record = await MedicalRecordRepository.getMedicalRecordById(id);
        if (!record) {
            return null;
        }

        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || record.patient_id !== patient.id) {
                return null;
            }
        }

        if (user.role === 'DOCTOR') {
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor) {
                return null;
            }
            return await this.maskSensitiveDataForDoctor(record, doctor.id);
        }

        if (user.role === 'RECEPTIONIST') {
            return this.maskSensitiveDataForReceptionist(record);
        }

        return record;
    }

    async getMedicalRecordsByPatient(patientId, user) {
        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || patient.id !== patientId) {
                return [];
            }
            return await MedicalRecordRepository.getPatientHistoryWithSensitiveData(patientId);
        }

        if (user.role === 'DOCTOR') {
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor) {
                return [];
            }
            const records = await MedicalRecordRepository.getMedicalRecordsByPatient(patientId);
            return records.map(r => this.maskSensitiveDataForDoctor(r, doctor.id));
        }

        if (user.role === 'RECEPTIONIST') {
            const records = await MedicalRecordRepository.getMedicalRecordsByPatient(patientId);
            return records.map(r => this.maskSensitiveDataForReceptionist(r));
        }

        if (user.role === 'ADMIN') {
            return await MedicalRecordRepository.getPatientHistoryWithSensitiveData(patientId);
        }

        return [];
    }

    async getMedicalRecordByAppointment(appointmentId, user) {
        const record = await MedicalRecordRepository.getMedicalRecordByAppointment(appointmentId);
        if (!record) {
            return null;
        }

        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || record.patient_id !== patient.id) {
                return null;
            }
        }

        if (user.role === 'DOCTOR') {
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor || record.doctor_id !== doctor.id) {
                return null;
            }
        }

        return record;
    }

    async createMedicalRecord(data, user) {
        try {
            if (user.role !== 'DOCTOR' && user.role !== 'ADMIN') {
                return { success: false, message: 'Only DOCTOR can create medical records' };
            }

            const { appointment_id, symptoms, diagnosis, result, prescription, note } = data;

            if (!appointment_id) {
                return { success: false, message: 'Appointment ID is required' };
            }

            const appointment = await AppointmentRepository.getAppointmentById(appointment_id);
            if (!appointment) {
                return { success: false, message: 'Appointment not found' };
            }

            if (user.role === 'DOCTOR') {
                const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
                if (!doctor) {
                    return { success: false, message: 'Doctor profile not found' };
                }
                if (appointment.doctor_id !== doctor.id) {
                    return { success: false, message: 'You can only create records for your own appointments' };
                }
            }

            const validStatuses = ['WAITING', 'INPROGRESS'];
            if (!validStatuses.includes(appointment.status)) {
                return { success: false, message: 'Cannot create medical record: appointment status must be WAITING or INPROGRESS' };
            }

            const existingRecord = await MedicalRecordRepository.checkMedicalRecordExistsForAppointment(appointment_id);
            if (existingRecord) {
                return { success: false, message: 'Medical record already exists for this appointment' };
            }

            const recordData = {
                patient_id: appointment.patient_id,
                doctor_id: appointment.doctor_id,
                appointment_id: appointment_id,
                symptoms: symptoms || null,
                diagnosis: diagnosis || null,
                result: result || null,
                prescription: prescription || null,
                note: note || null
            };

            const recordCreated = await MedicalRecordRepository.createMedicalRecord(recordData);
            if (!recordCreated) {
                return { success: false, message: 'Failed to create medical record' };
            }

            const record = await MedicalRecordRepository.getMedicalRecordByAppointment(appointment_id);

            await this.logAudit('CREATE', record.id, user.id, null, record, 'Create medical record');

            return { success: true, data: record };
        } catch (error) {
            console.error('Error creating medical record:', error);
            return { success: false, message: error.message };
        }
    }

    async updateMedicalRecord(id, data, user) {
        try {
            if (user.role !== 'DOCTOR' && user.role !== 'ADMIN') {
                return { success: false, message: 'Only DOCTOR can update medical records' };
            }

            const existingRecord = await MedicalRecordRepository.getMedicalRecordById(id);
            if (!existingRecord) {
                return { success: false, message: 'Medical record not found' };
            }

            if (existingRecord.status === 'COMPLETED') {
                return { success: false, message: 'Cannot update a finalized medical record' };
            }

            if (user.role === 'DOCTOR') {
                const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
                if (!doctor) {
                    return { success: false, message: 'Doctor profile not found' };
                }
                if (existingRecord.doctor_id !== doctor.id) {
                    return { success: false, message: 'You can only update your own medical records' };
                }
            }

            const updateData = {};
            const allowedFields = ['symptoms', 'diagnosis', 'result', 'prescription', 'note'];

            for (const field of allowedFields) {
                if (data[field] !== undefined) {
                    updateData[field] = data[field];
                }
            }

            if (Object.keys(updateData).length === 0) {
                return { success: false, message: 'No valid fields to update' };
            }

            const oldData = { ...existingRecord };
            const result = await MedicalRecordRepository.updateMedicalRecord(id, updateData);

            if (result) {
                const updated = await MedicalRecordRepository.getMedicalRecordById(id);
                await this.logAudit('UPDATE', id, user.id, oldData, updated, 'Update medical record');
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to update medical record' };
        } catch (error) {
            console.error('Error updating medical record:', error);
            return { success: false, message: error.message };
        }
    }

    async finalizeMedicalRecord(id, user) {
        try {
            if (user.role !== 'DOCTOR' && user.role !== 'ADMIN') {
                return { success: false, message: 'Only DOCTOR can finalize medical records' };
            }

            const existingRecord = await MedicalRecordRepository.getMedicalRecordById(id);
            if (!existingRecord) {
                return { success: false, message: 'Medical record not found' };
            }

            if (existingRecord.status === 'COMPLETED') {
                return { success: false, message: 'Medical record is already finalized' };
            }

            if (user.role === 'DOCTOR') {
                const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
                if (!doctor) {
                    return { success: false, message: 'Doctor profile not found' };
                }
                if (existingRecord.doctor_id !== doctor.id) {
                    return { success: false, message: 'You can only finalize your own medical records' };
                }
            }

            const result = await MedicalRecordRepository.finalizeMedicalRecord(id);
            if (result) {
                const updated = await MedicalRecordRepository.getMedicalRecordById(id);
                await this.logAudit('FINALIZE', id, user.id, { status: existingRecord.status }, { status: 'COMPLETED' }, 'Finalize medical record');

                if (updated.appointment_id) {
                    await AppointmentRepository.updateAppointment(updated.appointment_id, 'COMPLETED');
                }

                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to finalize medical record' };
        } catch (error) {
            console.error('Error finalizing medical record:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteMedicalRecord(id, user) {
        try {
            if (user.role !== 'ADMIN') {
                return { success: false, message: 'Only ADMIN can delete medical records' };
            }

            const existingRecord = await MedicalRecordRepository.getMedicalRecordById(id);
            if (!existingRecord) {
                return { success: false, message: 'Medical record not found' };
            }

            const result = await MedicalRecordRepository.softDeleteMedicalRecord(id);
            if (result) {
                await this.logAudit('DELETE', id, user.id, existingRecord, null, 'Soft delete medical record');
                return { success: true, message: 'Medical record deleted successfully' };
            }
            return { success: false, message: 'Failed to delete medical record' };
        } catch (error) {
            console.error('Error deleting medical record:', error);
            return { success: false, message: error.message };
        }
    }

    maskSensitiveDataForDoctor(record, doctorId) {
        if (record.doctor_id !== doctorId) {
            const masked = { ...record };
            delete masked.symptoms;
            delete masked.diagnosis;
            delete masked.prescription;
            delete masked.result;
            return masked;
        }
        return record;
    }

    maskSensitiveDataForReceptionist(record) {
        const masked = { ...record };
        delete masked.symptoms;
        delete masked.diagnosis;
        delete masked.prescription;
        delete masked.result;
        delete masked.note;
        return masked;
    }

    async logAudit(actionType, recordId, userId, oldData, newData, description) {
        try {
            await AuditLogRepository.createLog({
                user_id: userId,
                action_type: actionType,
                table_name: 'Medical_Records',
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

export default new MedicalRecordService();
