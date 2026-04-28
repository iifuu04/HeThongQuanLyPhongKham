/**
 * Bill Service (BUS Layer)
 * Business logic for Bill and BillItem operations
 * Implements BR:
 * - RECEPTIONIST creates bill after medical_record is completed
 * - Each medical_record has one bill
 * - Bill total is calculated from bill_items: quantity * price
 * - Cannot confirm payment for already COMPLETED bill
 * - Patient can view their own bills
 * - RECEPTIONIST and ADMIN can view all bills
 * - Cannot create bill if medical_record doesn't exist
 * - Cannot create bill if appointment not completed or no medical_record
 */

import BillRepository from './Bill.repository.js';
import MedicalRecordRepository from '../MedicalRecord/MedicalRecord.repository.js';
import AppointmentRepository from '../Appointment/Appointment.repository.js';
import PatientRepository from '../Patient/Patient.repository.js';
import AuditLogRepository from '../AuditLog/AuditLog.repository.js';

class BillService {
    async getAllBills(user, filters = {}) {
        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient) {
                return [];
            }
            return await BillRepository.getBillByPatient(patient.id);
        }

        if (user.role === 'RECEPTIONIST' || user.role === 'ADMIN') {
            return await BillRepository.getBills(filters);
        }

        return [];
    }

    async getBillById(id, user) {
        const bill = await BillRepository.getBillById(id);
        if (!bill) {
            return null;
        }

        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || bill.patient_id_ref !== patient.id) {
                return null;
            }
        }

        return bill;
    }

    async getBillFullDetail(id, user) {
        const bill = await BillRepository.getBillFullDetail(id);
        if (!bill) {
            return null;
        }

        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || bill.patient_id_ref !== patient.id) {
                return null;
            }
        }

        return bill;
    }

    async getBillsByPatient(patientId, user) {
        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || patient.id !== patientId) {
                return [];
            }
        }

        return await BillRepository.getBillByPatient(patientId);
    }

    async getBillItems(billId, user) {
        const bill = await this.getBillById(billId, user);
        if (!bill) {
            return [];
        }

        const items = await BillRepository.getBillItems(billId);
        return items || [];
    }

    async createBill(data, user) {
        try {
            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Only RECEPTIONIST can create bills' };
            }

            const { medical_record_id } = data;

            if (!medical_record_id) {
                return { success: false, message: 'Medical record ID is required' };
            }

            const medicalRecord = await MedicalRecordRepository.getMedicalRecordById(medical_record_id);
            if (!medicalRecord) {
                return { success: false, message: 'Medical record not found' };
            }

            const appointment = await AppointmentRepository.getAppointmentById(medicalRecord.appointment_id);
            if (!appointment) {
                return { success: false, message: 'Associated appointment not found' };
            }

            if (appointment.status !== 'COMPLETED') {
                return { success: false, message: 'Cannot create bill: appointment not completed' };
            }

            if (medicalRecord.status !== 'COMPLETED') {
                return { success: false, message: 'Cannot create bill: medical record not finalized' };
            }

            const existingBill = await BillRepository.getBillByMedicalRecord(medical_record_id);
            if (existingBill) {
                return { success: false, message: 'Bill already exists for this medical record. Use existing bill.' };
            }

            const result = await BillRepository.createBillWithTransaction({
                medical_record_id,
                created_by: user.id
            });

            if (result.success) {
                await this.logAudit('CREATE', result.data.id, user.id, null, result.data, 'Create bill');
                return { success: true, data: result.data };
            }

            return { success: false, message: 'Failed to create bill' };
        } catch (error) {
            console.error('Error creating bill:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, message: 'Bill already exists for this medical record' };
            }
            return { success: false, message: error.message };
        }
    }

    async updateBill(id, data, user) {
        try {
            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Only RECEPTIONIST can update bills' };
            }

            const bill = await BillRepository.getBillById(id);
            if (!bill) {
                return { success: false, message: 'Bill not found' };
            }

            if (bill.status === 'COMPLETED') {
                return { success: false, message: 'Cannot update completed bill' };
            }

            const result = await BillRepository.updateBill(id, data);
            if (result) {
                const updated = await BillRepository.getBillById(id);
                await this.logAudit('UPDATE', id, user.id, bill, updated, 'Update bill');
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to update bill' };
        } catch (error) {
            console.error('Error updating bill:', error);
            return { success: false, message: error.message };
        }
    }

    async confirmPayment(id, paymentMethod, user) {
        try {
            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Only RECEPTIONIST can confirm payment' };
            }

            const bill = await BillRepository.getBillById(id);
            if (!bill) {
                return { success: false, message: 'Bill not found' };
            }

            if (bill.status === 'COMPLETED') {
                return { success: false, message: 'Bill already paid' };
            }

            if (bill.status !== 'PENDING') {
                return { success: false, message: 'Invalid bill status for payment' };
            }

            const result = await BillRepository.confirmPayment(id, paymentMethod, user.id);
            if (result) {
                const updated = await BillRepository.getBillById(id);
                await this.logAudit('PAYMENT', id, user.id, { status: 'PENDING' }, { status: 'COMPLETED', payment_method: paymentMethod }, 'Confirm payment');
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to confirm payment' };
        } catch (error) {
            console.error('Error confirming payment:', error);
            return { success: false, message: error.message };
        }
    }

    async addBillItem(billId, data, user) {
        try {
            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Only RECEPTIONIST can add bill items' };
            }

            const bill = await BillRepository.getBillById(billId);
            if (!bill) {
                return { success: false, message: 'Bill not found' };
            }

            if (bill.status === 'COMPLETED') {
                return { success: false, message: 'Cannot add items to completed bill' };
            }

            const { service_id, quantity, price, notes } = data;

            if (!service_id) {
                return { success: false, message: 'Service ID is required' };
            }

            const result = await BillRepository.addBillItemWithTransaction({
                bill_id: billId,
                service_id,
                quantity: quantity || 1,
                price: price || null,
                notes
            });

            if (result.success) {
                await this.logAudit('CREATE', `BillItem:${billId}`, user.id, null, data, 'Add bill item');
                return { success: true, data: result.data };
            }

            return { success: false, message: 'Failed to add bill item' };
        } catch (error) {
            console.error('Error adding bill item:', error);
            return { success: false, message: error.message };
        }
    }

    async updateBillItem(itemId, data, user) {
        try {
            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Only RECEPTIONIST can update bill items' };
            }

            const item = await BillRepository.getBillItemById(itemId);
            if (!item) {
                return { success: false, message: 'Bill item not found' };
            }

            const bill = await BillRepository.getBillById(item.bill_id);
            if (!bill) {
                return { success: false, message: 'Bill not found' };
            }

            if (bill.status === 'COMPLETED') {
                return { success: false, message: 'Cannot update items in completed bill' };
            }

            const result = await BillRepository.updateBillItem(itemId, data);
            if (result) {
                const updated = await BillRepository.getBillItemById(itemId);
                const updatedBill = await BillRepository.getBillById(item.bill_id);
                await this.logAudit('UPDATE', `BillItem:${itemId}`, user.id, item, updated, 'Update bill item');
                return { success: true, data: { bill: updatedBill, item: updated } };
            }
            return { success: false, message: 'Failed to update bill item' };
        } catch (error) {
            console.error('Error updating bill item:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteBillItem(itemId, user) {
        try {
            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Only RECEPTIONIST can delete bill items' };
            }

            const item = await BillRepository.getBillItemById(itemId);
            if (!item) {
                return { success: false, message: 'Bill item not found' };
            }

            const bill = await BillRepository.getBillById(item.bill_id);
            if (!bill) {
                return { success: false, message: 'Bill not found' };
            }

            if (bill.status === 'COMPLETED') {
                return { success: false, message: 'Cannot delete items from completed bill' };
            }

            const result = await BillRepository.deleteBillItem(itemId);
            if (result) {
                const updatedBill = await BillRepository.getBillById(item.bill_id);
                await this.logAudit('DELETE', `BillItem:${itemId}`, user.id, item, null, 'Delete bill item');
                return { success: true, data: updatedBill };
            }
            return { success: false, message: 'Failed to delete bill item' };
        } catch (error) {
            console.error('Error deleting bill item:', error);
            return { success: false, message: error.message };
        }
    }

    async logAudit(actionType, recordId, userId, oldData, newData, description) {
        try {
            await AuditLogRepository.createLog({
                user_id: userId,
                action_type: actionType,
                table_name: 'Bills',
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

export default new BillService();
