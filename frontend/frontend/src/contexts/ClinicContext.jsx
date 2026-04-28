import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

/**
 * Convert date value to YYYY-MM-DD format for MySQL
 * Handles ISO strings, Date objects, and already formatted strings
 */
function normalizeDateForApi(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (typeof value === 'string' && value.includes('T')) {
    return value.split('T')[0];
  }
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return null;
}

const ClinicContext = createContext(null);

export function ClinicProvider({ children }) {
  const [data, setData] = useState({
    profiles: [],
    patients: [],
    doctors: [],
    specialties: [],
    clinics: [],
    shifts: [],
    services: [],
    workSchedules: [],
    appointments: [],
    appointmentRequests: [],
    medicalRecords: [],
    bills: [],
    billItems: [],
    auditLogs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        profilesRes,
        patientsRes,
        doctorsRes,
        specialtiesRes,
        clinicsRes,
        shiftsRes,
        servicesRes,
        schedulesRes,
        appointmentsRes,
        requestsRes,
        recordsRes,
        billsRes,
      ] = await Promise.all([
        api.getProfiles().catch(() => ({ data: [] })),
        api.getPatients().catch(() => ({ data: [] })),
        api.getDoctors().catch(() => ({ data: [] })),
        api.getSpecialties().catch(() => ({ data: [] })),
        api.getClinics().catch(() => ({ data: [] })),
        api.getShifts().catch(() => ({ data: [] })),
        api.getServices().catch(() => ({ data: [] })),
        api.getWorkSchedules().catch(() => ({ data: [] })),
        api.getAppointments().catch(() => ({ data: [] })),
        api.getAppointmentRequests().catch(() => ({ data: [] })),
        api.getMedicalRecords().catch(() => ({ data: [] })),
        api.getBills().catch(() => ({ data: [] })),
      ]);

      setData({
        profiles: profilesRes.data || [],
        patients: patientsRes.data || [],
        doctors: doctorsRes.data || [],
        specialties: specialtiesRes.data || [],
        clinics: clinicsRes.data || [],
        shifts: shiftsRes.data || [],
        services: servicesRes.data || [],
        workSchedules: schedulesRes.data || [],
        appointments: appointmentsRes.data || [],
        appointmentRequests: requestsRes.data || [],
        medicalRecords: recordsRes.data || [],
        bills: billsRes.data || [],
        billItems: [],
        auditLogs: [],
      });
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const lookups = useMemo(() => ({
    getProfile: (id) => data.profiles.find((x) => x.id === id || x.id === String(id)),
    getDoctor: (id) => data.doctors.find((x) => x.id === id || x.id === String(id)),
    getSpecialty: (id) => data.specialties.find((x) => x.id === id || x.id === String(id)),
    getClinic: (id) => data.clinics.find((x) => x.id === id || x.id === String(id)),
    getShift: (id) => data.shifts.find((x) => x.id === id || x.id === String(id)),
    getWorkSchedule: (id) => data.workSchedules.find((x) => x.id === id || x.id === String(id)),
    getPatient: (id) => data.patients.find((x) => x.id === id || x.id === String(id)),
    getAppointment: (id) => data.appointments.find((x) => x.id === id || x.id === String(id)),
    getMedicalRecord: (id) => data.medicalRecords.find((x) => x.id === id || x.id === String(id)),
    getService: (id) => data.services.find((x) => x.id === id || x.id === String(id)),
    getBill: (id) => data.bills.find((x) => x.id === id || x.id === String(id)),
    profileName: (profileId) => {
      const profile = data.profiles.find((x) => x.id === profileId || x.id === String(profileId));
      if (!profile) return '—';
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || '—';
    },
    patientName: (patientId) => {
      const patient = data.patients.find((x) => x.id === patientId || x.id === String(patientId));
      if (!patient) return '—';
      if (patient.fullName) return patient.fullName;
      const profile = data.profiles.find((x) => x.id === patient.profile_id || x.id === String(patient.profile_id));
      if (profile) return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || '—';
      return patientId;
    },
    doctorName: (doctorId) => {
      const doctor = data.doctors.find((x) => x.id === doctorId || x.id === String(doctorId));
      if (!doctor) return '—';
      const profile = data.profiles.find((x) => x.id === doctor.profile_id || x.id === String(doctor.profile_id));
      if (profile) return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || '—';
      return doctorId;
    },
  }), [data]);

  // CRUD operations
  const savePatient = useCallback(async (payload, actorId) => {
    try {
      const dataToSave = {
        ...payload,
        profile_id: payload.profileId || payload.profile_id,
        first_name: payload.firstName || payload.first_name,
        last_name: payload.lastName || payload.last_name,
        date_of_birth: normalizeDateForApi(payload.dateOfBirth || payload.date_of_birth),
      };
      if (payload.id) {
        await api.updatePatient(payload.id, dataToSave);
      } else {
        await api.createPatient(dataToSave);
      }
      notify('Đã lưu hồ sơ bệnh nhân.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi lưu bệnh nhân.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const saveDoctor = useCallback(async (payload, actorId) => {
    try {
      const dataToSave = {
        ...payload,
        profile_id: payload.profileId || payload.profile_id,
        specialty_id: payload.specialtyId || payload.specialty_id,
        clinic_id: payload.clinicId || payload.clinic_id,
      };
      if (payload.id) {
        await api.updateDoctor(payload.id, dataToSave);
      } else {
        await api.createDoctor(dataToSave);
      }
      notify('Đã lưu hồ sơ bác sĩ.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi lưu bác sĩ.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const saveSpecialty = useCallback(async (payload, actorId) => {
    try {
      const dataToSave = {
        name: payload.name,
        description: payload.description,
        status: payload.status,
      };
      if (payload.id) {
        await api.updateSpecialty(payload.id, dataToSave);
      } else {
        await api.createSpecialty(dataToSave);
      }
      notify('Đã lưu chuyên khoa.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi lưu chuyên khoa.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const saveClinic = useCallback(async (payload, actorId) => {
    try {
      const dataToSave = {
        name: payload.name,
        location: payload.location,
        is_reserve: payload.isReserve !== undefined ? payload.isReserve : payload.is_reserve,
      };
      if (payload.id) {
        await api.updateClinic(payload.id, dataToSave);
      } else {
        await api.createClinic(dataToSave);
      }
      notify('Đã lưu phòng khám.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi lưu phòng khám.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const saveShift = useCallback(async (payload, actorId) => {
    try {
      const dataToSave = {
        name: payload.name || payload.shiftName,
        start_time: payload.startTime || payload.start_time,
        end_time: payload.endTime || payload.end_time,
        max_patients: payload.maxPatients || payload.max_patients,
      };
      if (payload.id) {
        await api.updateShift(payload.id, dataToSave);
      } else {
        await api.createShift(dataToSave);
      }
      notify('Đã lưu ca làm việc.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi lưu ca làm việc.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const saveService = useCallback(async (payload, actorId) => {
    try {
      const dataToSave = {
        name: payload.name,
        price: payload.price,
        description: payload.description,
        unit: payload.unit,
      };
      if (payload.id) {
        await api.updateService(payload.id, dataToSave);
      } else {
        await api.createService(dataToSave);
      }
      notify('Đã lưu dịch vụ.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi lưu dịch vụ.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const saveSchedule = useCallback(async (payload, actorId) => {
    try {
      const dataToSave = {
        doctor_id: payload.doctorId || payload.doctor_id,
        clinic_id: payload.clinicId || payload.clinic_id,
        shift_id: payload.shiftId || payload.shift_id,
        work_date: normalizeDateForApi(payload.workDate || payload.work_date),
      };
      if (payload.id) {
        await api.updateWorkSchedule(payload.id, dataToSave);
      } else {
        await api.createWorkSchedule(dataToSave);
      }
      notify('Đã lưu lịch làm việc.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi lưu lịch làm việc.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const saveAppointment = useCallback(async (payload, actorId) => {
    try {
      // Normalize datetime values for MySQL DATETIME format
      const normalizeDateTimeForApi = (value) => {
        if (!value) return null;
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return value;
        if (typeof value === 'string' && value.includes('T')) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toISOString().slice(0, 19).replace('T', ' ');
          }
        }
        return value;
      };

      const dataToSave = {
        patient_id: payload.patientId || payload.patient_id,
        doctor_id: payload.doctorId || payload.doctor_id,
        work_schedule_id: payload.workScheduleId || payload.work_schedule_id,
        start_time: normalizeDateTimeForApi(payload.startTime || payload.start_time),
        end_time: normalizeDateTimeForApi(payload.endTime || payload.end_time),
        reason: payload.reason,
      };
      if (payload.id) {
        await api.updateAppointment(payload.id, dataToSave);
      } else {
        await api.createAppointment(dataToSave);
      }
      notify('Đã lưu lịch hẹn.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi lưu lịch hẹn.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const updateAppointmentStatus = useCallback(async (id, status, actorId) => {
    try {
      await api.updateAppointmentStatus(id, status);
      notify('Đã cập nhật trạng thái lịch hẹn.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi cập nhật trạng thái.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const createRequest = useCallback(async (payload, actorId) => {
    try {
      await api.createAppointmentRequest({
        appointment_id: payload.appointmentId || payload.appointment_id,
        patient_id: payload.patientId || payload.patient_id,
        doctor_id: payload.doctorId || payload.doctor_id,
        specialty_id: payload.specialtyId || payload.specialty_id,
        shift_id: payload.shiftId || payload.shift_id,
        action: payload.action,
        reason: payload.detail || payload.reason,
      });
      notify('Đã gửi yêu cầu.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi gửi yêu cầu.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const resolveRequest = useCallback(async (id, status, actorId) => {
    try {
      if (status === 'APPROVED') {
        await api.approveAppointmentRequest(id);
      } else {
        await api.rejectAppointmentRequest(id, 'Rejected by admin');
      }
      notify(status === 'APPROVED' ? 'Đã duyệt yêu cầu.' : 'Đã từ chối yêu cầu.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi xử lý yêu cầu.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const saveMedicalRecord = useCallback(async (payload, actorId) => {
    try {
      const dataToSave = {
        appointment_id: payload.appointmentId || payload.appointment_id,
        symptoms: payload.symptoms,
        diagnosis: payload.diagnosis,
        result: payload.result,
        prescription: payload.prescription,
        note: payload.note,
      };
      if (payload.id) {
        await api.updateMedicalRecord(payload.id, dataToSave);
      } else {
        await api.createMedicalRecord(dataToSave);
      }
      notify('Đã lưu bệnh án.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi lưu bệnh án.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const finalizeMedicalRecord = useCallback(async (id, actorId) => {
    try {
      await api.finalizeMedicalRecord(id);
      notify('Đã hoàn tất bệnh án.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi hoàn tất bệnh án.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const saveBill = useCallback(async (payload, items, actorId) => {
    try {
      const dataToSave = {
        medical_record_id: payload.medicalRecordId || payload.medical_record_id,
      };
      let billId = payload.id;
      if (!billId) {
        const result = await api.createBill(dataToSave);
        billId = result.data?.id;
      }
      if (items && items.length > 0) {
        for (const item of items) {
          await api.addBillItem(billId, {
            service_id: item.serviceId || item.service_id,
            quantity: item.quantity,
            price: item.price,
          });
        }
      }
      notify('Đã lưu hóa đơn.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi lưu hóa đơn.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const confirmPayment = useCallback(async (id, paymentMethod, actorId) => {
    try {
      await api.confirmPayment(id, paymentMethod);
      notify('Đã xác nhận thanh toán.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi xác nhận thanh toán.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const saveAccount = useCallback(async (payload, actorId) => {
    try {
      const dataToSave = {
        username: payload.username,
        password: payload.password,
        role: payload.role,
        first_name: payload.firstName || payload.first_name,
        last_name: payload.lastName || payload.last_name,
        email: payload.email,
        phone: payload.phone,
        date_of_birth: normalizeDateForApi(payload.dateOfBirth || payload.date_of_birth),
        gender: payload.gender,
      };
      if (payload.id) {
        await api.updateProfile(payload.id, dataToSave);
      } else {
        await api.createProfile(dataToSave);
      }
      notify('Đã lưu tài khoản.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi lưu tài khoản.', 'error');
      return false;
    }
  }, [loadAllData, notify]);

  const toggleAccountStatus = useCallback(async (id, actorId) => {
    try {
      const profile = data.profiles.find((x) => x.id === id || x.id === String(id));
      if (!profile) return false;
      await api.updateProfile(id, { is_deleted: profile.is_deleted ? 0 : 1 });
      notify('Đã cập nhật trạng thái tài khoản.');
      await loadAllData();
      return true;
    } catch (err) {
      notify(err.message || 'Lỗi khi cập nhật trạng thái.', 'error');
      return false;
    }
  }, [data.profiles, loadAllData, notify]);

  const recordLogin = useCallback(async (profileId) => {
    // Login is already recorded by backend
  }, []);

  const value = {
    db: data,
    toast,
    loading,
    error,
    notify,
    loadAllData,
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
