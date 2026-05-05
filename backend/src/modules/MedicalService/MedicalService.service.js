/**
 * MedicalService Service (BUS Layer)
 * Business logic for MedicalService operations
 */

import MedicalServiceRepository from './MedicalService.repository.js';
import AuditLogRepository from '../AuditLog/AuditLog.repository.js';

class MedicalServiceService {
    async getAllServices(filters = {}) {
        const services = await MedicalServiceRepository.getServices(filters);
        return services || [];
    }

    async getServiceById(id) {
        return await MedicalServiceRepository.getServiceById(id);
    }

    async createService(data, user) {
        try {
            if (user.role !== 'ADMIN') {
                return { success: false, message: 'Only ADMIN can create services' };
            }

            const { name, price, description, unit } = data;

            if (!name) {
                return { success: false, message: 'Service name is required' };
            }

            if (!price || price <= 0) {
                return { success: false, message: 'Valid price is required' };
            }

            const result = await MedicalServiceRepository.createService({
                name,
                price,
                description,
                unit
            });

            if (result) {
                const services = await MedicalServiceRepository.getServices();
                const created = services.find(s => s.name === name) || services[services.length - 1];
                await this.logAudit('CREATE', created.id, user.id, null, created, 'Create service');
                return { success: true, data: created };
            }
            return { success: false, message: 'Failed to create service' };
        } catch (error) {
            console.error('Error creating service:', error);
            return { success: false, message: error.message };
        }
    }

    async updateService(id, data, user) {
        try {
            if (user.role !== 'ADMIN') {
                return { success: false, message: 'Only ADMIN can update services' };
            }

            const existing = await MedicalServiceRepository.getServiceById(id);
            if (!existing) {
                return { success: false, message: 'Service not found' };
            }

            if (data.price !== undefined && data.price <= 0) {
                return { success: false, message: 'Price must be greater than 0' };
            }

            const result = await MedicalServiceRepository.updateService(id, data);

            if (result) {
                const updated = await MedicalServiceRepository.getServiceById(id);
                await this.logAudit('UPDATE', id, user.id, existing, updated, 'Update service');
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to update service' };
        } catch (error) {
            console.error('Error updating service:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteService(id, user) {
        try {
            if (user.role !== 'ADMIN') {
                return { success: false, message: 'Only ADMIN can delete services' };
            }

            const existing = await MedicalServiceRepository.getServiceById(id);
            if (!existing) {
                return { success: false, message: 'Service not found' };
            }

            const result = await MedicalServiceRepository.deleteService(id);

            if (result) {
                await this.logAudit('DELETE', id, user.id, existing, null, 'Delete service');
                return { success: true, message: 'Service deleted successfully' };
            }
            return { success: false, message: 'Failed to delete service' };
        } catch (error) {
            console.error('Error deleting service:', error);
            return { success: false, message: error.message };
        }
    }

    async logAudit(actionType, recordId, userId, oldData, newData, description) {
        try {
            await AuditLogRepository.createLog({
                user_id: userId,
                action_type: actionType,
                table_name: 'Services',
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

export default new MedicalServiceService();
