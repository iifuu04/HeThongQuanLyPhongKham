/**
 * Patient Routes
 * Handles patient CRUD operations
 * SRS UC1 - Patient Registration
 * SRS UC2 - Patient Search
 * SRS UC3 - Patient Information Update
 * SRS UC4 - View Patient History
 */

import express from 'express';
import PatientService from './Patient.service.js';
import { success, created, updated, notFound, error, forbidden } from '../../utils/response.js';
import { asyncHandler } from '../../utils/errors.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/patients
router.get('/', authorizeRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR'), asyncHandler(async (req, res) => {
    const { search } = req.query;
    
    try {
        if (search) {
            const patients = await PatientService.searchPatients(search);
            return success(res, patients, 'Patients retrieved successfully');
        }
        const patients = await PatientService.getAllPatients();
        return success(res, patients, 'Patients retrieved successfully');
    } catch (err) {
        console.error('Error in GET /patients:', err);
        return error(res, err.message, 500);
    }
}));

// GET /api/patients/:id
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const result = await PatientService.getPatientWithDetails(req.params.id, req.user);
        
        if (!result.success) {
            if (result.message === 'Access denied') {
                return forbidden(res, 'You can only view your own patient record');
            }
            return notFound(res, result.message);
        }
        
        return success(res, result.data, 'Patient details retrieved successfully');
    } catch (err) {
        console.error('Error in GET /patients/:id:', err);
        return error(res, err.message, 500);
    }
}));

// POST /api/patients
router.post('/', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    try {
        const result = await PatientService.createPatient(req.body, req.user.id);
        
        if (result.success) {
            return created(res, result.data, 'Patient created successfully');
        }
        return error(res, result.message, 400);
    } catch (err) {
        console.error('Error in POST /patients:', err);
        return error(res, err.message, 500);
    }
}));

// PUT /api/patients/:id
router.put('/:id', authorizeRoles('ADMIN', 'RECEPTIONIST'), asyncHandler(async (req, res) => {
    try {
        const result = await PatientService.updatePatient(req.params.id, req.body, req.user.id);
        
        if (result.success) {
            return updated(res, result.data, 'Patient updated successfully');
        }
        return error(res, result.message, 400);
    } catch (err) {
        console.error('Error in PUT /patients/:id:', err);
        return error(res, err.message, 500);
    }
}));

// DELETE /api/patients/:id
router.delete('/:id', authorizeRoles('ADMIN'), asyncHandler(async (req, res) => {
    try {
        const result = await PatientService.deletePatient(req.params.id, req.user.id);
        
        if (result.success) {
            return success(res, null, 'Patient deleted successfully');
        }
        return error(res, result.message, 400);
    } catch (err) {
        console.error('Error in DELETE /patients/:id:', err);
        return error(res, err.message, 500);
    }
}));

export default router;
