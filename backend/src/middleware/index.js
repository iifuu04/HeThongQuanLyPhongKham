/**
 * Index file for all middlewares
 * Import from here for cleaner code
 */

export { authenticate, optionalAuth, JWT_SECRET } from './auth.middleware.js';
export { requireRole, requireAdmin, requireDoctor, requireReceptionist, requirePatient, roleHierarchy } from './role.middleware.js';
export { 
    errorHandler, 
    asyncHandler,
    NotFoundError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    ConflictError 
} from './error.middleware.js';
