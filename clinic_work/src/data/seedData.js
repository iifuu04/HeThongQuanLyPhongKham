export const seedData = {
  profiles: [
    { id: 1, username: 'admin01', password: '123456', firstName: 'An', lastName: 'Nguyễn', name: 'An Nguyễn', role: 'admin', email: 'admin01@medsys.vn', phone: '0901000001', status: 'active' },
    { id: 2, username: 'reception01', password: '123456', firstName: 'Chi', lastName: 'Lê', name: 'Chi Lê', role: 'receptionist', email: 'reception01@medsys.vn', phone: '0901000003', status: 'active' },
    { id: 7, username: 'doctor01', password: '123456', firstName: 'Minh', lastName: 'Trần', name: 'BS. Minh Trần', role: 'doctor', email: 'doctor01@medsys.vn', phone: '0910000001', status: 'active' },
    { id: 8, username: 'doctor02', password: '123456', firstName: 'Hà', lastName: 'Phạm', name: 'BS. Hà Phạm', role: 'doctor', email: 'doctor02@medsys.vn', phone: '0910000002', status: 'active' },
    { id: 9, username: 'doctor03', password: '123456', firstName: 'Linh', lastName: 'Bùi', name: 'BS. Linh Bùi', role: 'doctor', email: 'doctor03@medsys.vn', phone: '0910000003', status: 'active' },
    { id: 31, username: 'patient01', password: '123456', firstName: 'Mai', lastName: 'Nguyễn', name: 'Mai Nguyễn', role: 'patient', email: 'patient01@medsys.vn', phone: '0920000001', status: 'active' },
    { id: 32, username: 'patient02', password: '123456', firstName: 'Bình', lastName: 'Trần', name: 'Bình Trần', role: 'patient', email: 'patient02@medsys.vn', phone: '0920000002', status: 'active' },
    { id: 33, username: 'patient03', password: '123456', firstName: 'Vy', lastName: 'Lê', name: 'Vy Lê', role: 'patient', email: 'patient03@medsys.vn', phone: '0920000003', status: 'locked' },
  ],
  specialties: [
    { id: 1, name: 'Nội tổng quát', establishAt: '2016-01-01', description: 'Khám và theo dõi bệnh lý nội khoa tổng quát.', status: 'ACTIVE' },
    { id: 2, name: 'Tai Mũi Họng', establishAt: '2017-05-12', description: 'Khám chuyên khoa tai mũi họng.', status: 'ACTIVE' },
    { id: 3, name: 'Nhi khoa', establishAt: '2018-03-20', description: 'Khám và theo dõi sức khỏe trẻ em.', status: 'ACTIVE' },
    { id: 4, name: 'Da liễu', establishAt: '2019-07-10', description: 'Tư vấn điều trị bệnh da liễu.', status: 'LOCKED' },
  ],
  clinics: [
    { id: 1, name: 'Clinic 01', location: 'Tầng 1 - Khu A', isReserve: false },
    { id: 2, name: 'Clinic 02', location: 'Tầng 1 - Khu B', isReserve: false },
    { id: 3, name: 'Clinic 03', location: 'Tầng 2 - Khu A', isReserve: true },
  ],
  shifts: [
    { id: 1, startTime: '07:00', endTime: '09:30', maxPatients: 16 },
    { id: 2, startTime: '09:30', endTime: '12:00', maxPatients: 14 },
    { id: 3, startTime: '13:00', endTime: '15:30', maxPatients: 14 },
    { id: 4, startTime: '15:30', endTime: '18:00', maxPatients: 12 },
  ],
  services: [
    { id: 1, name: 'Khám chuyên khoa', price: 150000 },
    { id: 2, name: 'Nội soi Tai Mũi Họng', price: 280000 },
    { id: 3, name: 'Tư vấn điều trị', price: 120000 },
    { id: 4, name: 'Thuốc kê đơn', price: 180000 },
  ],
  doctors: [
    { id: 'D00001', profileId: 7, specialtyId: 2, clinicId: 1, status: 'ACTIVE' },
    { id: 'D00002', profileId: 8, specialtyId: 1, clinicId: 2, status: 'ACTIVE' },
    { id: 'D00003', profileId: 9, specialtyId: 3, clinicId: 3, status: 'ACTIVE' },
  ],
  patients: [
    { id: 'P00001', profileId: 31, dateOfBirth: '2004-10-21', gender: 'Female', address: 'Quận 7, TP.HCM', history: 'Viêm họng tái phát', phone: '0920000001' },
    { id: 'P00002', profileId: 32, dateOfBirth: '1999-03-14', gender: 'Male', address: 'Thủ Đức, TP.HCM', history: 'Dị ứng thời tiết', phone: '0920000002' },
    { id: 'P00003', profileId: null, dateOfBirth: '1996-08-30', gender: 'Female', address: 'Gò Vấp, TP.HCM', history: 'Viêm mũi dị ứng', phone: '0920000099', fullName: 'Hương Võ' },
  ],
  workSchedules: [
    { id: 1, doctorId: 'D00001', clinicId: 1, shiftId: 1, workDate: '2026-04-28' },
    { id: 2, doctorId: 'D00002', clinicId: 2, shiftId: 3, workDate: '2026-04-28' },
    { id: 3, doctorId: 'D00003', clinicId: 3, shiftId: 2, workDate: '2026-04-29' },
  ],
  appointments: [
    { id: 1, patientId: 'P00001', doctorId: 'D00001', workScheduleId: 1, startTime: '2026-04-28T07:30', endTime: '2026-04-28T08:00', status: 'SCHEDULED', reason: 'Đau họng kéo dài' },
    { id: 2, patientId: 'P00002', doctorId: 'D00002', workScheduleId: 2, startTime: '2026-04-28T13:30', endTime: '2026-04-28T14:00', status: 'WAITING', reason: 'Khám tổng quát định kỳ' },
    { id: 3, patientId: 'P00003', doctorId: 'D00003', workScheduleId: 3, startTime: '2026-04-29T10:00', endTime: '2026-04-29T10:30', status: 'COMPLETED', reason: 'Sốt nhẹ và ho' },
  ],
  appointmentRequests: [
    { id: 1, appointmentId: 1, patientId: 'P00001', doctorId: 'D00001', specialtyId: 2, shiftId: 1, createdAt: '2026-04-24', action: 'CANCEL', requestBy: 31, responseBy: null, responseAt: null, status: 'PENDING', detail: 'Bệnh nhân bận công việc đột xuất.' },
  ],
  medicalRecords: [
    { id: 1, patientId: 'P00003', doctorId: 'D00003', appointmentId: 3, note: 'Theo dõi tại nhà', symptoms: 'Sốt nhẹ, ho khan', diagnosis: 'Cảm cúm', result: 'Ổn định', prescription: 'Paracetamol, nghỉ ngơi, uống nhiều nước', status: 'COMPLETED' },
  ],
  bills: [
    { id: 1, medicalRecordId: 1, totalAmount: 300000, updatedBy: 2, paymentMethod: 'BANKING', status: 'COMPLETED', patientId: 'P00003' },
  ],
  billItems: [
    { id: 1, billId: 1, serviceId: 1, quantity: 1, price: 150000 },
    { id: 2, billId: 1, serviceId: 4, quantity: 1, price: 150000 },
  ],
  auditLogs: [
    { id: 1, userId: 1, actionType: 'LOGIN', tableName: 'Profiles', recordId: 1, description: 'Đăng nhập quản trị viên', createdAt: '2026-04-27 08:00' },
    { id: 2, userId: 2, actionType: 'UPDATE', tableName: 'Appointments', recordId: 2, description: 'Cập nhật trạng thái chờ khám', createdAt: '2026-04-27 08:30' },
  ],
};

export const demoAccounts = [
  { username: 'admin01', password: '123456', label: 'Quản trị viên' },
  { username: 'reception01', password: '123456', label: 'Lễ tân' },
  { username: 'doctor01', password: '123456', label: 'Bác sĩ' },
  { username: 'patient01', password: '123456', label: 'Bệnh nhân' },
];
