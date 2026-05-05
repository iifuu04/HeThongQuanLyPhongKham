/**
 * Report Service (BUS Layer)
 * Business logic for Report operations
 * All methods use raw SQL COUNT/SUM for dashboard
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
                query += ' WHERE DATE(b.created_at) BETWEEN ? AND ?';
                params.push(from, to);
            }
            
            query += ' ORDER BY b.created_at DESC';
            
            const [rows] = await db.query(query, params);
            
            const totalRevenue = (rows || [])
                .filter(r => r.status === 'COMPLETED')
                .reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);
            
            return {
                reports: rows || [],
                summary: {
                    totalBills: rows ? rows.length : 0,
                    completedPayments: rows ? rows.filter(r => r.status === 'COMPLETED').length : 0,
                    pendingPayments: rows ? rows.filter(r => r.status === 'PENDING').length : 0,
                    totalRevenue
                }
            };
        } catch (error) {
            console.error('Error generating revenue report:', error);
            return {
                reports: [],
                summary: {
                    totalBills: 0,
                    completedPayments: 0,
                    pendingPayments: 0,
                    totalRevenue: 0
                }
            };
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
                query += ' WHERE DATE(a.created_at) BETWEEN ? AND ?';
                params.push(from, to);
            }
            
            query += ' GROUP BY a.status, DATE(a.created_at) ORDER BY date DESC';
            
            const [rows] = await db.query(query, params);
            
            const total = rows ? rows.reduce((sum, r) => sum + r.count, 0) : 0;
            
            return {
                reports: rows || [],
                summary: {
                    total,
                    scheduled: rows ? (rows.find(r => r.status === 'SCHEDULED')?.count || 0) : 0,
                    waiting: rows ? (rows.find(r => r.status === 'WAITING')?.count || 0) : 0,
                    completed: rows ? rows.filter(r => r.status === 'COMPLETED').reduce((sum, r) => sum + r.count, 0) : 0,
                    cancelled: rows ? rows.filter(r => r.status === 'CANCELLED').reduce((sum, r) => sum + r.count, 0) : 0
                }
            };
        } catch (error) {
            console.error('Error generating appointment report:', error);
            return {
                reports: [],
                summary: {
                    total: 0,
                    scheduled: 0,
                    waiting: 0,
                    completed: 0,
                    cancelled: 0
                }
            };
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
            
            return { reports: rows || [] };
        } catch (error) {
            console.error('Error generating doctor report:', error);
            return { reports: [] };
        }
    }

    /**
     * Dashboard Summary - uses raw SQL COUNT/SUM for performance
     * No fetching lists, all aggregated with SQL
     */
    async getDashboardSummary() {
        try {
            // Execute all queries in parallel using Promise.all
            const [
                activeAccountsResult,
                activeDoctorsResult,
                pendingRequestsResult,
                activePatientsResult,
                todayAppointmentsResult,
                pendingBillsResult,
                todayRevenueResult
            ] = await Promise.all([
                // Active accounts (excluding PATIENT role)
                db.query(`SELECT COUNT(*) as count FROM Profiles WHERE role != 'PATIENT' AND (is_deleted = 0 OR is_deleted IS NULL OR is_deleted = FALSE)`),
                
                // Active doctors - JOIN Doctors with Profiles where role=DOCTOR
                db.query(`
                    SELECT COUNT(*) as count 
                    FROM Doctors d
                    JOIN Profiles p ON d.profile_id = p.id
                    WHERE p.role = 'DOCTOR' AND (p.is_deleted = 0 OR p.is_deleted IS NULL OR p.is_deleted = FALSE)
                `),
                
                // Pending appointment requests
                db.query(`SELECT COUNT(*) as count FROM Appointment_Request WHERE status = 'PENDING'`),
                
                // Active patients
                db.query(`SELECT COUNT(*) as count FROM Profiles WHERE role = 'PATIENT' AND (is_deleted = 0 OR is_deleted IS NULL OR is_deleted = FALSE)`),
                
                // Today's appointments (not cancelled)
                db.query(`SELECT COUNT(*) as count FROM Appointments WHERE DATE(created_at) = CURDATE() AND status != 'CANCELLED'`),
                
                // Pending bills
                db.query(`SELECT COUNT(*) as count FROM Bills WHERE status = 'PENDING'`),
                
                // Today's revenue (COMPLETED bills)
                db.query(`
                    SELECT COALESCE(SUM(total_amount), 0) as total 
                    FROM Bills 
                    WHERE status = 'COMPLETED' AND DATE(created_at) = CURDATE()
                `)
            ]);

            // Extract counts from query results (mysql2 returns [rows, fields])
            const activeAccounts = activeAccountsResult[0]?.[0]?.count || 0;
            const activeDoctors = activeDoctorsResult[0]?.[0]?.count || 0;
            const pendingRequests = pendingRequestsResult[0]?.[0]?.count || 0;
            const activePatients = activePatientsResult[0]?.[0]?.count || 0;
            const todayAppointments = todayAppointmentsResult[0]?.[0]?.count || 0;
            const pendingBills = pendingBillsResult[0]?.[0]?.count || 0;
            const todayRevenue = parseFloat(todayRevenueResult[0]?.[0]?.total || 0);

            return {
                activeAccounts,
                activeDoctors,
                pendingRequests,
                activePatients,
                todayAppointments,
                pendingBills,
                todayRevenue
            };
        } catch (error) {
            console.error('Error generating dashboard summary:', error);
            // Return default values instead of throwing to prevent crash
            return {
                activeAccounts: 0,
                activeDoctors: 0,
                pendingRequests: 0,
                activePatients: 0,
                todayAppointments: 0,
                pendingBills: 0,
                todayRevenue: 0
            };
        }
    }
}

export default new ReportService();
