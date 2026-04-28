/**
 * Patient Service (BUS Layer)
 * Business logic for Patient operations
 * SRS UC1 - Patient Registration
 * SRS UC2 - Patient Search
 * SRS UC3 - Patient Information Update
 * SRS UC4 - View Patient History
 */

import PatientRepository from './Patient.repository.js';
import ProfileRepository from '../Profile/Profile.repository.js';
import AuditLogRepository from '../AuditLog/AuditLog.repository.js';
import bcrypt from 'bcrypt';
import { normalizeDate } from '../../utils/date.js';

class PatientService {
    /**
     * Get all patients with profile info
     */
    async getAllPatients() {
        const patients = await PatientRepository.getPatients();
        return patients || [];
    }

    /**
     * Search patients by id, name, or phone
     */
    async searchPatients(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return [];
        }
        const patients = await PatientRepository.searchPatients(searchTerm.trim());
        return patients || [];
    }

    /**
     * Get patient by ID with profile info
     */
    async getPatientById(id) {
        return await PatientRepository.getPatientProfile(id);
    }

    /**
     * Get patient with full details
     */
    async getPatientWithDetails(patientId, user) {
        try {
            const patient = await PatientRepository.getPatientProfile(patientId);
            
            if (!patient) {
                return { success: false, message: 'Patient not found' };
            }

            if (['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(user.role)) {
                const appointments = await PatientRepository.getPatientAppointments(patientId);
                const medicalRecords = await PatientRepository.getPatientMedicalRecords(patientId);
                
                return {
                    success: true,
                    data: {
                        patient: {
                            id: patient.id,
                            profile_id: patient.profile_id
                        },
                        profile: {
                            first_name: patient.first_name,
                            last_name: patient.last_name,
                            date_of_birth: patient.date_of_birth,
                            gender: patient.gender,
                            email: patient.email,
                            phone: patient.phone,
                            address: patient.address
                        },
                        appointments: appointments || [],
                        medical_records: medicalRecords || []
                    }
                };
            }
            
            if (user.role === 'PATIENT') {
                const ownPatient = await PatientRepository.getPatientByProfileId(user.id);
                
                if (!ownPatient || ownPatient.id !== patientId) {
                    return { success: false, message: 'Access denied' };
                }
                
                const medicalRecords = await PatientRepository.getPatientMedicalRecords(patientId);
                
                return {
                    success: true,
                    data: {
                        patient: {
                            id: patient.id,
                            profile_id: patient.profile_id
                        },
                        profile: {
                            first_name: patient.first_name,
                            last_name: patient.last_name,
                            date_of_birth: patient.date_of_birth,
                            gender: patient.gender,
                            email: patient.email,
                            phone: patient.phone,
                            address: patient.address
                        },
                        appointments: [],
                        medical_records: medicalRecords || []
                    }
                };
            }
            
            return { success: false, message: 'Access denied' };
        } catch (error) {
            console.error('Error getting patient details:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Create new patient
     */
    async createPatient(data, actorId) {
        try {
            const required = ['first_name', 'last_name', 'date_of_birth', 'phone'];
            for (const field of required) {
                if (!data[field]) {
                    return { success: false, message: `Missing required field: ${field}` };
                }
            }

            let username = data.username;
            if (!username) {
                const cleanPhone = data.phone.replace(/\D/g, '');
                username = `patient_${cleanPhone.slice(-8)}`;
            }

            const existingProfile = await ProfileRepository.getUserByUsername(username);
            if (existingProfile) {
                return { success: false, message: 'Username already exists' };
            }

            const password = data.password || 'patient123';
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Create profile - this will automatically create Patient record
            const profileData = {
                username,
                password_hash,
                role: 'PATIENT',
                first_name: data.first_name,
                last_name: data.last_name,
                date_of_birth: normalizeDate(data.date_of_birth),
                gender: data.gender || null,
                email: data.email || null,
                phone: data.phone,
                address: data.address || null
            };

            await ProfileRepository.createProfile(profileData);
            
            // Get the created profile
            const newProfile = await ProfileRepository.getUserByUsername(username);
            if (!newProfile) {
                return { success: false, message: 'Failed to create patient profile' };
            }

            // Get the patient record (created automatically by Profile.createProfile)
            const patient = await PatientRepository.getPatientByProfileId(newProfile.id);
            if (!patient) {
                return { success: false, message: 'Failed to create patient record' };
            }

            // Create audit log
            try {
                await AuditLogRepository.createLog({
                    user_id: actorId,
                    action_type: 'CREATE',
                    table_name: 'Patients',
                    record_id: patient.id,
                    description: `Created patient: ${data.first_name} ${data.last_name} (${patient.id})`,
                    ip_address: null,
                    user_agent: null
                });
            } catch (logError) {
                console.error('Failed to create audit log:', logError);
            }

            return {
                success: true,
                data: {
                    id: patient.id,
                    profile_id: newProfile.id,
                    first_name: newProfile.first_name,
                    last_name: newProfile.last_name,
                    date_of_birth: newProfile.date_of_birth,
                    gender: newProfile.gender,
                    email: newProfile.email,
                    phone: newProfile.phone,
                    address: newProfile.address
                },
                default_password: password
            };
        } catch (error) {
            console.error('Error creating patient:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Update patient info
     */
    async updatePatient(patientId, data, actorId) {
        try {
            const patient = await PatientRepository.getPatientProfile(patientId);
            if (!patient) {
                return { success: false, message: 'Patient not found' };
            }

            const profileUpdate = {};
            const allowedFields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'email', 'phone', 'address'];
            
            for (const field of allowedFields) {
                if (data[field] !== undefined) {
                    // Normalize date fields
                    if (field === 'date_of_birth') {
                        profileUpdate[field] = normalizeDate(data[field]);
                    } else {
                        profileUpdate[field] = data[field];
                    }
                }
            }

            if (data.password) {
                const saltRounds = 10;
                profileUpdate.password_hash = await bcrypt.hash(data.password, saltRounds);
            }

            if (Object.keys(profileUpdate).length === 0) {
                return { success: false, message: 'No fields to update' };
            }

            const updated = await ProfileRepository.updateProfile(patient.profile_id, profileUpdate);

            if (updated) {
                const updatedPatient = await PatientRepository.getPatientProfile(patientId);

                try {
                    await AuditLogRepository.createLog({
                        user_id: actorId,
                        action_type: 'UPDATE',
                        table_name: 'Patients',
                        record_id: patientId,
                        description: `Updated patient: ${updatedPatient.first_name} ${updatedPatient.last_name} (${patientId})`,
                        ip_address: null,
                        user_agent: null
                    });
                } catch (logError) {
                    console.error('Failed to create audit log:', logError);
                }

                return {
                    success: true,
                    data: {
                        id: updatedPatient.id,
                        profile_id: updatedPatient.profile_id,
                        first_name: updatedPatient.first_name,
                        last_name: updatedPatient.last_name,
                        date_of_birth: updatedPatient.date_of_birth,
                        gender: updatedPatient.gender,
                        email: updatedPatient.email,
                        phone: updatedPatient.phone,
                        address: updatedPatient.address
                    }
                };
            }

            return { success: false, message: 'Failed to update patient' };
        } catch (error) {
            console.error('Error updating patient:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Soft delete patient
     */
    async deletePatient(patientId, actorId) {
        try {
            const patient = await PatientRepository.getPatientProfile(patientId);
            if (!patient) {
                return { success: false, message: 'Patient not found' };
            }

            const deleted = await ProfileRepository.deleteProfile(patient.profile_id);

            if (deleted) {
                try {
                    await AuditLogRepository.createLog({
                        user_id: actorId,
                        action_type: 'DELETE',
                        table_name: 'Patients',
                        record_id: patientId,
                        description: `Deleted patient: ${patient.first_name} ${patient.last_name} (${patientId})`,
                        ip_address: null,
                        user_agent: null
                    });
                } catch (logError) {
                    console.error('Failed to create audit log:', logError);
                }

                return { success: true, message: 'Patient deleted' };
            }

            return { success: false, message: 'Failed to delete patient' };
        } catch (error) {
            console.error('Error deleting patient:', error);
            return { success: false, message: error.message };
        }
    }
}

export default new PatientService();
