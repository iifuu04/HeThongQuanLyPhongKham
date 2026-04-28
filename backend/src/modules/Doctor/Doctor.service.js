/**
 * Doctor Service (BUS Layer)
 * Business logic for Doctor operations
 * Implements BR:
 * - Only ADMIN can add/edit/delete/disable doctors
 * - Each doctor has unique ID
 * - Doctor must be linked with Profile role DOCTOR
 * - Doctor must be linked with valid Specialty
 */

import DoctorRepository from './Doctor.repository.js';
import ProfileRepository from '../Profile/Profile.repository.js';
import SpecialtyRepository from '../Specialty/Specialty.repository.js';

class DoctorService {
    async getAllDoctors(includeInactive = false) {
        const doctors = await DoctorRepository.getDoctors(includeInactive);
        return doctors || [];
    }

    async getDoctorById(id) {
        return await DoctorRepository.getDoctorById(id);
    }

    async getDoctorWithDetails(id) {
        return await DoctorRepository.getDoctorWithDetails(id);
    }

    async getDoctorsBySpecialty(specialtyId) {
        const doctors = await DoctorRepository.getDoctorsBySpecialty(specialtyId);
        return doctors || [];
    }

    async createDoctor(data) {
        try {
            const { profile_id, specialty_id } = data;

            if (!profile_id) {
                return { success: false, message: 'Profile ID is required' };
            }

            if (!specialty_id) {
                return { success: false, message: 'Specialty ID is required' };
            }

            const profile = await ProfileRepository.getUserById(profile_id);
            if (!profile) {
                return { success: false, message: 'Profile not found' };
            }

            if (profile.role !== 'DOCTOR') {
                return { success: false, message: 'Profile must have role DOCTOR' };
            }

            const specialty = await SpecialtyRepository.getSpecialtyById(specialty_id);
            if (!specialty) {
                return { success: false, message: 'Specialty not found' };
            }

            if (specialty.status !== 'ACTIVE') {
                return { success: false, message: 'Specialty is not active' };
            }

            const existingDoctorByProfile = await DoctorRepository.getDoctorByProfileId(profile_id);
            if (existingDoctorByProfile) {
                return { success: false, message: 'This profile is already linked to another doctor' };
            }

            const doctorId = await DoctorRepository.generateDoctorId();

            const result = await DoctorRepository.createDoctor({
                id: doctorId,
                profile_id,
                specialty_id
            });

            if (result) {
                const created = await DoctorRepository.getDoctorById(doctorId);
                return { success: true, data: created };
            }
            return { success: false, message: 'Failed to create doctor' };
        } catch (error) {
            console.error('Error creating doctor:', error);
            return { success: false, message: error.message };
        }
    }

    async updateDoctor(id, data) {
        try {
            const existing = await DoctorRepository.getDoctorById(id);
            if (!existing) {
                return { success: false, message: 'Doctor not found' };
            }

            if (data.specialty_id) {
                const specialty = await SpecialtyRepository.getSpecialtyById(data.specialty_id);
                if (!specialty) {
                    return { success: false, message: 'Specialty not found' };
                }
                if (specialty.status !== 'ACTIVE') {
                    return { success: false, message: 'Specialty is not active' };
                }
            }

            if (data.profile_id && data.profile_id !== existing.profile_id) {
                const profile = await ProfileRepository.getUserById(data.profile_id);
                if (!profile) {
                    return { success: false, message: 'Profile not found' };
                }
                if (profile.role !== 'DOCTOR') {
                    return { success: false, message: 'Profile must have role DOCTOR' };
                }
                const existingDoctorByProfile = await DoctorRepository.getDoctorByProfileId(data.profile_id);
                if (existingDoctorByProfile && existingDoctorByProfile.id !== id) {
                    return { success: false, message: 'This profile is already linked to another doctor' };
                }
            }

            const result = await DoctorRepository.updateDoctor(id, data);
            if (result) {
                const updated = await DoctorRepository.getDoctorById(id);
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to update doctor' };
        } catch (error) {
            console.error('Error updating doctor:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteDoctor(id) {
        try {
            const existing = await DoctorRepository.getDoctorById(id);
            if (!existing) {
                return { success: false, message: 'Doctor not found' };
            }

            const hasLinkedSchedules = await DoctorRepository.hasLinkedSchedules(id);
            if (hasLinkedSchedules) {
                return { success: false, message: 'Cannot delete doctor: there are work schedules linked to this doctor' };
            }

            const result = await DoctorRepository.deleteDoctor(id);
            if (result) {
                return { success: true, message: 'Doctor deleted successfully' };
            }
            return { success: false, message: 'Failed to delete doctor' };
        } catch (error) {
            console.error('Error deleting doctor:', error);
            return { success: false, message: error.message };
        }
    }

    async disableDoctor(id) {
        try {
            const existing = await DoctorRepository.getDoctorById(id);
            if (!existing) {
                return { success: false, message: 'Doctor not found' };
            }
            return { success: false, message: 'Disable function not available - Doctors table has no status column' };
        } catch (error) {
            console.error('Error disabling doctor:', error);
            return { success: false, message: error.message };
        }
    }

    async enableDoctor(id) {
        try {
            const existing = await DoctorRepository.getDoctorById(id);
            if (!existing) {
                return { success: false, message: 'Doctor not found' };
            }
            return { success: false, message: 'Enable function not available - Doctors table has no status column' };
        } catch (error) {
            console.error('Error enabling doctor:', error);
            return { success: false, message: error.message };
        }
    }
}

export default new DoctorService();
