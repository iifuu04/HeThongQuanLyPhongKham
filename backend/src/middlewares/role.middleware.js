/**
 * Role-based Access Control Middleware
 * NFR Security - Authorization
 * SRS UC20 - Role-based Access Control
 * 
 * Valid roles:
 * - ADMIN: Full system access
 * - DOCTOR: Medical records, appointments
 * - RECEPTIONIST: Patient management, appointments, billing
 * - PATIENT: Own records, appointments
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
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }
        
        const userRole = req.user.role;
        
        // Validate that user role is valid
        if (!isValidRole(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Invalid user role.'
            });
        }
        
        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
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
