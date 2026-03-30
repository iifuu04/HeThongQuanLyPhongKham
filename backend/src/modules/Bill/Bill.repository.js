// Bill.repository.js
import db from './../../config/db.js'

class Bill {
    // Bill
    static async createBill(bill) {
        const {medicalRecordId, totalAmount, updated_by, status} = bill;

        const [result] = await db.execute(
            `INSERT INTO Bills (medical_record_id, total_amount, created_at, updated_at, updated_by, status)
            VALUES (?, ?, NOW(), NOW(), ?, ?)`,
            [medicalRecordId, totalAmount, updated_by, status]
        );

        return result.affectedRows > 0;
    }

    static async updateBillStatus(id, status) {
        const [result] = await db.execute(
            `UPDATE Bills 
            SET status = ?, updated_at = NOW()
            WHERE id = ?`,
            [status, id]
        );

        return result.affectedRows > 0;
    }

    static async getBillById(id) {
        const [result] = await db.execute(
            `SELECT 
                id,
                medical_record_id,
                total_amount,
                created_at,
                updated_at,
                updated_by,
                status
            FROM Bills
            WHERE id = ?`,
            [id]
        );

        return result.length > 0 ? result[0] : null;
    }

    static async getBills() {
        const [result] = await db.execute(
            `SELECT 
                id,
                medical_record_id,
                total_amount,
                created_at,
                updated_at,
                updated_by,
                status
            FROM Bills`
        );

        return result.length > 0 ? result : null;
    }

    static async getBillByPatient(patientId) {
        const [result] = await db.execute(
            `SELECT 
                b.id,
                b.medical_record_id,
                b.total_amount,
                b.created_at,
                b.updated_at,
                b.updated_by,
                b.status
            FROM Bills b
            JOIN Medical_Records mr
                ON b.medical_record_id = mr.id
            WHERE mr.patient_id = ?`,
            [patientId]
        );

        return result.length > 0 ? result : null;
    }

    static async getBillByMedicalRecord(medicalRecordId) {
        const [result] = await db.execute(
            `SELECT 
                id,
                medical_record_id,
                total_amount,
                created_at,
                updated_at,
                updated_by,
                status
            FROM Bills
            WHERE medical_record_id = ?`,
            [medicalRecordId]
        );

        return result.length > 0 ? result[0] : null;
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
            `UPDATE Bills
            SET total_amount = ?, updated_at = NOW()
            WHERE id = ?`,
            [totalAmount, billId]
        );

        return totalAmount;
    }

    static async getBillFullDetail(billId) {
        const sql = `
        WITH patient_profile AS (
            SELECT 
                mr.id                                       AS id,
                mr.patient_id                               AS patient_id,
                CONCAT(p.first_name, ' ', p.last_name)      AS patient_name
            FROM Medical_Records mr
            JOIN Bills    b     ON mr.id = b.medical_record_id
            JOIN Patients pa    ON mr.patient_id = pa.id
            JOIN Profiles p     ON pa.profile_id = p.id
            WHERE b.id = :billId
        ),
        
        doctor_profile AS (
            SELECT 
                mr.id                                       AS id,
                mr.doctor_id                                AS doctor_id,
                CONCAT(p.first_name, ' ', p.last_name)      AS doctor_name
            FROM Medical_Records mr
            JOIN Bills    b     ON mr.id = b.medical_record_id
            JOIN Doctors  d     ON mr.doctor_id = d.id
            JOIN Profiles p     ON d.profile_id = p.id
            WHERE b.id = :billId
        ),

        service_used AS (
            SELECT 
                bi.id                   AS bill_item_id,
                bi.bill_id              AS bill_id,
                s.name                  AS service_name,
                s.price                 AS service_price,
                bi.quantity             AS quantity,
                s.price * bi.quantity   AS line_total 
            FROM Bill_Items bi
            JOIN Services s     ON bi.service_id = s.id
            WHERE bi.bill_id = :billId
        )
        
        SELECT 
            b.id                        AS bill_id,
            b.medical_record_id         AS medical_record_id,
            b.total_amount              AS total_amount,
            b.created_at                AS created_at,
            b.updated_at                AS updated_at,
            b.updated_by                AS updated_by,
            b.status                    AS status,

            pp.patient_id               AS patient_id,
            pp.patient_name             AS patient_name,

            d.doctor_id                 AS doctor_id,
            d.doctor_name               AS doctor_name,

            su.bill_item_id             AS bill_item_id,
            su.service_name             AS service_name,
            su.quantity                 AS quantity,
            su.service_price            AS price,
            su.line_total               AS line_total
        FROM Bills b
        JOIN Medical_Records        mr     ON b.medical_record_id = mr.id
        LEFT JOIN service_used      su     ON b.id = su.bill_id
        LEFT JOIN patient_profile   pp     ON mr.id = pp.id
        LEFT JOIN doctor_profile    d      ON mr.id = d.id
        WHERE b.id = :billId`

        const [rows] = await db.query(sql, { billId: billId });

        if (rows.length === 0) return null;

        const first = rows[0];
        const details = {
            // thông tin bill
            id: first.bill_id,
            medical_record_id: first.medical_record_id,
            total_amount: first.total_amount,
            created_at: first.created_at,
            updated_at: first.updated_at,
            updated_by: first.updated_by,
            status: first.status,
            // thông tin bệnh nhân, bác sĩ
            patient: {
                id: first.patient_id,
                name: first.patient_name,
            },
            doctor: {
                id: first.doctor_id,
                name: first.doctor_name,
            },
            // các dịch vụ sử dụng
            items: [],
        };

        for (const row of rows) {
            if (!row.bill_item_id) {
                continue;
            }

            details.items.push({
                id: row.bill_item_id,
                service_name: row.service_name,
                quantity: row.quantity,
                price: row.price,
                line_total: row.line_total,
            });
        }

        return details;
    }

    static async confirmPayment(billId, paymentMethod, staffId) {
        const [result] = await db.execute(
            `UPDATE Bills
            SET status = 'COMPLETED', updated_by = ?, updated_at = NOW(), payment_method = ?
            WHERE id = ? AND status = 'PENDING'`,
            [staffId, paymentMethod, billId]
        );

        return result.affectedRows > 0;
    }
    
    static async hasBillBeenPaid(medicalRecordId) {
        const [result] = await db.execute(
            `SELECT status
            FROM Bills
            WHERE medical_record_id = ?
            LIMIT 1`,
            [medicalRecordId]
        );

        if (result.length === 0) {
            return false;
        }

        return result[0].status === 'COMPLETED';
    }


    // Bill Items
    static async addBillItem(item) {
        const {billId, serviceId, quantity = 1, price} = item;

        let unitPrice = price;
        if (unitPrice == null) {
            const [serviceRows] = await db.execute(
                `SELECT price FROM Services WHERE id = ?`,
                [serviceId]
            );

            if (serviceRows.length === 0) {
                return false;
            }

            unitPrice = serviceRows[0].price;
        }

        const [result] = await db.execute(
            `INSERT INTO Bill_Items (bill_id, service_id, quantity, price)
            VALUES (?, ?, ?, ?)`,
            [billId, serviceId, quantity, unitPrice]
        );

        if (result.affectedRows > 0) {
            await this.calculateTotalAmount(billId); // cập nhật tổng tiền trong Bills
            return true;
        }

        return false;
    }

    static async updateBillItem(id, item) {
        const [existingRows] = await db.execute(
            `SELECT bill_id, service_id, quantity, price
            FROM Bill_Items
            WHERE id = ?`,
            [id]
        );

        if (existingRows.length === 0) {
            return false;
        }

        const existing = existingRows[0];
        const newServiceId = item.serviceId ?? existing.service_id;
        const newQuantity = item.quantity ?? existing.quantity;

        let newPrice = item.price;
        if (newPrice == null) {
            if (item.serviceId != null && item.serviceId !== existing.service_id) {
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
            `UPDATE Bill_Items
            SET service_id = ?, quantity = ?, price = ?
            WHERE id = ?`,
            [newServiceId, newQuantity, newPrice, id]
        );

        if (result.affectedRows > 0) {
            await this.calculateTotalAmount(existing.bill_id); // cập nhật lại tổng tiền trong bill khi đổi dịch vụ mới
            return true;
        }

        return false;
    }

    static async deleteBillItem(id) {
        const [existingRows] = await db.execute(
            `SELECT bill_id
            FROM Bill_Items
            WHERE id = ?`,
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

    static async getBillItems(billID) {
        const [result] = await db.execute(
            `SELECT 
                bi.bill_id,
                bi.service_id,
                s.name AS service_name,
                bi.quantity,
                bi.price,
                (bi.quantity * bi.price) AS line_total
            FROM Bill_Items bi
            JOIN Services s
                ON bi.service_id = s.id
            WHERE bi.bill_id = ?`,
            [billID]
        );

        return result.length > 0 ? result : null;
    }

}

export default Bill;