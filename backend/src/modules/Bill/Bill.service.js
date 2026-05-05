/**
 * Bill Service (BUS Layer)
 * Business logic for Bill and BillItem operations
 * 
 * Implements BR:
 * 1. Only RECEPTIONIST/ADMIN can create bills
 * 2. Each medical_record has one bill (UNIQUE constraint)
 * 3. Bill total is calculated from bill_items: SUM(quantity * price)
 * 4. Confirm payment only once - bill must be PENDING
 * 5. COMPLETED bill cannot be paid again
 * 6. Patient can view their own bills
 */

import BillRepository from './Bill.repository.js';
import MedicalRecordRepository from '../MedicalRecord/MedicalRecord.repository.js';
import AppointmentRepository from '../Appointment/Appointment.repository.js';
import PatientRepository from '../Patient/Patient.repository.js';
import AuditLogRepository from '../AuditLog/AuditLog.repository.js';

class BillService {
    /**
     * Get all bills with role-based filtering
     */
    async getAllBills(user, filters = {}) {
        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient) {
                return [];
            }
            return await BillRepository.getBillByPatient(patient.id);
        }

        if (user.role === 'RECEPTIONIST' || user.role === 'ADMIN' || user.role === 'DOCTOR') {
            return await BillRepository.getBills(filters);
        }

        return [];
    }

    /**
     * Get bill by ID with access control
     */
    async getBillById(id, user) {
        const bill = await BillRepository.getBillById(id);
        if (!bill) {
            return null;
        }

        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || bill.patient_id !== patient.id) {
                return null;
            }
        }

        return bill;
    }

    /**
     * Get bill full detail with items
     */
    async getBillFullDetail(id, user) {
        const bill = await BillRepository.getBillFullDetail(id);
        if (!bill) {
            return null;
        }

        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || bill.patient_id !== patient.id) {
                return null;
            }
        }

        return bill;
    }

    /**
     * Get bills by patient
     */
    async getBillsByPatient(patientId, user) {
        if (user.role === 'PATIENT') {
            const patient = await PatientRepository.getPatientByProfileId(user.id);
            if (!patient || patient.id !== patientId) {
                return [];
            }
        }

        return await BillRepository.getBillByPatient(patientId);
    }

    /**
     * Get bill items
     */
    async getBillItems(billId, user) {
        const bill = await this.getBillById(billId, user);
        if (!bill) {
            return [];
        }

        const items = await BillRepository.getBillItems(billId);
        return items || [];
    }

    /**
     * Create new bill
     * Only RECEPTIONIST/ADMIN can create
     * Each medical_record has only one bill
     * Medical record must be COMPLETED
     */
    async createBill(data, user) {
        try {
            // Only RECEPTIONIST or ADMIN can create bills
            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Chỉ LỄ TÂN hoặc QUẢN TRỊ mới được tạo hóa đơn' };
            }

            const { medical_record_id } = data;

            if (!medical_record_id) {
                return { success: false, message: 'ID bệnh án là bắt buộc' };
            }

            // Verify medical record exists
            const medicalRecord = await MedicalRecordRepository.getMedicalRecordById(medical_record_id);
            if (!medicalRecord) {
                return { success: false, message: 'Bệnh án không tồn tại' };
            }

            // Medical record must be COMPLETED
            if (medicalRecord.status !== 'COMPLETED') {
                return { success: false, message: 'Chỉ có thể tạo hóa đơn cho bệnh án đã hoàn thành' };
            }

            // Check if bill already exists for this medical record
            const existingBill = await BillRepository.getBillByMedicalRecord(medical_record_id);
            if (existingBill) {
                return { success: false, message: 'Đã có hóa đơn cho bệnh án này. Sử dụng hóa đơn hiện có.' };
            }

            // Create bill with transaction
            const result = await BillRepository.createBillWithTransaction({
                medical_record_id,
                updated_by: user.id
            });

            if (result.success) {
                await this.logAudit('CREATE', result.data.id, user.id, null, result.data, 'Tạo hóa đơn');
                return { success: true, data: result.data };
            }

            return { success: false, message: 'Không thể tạo hóa đơn' };
        } catch (error) {
            console.error('Error creating bill:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, message: 'Đã có hóa đơn cho bệnh án này' };
            }
            return { success: false, message: error.message };
        }
    }

    /**
     * Update bill
     * Only RECEPTIONIST/ADMIN can update
     * Cannot update COMPLETED bill
     */
    async updateBill(id, data, user) {
        try {
            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Chỉ LỄ TÂN hoặc QUẢN TRỊ mới được cập nhật hóa đơn' };
            }

            const bill = await BillRepository.getBillById(id);
            if (!bill) {
                return { success: false, message: 'Hóa đơn không tồn tại' };
            }

            // Cannot update COMPLETED bill
            if (bill.status === 'COMPLETED') {
                return { success: false, message: 'Không thể cập nhật hóa đơn đã thanh toán' };
            }

            const result = await BillRepository.updateBill(id, data);
            if (result) {
                const updated = await BillRepository.getBillById(id);
                await this.logAudit('UPDATE', id, user.id, bill, updated, 'Cập nhật hóa đơn');
                return { success: true, data: updated };
            }
            return { success: false, message: 'Không thể cập nhật hóa đơn' };
        } catch (error) {
            console.error('Error updating bill:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Confirm payment
     * Only RECEPTIONIST/ADMIN can confirm
     * Bill must be PENDING
     * Can only confirm once - bill becomes COMPLETED
     */
    async confirmPayment(id, paymentMethod, user) {
        try {
            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Chỉ LỄ TÂN hoặc QUẢN TRỊ mới được xác nhận thanh toán' };
            }

            if (!paymentMethod) {
                return { success: false, message: 'Phương thức thanh toán là bắt buộc' };
            }

            const bill = await BillRepository.getBillById(id);
            if (!bill) {
                return { success: false, message: 'Hóa đơn không tồn tại' };
            }

            // Bill must be PENDING to confirm payment
            if (bill.status === 'COMPLETED') {
                return { success: false, message: 'Hóa đơn đã được thanh toán trước đó' };
            }

            if (bill.status !== 'PENDING') {
                return { success: false, message: 'Trạng thái hóa đơn không hợp lệ để thanh toán' };
            }

            // Confirm payment - only one time
            const result = await BillRepository.confirmPayment(id, paymentMethod, user.id);
            if (result) {
                const updated = await BillRepository.getBillById(id);
                await this.logAudit('PAYMENT', id, user.id, { status: 'PENDING' }, { status: 'COMPLETED', payment_method: paymentMethod }, 'Xác nhận thanh toán');
                return { success: true, data: updated };
            }
            return { success: false, message: 'Không thể xác nhận thanh toán' };
        } catch (error) {
            console.error('Error confirming payment:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Add bill item
     * Only RECEPTIONIST/ADMIN can add
     * Cannot add to COMPLETED bill
     * Updates total_amount automatically
     */
    async addBillItem(billId, data, user) {
        try {
            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Chỉ LỄ TÂN hoặc QUẢN TRỊ mới được thêm dịch vụ' };
            }

            const bill = await BillRepository.getBillById(billId);
            if (!bill) {
                return { success: false, message: 'Hóa đơn không tồn tại' };
            }

            // Cannot add items to COMPLETED bill
            if (bill.status === 'COMPLETED') {
                return { success: false, message: 'Không thể thêm dịch vụ vào hóa đơn đã thanh toán' };
            }

            const { service_id, quantity, price } = data;

            if (!service_id) {
                return { success: false, message: 'ID dịch vụ là bắt buộc' };
            }

            if (!quantity || quantity < 1) {
                return { success: false, message: 'Số lượng phải lớn hơn 0' };
            }

            // Add item with transaction - calculates total_amount
            const result = await BillRepository.addBillItemWithTransaction({
                bill_id: billId,
                service_id,
                quantity: quantity || 1,
                price: price || null
            });

            if (result.success) {
                await this.logAudit('CREATE', `BillItem:${billId}`, user.id, null, data, 'Thêm dịch vụ vào hóa đơn');
                return { success: true, data: result.data };
            }

            return { success: false, message: 'Không thể thêm dịch vụ' };
        } catch (error) {
            console.error('Error adding bill item:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Update bill item
     * Only RECEPTIONIST/ADMIN can update
     * Cannot update in COMPLETED bill
     */
    async updateBillItem(itemId, data, user) {
        try {
            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Chỉ LỄ TÂN hoặc QUẢN TRỊ mới được cập nhật dịch vụ' };
            }

            const item = await BillRepository.getBillItemById(itemId);
            if (!item) {
                return { success: false, message: 'Dịch vụ không tồn tại' };
            }

            const bill = await BillRepository.getBillById(item.bill_id);
            if (!bill) {
                return { success: false, message: 'Hóa đơn không tồn tại' };
            }

            // Cannot update items in COMPLETED bill
            if (bill.status === 'COMPLETED') {
                return { success: false, message: 'Không thể cập nhật dịch vụ trong hóa đơn đã thanh toán' };
            }

            const result = await BillRepository.updateBillItem(itemId, data);
            if (result) {
                const updated = await BillRepository.getBillItemById(itemId);
                const updatedBill = await BillRepository.getBillById(item.bill_id);
                await this.logAudit('UPDATE', `BillItem:${itemId}`, user.id, item, updated, 'Cập nhật dịch vụ');
                return { success: true, data: { bill: updatedBill, item: updated } };
            }
            return { success: false, message: 'Không thể cập nhật dịch vụ' };
        } catch (error) {
            console.error('Error updating bill item:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Delete bill item
     * Only RECEPTIONIST/ADMIN can delete
     * Cannot delete from COMPLETED bill
     */
    async deleteBillItem(itemId, user) {
        try {
            if (user.role !== 'RECEPTIONIST' && user.role !== 'ADMIN') {
                return { success: false, message: 'Chỉ LỄ TÂN hoặc QUẢN TRỊ mới được xóa dịch vụ' };
            }

            const item = await BillRepository.getBillItemById(itemId);
            if (!item) {
                return { success: false, message: 'Dịch vụ không tồn tại' };
            }

            const bill = await BillRepository.getBillById(item.bill_id);
            if (!bill) {
                return { success: false, message: 'Hóa đơn không tồn tại' };
            }

            // Cannot delete items from COMPLETED bill
            if (bill.status === 'COMPLETED') {
                return { success: false, message: 'Không thể xóa dịch vụ khỏi hóa đơn đã thanh toán' };
            }

            const result = await BillRepository.deleteBillItem(itemId);
            if (result) {
                const updatedBill = await BillRepository.getBillById(item.bill_id);
                await this.logAudit('DELETE', `BillItem:${itemId}`, user.id, item, null, 'Xóa dịch vụ khỏi hóa đơn');
                return { success: true, data: updatedBill };
            }
            return { success: false, message: 'Không thể xóa dịch vụ' };
        } catch (error) {
            console.error('Error deleting bill item:', error);
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