/**
 * Role-based Access Control Middleware
 * Checks if user has required role(s) to access a resource
 */

export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'ERROR',
                message: 'Authentication required.'
            });
        }
        
        const userRole = req.user.role;
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                status: 'ERROR',
                message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
            });
        }
        
        next();
    };
}

export function requireAdmin(req, res, next) {
    return requireRole('ADMIN')(req, res, next);
}

export function requireDoctor(req, res, next) {
    return requireRole('ADMIN', 'DOCTOR')(req, res, next);
}

export function requireReceptionist(req, res, next) {
    return requireRole('ADMIN', 'RECEPTIONIST')(req, res, next);
}

export function requirePatient(req, res, next) {
    return requireRole('ADMIN', 'PATIENT')(req, res, next);
}

// Role hierarchy for combined access
export const roleHierarchy = {
    'ADMIN': ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'],
    'DOCTOR': ['DOCTOR', 'PATIENT'],
    'RECEPTIONIST': ['RECEPTIONIST', 'PATIENT'],
    'PATIENT': ['PATIENT']
};
