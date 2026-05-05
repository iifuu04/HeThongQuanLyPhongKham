/**
 * Patient Routes
 * Handles patient CRUD operations
 * 
 * Permission Matrix (SRS):
 * - ADMIN: full access (create, read, update, delete)
 * - RECEPTIONIST: create, read, update patients
 * - DOCTOR: read patients (view list, view details)
 * - PATIENT: read own data only
 */

import express from 'express';
import PatientService from './Patient.service.js';
import { success, created, updated, notFound, error, forbidden } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/patients - Get all patients
// ADMIN, RECEPTIONIST, DOCTOR can view patient list
router.get('/', authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'), asyncHandler(async (req, res) => {
    const { search } = req.query;
    
    try {
        if (search) {
            const patients = await PatientService.searchPatients(search);
            return success(res, patients, 'Lấy danh sách bệnh nhân thành công');
        }
        const patients = await PatientService.getAllPatients();
        return success(res, patients, 'Lấy danh sách bệnh nhân thành công');
    } catch (err) {
        console.error('Error in GET /patients:', err);
        return error(res, err.message, 500);
    }
}));

// GET /api/patients/:id - Get patient by ID
// PATIENT can only view their own record
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const result = await PatientService.getPatientWithDetails(req.params.id, req.user);
        
        if (!result.success) {
            if (result.message === 'Access denied') {
                return forbidden(res, 'Bạn chỉ có thể xem hồ sơ bệnh nhân của mình');
            }
            return notFound(res, result.message);
        }
        
        return success(res, result.data, 'Lấy chi tiết bệnh nhân thành công');
    } catch (err) {
        console.error('Error in GET /patients/:id:', err);
        return error(res, err.message, 500);
    }
}));

// POST /api/patients - Create new patient
// ADMIN, RECEPTIONIST can create
router.post('/', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    try {
        const result = await PatientService.createPatient(req.body, req.user.id);
        
        if (result.success) {
            return created(res, result.data, 'Tạo bệnh nhân thành công');
        }
        return error(res, result.message, 400);
    } catch (err) {
        console.error('Error in POST /patients:', err);
        return error(res, err.message, 500);
    }
}));

// PUT /api/patients/:id - Update patient
// ADMIN, RECEPTIONIST can update
router.put('/:id', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    try {
        const result = await PatientService.updatePatient(req.params.id, req.body, req.user.id);
        
        if (result.success) {
            return updated(res, result.data, 'Cập nhật bệnh nhân thành công');
        }
        return error(res, result.message, 400);
    } catch (err) {
        console.error('Error in PUT /patients/:id:', err);
        return error(res, err.message, 500);
    }
}));

// DELETE /api/patients/:id - Soft delete patient
// ADMIN only
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    try {
        const result = await PatientService.deletePatient(req.params.id, req.user.id);
        
        if (result.success) {
            return success(res, null, 'Xóa bệnh nhân thành công');
        }
        return error(res, result.message, 400);
    } catch (err) {
        console.error('Error in DELETE /patients/:id:', err);
        return error(res, err.message, 500);
    }
}));

export default router;
