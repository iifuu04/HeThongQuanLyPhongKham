/**
 * Bill Routes
 * Handles bill and bill items CRUD operations
 * UC16, UC17: Bill and Payment Management
 * Implements BR:
 * - RECEPTIONIST creates bill after medical_record is completed
 * - Each medical_record has one bill
 * - Patient can view their own bills
 * - RECEPTIONIST and ADMIN can view all bills
 */

import express from 'express';
import BillService from './Bill.service.js';
import { success, created, updated, notFound, error } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/bills - Get all bills
router.get('/', authorizeRoles('ADMIN', 'RECEPTIONIST', 'PATIENT'), asyncHandler(async (req, res) => {
    const { status, patient_id, from_date, to_date } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (patient_id) filters.patient_id = patient_id;
    if (from_date) filters.from_date = from_date;
    if (to_date) filters.to_date = to_date;

    const bills = await BillService.getAllBills(req.user, filters);
    return success(res, bills, 'Bills retrieved successfully');
}));

// GET /api/bills/:id - Get bill by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const bill = await BillService.getBillById(req.params.id, req.user);
    if (!bill) {
        return notFound(res, 'Bill not found');
    }
    return success(res, bill, 'Bill retrieved successfully');
}));

// GET /api/bills/:id/detail - Get full bill detail with items
router.get('/:id/detail', asyncHandler(async (req, res) => {
    const detail = await BillService.getBillFullDetail(req.params.id, req.user);
    if (!detail) {
        return notFound(res, 'Bill not found');
    }
    return success(res, detail, 'Bill detail retrieved successfully');
}));

// GET /api/bills/patient/:patientId - Get bills by patient
router.get('/patient/:patientId', authorizeRoles('ADMIN', 'RECEPTIONIST', 'PATIENT'), asyncHandler(async (req, res) => {
    const bills = await BillService.getBillsByPatient(req.params.patientId, req.user);
    return success(res, bills, 'Patient bills retrieved successfully');
}));

// GET /api/bills/:id/items - Get bill items
router.get('/:id/items', asyncHandler(async (req, res) => {
    const items = await BillService.getBillItems(req.params.id, req.user);
    return success(res, items, 'Bill items retrieved successfully');
}));

// POST /api/bills - Create new bill (RECEPTIONIST only)
router.post('/', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await BillService.createBill(req.body, req.user);
    if (result.success) {
        return created(res, result.data, 'Bill created successfully');
    }
    return error(res, result.message, 400);
}));

// PUT /api/bills/:id - Update bill (RECEPTIONIST only)
router.put('/:id', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await BillService.updateBill(req.params.id, req.body, req.user);
    if (result.success) {
        return updated(res, result.data, 'Bill updated successfully');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/bills/:id/pay - Confirm payment (RECEPTIONIST only)
router.patch('/:id/pay', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await BillService.confirmPayment(req.params.id, req.body.paymentMethod, req.user);
    if (result.success) {
        return updated(res, result.data, 'Payment confirmed successfully');
    }
    return error(res, result.message, 400);
}));

// POST /api/bills/:id/items - Add bill item (RECEPTIONIST only)
router.post('/:id/items', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await BillService.addBillItem(req.params.id, req.body, req.user);
    if (result.success) {
        return created(res, result.data, 'Bill item added successfully');
    }
    return error(res, result.message, 400);
}));

// PUT /api/bills/items/:itemId - Update bill item (RECEPTIONIST only)
router.put('/items/:itemId', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await BillService.updateBillItem(req.params.itemId, req.body, req.user);
    if (result.success) {
        return updated(res, result.data, 'Bill item updated successfully');
    }
    return error(res, result.message, 400);
}));

// DELETE /api/bills/items/:itemId - Delete bill item (RECEPTIONIST only)
router.delete('/items/:itemId', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await BillService.deleteBillItem(req.params.itemId, req.user);
    if (result.success) {
        return success(res, result.data, 'Bill item deleted successfully');
    }
    return error(res, result.message, 400);
}));

export default router;
