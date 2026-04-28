/**
 * AppointmentRequest Routes
 * Handles appointment request CRUD operations
 * Implements BR:
 * - ADMIN approves/rejects requests
 * - RECEPTIONIST and DOCTOR can view pending requests (read only)
 */

import express from 'express';
import AppointmentRequestService from './AppointmentRequest.service.js';
import { success, created, updated, notFound, error } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/appointment-requests - Get all requests
router.get('/', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const { status, action, patient_id, doctor_id } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (action) filters.action = action;
    if (patient_id) filters.patient_id = patient_id;
    if (doctor_id) filters.doctor_id = doctor_id;

    const requests = await AppointmentRequestService.getRequests(req.user, filters);
    return success(res, requests, 'Requests retrieved successfully');
}));

// GET /api/appointment-requests/pending - Get pending requests
router.get('/pending', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const requests = await AppointmentRequestService.getPendingRequests(req.user);
    return success(res, requests, 'Pending requests retrieved successfully');
}));

// GET /api/appointment-requests/:id - Get request by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const request = await AppointmentRequestService.getRequestById(req.params.id, req.user);
    if (!request) {
        return notFound(res, 'Request not found');
    }
    return success(res, request, 'Request retrieved successfully');
}));

// POST /api/appointment-requests - Create new request (RECEPTIONIST, DOCTOR only)
router.post('/', authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'), asyncHandler(async (req, res) => {
    const result = await AppointmentRequestService.createRequest(req.body, req.user);
    if (result.success) {
        return created(res, result.data, 'Request created successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/appointment-requests/:id/approve - Approve request (ADMIN only)
router.patch('/:id/approve', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await AppointmentRequestService.approveRequest(req.params.id, req.user);
    if (result.success) {
        return updated(res, result.data, 'Request approved successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/appointment-requests/:id/reject - Reject request (ADMIN only)
router.patch('/:id/reject', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    const result = await AppointmentRequestService.rejectRequest(req.params.id, req.user, req.body.reason);
    if (result.success) {
        return updated(res, result.data, 'Request rejected successfully');
    }
    return error(res, result.message, 400);
}));

export default router;
