// Bill.repository.js
// Schema: Bills(id INT, medical_record_id INT UNIQUE, total_amount DECIMAL, created_at DATE, updated_at DATE, updated_by INT, payment_method ENUM, status ENUM)
// Schema: Bill_Items(id INT, bill_id INT, service_id INT, quantity INT, price DECIMAL)
// Join: Bills + Medical_Records + Patients + Profiles + Doctors + Profiles + Appointments + Work_Schedules + Clinics
//       Bill_Items + Services
import db from '../../config/db.js';

class BillRepository {
    /**
     * Generate a new bill ID
     */
    static async generateBillId() {
        const [rows] = await db.execute(
            `SELECT MAX(CAST(id AS UNSIGNED)) as max_num FROM Bills`
        );
        const maxNum = rows[0].max_num || 0;
        return maxNum + 1;
    }

    /**
     * Create bill with transaction
     * Ensures atomicity when creating bill and setting initial state
     */
    static async createBillWithTransaction(bill) {
        const { medical_record_id, updated_by } = bill;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const billId = await this.generateBillIdWithConnection(connection);

            // Insert bill with status PENDING and total_amount = 0 initially
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

    /**
     * Generate bill ID using existing connection
     */
    static async generateBillIdWithConnection(connection) {
        const [rows] = await connection.execute(
            `SELECT MAX(CAST(id AS UNSIGNED)) as max_num FROM Bills`
        );
        const maxNum = rows[0].max_num || 0;
        return maxNum + 1;
    }

    /**
     * Create bill (simple, no transaction)
     */
    static async createBill(bill) {
        const { medical_record_id, total_amount, status, updated_by } = bill;

        const [result] = await db.execute(
            `INSERT INTO Bills (id, medical_record_id, total_amount, status, created_at, updated_at, updated_by)
             VALUES (?, ?, ?, ?, CURDATE(), CURDATE(), ?)`,
            [await this.generateBillId(), medical_record_id, total_amount || 0, status || 'PENDING', updated_by]
        );

        return result.affectedRows > 0;
    }

    /**
     * Update bill
     */
    static async updateBill(id, bill) {
        const allowedFields = ['total_amount', 'status', 'payment_method'];
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

    /**
     * Update bill status
     */
    static async updateBillStatus(id, status) {
        const [result] = await db.execute(
            `UPDATE Bills SET status = ?, updated_at = CURDATE() WHERE id = ?`,
            [status, id]
        );

        return result.affectedRows > 0;
    }

    /**
     * Get bill by ID with full joins
     */
    static async getBillById(id) {
        const [rows] = await db.execute(
            `SELECT b.*,
                    b.id AS bill_id,
                    mr.id AS medical_record_id,
                    mr.appointment_id,
                    mr.patient_id,
                    mr.doctor_id,
                    pa.id AS patient_id_ref,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    p.email AS patient_email,
                    d.id AS doctor_id_ref,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name,
                    dp.phone AS doctor_phone,
                    mr.diagnosis,
                    mr.prescription,
                    mr.symptoms,
                    mr.result,
                    a.start_time AS appointment_time,
                    a.status AS appointment_status,
                    c.name AS clinic_name,
                    c.location AS clinic_location
             FROM Bills b
             LEFT JOIN Medical_Records mr ON b.medical_record_id = mr.id
             LEFT JOIN Appointments a ON mr.appointment_id = a.id
             LEFT JOIN Patients pa ON mr.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON mr.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             LEFT JOIN Work_Schedules ws ON a.work_schedule_id = ws.id
             LEFT JOIN Clinics c ON ws.clinic_id = c.id
             WHERE b.id = ?`,
            [id]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Get all bills with filters
     */
    static async getBills(filters = {}) {
        let sql = `
            SELECT b.*,
                    b.id AS bill_id,
                    mr.id AS medical_record_id,
                    mr.patient_id,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    d.id AS doctor_id,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name
             FROM Bills b
             LEFT JOIN Medical_Records mr ON b.medical_record_id = mr.id
             LEFT JOIN Patients pa ON mr.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON mr.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             WHERE 1=1
        `;

        const params = [];

        if (filters.status) {
            sql += ` AND b.status = ?`;
            params.push(filters.status);
        }

        if (filters.patient_id) {
            sql += ` AND mr.patient_id = ?`;
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

        return rows || [];
    }

    /**
     * Get bills by patient ID
     */
    static async getBillByPatient(patientId) {
        const [rows] = await db.execute(
            `SELECT b.*,
                    b.id AS bill_id,
                    mr.id AS medical_record_id,
                    mr.patient_id,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.phone AS patient_phone,
                    d.id AS doctor_id,
                    dp.first_name AS doctor_first_name,
                    dp.last_name AS doctor_last_name
             FROM Bills b
             LEFT JOIN Medical_Records mr ON b.medical_record_id = mr.id
             LEFT JOIN Patients pa ON mr.patient_id = pa.id
             LEFT JOIN Profiles p ON pa.profile_id = p.id
             LEFT JOIN Doctors d ON mr.doctor_id = d.id
             LEFT JOIN Profiles dp ON d.profile_id = dp.id
             WHERE mr.patient_id = ?
             ORDER BY b.created_at DESC`,
            [patientId]
        );

        return rows || [];
    }

    /**
     * Get bill by medical record ID
     */
    static async getBillByMedicalRecord(medicalRecordId) {
        const [rows] = await db.execute(
            `SELECT * FROM Bills WHERE medical_record_id = ?`,
            [medicalRecordId]
        );

        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Calculate total amount from bill_items
     * SUM(quantity * price)
     */
    static async calculateTotalAmount(billId) {
        const [sumRows] = await db.execute(
            `SELECT COALESCE(SUM(quantity * price), 0) AS total_amount
             FROM Bill_Items
             WHERE bill_id = ?`,
            [billId]
        );

        const totalAmount = Number(sumRows[0].total_amount || 0);

        await db.execute(
            `UPDATE Bills SET total_amount = ?, updated_at = CURDATE() WHERE id = ?`,
            [totalAmount, billId]
        );

        return totalAmount;
    }

    /**
     * Get bill full detail with items
     */
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

    /**
     * Confirm payment - sets status to COMPLETED
     * Only works if current status is PENDING
     */
    static async confirmPayment(billId, paymentMethod, staffId) {
        const [result] = await db.execute(
            `UPDATE Bills
             SET status = 'COMPLETED', updated_by = ?, updated_at = CURDATE(), payment_method = ?
             WHERE id = ? AND status = 'PENDING'`,
            [staffId, paymentMethod, billId]
        );

        return result.affectedRows > 0;
    }

    /**
     * Check if medical record has been paid
     */
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

    /**
     * Check if bill exists for medical record
     */
    static async checkBillExistsForMedicalRecord(medicalRecordId) {
        const [result] = await db.execute(
            `SELECT id FROM Bills WHERE medical_record_id = ?`,
            [medicalRecordId]
        );

        return result.length > 0;
    }

    // =====================
    // BILL ITEMS
    // =====================

    /**
     * Add bill item with transaction
     * Automatically calculates and updates total_amount
     */
    static async addBillItemWithTransaction(item) {
        const { bill_id, service_id, quantity, price } = item;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Get service price if not provided
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

            // Insert bill item
            const [insertResult] = await connection.execute(
                `INSERT INTO Bill_Items (bill_id, service_id, quantity, price)
                 VALUES (?, ?, ?, ?)`,
                [bill_id, service_id, quantity || 1, unitPrice]
            );

            if (insertResult.affectedRows === 0) {
                throw new Error('Failed to add bill item');
            }

            // Recalculate total amount
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

    /**
     * Add bill item (simple, no transaction)
     */
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

    /**
     * Update bill item
     */
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

    /**
     * Delete bill item
     */
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

    /**
     * Get all items for a bill with service details
     */
    static async getBillItems(billId) {
        const [rows] = await db.execute(
            `SELECT bi.*,
                    bi.id AS bill_item_id,
                    s.name AS service_name,
                    s.price AS service_price,
                    (bi.quantity * bi.price) AS line_total
             FROM Bill_Items bi
             LEFT JOIN Services s ON bi.service_id = s.id
             WHERE bi.bill_id = ?`,
            [billId]
        );

        return rows || [];
    }

    /**
     * Get bill item by ID
     */
    static async getBillItemById(id) {
        const [rows] = await db.execute(
            `SELECT bi.*,
                    bi.id AS bill_item_id,
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

    /**
     * Calculate total amount using existing connection
     */
    static async calculateTotalAmountWithConnection(connection, billId) {
        const [sumRows] = await connection.execute(
            `SELECT COALESCE(SUM(quantity * price), 0) AS total_amount
             FROM Bill_Items
             WHERE bill_id = ?`,
            [billId]
        );

        const totalAmount = Number(sumRows[0].total_amount || 0);

        await connection.execute(
            `UPDATE Bills SET total_amount = ?, updated_at = CURDATE() WHERE id = ?`,
            [totalAmount, billId]
        );

        return totalAmount;
    }
}

export default BillRepository;
