// WorkSchedule.validator.js
// Validation rules for WorkSchedule operations

export const validateWorkSchedule = (data, isUpdate = false) => {
    const errors = [];

    if (!isUpdate) {
        if (!data.doctor_id) {
            errors.push('Doctor ID is required');
        }
        if (!data.clinic_id) {
            errors.push('Clinic ID is required');
        }
        if (!data.shift_id) {
            errors.push('Shift ID is required');
        }
        if (!data.work_date) {
            errors.push('Work date is required');
        }
    }

    if (data.work_date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.work_date)) {
            errors.push('Work date must be in YYYY-MM-DD format');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export const validateWorkScheduleQuery = (query) => {
    const errors = [];
    const validFilters = ['doctor_id', 'work_date', 'specialty_id', 'clinic_id'];

    for (const key of Object.keys(query)) {
        if (!validFilters.includes(key)) {
            errors.push(`Invalid filter: ${key}`);
        }
    }

    if (query.work_date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(query.work_date)) {
            errors.push('work_date must be in YYYY-MM-DD format');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
