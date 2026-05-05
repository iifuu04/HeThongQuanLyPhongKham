/**
 * Clinic Service (BUS Layer)
 * Business logic for Clinic operations
 */

import ClinicRepository from './Clinic.repository.js';

class ClinicService {
    async getAllClinics() {
        const clinics = await ClinicRepository.getClinics();
        return clinics || [];
    }

    async getClinicById(id) {
        return await ClinicRepository.getClinicById(id);
    }

    async createClinic(data) {
        try {
            const { name, location, is_reserve } = data;

            if (!name || name.trim() === '') {
                return { success: false, message: 'Clinic name is required' };
            }

            if (!location || location.trim() === '') {
                return { success: false, message: 'Clinic location is required' };
            }

            const existingByName = await ClinicRepository.getByName(name.trim());
            if (existingByName) {
                return { success: false, message: 'Clinic with this name already exists' };
            }

            const result = await ClinicRepository.createClinic({
                name: name.trim(),
                location: location.trim(),
                is_reserve: is_reserve || false
            });

            if (result) {
                const clinics = await ClinicRepository.getClinics();
                const created = clinics.find(c => c.name === name.trim());
                return { success: true, data: created };
            }
            return { success: false, message: 'Failed to create clinic' };
        } catch (error) {
            console.error('Error creating clinic:', error);
            return { success: false, message: error.message };
        }
    }

    async updateClinic(id, data) {
        try {
            const existing = await ClinicRepository.getClinicById(id);
            if (!existing) {
                return { success: false, message: 'Clinic not found' };
            }

            if (data.name) {
                data.name = data.name.trim();
                if (data.name === '') {
                    return { success: false, message: 'Clinic name cannot be empty' };
                }
                const duplicate = await ClinicRepository.getByNameExcludingId(data.name, id);
                if (duplicate) {
                    return { success: false, message: 'Another clinic with this name already exists' };
                }
            }

            if (data.location) {
                data.location = data.location.trim();
                if (data.location === '') {
                    return { success: false, message: 'Clinic location cannot be empty' };
                }
            }

            if (data.is_reserve === undefined) {
                delete data.is_reserve;
            }

            const result = await ClinicRepository.updateClinic(id, data);
            if (result) {
                const updated = await ClinicRepository.getClinicById(id);
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to update clinic' };
        } catch (error) {
            console.error('Error updating clinic:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteClinic(id) {
        try {
            const existing = await ClinicRepository.getClinicById(id);
            if (!existing) {
                return { success: false, message: 'Clinic not found' };
            }

            const hasLinkedSchedules = await ClinicRepository.hasLinkedSchedules(id);
            if (hasLinkedSchedules) {
                return { success: false, message: 'Cannot delete clinic: there are work schedules linked to this clinic' };
            }

            const result = await ClinicRepository.deleteClinic(id);
            if (result) {
                return { success: true, message: 'Clinic deleted successfully' };
            }
            return { success: false, message: 'Failed to delete clinic' };
        } catch (error) {
            console.error('Error deleting clinic:', error);
            return { success: false, message: error.message };
        }
    }
}

export default new ClinicService();
