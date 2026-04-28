/**
 * Unified Response Format
 * All API responses use this format:
 * {
 *   success: true/false,
 *   message: "...",
 *   data: ...
 * }
 */

export function success(res, data = null, message = 'Success') {
    return res.json({
        success: true,
        message,
        data
    });
}

export function created(res, data = null, message = 'Created successfully') {
    return res.status(201).json({
        success: true,
        message,
        data
    });
}

export function updated(res, data = null, message = 'Updated successfully') {
    return res.status(200).json({
        success: true,
        message,
        data
    });
}

export function deleted(res, message = 'Deleted successfully') {
    return res.status(200).json({
        success: true,
        message
    });
}

export function error(res, message = 'An error occurred', statusCode = 400, data = null) {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(data && { data })
    });
}

export function notFound(res, message = 'Resource not found') {
    return res.status(404).json({
        success: false,
        message
    });
}

export function unauthorized(res, message = 'Unauthorized') {
    return res.status(401).json({
        success: false,
        message
    });
}

export function forbidden(res, message = 'Forbidden') {
    return res.status(403).json({
        success: false,
        message
    });
}

export function serverError(res, message = 'Internal server error') {
    return res.status(500).json({
        success: false,
        message
    });
}

export function paginated(res, data, pagination, message = 'Success') {
    return res.json({
        success: true,
        message,
        data,
        pagination
    });
}
