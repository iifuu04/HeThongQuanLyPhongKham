/**
 * Shift Service (BUS Layer)
 * Business logic for Shift operations
 * Implements BR: Only ADMIN can add/edit/delete shifts
 */

import ShiftRepository from './Shift.repository.js';

class ShiftService {
    async getAllShifts() {
        const shifts = await ShiftRepository.getShifts();
        return shifts || [];
    }

    async getShiftById(id) {
        return await ShiftRepository.getShiftById(id);
    }

    async createShift(data) {
        try {
            const { start_time, end_time, max_patients } = data;

            if (!start_time) {
                return { success: false, message: 'Giờ bắt đầu là bắt buộc' };
            }

            if (!end_time) {
                return { success: false, message: 'Giờ kết thúc là bắt buộc' };
            }

            if (!max_patients || max_patients < 1) {
                return { success: false, message: 'Số bệnh nhân tối đa phải ít nhất là 1' };
            }

            if (start_time >= end_time) {
                return { success: false, message: 'Giờ kết thúc phải sau giờ bắt đầu' };
            }

            const result = await ShiftRepository.createShift({
                start_time,
                end_time,
                max_patients
            });

            if (result) {
                const shifts = await ShiftRepository.getShifts();
                const created = shifts.find(s => s.start_time === start_time && s.end_time === end_time);
                return { success: true, data: created || shifts[shifts.length - 1] };
            }
            return { success: false, message: 'Không thể tạo ca làm việc' };
        } catch (error) {
            console.error('Error creating shift:', error);
            return { success: false, message: error.message };
        }
    }

    async updateShift(id, data) {
        try {
            const existing = await ShiftRepository.getShiftById(id);
            if (!existing) {
                return { success: false, message: 'Không tìm thấy ca làm việc' };
            }

            const newStartTime = data.start_time || existing.start_time;
            const newEndTime = data.end_time || existing.end_time;

            if (newStartTime >= newEndTime) {
                return { success: false, message: 'Giờ kết thúc phải sau giờ bắt đầu' };
            }

            if (data.max_patients !== undefined && data.max_patients < 1) {
                return { success: false, message: 'Số bệnh nhân tối đa phải ít nhất là 1' };
            }

            const result = await ShiftRepository.updateShift(id, data);
            if (result) {
                const updated = await ShiftRepository.getShiftById(id);
                return { success: true, data: updated };
            }
            return { success: false, message: 'Không thể cập nhật ca làm việc' };
        } catch (error) {
            console.error('Error updating shift:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteShift(id) {
        try {
            const existing = await ShiftRepository.getShiftById(id);
            if (!existing) {
                return { success: false, message: 'Không tìm thấy ca làm việc' };
            }

            const hasLinked = await ShiftRepository.hasLinkedSchedules(id);
            if (hasLinked) {
                return { success: false, message: 'Không thể xóa: có lịch làm việc liên kết với ca này' };
            }

            const result = await ShiftRepository.deleteShift(id);
            if (result) {
                return { success: true, message: 'Xóa ca làm việc thành công' };
            }
            return { success: false, message: 'Không thể xóa ca làm việc' };
        } catch (error) {
            console.error('Error deleting shift:', error);
            return { success: false, message: error.message };
        }
    }
}

export default new ShiftService();
