/**
 * Report Service (BUS Layer)
 * Business logic for Report operations
 */

import db from '../../config/db.js';

class ReportService {
    async getRevenueReport(from, to) {
        try {
            let query = `
                SELECT 
                    b.id,
                    b.total_amount,
                    b.status,
                    b.payment_method,
                    b.created_at,
                    CONCAT(p.first_name, ' ', p.last_name) as patient_name
                FROM Bills b
                JOIN Medical_Records mr ON b.medical_record_id = mr.id
                JOIN Patients pa ON mr.patient_id = pa.id
                JOIN Profiles p ON pa.profile_id = p.id
            `;
            
            const params = [];
            if (from && to) {
                query += ' WHERE b.created_at BETWEEN ? AND ?';
                params.push(from, to);
            }
            
            query += ' ORDER BY b.created_at DESC';
            
            const [rows] = await db.query(query, params);
            
            const totalRevenue = rows
                .filter(r => r.status === 'COMPLETED')
                .reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);
            
            return {
                reports: rows,
                summary: {
                    totalBills: rows.length,
                    completedPayments: rows.filter(r => r.status === 'COMPLETED').length,
                    pendingPayments: rows.filter(r => r.status === 'PENDING').length,
                    totalRevenue
                }
            };
        } catch (error) {
            console.error('Error generating revenue report:', error);
            throw error;
        }
    }

    async getAppointmentReport(from, to) {
        try {
            let query = `
                SELECT 
                    a.status,
                    COUNT(*) as count,
                    DATE(a.created_at) as date
                FROM Appointments a
            `;
            
            const params = [];
            if (from && to) {
                query += ' WHERE a.created_at BETWEEN ? AND ?';
                params.push(from, to);
            }
            
            query += ' GROUP BY a.status, DATE(a.created_at) ORDER BY date DESC';
            
            const [rows] = await db.query(query, params);
            
            const total = rows.reduce((sum, r) => sum + r.count, 0);
            
            return {
                reports: rows,
                summary: {
                    total,
                    scheduled: rows.find(r => r.status === 'SCHEDULED')?.count || 0,
                    waiting: rows.find(r => r.status === 'WAITING')?.count || 0,
                    completed: rows.filter(r => r.status === 'COMPLETED').reduce((sum, r) => sum + r.count, 0),
                    cancelled: rows.filter(r => r.status === 'CANCELLED').reduce((sum, r) => sum + r.count, 0)
                }
            };
        } catch (error) {
            console.error('Error generating appointment report:', error);
            throw error;
        }
    }

    async getDoctorReport() {
        try {
            const [rows] = await db.query(`
                SELECT 
                    d.id,
                    CONCAT(p.first_name, ' ', p.last_name) as doctor_name,
                    s.name as specialty_name,
                    COUNT(a.id) as total_appointments,
                    COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as completed_appointments
                FROM Doctors d
                JOIN Profiles p ON d.profile_id = p.id
                LEFT JOIN Specialties s ON d.specialty_id = s.id
                LEFT JOIN Appointments a ON d.id = a.doctor_id
                GROUP BY d.id, p.first_name, p.last_name, s.name
                ORDER BY total_appointments DESC
            `);
            
            return { reports: rows };
        } catch (error) {
            console.error('Error generating doctor report:', error);
            throw error;
        }
    }

    async getDashboardSummary() {
        try {
            const [[patientCount]] = await db.query('SELECT COUNT(*) as count FROM Patients');
            const [[doctorCount]] = await db.query('SELECT COUNT(*) as count FROM Doctors');
            const [[todayAppointmentCount]] = await db.query(
                'SELECT COUNT(*) as count FROM Appointments WHERE DATE(created_at) = CURDATE()'
            );
            const [[pendingBillCount]] = await db.query(
                'SELECT COUNT(*) as count FROM Bills WHERE status = \'PENDING\''
            );
            const [[todayRevenue]] = await db.query(`
                SELECT COALESCE(SUM(total_amount), 0) as total 
                FROM Bills 
                WHERE status = 'COMPLETED' AND DATE(created_at) = CURDATE()
            `);
            
            return {
                patients: patientCount.count,
                doctors: doctorCount.count,
                todayAppointments: todayAppointmentCount.count,
                pendingBills: pendingBillCount.count,
                todayRevenue: parseFloat(todayRevenue.total)
            };
        } catch (error) {
            console.error('Error generating dashboard summary:', error);
            throw error;
        }
    }
}

export default new ReportService();
