// Bill.repository.js
import db from '../../config/db.js';

class BillRepository {
    static async generateBillId() {
        const [rows] = await db.execute(
            `SELECT MAX(CAST(id AS UNSIGNED)) as max_num FROM Bills`
        );
        const maxNum = rows[0].max_num || 0;
        return maxNum + 1;
    }

    static async generateBillItemId() {
        const [rows] = await db.execute(
            `SELECT MAX(CAST(id AS UNSIGNED)) as max_num FROM Bill_Items`
        );
        const maxNum = rows[0].max_num || 0;
        return maxNum + 1;
    }

    static async createBillWithTransaction(bill) {
        const { medical_record_id, updated_by } = bill;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const billId = await this.generateBillId();

            const [insertResult] = await connection.execute(
                `INSERT INTO Bills (id, medical_record_id, total_amount, status, created_at, updated_at, updated_by)
                 VALUES (?, ?, 0, 'PENDING', CURDATE(), CURDATE(), ?)`,
                [billId, medical_record_id, updated_by]
            );

            if (insertResult.affectedRows === 0) {
                throw new Error('Failed to create bill');
            }

            await connection.commit();

            const created = await this.getBillById(billId);
            return { success: true, data: created };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async createBill(bill) {
        const { medical_record_id, total_amount, status, updated_by } = bill;

        const [result] = await db.execute(
            `INSERT INTO Bills (id, medical_record_id, total_amount, status, created_at, updated_at, updated_by)
             VALUES (?, ?, ?, ?, CURDATE(), CURDATE(), ?)`,
            [await this.generateBillId(), medical_record_id, total_amount || 0, status || 'PENDING', updated_by]
        );

        return result.affectedRows > 0;
    }

    static async updateBill(id, bill) {
        const allowedFields = ['total_amount', 'status', 'payment_method', 'payment_date'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(bill)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return false;

        fields.push('updated_at = CURDATE()');
        const sql = `UPDATE Bills SET ${fields.join(', ')} WHERE id = ?`;
        values.push(id);

        const [result] = await db.execute(sql, values);

        return result.affectedRows > 0;
    }

    static async updateBillStatus(id, status) {
        const [result] = await db.execute(
            `UPDATE Bills SET status = ?, updated_at = CURDATE() WHERE id = ?`,
            [status, id]
        );

        return result.affectedRows > 0;
    }

    static async getBillById(id) {
        const [rows] = await db.execute(
            `SELECT b.*,
                    mr.id AS medical_record_id_ref,
                    pat.id AS patient_id_ref,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    doc.id AS doctor_id_ref,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    mr.diagnosis,
                    mr.prescription,
                    a.start_time AS appointment_time,
                    c.name AS clinic_name
             FROM Bills b
             LEFT JOIN Medical_Records mr ON b.medical_record_id = mr.id
             LEFT JOIN Appointments a ON mr.appointment_id = a.id
             LEFT JOIN Patients pat ON mr.patient_id = pat.id
             LEFT JOIN Profiles p ON pat.profile_id = p.id
             LEFT JOIN Doctors doc ON mr.doctor_id = doc.id
             LEFT JOIN Profiles dp ON doc.profile_id = dp.id
             LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
             LEFT JOIN Clinics c ON ws.clinic_id = c.id
             WHERE b.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async getBills(filters = {}) {
        let sql = `
            SELECT b.*,
                    mr.id AS medical_record_id_ref,
                    pat.id AS patient_id_ref,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    doc.id AS doctor_id_ref,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name
             FROM Bills b
             LEFT JOIN Medical_Records mr ON b.medical_record_id = mr.id
             LEFT JOIN Patients pat ON mr.patient_id = pat.id
             LEFT JOIN Profiles p ON pat.profile_id = p.id
             LEFT JOIN Doctors doc ON mr.doctor_id = doc.id
             LEFT JOIN Profiles dp ON doc.profile_id = dp.id
             WHERE 1=1
        `;

        const params = [];

        if (filters.status) {
            sql += ` AND b.status = ?`;
            params.push(filters.status);
        }

        if (filters.patient_id) {
            sql += ` AND pat.id = ?`;
            params.push(filters.patient_id);
        }

        if (filters.from_date) {
            sql += ` AND DATE(b.created_at) >= ?`;
            params.push(filters.from_date);
        }

        if (filters.to_date) {
            sql += ` AND DATE(b.created_at) <= ?`;
            params.push(filters.to_date);
        }

        sql += ` ORDER BY b.created_at DESC`;

        const [rows] = await db.execute(sql, params);

        return rows;
    }

    static async getBillByPatient(patientId) {
        const [rows] = await db.execute(
            `SELECT b.*,
                    mr.id AS medical_record_id_ref,
                    pat.id AS patient_id_ref,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    doc.id AS doctor_id_ref,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name
             FROM Bills b
             LEFT JOIN Medical_Records mr ON b.medical_record_id = mr.id
             LEFT JOIN Patients pat ON mr.patient_id = pat.id
             LEFT JOIN Profiles p ON pat.profile_id = p.id
             LEFT JOIN Doctors doc ON mr.doctor_id = doc.id
             LEFT JOIN Profiles dp ON doc.profile_id = dp.id
             WHERE pat.id = ?
             ORDER BY b.created_at DESC`,
            [patientId]
        );

        return rows;
    }

    static async getBillByMedicalRecord(medicalRecordId) {
        const [rows] = await db.execute(
            `SELECT * FROM Bills WHERE medical_record_id = ?`,
            [medicalRecordId]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async calculateTotalAmount(billId) {
        const [sumRows] = await db.execute(
            `SELECT COALESCE(SUM(quantity * price), 0) AS total_amount
             FROM Bill_Items
             WHERE bill_id = ?`,
            [billId]
        );

        const totalAmount = Number(sumRows[0].total_amount || 0);

        await db.execute(
            `UPDATE Bills SET total_amount = ?, updated_at = NOW() WHERE id = ?`,
            [totalAmount, billId]
        );

        return totalAmount;
    }

    static async getBillFullDetail(billId) {
        const bill = await this.getBillById(billId);
        if (!bill) return null;

        const items = await this.getBillItems(billId);

        return {
            ...bill,
            items: items || [],
            item_count: items ? items.length : 0
        };
    }

    static async confirmPayment(billId, paymentMethod, staffId) {
        const [result] = await db.execute(
            `UPDATE Bills
             SET status = 'COMPLETED', updated_by = ?, updated_at = NOW(), payment_method = ?, payment_date = NOW()
             WHERE id = ? AND status = 'PENDING'`,
            [staffId, paymentMethod, billId]
        );

        return result.affectedRows > 0;
    }

    static async hasBillBeenPaid(medicalRecordId) {
        const [result] = await db.execute(
            `SELECT status FROM Bills WHERE medical_record_id = ? LIMIT 1`,
            [medicalRecordId]
        );

        if (result.length === 0) {
            return false;
        }

        return result[0].status === 'COMPLETED';
    }

    static async checkBillExistsForMedicalRecord(medicalRecordId) {
        const [result] = await db.execute(
            `SELECT id FROM Bills WHERE medical_record_id = ?`,
            [medicalRecordId]
        );

        return result.length > 0;
    }

    // Bill Items
    static async addBillItemWithTransaction(item) {
        const { bill_id, service_id, quantity, price } = item;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            let unitPrice = price;
            if (unitPrice == null) {
                const [serviceRows] = await connection.execute(
                    `SELECT price FROM Services WHERE id = ?`,
                    [service_id]
                );

                if (serviceRows.length === 0) {
                    throw new Error('Service not found');
                }

                unitPrice = serviceRows[0].price;
            }

            const [insertResult] = await connection.execute(
                `INSERT INTO Bill_Items (bill_id, service_id, quantity, price)
                 VALUES (?, ?, ?, ?)`,
                [bill_id, service_id, quantity || 1, unitPrice]
            );

            if (insertResult.affectedRows === 0) {
                throw new Error('Failed to add bill item');
            }

            await this.calculateTotalAmountWithConnection(connection, bill_id);

            await connection.commit();

            const items = await this.getBillItems(bill_id);
            const updatedBill = await this.getBillById(bill_id);

            return { success: true, data: { bill: updatedBill, items } };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async addBillItem(item) {
        const { bill_id, service_id, quantity, price } = item;

        let unitPrice = price;
        if (unitPrice == null) {
            const [serviceRows] = await db.execute(
                `SELECT price FROM Services WHERE id = ?`,
                [service_id]
            );

            if (serviceRows.length === 0) {
                return false;
            }

            unitPrice = serviceRows[0].price;
        }

        const [result] = await db.execute(
            `INSERT INTO Bill_Items (bill_id, service_id, quantity, price)
             VALUES (?, ?, ?, ?)`,
            [bill_id, service_id, quantity || 1, unitPrice]
        );

        if (result.affectedRows > 0) {
            await this.calculateTotalAmount(bill_id);
            return true;
        }

        return false;
    }

    static async updateBillItem(id, item) {
        const [existingRows] = await db.execute(
            `SELECT bill_id, service_id, quantity, price FROM Bill_Items WHERE id = ?`,
            [id]
        );

        if (existingRows.length === 0) {
            return false;
        }

        const existing = existingRows[0];
        const newServiceId = item.service_id ?? existing.service_id;
        const newQuantity = item.quantity ?? existing.quantity;

        let newPrice = item.price;
        if (newPrice == null) {
            if (item.service_id != null && item.service_id !== existing.service_id) {
                const [serviceRows] = await db.execute(
                    `SELECT price FROM Services WHERE id = ?`,
                    [newServiceId]
                );

                if (serviceRows.length === 0) {
                    return false;
                }

                newPrice = serviceRows[0].price;
            } else {
                newPrice = existing.price;
            }
        }

        const [result] = await db.execute(
            `UPDATE Bill_Items SET service_id = ?, quantity = ?, price = ? WHERE id = ?`,
            [newServiceId, newQuantity, newPrice, id]
        );

        if (result.affectedRows > 0) {
            await this.calculateTotalAmount(existing.bill_id);
            return true;
        }

        return false;
    }

    static async deleteBillItem(id) {
        const [existingRows] = await db.execute(
            `SELECT bill_id FROM Bill_Items WHERE id = ?`,
            [id]
        );

        if (existingRows.length === 0) {
            return false;
        }

        const billId = existingRows[0].bill_id;
        const [result] = await db.execute(
            `DELETE FROM Bill_Items WHERE id = ?`,
            [id]
        );

        if (result.affectedRows > 0) {
            await this.calculateTotalAmount(billId);
            return true;
        }

        return false;
    }

    static async getBillItems(billId) {
        const [rows] = await db.execute(
            `SELECT bi.*,
                    s.name AS service_name,
                    s.description AS service_description,
                    (bi.quantity * bi.price) AS line_total
             FROM Bill_Items bi
             LEFT JOIN Services s ON bi.service_id = s.id
             WHERE bi.bill_id = ?`,
            [billId]
        );

        return rows;
    }

    static async getBillItemById(id) {
        const [rows] = await db.execute(
            `SELECT bi.*,
                    s.name AS service_name,
                    s.price AS service_price,
                    (bi.quantity * bi.price) AS line_total
             FROM Bill_Items bi
             LEFT JOIN Services s ON bi.service_id = s.id
             WHERE bi.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    static async calculateTotalAmountWithConnection(connection, billId) {
        const [sumRows] = await connection.execute(
            `SELECT COALESCE(SUM(quantity * price), 0) AS total_amount
             FROM Bill_Items
             WHERE bill_id = ?`,
            [billId]
        );

        const totalAmount = Number(sumRows[0].total_amount || 0);

        await connection.execute(
            `UPDATE Bills SET total_amount = ? WHERE id = ?`,
            [totalAmount, billId]
        );

        return totalAmount;
    }
}

export default BillRepository;
