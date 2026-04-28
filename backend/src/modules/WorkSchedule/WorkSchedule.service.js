/**
 * WorkSchedule Service (BUS Layer)
 * Business logic for WorkSchedule operations
 * Implements BR:
 * - Only ADMIN can add/edit/delete work schedules
 * - Work schedule consists of doctor_id, clinic_id, shift_id, work_date
 * - No duplicate work schedule for same doctor_id + shift_id + work_date
 * - Do not edit medical appointment data when updating doctor info
 */

import WorkScheduleRepository from './WorkSchedule.repository.js';
import DoctorRepository from '../Doctor/Doctor.repository.js';
import ClinicRepository from '../Clinic/Clinic.repository.js';
import ShiftRepository from '../Shift/Shift.repository.js';
import { normalizeDate } from '../../utils/date.js';

class WorkScheduleService {
    async getAllSchedules(filters = {}) {
        const schedules = await WorkScheduleRepository.getSchedules(filters);
        return schedules || [];
    }

    async getScheduleById(id) {
        return await WorkScheduleRepository.getScheduleById(id);
    }

    async getSchedulesByDoctor(doctorId) {
        const schedules = await WorkScheduleRepository.getSchedulesByDoctor(doctorId);
        return schedules || [];
    }

    async getSchedulesByDate(date) {
        const schedules = await WorkScheduleRepository.getSchedulesByDate(date);
        return schedules || [];
    }

    async getSchedulesByFilters(filters) {
        const schedules = await WorkScheduleRepository.getSchedulesByFilters(filters);
        return schedules || [];
    }

    async createSchedule(data) {
        try {
            const { doctor_id, clinic_id, shift_id, work_date } = data;

            if (!doctor_id) {
                return { success: false, message: 'Doctor ID is required' };
            }

            if (!clinic_id) {
                return { success: false, message: 'Clinic ID is required' };
            }

            if (!shift_id) {
                return { success: false, message: 'Shift ID is required' };
            }

            if (!work_date) {
                return { success: false, message: 'Work date is required' };
            }

            // Normalize work_date to YYYY-MM-DD format
            const normalizedWorkDate = normalizeDate(work_date);
            if (!normalizedWorkDate) {
                return { success: false, message: 'Invalid work date format' };
            }

            const doctor = await DoctorRepository.getDoctorById(doctor_id);
            if (!doctor) {
                return { success: false, message: 'Doctor not found' };
            }

            if (doctor.status !== 'ACTIVE') {
                return { success: false, message: 'Doctor is not active' };
            }

            const clinic = await ClinicRepository.getClinicById(clinic_id);
            if (!clinic) {
                return { success: false, message: 'Clinic not found' };
            }

            const shift = await ShiftRepository.getShiftById(shift_id);
            if (!shift) {
                return { success: false, message: 'Shift not found' };
            }

            const workDateObj = new Date(normalizedWorkDate);
            if (isNaN(workDateObj.getTime())) {
                return { success: false, message: 'Invalid work date format' };
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (workDateObj < today) {
                return { success: false, message: 'Work date cannot be in the past' };
            }

            const existingSchedule = await WorkScheduleRepository.checkScheduleConflict(
                doctor_id, shift_id, normalizedWorkDate
            );
            if (existingSchedule) {
                return { success: false, message: 'Schedule conflict: Doctor already has a schedule for this shift and date' };
            }

            const result = await WorkScheduleRepository.createSchedule({
                doctor_id,
                clinic_id,
                shift_id,
                work_date: normalizedWorkDate
            });

            if (result) {
                const schedules = await WorkScheduleRepository.getSchedules();
                const created = schedules.find(s =>
                    s.doctor_id === doctor_id &&
                    s.shift_id === shift_id &&
                    s.work_date === normalizedWorkDate
                );
                return { success: true, data: created };
            }
            return { success: false, message: 'Failed to create work schedule' };
        } catch (error) {
            console.error('Error creating work schedule:', error);
            return { success: false, message: error.message };
        }
    }

    async updateSchedule(id, data) {
        try {
            const existing = await WorkScheduleRepository.getScheduleById(id);
            if (!existing) {
                return { success: false, message: 'Work schedule not found' };
            }

            if (data.clinic_id) {
                const clinic = await ClinicRepository.getClinicById(data.clinic_id);
                if (!clinic) {
                    return { success: false, message: 'Clinic not found' };
                }
            }

            if (data.shift_id) {
                const shift = await ShiftRepository.getShiftById(data.shift_id);
                if (!shift) {
                    return { success: false, message: 'Shift not found' };
                }
            }

            if (data.doctor_id) {
                const doctor = await DoctorRepository.getDoctorById(data.doctor_id);
                if (!doctor) {
                    return { success: false, message: 'Doctor not found' };
                }
            }

            if (data.work_date) {
                const normalizedWorkDate = normalizeDate(data.work_date);
                if (!normalizedWorkDate) {
                    return { success: false, message: 'Invalid work date format' };
                }
                // Replace data.work_date with normalized version for use in conflict check
                data._normalizedWorkDate = normalizedWorkDate;
            }

            if (data.doctor_id || data.shift_id || data.work_date) {
                const checkDoctorId = data.doctor_id || existing.doctor_id;
                const checkShiftId = data.shift_id || existing.shift_id;
                const checkWorkDate = data._normalizedWorkDate || existing.work_date;

                const conflict = await WorkScheduleRepository.checkScheduleConflictExcludingId(
                    checkDoctorId, checkShiftId, checkWorkDate, id
                );
                if (conflict) {
                    return { success: false, message: 'Schedule conflict: Doctor already has a schedule for this shift and date' };
                }
            }

            const allowedFields = ['clinic_id', 'shift_id', 'work_date'];
            const updateData = {};
            for (const key of allowedFields) {
                if (data[key] !== undefined) {
                    // Normalize work_date
                    if (key === 'work_date') {
                        updateData[key] = normalizeDate(data[key]);
                    } else {
                        updateData[key] = data[key];
                    }
                }
            }

            if (Object.keys(updateData).length === 0) {
                return { success: false, message: 'No valid fields to update' };
            }

            const result = await WorkScheduleRepository.updateSchedule(id, updateData);
            if (result) {
                const updated = await WorkScheduleRepository.getScheduleById(id);
                return { success: true, data: updated };
            }
            return { success: false, message: 'Failed to update work schedule' };
        } catch (error) {
            console.error('Error updating work schedule:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteSchedule(id) {
        try {
            const existing = await WorkScheduleRepository.getScheduleById(id);
            if (!existing) {
                return { success: false, message: 'Work schedule not found' };
            }

            const hasLinkedAppointments = await WorkScheduleRepository.hasLinkedAppointments(id);
            if (hasLinkedAppointments) {
                return { success: false, message: 'Cannot delete schedule: there are appointments linked to this schedule' };
            }

            const result = await WorkScheduleRepository.deleteSchedule(id);
            if (result) {
                return { success: true, message: 'Work schedule deleted successfully' };
            }
            return { success: false, message: 'Failed to delete work schedule' };
        } catch (error) {
            console.error('Error deleting work schedule:', error);
            return { success: false, message: error.message };
        }
    }
}

export default new WorkScheduleService();
