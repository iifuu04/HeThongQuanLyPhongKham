/**
 * Report Controller
 * Handles HTTP request/response for Report operations
 */

import { success, error } from '../../utils/response.js';
import ReportService from './Report.service.js';

export class ReportController {
    static async getRevenue(req, res, next) {
        try {
            const { from, to } = req.query;
            const report = await ReportService.getRevenueReport(from, to);
            return success(res, report, 'Revenue report retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getAppointments(req, res, next) {
        try {
            const { from, to } = req.query;
            const report = await ReportService.getAppointmentReport(from, to);
            return success(res, report, 'Appointment report retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getDoctors(req, res, next) {
        try {
            const report = await ReportService.getDoctorReport();
            return success(res, report, 'Doctor report retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getDashboard(req, res, next) {
        try {
            const report = await ReportService.getDashboardSummary();
            return success(res, report, 'Dashboard summary retrieved successfully');
        } catch (err) {
            next(err);
        }
    }
}

export default ReportController;
