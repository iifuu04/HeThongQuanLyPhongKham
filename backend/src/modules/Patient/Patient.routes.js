/**
 * Patient Routes
 * Handles patient CRUD operations
 * 
 * Permission Matrix (SRS):
 * - ADMIN: full access (create, read, update, delete)
 * - RECEPTIONIST: create, read, update patients
 * - DOCTOR: read patients
 * - PATIENT: read own data only
 */

import express from 'express';
import PatientService from './Patient.service.js';
import PatientRepository from './Patient.repository.js';
import { success, created, updated, notFound, error, forbidden } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/patients
// ADMIN, RECEPTIONIST, DOCTOR: xem danh sách bệnh nhân
// PATIENT: chỉ trả về hồ sơ bệnh nhân của chính tài khoản đang đăng nhập
router.get('/', asyncHandler(async (req, res) => {
    const { search } = req.query;

    try {
        if (req.user.role === 'PATIENT') {
            const ownPatient = await PatientRepository.getPatientByProfileId(req.user.id);

            if (!ownPatient) {
                return success(res, [], 'Tài khoản bệnh nhân chưa có hồ sơ bệnh nhân liên kết');
            }

            const patientProfile = await PatientRepository.getPatientProfile(ownPatient.id);

            return success(
                res,
                patientProfile ? [patientProfile] : [ownPatient],
                'Lấy hồ sơ bệnh nhân của tài khoản hiện tại thành công'
            );
        }

        if (!['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(req.user.role)) {
            return forbidden(res, 'Bạn không có quyền xem danh sách bệnh nhân');
        }

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

// GET /api/patients/:id
// PATIENT chỉ được xem hồ sơ của chính mình
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

// POST /api/patients
// ADMIN, RECEPTIONIST tạo hồ sơ bệnh nhân
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

// PUT /api/patients/:id
// ADMIN, RECEPTIONIST cập nhật hồ sơ bệnh nhân
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

// DELETE /api/patients/:id
// ADMIN xóa mềm hồ sơ bệnh nhân
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