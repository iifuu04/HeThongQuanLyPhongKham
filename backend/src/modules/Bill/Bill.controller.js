/**
 * Bill Controller
 * Handles HTTP request/response for Bill operations
 */

import { success, created, updated, notFound, error } from '../../utils/response.js';
import BillService from './Bill.service.js';

export class BillController {
    static async getAll(req, res, next) {
        try {
            const bills = await BillService.getAllBills();
            return success(res, bills, 'Bills retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const bill = await BillService.getBillById(req.params.id);
            if (!bill) {
                return notFound(res, 'Bill not found');
            }
            return success(res, bill, 'Bill retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getDetail(req, res, next) {
        try {
            const detail = await BillService.getBillFullDetail(req.params.id);
            if (!detail) {
                return notFound(res, 'Bill not found');
            }
            return success(res, detail, 'Bill detail retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getByPatient(req, res, next) {
        try {
            const bills = await BillService.getBillsByPatient(req.params.patientId);
            return success(res, bills, 'Patient bills retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const result = await BillService.createBill(req.body);
            if (result.success) {
                return created(res, result.data, 'Bill created successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async confirmPayment(req, res, next) {
        try {
            const result = await BillService.confirmPayment(req.params.id, req.body.paymentMethod, req.user.id);
            if (result.success) {
                return updated(res, result.data, 'Payment confirmed successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async addItem(req, res, next) {
        try {
            const result = await BillService.addBillItem(req.params.id, req.body);
            if (result.success) {
                return created(res, result.data, 'Bill item added successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async updateItem(req, res, next) {
        try {
            const result = await BillService.updateBillItem(req.params.itemId, req.body);
            if (result.success) {
                return updated(res, result.data, 'Bill item updated successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async deleteItem(req, res, next) {
        try {
            const result = await BillService.deleteBillItem(req.params.itemId);
            if (result.success) {
                return success(res, null, 'Bill item deleted successfully');
            }
            return error(res, result.message, 400);
        } catch (err) {
            next(err);
        }
    }

    static async getItems(req, res, next) {
        try {
            const items = await BillService.getBillItems(req.params.id);
            return success(res, items, 'Bill items retrieved successfully');
        } catch (err) {
            next(err);
        }
    }
}

export default BillController;
