/**
 * Bill Routes
 * Handles bill and bill items CRUD operations
 * 
 * Permission Matrix (SRS):
 * - ADMIN: full access
 * - RECEPTIONIST: create bills, manage items, confirm payment
 * - DOCTOR: read only (view billing for reference)
 * - PATIENT: read own bills only
 * 
 * Implements BR:
 * 1. RECEPTIONIST creates bill after medical_record is completed
 * 2. Each medical_record has one bill
 * 3. Bill total is calculated from bill_items
 * 4. Payment can only be confirmed once - bill becomes COMPLETED
 * 5. COMPLETED bill cannot be paid again
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
// ADMIN, RECEPTIONIST can view all; DOCTOR can view for reference; PATIENT can view own
router.get('/', authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'), asyncHandler(async (req, res) => {
    const { status, patient_id, from_date, to_date } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (patient_id) filters.patient_id = patient_id;
    if (from_date) filters.from_date = from_date;
    if (to_date) filters.to_date = to_date;

    const bills = await BillService.getAllBills(req.user, filters);
    return success(res, bills, 'Lấy danh sách hóa đơn thành công');
}));

// GET /api/bills/:id - Get bill by ID
router.get('/:id', authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'), asyncHandler(async (req, res) => {
    const bill = await BillService.getBillById(req.params.id, req.user);
    if (!bill) {
        return notFound(res, 'Không tìm thấy hóa đơn');
    }
    return success(res, bill, 'Lấy chi tiết hóa đơn thành công');
}));

// GET /api/bills/:id/detail - Get full bill detail with items
router.get('/:id/detail', authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'), asyncHandler(async (req, res) => {
    const detail = await BillService.getBillFullDetail(req.params.id, req.user);
    if (!detail) {
        return notFound(res, 'Không tìm thấy hóa đơn');
    }
    return success(res, detail, 'Lấy chi tiết hóa đơn thành công');
}));

// GET /api/bills/:id/items - Get bill items
router.get('/:id/items', authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'), asyncHandler(async (req, res) => {
    const items = await BillService.getBillItems(req.params.id, req.user);
    return success(res, items, 'Lấy danh sách dịch vụ thành công');
}));

// GET /api/bills/patient/:patientId - Get bills by patient
router.get('/patient/:patientId', authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'), asyncHandler(async (req, res) => {
    const bills = await BillService.getBillsByPatient(req.params.patientId, req.user);
    return success(res, bills, 'Lấy hóa đơn theo bệnh nhân thành công');
}));

// POST /api/bills - Create new bill
// ADMIN, RECEPTIONIST only
router.post('/', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await BillService.createBill(req.body, req.user);
    if (result.success) {
        return created(res, result.data, 'Tạo hóa đơn thành công');
    }
    return error(res, result.message, 400);
}));

// PUT /api/bills/:id - Update bill
// ADMIN, RECEPTIONIST only
router.put('/:id', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await BillService.updateBill(req.params.id, req.body, req.user);
    if (result.success) {
        return updated(res, result.data, 'Cập nhật hóa đơn thành công');
    }
    return error(res, result.message, 400);
}));

// PATCH /api/bills/:id/pay - Confirm payment
// ADMIN, RECEPTIONIST only
router.patch('/:id/pay', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await BillService.confirmPayment(req.params.id, req.body.paymentMethod, req.user);
    if (result.success) {
        return updated(res, result.data, 'Xác nhận thanh toán thành công');
    }
    return error(res, result.message, 400);
}));

// POST /api/bills/:id/items - Add bill item
// ADMIN, RECEPTIONIST only
router.post('/:id/items', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await BillService.addBillItem(req.params.id, req.body, req.user);
    if (result.success) {
        return created(res, result.data, 'Thêm dịch vụ thành công');
    }
    return error(res, result.message, 400);
}));

// PUT /api/bills/items/:itemId - Update bill item
// ADMIN, RECEPTIONIST only
router.put('/items/:itemId', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await BillService.updateBillItem(req.params.itemId, req.body, req.user);
    if (result.success) {
        return updated(res, result.data, 'Cập nhật dịch vụ thành công');
    }
    return error(res, result.message, 400);
}));

// DELETE /api/bills/items/:itemId - Delete bill item
// ADMIN, RECEPTIONIST only
router.delete('/items/:itemId', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    const result = await BillService.deleteBillItem(req.params.itemId, req.user);
    if (result.success) {
        return success(res, result.data, 'Xóa dịch vụ thành công');
    }
    return error(res, result.message, 400);
}));

export default router;
