/**
 * Report Routes
 * Handles report generation
 * 
 * Permission Matrix (SRS):
 * - ADMIN: full access (revenue, appointments, doctors, dashboard)
 * - DOCTOR: dashboard only
 * - RECEPTIONIST: dashboard only
 */

import express from 'express';
import ReportService from './Report.service.js';
import { success, error } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/reports/revenue - Get revenue report
// ADMIN only
router.get('/revenue', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const report = await ReportService.getRevenueReport(from, to);
    return success(res, report, 'Lấy báo cáo doanh thu thành công');
}));

// GET /api/reports/appointments - Get appointment statistics
// ADMIN only
router.get('/appointments', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const report = await ReportService.getAppointmentReport(from, to);
    return success(res, report, 'Lấy báo cáo lịch hẹn thành công');
}));

// GET /api/reports/doctors - Get doctor statistics
// ADMIN only
router.get('/doctors', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const report = await ReportService.getDoctorReport();
    return success(res, report, 'Lấy báo cáo bác sĩ thành công');
}));

// GET /api/reports/dashboard - Get dashboard summary
// ALL roles can view (ADMIN, DOCTOR, RECEPTIONIST, PATIENT)
router.get('/dashboard', asyncHandler(async (req, res) => {
    const report = await ReportService.getDashboardSummary();
    return success(res, report, 'Lấy tổng quan dashboard thành công');
}));

export default router;
