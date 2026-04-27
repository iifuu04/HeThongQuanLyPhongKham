import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { seedData } from '../data/seedData';
import { nextId } from '../utils/helpers';

const ClinicContext = createContext(null);
const STORAGE_KEY = 'medsys_ui_db';

function readDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return seedData;
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return seedData;
  }
}

export function ClinicProvider({ children }) {
  const [db, setDb] = useState(readDb);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db]);

  function notify(message, type = 'success') {
    setToast({ message, type });
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(null), 2600);
  }

  function resetDb() {
    setDb(seedData);
    notify('Đã khôi phục dữ liệu mẫu của hệ thống.');
  }

  function appendLog(prev, entry) {
    const nextEntry = {
      id: nextId('', prev.auditLogs),
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      ...entry,
    };
    return [nextEntry, ...prev.auditLogs].slice(0, 50);
  }

  function saveCollection(prev, collection, payload) {
    const list = prev[collection];
    const exists = list.some((item) => item.id === payload.id);
    return exists ? list.map((item) => (item.id === payload.id ? payload : item)) : [payload, ...list];
  }

  function updateDb(producer, successMessage, type = 'success') {
    setDb((prev) => producer(prev));
    if (successMessage) notify(successMessage, type);
  }

  const lookups = useMemo(() => ({
    getProfile: (id) => db.profiles.find((x) => x.id === id),
    getDoctor: (id) => db.doctors.find((x) => x.id === id),
    getSpecialty: (id) => db.specialties.find((x) => x.id === id),
    getClinic: (id) => db.clinics.find((x) => x.id === id),
    getShift: (id) => db.shifts.find((x) => x.id === id),
    getWorkSchedule: (id) => db.workSchedules.find((x) => x.id === id),
    getPatient: (id) => db.patients.find((x) => x.id === id),
    getAppointment: (id) => db.appointments.find((x) => x.id === id),
    getMedicalRecord: (id) => db.medicalRecords.find((x) => x.id === id),
    getService: (id) => db.services.find((x) => x.id === id),
    getBill: (id) => db.bills.find((x) => x.id === id),
    profileName: (profileId) => db.profiles.find((x) => x.id === profileId)?.name || '—',
    patientName: (patientId) => {
      const patient = db.patients.find((x) => x.id === patientId);
      if (!patient) return '—';
      if (patient.fullName) return patient.fullName;
      const profile = db.profiles.find((x) => x.id === patient.profileId);
      return profile?.name || patientId;
    },
    doctorName: (doctorId) => {
      const doctor = db.doctors.find((x) => x.id === doctorId);
      if (!doctor) return '—';
      return db.profiles.find((x) => x.id === doctor.profileId)?.name || doctorId;
    },
  }), [db]);

  function savePatient(payload, actorId = 2) {
    const next = {
      id: payload.id || nextId('P', db.patients),
      ...payload,
    };
    updateDb((prev) => ({
      ...prev,
      patients: saveCollection(prev, 'patients', next),
      auditLogs: appendLog(prev, { userId: actorId, actionType: payload.id ? 'UPDATE' : 'CREATE', tableName: 'Patients', recordId: next.id, description: payload.id ? 'Cập nhật hồ sơ bệnh nhân' : 'Tạo hồ sơ bệnh nhân' }),
    }), payload.id ? 'Đã cập nhật hồ sơ bệnh nhân.' : 'Đã tạo hồ sơ bệnh nhân mới.');
  }

  function saveDoctor(payload, actorId = 1) {
    const next = { id: payload.id || nextId('D', db.doctors), ...payload };
    updateDb((prev) => ({
      ...prev,
      doctors: saveCollection(prev, 'doctors', next),
      auditLogs: appendLog(prev, { userId: actorId, actionType: payload.id ? 'UPDATE' : 'CREATE', tableName: 'Doctors', recordId: next.id, description: payload.id ? 'Cập nhật hồ sơ bác sĩ' : 'Tạo hồ sơ bác sĩ' }),
    }), payload.id ? 'Đã cập nhật bác sĩ.' : 'Đã thêm bác sĩ mới.');
  }

  function saveSpecialty(payload, actorId = 1) {
    const next = { id: payload.id || nextId('', db.specialties), ...payload };
    updateDb((prev) => ({
      ...prev,
      specialties: saveCollection(prev, 'specialties', next),
      auditLogs: appendLog(prev, { userId: actorId, actionType: payload.id ? 'UPDATE' : 'CREATE', tableName: 'Specialties', recordId: next.id, description: payload.id ? 'Cập nhật chuyên khoa' : 'Tạo chuyên khoa' }),
    }), payload.id ? 'Đã cập nhật chuyên khoa.' : 'Đã thêm chuyên khoa mới.');
  }

  function saveClinic(payload, actorId = 1) {
    const next = { id: payload.id || nextId('', db.clinics), ...payload };
    updateDb((prev) => ({
      ...prev,
      clinics: saveCollection(prev, 'clinics', next),
      auditLogs: appendLog(prev, { userId: actorId, actionType: payload.id ? 'UPDATE' : 'CREATE', tableName: 'Clinics', recordId: next.id, description: payload.id ? 'Cập nhật phòng khám' : 'Tạo phòng khám' }),
    }), payload.id ? 'Đã cập nhật phòng khám.' : 'Đã thêm phòng khám mới.');
  }

  function saveShift(payload, actorId = 1) {
    const next = { id: payload.id || nextId('', db.shifts), ...payload };
    updateDb((prev) => ({
      ...prev,
      shifts: saveCollection(prev, 'shifts', next),
      auditLogs: appendLog(prev, { userId: actorId, actionType: payload.id ? 'UPDATE' : 'CREATE', tableName: 'Shifts', recordId: next.id, description: payload.id ? 'Cập nhật ca làm việc' : 'Tạo ca làm việc' }),
    }), payload.id ? 'Đã cập nhật ca khám.' : 'Đã thêm ca khám mới.');
  }

  function saveService(payload, actorId = 1) {
    const next = { id: payload.id || nextId('', db.services), ...payload };
    updateDb((prev) => ({
      ...prev,
      services: saveCollection(prev, 'services', next),
      auditLogs: appendLog(prev, { userId: actorId, actionType: payload.id ? 'UPDATE' : 'CREATE', tableName: 'Services', recordId: next.id, description: payload.id ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ' }),
    }), payload.id ? 'Đã cập nhật dịch vụ.' : 'Đã thêm dịch vụ mới.');
  }

  function saveSchedule(payload, actorId = 1) {
    const duplicated = db.workSchedules.some((item) => item.id !== payload.id && item.doctorId === payload.doctorId && item.shiftId === payload.shiftId && item.workDate === payload.workDate);
    if (duplicated) {
      notify('Bác sĩ đã có lịch làm trong ca này.', 'error');
      return false;
    }
    const next = { id: payload.id || nextId('', db.workSchedules), ...payload };
    updateDb((prev) => ({
      ...prev,
      workSchedules: saveCollection(prev, 'workSchedules', next),
      auditLogs: appendLog(prev, { userId: actorId, actionType: payload.id ? 'UPDATE' : 'CREATE', tableName: 'Work_Schedules', recordId: next.id, description: payload.id ? 'Cập nhật lịch làm việc' : 'Tạo lịch làm việc' }),
    }), payload.id ? 'Đã cập nhật lịch làm việc.' : 'Đã tạo lịch làm việc mới.');
    return true;
  }

  function saveAppointment(payload, actorId = 2) {
    const duplicated = db.appointments.some((item) => item.id !== payload.id && item.doctorId === payload.doctorId && item.startTime === payload.startTime && item.status !== 'CANCELLED');
    if (duplicated) {
      notify('Khung giờ này đã được đặt cho bác sĩ.', 'error');
      return false;
    }
    const next = { id: payload.id || nextId('', db.appointments), ...payload };
    updateDb((prev) => ({
      ...prev,
      appointments: saveCollection(prev, 'appointments', next),
      auditLogs: appendLog(prev, { userId: actorId, actionType: payload.id ? 'UPDATE' : 'CREATE', tableName: 'Appointments', recordId: next.id, description: payload.id ? 'Cập nhật lịch hẹn khám' : 'Tạo lịch hẹn khám' }),
    }), payload.id ? 'Đã cập nhật lịch hẹn khám.' : 'Đã tạo lịch hẹn khám mới.');
    return true;
  }

  function updateAppointmentStatus(id, status, actorId = 2) {
    updateDb((prev) => ({
      ...prev,
      appointments: prev.appointments.map((item) => (item.id === id ? { ...item, status } : item)),
      auditLogs: appendLog(prev, { userId: actorId, actionType: 'UPDATE', tableName: 'Appointments', recordId: id, description: `Cập nhật trạng thái lịch hẹn thành ${status}` }),
    }), 'Đã cập nhật trạng thái lịch hẹn.');
  }

  function createRequest(payload, actorId) {
    const next = { id: nextId('', db.appointmentRequests), status: 'PENDING', ...payload };
    updateDb((prev) => ({
      ...prev,
      appointmentRequests: [next, ...prev.appointmentRequests],
      auditLogs: appendLog(prev, { userId: actorId, actionType: 'CREATE', tableName: 'Appointment_Request', recordId: next.id, description: 'Tạo yêu cầu đổi hoặc hủy lịch hẹn' }),
    }), 'Đã ghi nhận yêu cầu xử lý lịch hẹn.');
  }

  function resolveRequest(id, status, actorId = 1) {
    const request = db.appointmentRequests.find((item) => item.id === id);
    if (!request || request.status !== 'PENDING') {
      notify('Yêu cầu này không còn ở trạng thái chờ xử lý.', 'error');
      return false;
    }
    updateDb((prev) => ({
      ...prev,
      appointmentRequests: prev.appointmentRequests.map((item) => (item.id === id ? { ...item, status, responseBy: actorId, responseAt: new Date().toISOString().slice(0, 16).replace('T', ' ') } : item)),
      appointments: status === 'APPROVED' && request.action === 'CANCEL'
        ? prev.appointments.map((item) => (item.id === request.appointmentId ? { ...item, status: 'CANCELLED' } : item))
        : prev.appointments,
      auditLogs: appendLog(prev, { userId: actorId, actionType: 'UPDATE', tableName: 'Appointment_Request', recordId: id, description: status === 'APPROVED' ? 'Duyệt yêu cầu lịch hẹn' : 'Từ chối yêu cầu lịch hẹn' }),
    }), status === 'APPROVED' ? 'Đã duyệt yêu cầu.' : 'Đã từ chối yêu cầu.');
    return true;
  }

  function saveMedicalRecord(payload, actorId = 7) {
    const duplicated = db.medicalRecords.some((item) => item.id !== payload.id && item.appointmentId === payload.appointmentId);
    if (duplicated) {
      notify('Lịch hẹn này đã có bệnh án.', 'error');
      return false;
    }
    const next = { id: payload.id || nextId('', db.medicalRecords), ...payload };
    updateDb((prev) => ({
      ...prev,
      medicalRecords: saveCollection(prev, 'medicalRecords', next),
      auditLogs: appendLog(prev, { userId: actorId, actionType: payload.id ? 'UPDATE' : 'CREATE', tableName: 'Medical_Records', recordId: next.id, description: payload.id ? 'Cập nhật hồ sơ bệnh án' : 'Tạo hồ sơ bệnh án' }),
    }), payload.id ? 'Đã cập nhật bệnh án.' : 'Đã tạo bệnh án mới.');
    return true;
  }

  function finalizeMedicalRecord(id, actorId = 7) {
    updateDb((prev) => ({
      ...prev,
      medicalRecords: prev.medicalRecords.map((item) => (item.id === id ? { ...item, status: 'COMPLETED' } : item)),
      auditLogs: appendLog(prev, { userId: actorId, actionType: 'UPDATE', tableName: 'Medical_Records', recordId: id, description: 'Hoàn tất hồ sơ bệnh án' }),
    }), 'Đã hoàn tất hồ sơ bệnh án.');
  }

  function saveBill(payload, items, actorId = 2) {
    const duplicated = db.bills.some((item) => item.id !== payload.id && item.medicalRecordId === payload.medicalRecordId);
    if (duplicated) {
      notify('Bệnh án này đã có hóa đơn.', 'error');
      return false;
    }
    const billId = payload.id || nextId('', db.bills);
    const normalizedBill = { id: billId, ...payload };
    const normalizedItems = items.map((item, index) => ({ id: item.id || Number(`${billId}${index + 1}`), billId, ...item }));
    updateDb((prev) => ({
      ...prev,
      bills: saveCollection(prev, 'bills', normalizedBill),
      billItems: [...prev.billItems.filter((item) => item.billId !== billId), ...normalizedItems],
      auditLogs: appendLog(prev, { userId: actorId, actionType: payload.id ? 'UPDATE' : 'CREATE', tableName: 'Bills', recordId: billId, description: payload.id ? 'Cập nhật hóa đơn thanh toán' : 'Tạo hóa đơn thanh toán' }),
    }), payload.id ? 'Đã cập nhật hóa đơn.' : 'Đã tạo hóa đơn thanh toán.');
    return true;
  }

  function confirmPayment(id, paymentMethod, actorId = 2) {
    updateDb((prev) => ({
      ...prev,
      bills: prev.bills.map((item) => (item.id === id ? { ...item, status: 'COMPLETED', paymentMethod, updatedBy: actorId } : item)),
      auditLogs: appendLog(prev, { userId: actorId, actionType: 'UPDATE', tableName: 'Bills', recordId: id, description: 'Xác nhận thanh toán hóa đơn' }),
    }), 'Đã xác nhận thanh toán.');
  }

  function saveAccount(payload, actorId = 1) {
    const duplicated = db.profiles.some((item) => item.id !== payload.id && (item.username === payload.username || item.email === payload.email));
    if (duplicated) {
      notify('Tên đăng nhập hoặc email đã tồn tại.', 'error');
      return false;
    }
    const next = { id: payload.id || nextId('', db.profiles), ...payload };
    updateDb((prev) => ({
      ...prev,
      profiles: saveCollection(prev, 'profiles', next),
      auditLogs: appendLog(prev, { userId: actorId, actionType: payload.id ? 'UPDATE' : 'CREATE', tableName: 'Profiles', recordId: next.id, description: payload.id ? 'Cập nhật tài khoản người dùng' : 'Tạo tài khoản người dùng' }),
    }), payload.id ? 'Đã cập nhật tài khoản.' : 'Đã tạo tài khoản mới.');
    return true;
  }

  function toggleAccountStatus(id, actorId = 1) {
    if (id === actorId) {
      notify('Không thể tự khóa tài khoản đang đăng nhập.', 'error');
      return false;
    }
    updateDb((prev) => ({
      ...prev,
      profiles: prev.profiles.map((item) => (item.id === id ? { ...item, status: item.status === 'active' ? 'locked' : 'active' } : item)),
      auditLogs: appendLog(prev, { userId: actorId, actionType: 'UPDATE', tableName: 'Profiles', recordId: id, description: 'Thay đổi trạng thái tài khoản' }),
    }), 'Đã cập nhật trạng thái tài khoản.');
    return true;
  }

  function recordLogin(profileId) {
    updateDb((prev) => ({
      ...prev,
      auditLogs: appendLog(prev, { userId: profileId, actionType: 'LOGIN', tableName: 'Profiles', recordId: profileId, description: 'Đăng nhập hệ thống' }),
    }));
  }

  const value = {
    db,
    toast,
    notify,
    resetDb,
    savePatient,
    saveDoctor,
    saveSpecialty,
    saveClinic,
    saveShift,
    saveService,
    saveSchedule,
    saveAppointment,
    updateAppointmentStatus,
    createRequest,
    resolveRequest,
    saveMedicalRecord,
    finalizeMedicalRecord,
    saveBill,
    confirmPayment,
    saveAccount,
    toggleAccountStatus,
    recordLogin,
    ...lookups,
  };

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) throw new Error('useClinic must be used within ClinicProvider');
  return context;
}
