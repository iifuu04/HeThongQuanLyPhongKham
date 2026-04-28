/**
 * Report Routes
 * Handles report generation
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
router.get('/revenue', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const report = await ReportService.getRevenueReport(from, to);
    return success(res, report, 'Revenue report retrieved successfully');
}));

// GET /api/reports/appointments - Get appointment statistics
router.get('/appointments', authorizeRoles('ADMIN', 'DOCTOR'), asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const report = await ReportService.getAppointmentReport(from, to);
    return success(res, report, 'Appointment report retrieved successfully');
}));

// GET /api/reports/doctors - Get doctor statistics
router.get('/doctors', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const report = await ReportService.getDoctorReport();
    return success(res, report, 'Doctor report retrieved successfully');
}));

// GET /api/reports/dashboard - Get dashboard summary
router.get('/dashboard', authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const report = await ReportService.getDashboardSummary();
    return success(res, report, 'Dashboard summary retrieved successfully');
}));

export default router;
