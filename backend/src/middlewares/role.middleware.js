/**
 * Role-based Access Control Middleware
 * NFR Security - Authorization
 * SRS UC20 - Role-based Access Control
 * 
 * Permission Matrix:
 * ┌─────────────────┬─────────┬─────────┬───────────────┬──────────┐
 * │ Module          │ ADMIN   │ DOCTOR  │ RECEPTIONIST │ PATIENT  │
 * ├─────────────────┼─────────┼─────────┼───────────────┼──────────┤
 * │ Dashboard       │ ✓       │ ✓       │ ✓             │ ✗        │
 * │ Profiles/Users  │ ✓ (CRUD)│ ✗       │ ✗             │ ✗        │
 * │ Patients        │ ✓ (CRUD)│ R       │ CRU           │ R (own)  │
 * │ Doctors         │ ✓ (CRUD)│ R       │ R             │ ✗        │
 * │ Appointments    │ ✓       │ R (own) │ CRU           │ CRU(own) │
 * │ Medical Records │ ✓ (CRUD)│ CRU(own)│ R             │ R (own)  │
 * │ Bills           │ ✓ (CRUD)│ R       │ CRU           │ R (own)  │
 * │ Work Schedules  │ ✓ (CRUD)│ R (own) │ R             │ ✗        │
 * │ Specialties     │ ✓ (CRUD)│ R       │ R             │ ✗        │
 * │ Clinics         │ ✓ (CRU) │ R       │ R             │ ✗        │
 * │ Shifts          │ ✓ (CRUD)│ R       │ R             │ ✗        │
 * │ Services        │ ✓ (CRUD)│ R       │ R             │ ✗        │
 * │ Audit Logs      │ ✓ (R)   │ ✗       │ ✗             │ ✗        │
 * │ Reports         │ ✓       │ ✗       │ ✗             │ ✗        │
 * └─────────────────┴─────────┴─────────┴───────────────┴──────────┘
 * 
 * C = Create, R = Read, U = Update, D = Delete
 * 
 * Valid roles: ADMIN, DOCTOR, RECEPTIONIST, PATIENT
 */

export const VALID_ROLES = ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'];

/**
 * Check if role is valid
 */
export function isValidRole(role) {
    return VALID_ROLES.includes(role);
}

/**
 * Authorize based on allowed roles
 * Returns 403 Forbidden if user role is not in allowed roles
 * Returns 401 Unauthorized if user is not authenticated
 * 
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Yêu cầu xác thực.' });
        }
        const userRole = req.user.role;
        if (!isValidRole(userRole)) {
            return res.status(403).json({ success: false, message: 'Vai trò người dùng không hợp lệ.' });
        }
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Không có quyền truy cập. Vai trò yêu cầu: ${allowedRoles.join(', ')}`
            });
        }
        next();
    };
}

/**
 * Shorthand for admin-only routes
 */
export function requireAdmin(req, res, next) {
    return authorizeRoles('ADMIN')(req, res, next);
}

/**
 * Admin or Doctor access
 */
export function requireDoctor(req, res, next) {
    return authorizeRoles('ADMIN', 'DOCTOR')(req, res, next);
}

/**
 * Admin or Receptionist access
 */
export function requireReceptionist(req, res, next) {
    return authorizeRoles('ADMIN', 'RECEPTIONIST')(req, res, next);
}

/**
 * Admin or Patient access
 */
export function requirePatient(req, res, next) {
    return authorizeRoles('ADMIN', 'PATIENT')(req, res, next);
}

/**
 * Admin, Doctor, or Receptionist access
 */
export function requireMedicalStaff(req, res, next) {
    return authorizeRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST')(req, res, next);
}

/**
 * Admin, Doctor, Receptionist, or Patient access
 */
export function requireAllRoles(req, res, next) {
    return authorizeRoles(...VALID_ROLES)(req, res, next);
}
