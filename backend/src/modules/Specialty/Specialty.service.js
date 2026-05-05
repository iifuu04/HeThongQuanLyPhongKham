/**
 * Specialty Service (BUS Layer)
 * Business logic for Specialty operations
 * Implements BR: Each specialty only exists once, no duplicate active names
 */

import SpecialtyRepository from './Specialty.repository.js';
import db from '../../config/db.js';

class SpecialtyService {
    async getAllSpecialties(includeInactive = false) {
        const specialties = await SpecialtyRepository.getSpecialties(includeInactive);
        return specialties || [];
    }

    async getSpecialtyById(id) {
        return await SpecialtyRepository.getSpecialtyById(id);
    }

    async createSpecialty(data) {
        try {
            const { name, description } = data;

            if (!name || name.trim() === '') {
                return { success: false, message: 'Specialty name is required' };
            }

            const existingActive = await SpecialtyRepository.getActiveByName(name.trim());
            if (existingActive) {
                return { success: false, message: 'Specialty with this name already exists and is active' };
            }

            const result = await SpecialtyRepository.createSpecialty({
                name: name.trim(),
                description: description || null
            });

            if (result) {
                const specialties = await SpecialtyRepository.getSpecialties();
                const created = specialties.find(s => s.name === name.trim());
                return { success: true, data: created };
            }
            return { success: false, message: 'Failed to create specialty' };
        } catch (error) {
            console.error('Error creating specialty:', error);
            return { success: false, message: error.message };
        }
    }

    async updateSpecialty(id, data) {
        try {
            const existing = await SpecialtyRepository.getSpecialtyById(id);
            if (!existing) {
                return { success: false, message: 'Specialty not found' };
            }

            if (data.name) {
                data.name = data.name.trim();
                if (data.name === '') {
                    return { success: false, message: 'Specialty name cannot be empty' };
                }

                const duplicate = await SpecialtyRepository.getActiveByNameExcludingId(data.name, id);
                if (duplicate) {
                    return { success: false, message: 'Another specialty with this name already exists and is active' };
                }
            }

            if (data.description === '') {
                data.description = null;
            }

            const result = await SpecialtyRepository.updateSpecialty(id, data);
            if (result) {
                const updated = await SpecialtyRepository.getSpecialtyById(id);
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to update specialty' };
        } catch (error) {
            console.error('Error updating specialty:', error);
            return { success: false, message: error.message };
        }
    }

    async lockSpecialty(id) {
        try {
            const existing = await SpecialtyRepository.getSpecialtyById(id);
            if (!existing) {
                return { success: false, message: 'Specialty not found' };
            }

            if (existing.status === 'LOCKED') {
                return { success: false, message: 'Specialty is already locked' };
            }

            const result = await SpecialtyRepository.lockSpecialty(id);
            if (result) {
                const updated = await SpecialtyRepository.getSpecialtyById(id);
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to lock specialty' };
        } catch (error) {
            console.error('Error locking specialty:', error);
            return { success: false, message: error.message };
        }
    }

    async unlockSpecialty(id) {
        try {
            const existing = await SpecialtyRepository.getSpecialtyById(id);
            if (!existing) {
                return { success: false, message: 'Specialty not found' };
            }

            if (existing.status === 'ACTIVE') {
                return { success: false, message: 'Specialty is already active' };
            }

            const result = await SpecialtyRepository.unlockSpecialty(id);
            if (result) {
                const updated = await SpecialtyRepository.getSpecialtyById(id);
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to unlock specialty' };
        } catch (error) {
            console.error('Error unlocking specialty:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteSpecialty(id) {
        try {
            const existing = await SpecialtyRepository.getSpecialtyById(id);
            if (!existing) {
                return { success: false, message: 'Specialty not found' };
            }

            const hasLinkedDoctors = await SpecialtyRepository.hasLinkedDoctors(id);
            if (hasLinkedDoctors) {
                return { success: false, message: 'Cannot delete specialty: there are doctors linked to this specialty' };
            }

            const result = await SpecialtyRepository.deleteSpecialty(id);
            if (result) {
                return { success: true, message: 'Specialty deleted successfully' };
            }
            return { success: false, message: 'Failed to delete specialty' };
        } catch (error) {
            console.error('Error deleting specialty:', error);
            return { success: false, message: error.message };
        }
    }

    async disableSpecialty(id) {
        return await this.lockSpecialty(id);
    }
}

export default new SpecialtyService();
