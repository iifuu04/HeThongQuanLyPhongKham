/**
 * MedicalRecord Service (BUS Layer)
 * Business logic for MedicalRecord operations
 * 
 * Implements BR:
 * 1. Only DOCTOR can create/update medical records
 * 2. Doctor can only update records for their appointments
 * 3. Each appointment has only 1 medical record (UNIQUE constraint)
 * 4. Required fields: symptoms, diagnosis, result, prescription (cannot be empty when DB has data)
 * 5. Patient can only view their own medical history
 * 6. Doctor can view patient history for treatment
 */

import MedicalRecordRepository from './MedicalRecord.repository.js';
import AppointmentRepository from '../Appointment/Appointment.repository.js';
import DoctorRepository from '../Doctor/Doctor.repository.js';
import PatientRepository from '../Patient/Patient.repository.js';
import AuditLogRepository from '../AuditLog/AuditLog.repository.js';

class MedicalRecordService {
    /**
     * Check if database has existing medical records
     */
    async hasExistingRecords() {
        try {
            const records = await MedicalRecordRepository.getMedicalRecords({});
            return records.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get all medical records with role-based filtering
     */
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

        // ADMIN, RECEPTIONIST can see all
        return await MedicalRecordRepository.getMedicalRecords(filters);
    }

    /**
     * Get medical record by ID with access control
     */
    async getMedicalRecordById(id, user) {
        const record = await MedicalRecordRepository.getMedicalRecordById(id);
        if (!record) {
            return null;
        }

        // PATIENT can only view their own records
        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || record.patient_id !== patient.id) {
                return null;
            }
        }

        // DOCTOR can only view their own records (or patient history for treatment)
        if (user.role === 'DOCTOR') {
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor) {
                return null;
            }
            // For their own records, show all data
            if (record.doctor_id === doctor.id) {
                return record;
            }
            // For other doctors' records, mask sensitive data
            return this.maskSensitiveData(record);
        }

        return record;
    }

    /**
     * Get patient history - Doctor can view their patients' history
     */
    async getMedicalRecordsByPatient(patientId, user) {
        // PATIENT can only view their own history
        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || patient.id !== patientId) {
                return [];
            }
            return await MedicalRecordRepository.getPatientHistoryWithSensitiveData(patientId);
        }

        // DOCTOR can view patient history for treatment
        if (user.role === 'DOCTOR') {
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor) {
                return [];
            }
            return await MedicalRecordRepository.getPatientHistory(patientId);
        }

        // ADMIN, RECEPTIONIST can view all
        return await MedicalRecordRepository.getPatientHistoryWithSensitiveData(patientId);
    }

    /**
     * Get medical record by appointment ID with access control
     */
    async getMedicalRecordByAppointment(appointmentId, user) {
        const record = await MedicalRecordRepository.getMedicalRecordByAppointment(appointmentId);
        if (!record) {
            return null;
        }

        // PATIENT can only view their own records
        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || record.patient_id !== patient.id) {
                return null;
            }
        }

        // DOCTOR can only view records for their appointments
        if (user.role === 'DOCTOR') {
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor || record.doctor_id !== doctor.id) {
                return null;
            }
        }

        return record;
    }

    /**
     * Create new medical record
     * Only DOCTOR can create, and only for their appointments
     */
    async createMedicalRecord(data, user) {
        try {
            // Only DOCTOR can create medical records
            if (user.role !== 'DOCTOR') {
                return { success: false, message: 'Chỉ BÁC SĨ mới được tạo bệnh án' };
            }

            const { appointment_id, symptoms, diagnosis, result, prescription, note } = data;

            if (!appointment_id) {
                return { success: false, message: 'ID lịch hẹn là bắt buộc' };
            }

            // Get the appointment
            const appointment = await AppointmentRepository.getAppointmentById(appointment_id);
            if (!appointment) {
                return { success: false, message: 'Lịch hẹn không tồn tại' };
            }

            // Verify doctor is the assigned doctor
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor) {
                return { success: false, message: 'Hồ sơ bác sĩ không tồn tại' };
            }
            if (appointment.doctor_id !== doctor.id) {
                return { success: false, message: 'Bạn chỉ được tạo bệnh án cho lịch hẹn của mình' };
            }

            // Verify appointment status allows creating medical record
            const validStatuses = ['WAITING', 'INPROGRESS'];
            if (!validStatuses.includes(appointment.status)) {
                return { success: false, message: 'Chỉ có thể tạo bệnh án cho lịch hẹn đang CHỜ KHÁM hoặc ĐANG KHÁM' };
            }

            // Check if medical record already exists for this appointment
            const existingRecord = await MedicalRecordRepository.checkMedicalRecordExistsForAppointment(appointment_id);
            if (existingRecord) {
                return { success: false, message: 'Đã có bệnh án cho lịch hẹn này' };
            }

            // If database has existing records, validate required fields are not empty
            const hasData = await this.hasExistingRecords();
            if (hasData) {
                const errors = [];
                if (!symptoms || (typeof symptoms === 'string' && symptoms.trim() === '')) {
                    errors.push('Triệu chứng không được để trống');
                }
                if (!diagnosis || (typeof diagnosis === 'string' && diagnosis.trim() === '')) {
                    errors.push('Chẩn đoán không được để trống');
                }
                if (!result || (typeof result === 'string' && result.trim() === '')) {
                    errors.push('Kết quả không được để trống');
                }
                if (!prescription || (typeof prescription === 'string' && prescription.trim() === '')) {
                    errors.push('Chỉ định không được để trống');
                }
                if (errors.length > 0) {
                    return { success: false, message: errors.join('; ') };
                }
            }

            // Create the medical record
            const recordData = {
                patient_id: appointment.patient_id,
                doctor_id: appointment.doctor_id,
                appointment_id: appointment_id,
                symptoms: symptoms || null,
                diagnosis: diagnosis || null,
                result: result || null,
                prescription: prescription || null,
                note: note || null,
            };

            const created = await MedicalRecordRepository.createMedicalRecord(recordData);
            if (!created) {
                return { success: false, message: 'Không thể tạo bệnh án' };
            }

            // Get the created record
            const record = await MedicalRecordRepository.getMedicalRecordByAppointment(appointment_id);

            // Audit log
            await this.logAudit('CREATE', record.id, user.id, null, record, 'Tạo bệnh án');

            return { success: true, data: record };
        } catch (error) {
            console.error('Error creating medical record:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Update medical record
     * Only DOCTOR can update, and only their own records
     */
    async updateMedicalRecord(id, data, user) {
        try {
            // Only DOCTOR can update medical records
            if (user.role !== 'DOCTOR') {
                return { success: false, message: 'Chỉ BÁC SĨ mới được cập nhật bệnh án' };
            }

            const existingRecord = await MedicalRecordRepository.getMedicalRecordById(id);
            if (!existingRecord) {
                return { success: false, message: 'Bệnh án không tồn tại' };
            }

            // Cannot update completed records
            if (existingRecord.status === 'COMPLETED') {
                return { success: false, message: 'Không thể cập nhật bệnh án đã hoàn tất' };
            }

            // Verify doctor is the owner
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor) {
                return { success: false, message: 'Hồ sơ bác sĩ không tồn tại' };
            }
            if (existingRecord.doctor_id !== doctor.id) {
                return { success: false, message: 'Bạn chỉ được cập nhật bệnh án của mình' };
            }

            // Validate required fields if database has data
            const hasData = await this.hasExistingRecords();
            if (hasData) {
                const errors = [];
                const updateData = data;

                if (updateData.symptoms !== undefined && (!updateData.symptoms || (typeof updateData.symptoms === 'string' && updateData.symptoms.trim() === ''))) {
                    errors.push('Triệu chứng không được để trống');
                }
                if (updateData.diagnosis !== undefined && (!updateData.diagnosis || (typeof updateData.diagnosis === 'string' && updateData.diagnosis.trim() === ''))) {
                    errors.push('Chẩn đoán không được để trống');
                }
                if (updateData.result !== undefined && (!updateData.result || (typeof updateData.result === 'string' && updateData.result.trim() === ''))) {
                    errors.push('Kết quả không được để trống');
                }
                if (updateData.prescription !== undefined && (!updateData.prescription || (typeof updateData.prescription === 'string' && updateData.prescription.trim() === ''))) {
                    errors.push('Chỉ định không được để trống');
                }
                if (errors.length > 0) {
                    return { success: false, message: errors.join('; ') };
                }
            }

            const oldData = { ...existingRecord };
            const updated = await MedicalRecordRepository.updateMedicalRecord(id, data);

            if (updated) {
                const record = await MedicalRecordRepository.getMedicalRecordById(id);
                await this.logAudit('UPDATE', id, user.id, oldData, record, 'Cập nhật bệnh án');
                return { success: true, data: record };
            }
            return { success: false, message: 'Không thể cập nhật bệnh án' };
        } catch (error) {
            console.error('Error updating medical record:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Finalize medical record (mark as COMPLETED)
     * Only DOCTOR can finalize their own records
     */
    async finalizeMedicalRecord(id, user) {
        try {
            if (user.role !== 'DOCTOR') {
                return { success: false, message: 'Chỉ BÁC SĨ mới được hoàn tất bệnh án' };
            }

            const existingRecord = await MedicalRecordRepository.getMedicalRecordById(id);
            if (!existingRecord) {
                return { success: false, message: 'Bệnh án không tồn tại' };
            }

            if (existingRecord.status === 'COMPLETED') {
                return { success: false, message: 'Bệnh án đã được hoàn tất trước đó' };
            }

            // Verify doctor is the owner
            const doctor = await DoctorRepository.getDoctorByProfileId(user.id);
            if (!doctor) {
                return { success: false, message: 'Hồ sơ bác sĩ không tồn tại' };
            }
            if (existingRecord.doctor_id !== doctor.id) {
                return { success: false, message: 'Bạn chỉ được hoàn tất bệnh án của mình' };
            }

            // Validate required fields before finalizing
            const errors = [];
            if (!existingRecord.symptoms || existingRecord.symptoms.trim() === '') {
                errors.push('Triệu chứng không được để trống');
            }
            if (!existingRecord.diagnosis || existingRecord.diagnosis.trim() === '') {
                errors.push('Chẩn đoán không được để trống');
            }
            if (!existingRecord.result || existingRecord.result.trim() === '') {
                errors.push('Kết quả không được để trống');
            }
            if (!existingRecord.prescription || existingRecord.prescription.trim() === '') {
                errors.push('Chỉ định không được để trống');
            }
            if (errors.length > 0) {
                return { success: false, message: errors.join('; ') };
            }

            const result = await MedicalRecordRepository.finalizeMedicalRecord(id);
            if (result) {
                const record = await MedicalRecordRepository.getMedicalRecordById(id);
                await this.logAudit('FINALIZE', id, user.id, { status: 'INCOMPLETE' }, { status: 'COMPLETED' }, 'Hoàn tất bệnh án');

                // Update related appointment to COMPLETED
                if (record.appointment_id) {
                    await AppointmentRepository.updateAppointmentStatus(record.appointment_id, 'COMPLETED');
                }

                return { success: true, data: record };
            }
            return { success: false, message: 'Không thể hoàn tất bệnh án' };
        } catch (error) {
            console.error('Error finalizing medical record:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Mask sensitive data for non-owner doctors
     */
    maskSensitiveData(record) {
        const masked = { ...record };
        delete masked.symptoms;
        delete masked.diagnosis;
        delete masked.result;
        delete masked.prescription;
        return masked;
    }

    /**
     * Delete medical record (ADMIN only)
     */
    async deleteMedicalRecord(id, user) {
        try {
            if (user.role !== 'ADMIN') {
                return { success: false, message: 'Chỉ QUẢN TRỊ mới được xóa bệnh án' };
            }

            const existingRecord = await MedicalRecordRepository.getMedicalRecordById(id);
            if (!existingRecord) {
                return { success: false, message: 'Bệnh án không tồn tại' };
            }

            const deleted = await MedicalRecordRepository.softDeleteMedicalRecord(id);
            if (deleted) {
                await this.logAudit('DELETE', id, user.id, existingRecord, null, 'Xóa bệnh án');
                return { success: true, message: 'Xóa bệnh án thành công' };
            }
            return { success: false, message: 'Không thể xóa bệnh án' };
        } catch (error) {
            console.error('Error deleting medical record:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Audit logging helper
     */
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
                user_agent: null,
            });
        } catch (error) {
            console.error('Error logging audit:', error);
        }
    }
}

export default new MedicalRecordService();
