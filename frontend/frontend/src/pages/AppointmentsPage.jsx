import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { api } from '../api/client';
import { formatDateTime, formatTime } from '../utils/helpers';

const empty = {
  patientId: '',
  doctorId: '',
  workScheduleId: '',
  startTime: '',
  endTime: '',
  reason: '',
};

function sameId(a, b) {
  return String(a ?? '') === String(b ?? '');
}

function getDateOnly(value) {
  if (!value) return '';
  return String(value).split('T')[0].split(' ')[0];
}

function getTimeOnly(value) {
  if (!value) return '';

  const text = String(value);

  // Case: "09:30:00"
  if (/^\d{2}:\d{2}/.test(text)) {
    return text.slice(0, 5);
  }

  // Case: "2026-05-10T09:30:00" hoặc "2026-05-10 09:30:00"
  if (text.includes('T')) {
    return text.split('T')[1].slice(0, 5);
  }

  if (text.includes(' ')) {
    return text.split(' ')[1].slice(0, 5);
  }

  return text.slice(0, 5);
}

function makeDateTimeLocal(dateStr, timeStr) {
  const date = getDateOnly(dateStr);
  const time = getTimeOnly(timeStr);

  if (!date || !time) return '';

  return `${date}T${time}`;
}

function normalizeDateTimeLocal(value) {
  if (!value) return '';
  return String(value).replace(' ', 'T').slice(0, 16);
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const {
    db,
    saveAppointment,
    patientName,
    doctorName,
    loadAllData,
    notify,
  } = useClinic();

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [filters, setFilters] = useState({
    date: '',
    status: '',
    doctorId: '',
    patientId: '',
  });

  const currentDoctor = useMemo(() => {
    return db.doctors.find((item) => sameId(item.profile_id, user?.id));
  }, [db.doctors, user?.id]);

  const currentPatient = useMemo(() => {
    return db.patients.find((item) => sameId(item.profile_id, user?.id));
  }, [db.patients, user?.id]);

  const selectedSchedule = useMemo(() => {
    if (!form.workScheduleId) return null;

    return db.workSchedules.find((ws) => sameId(ws.id, form.workScheduleId));
  }, [db.workSchedules, form.workScheduleId]);

  const selectedShift = useMemo(() => {
    if (!selectedSchedule) return null;

    return db.shifts.find((shift) => sameId(shift.id, selectedSchedule.shift_id));
  }, [db.shifts, selectedSchedule]);

  const scheduleStartLimit = selectedSchedule && selectedShift
    ? makeDateTimeLocal(selectedSchedule.work_date, selectedShift.start_time)
    : '';

  const scheduleEndLimit = selectedSchedule && selectedShift
    ? makeDateTimeLocal(selectedSchedule.work_date, selectedShift.end_time)
    : '';

  useEffect(() => {
    if (!form.workScheduleId) return;
    if (!scheduleStartLimit || !scheduleEndLimit) return;

    setForm((prev) => {
      if (
        prev.startTime === scheduleStartLimit &&
        prev.endTime === scheduleEndLimit
      ) {
        return prev;
      }

      return {
        ...prev,
        startTime: scheduleStartLimit,
        endTime: scheduleEndLimit,
      };
    });
  }, [form.workScheduleId, scheduleStartLimit, scheduleEndLimit]);

  const scopedAppointments = useMemo(() => db.appointments.filter((item) => {
    if (user?.role === 'DOCTOR') return sameId(item.doctor_id, currentDoctor?.id);
    if (user?.role === 'PATIENT') return sameId(item.patient_id, currentPatient?.id);
    return true;
  }), [db.appointments, user?.role, currentDoctor?.id, currentPatient?.id]);

  const rows = useMemo(() => scopedAppointments.filter((item) => {
    const startTime = item.start_time || '';
    const itemDate = getDateOnly(startTime);

    if (filters.date && itemDate !== filters.date) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.doctorId && !sameId(item.doctor_id, filters.doctorId)) return false;
    if (filters.patientId && !sameId(item.patient_id, filters.patientId)) return false;

    return true;
  }).map((item) => ({
    ...item,
    patient: patientName(item.patient_id),
    doctor: doctorName(item.doctor_id),
  })), [scopedAppointments, filters, patientName, doctorName]);

  const queueStats = [
    ['Đã đặt lịch', scopedAppointments.filter((x) => x.status === 'SCHEDULED').length],
    ['Chờ khám', scopedAppointments.filter((x) => x.status === 'WAITING').length],
    ['Đang khám', scopedAppointments.filter((x) => x.status === 'INPROGRESS').length],
    ['Hoàn tất', scopedAppointments.filter((x) => x.status === 'COMPLETED').length],
  ];

  const workScheduleOptions = useMemo(() => {
    if (!form.doctorId) return [];

    return db.workSchedules
      .filter((ws) => sameId(ws.doctor_id, form.doctorId))
      .map((ws) => {
        const shift = db.shifts.find((item) => sameId(item.id, ws.shift_id));
        const range = shift
          ? `${formatTime(shift.start_time)}–${formatTime(shift.end_time)}`
          : '';

        return {
          value: ws.id,
          label: `${getDateOnly(ws.work_date)} • ${range}`,
        };
      });
  }, [db.workSchedules, db.shifts, form.doctorId]);

  const fields = [
    {
      name: 'patientId',
      label: 'Bệnh nhân',
      type: 'select',
      required: true,
      options: db.patients.map((x) => ({
        value: x.id,
        label: patientName(x.id),
      })),
    },
    {
      name: 'doctorId',
      label: 'Bác sĩ',
      type: 'select',
      required: true,
      options: db.doctors.map((x) => ({
        value: x.id,
        label: doctorName(x.id),
      })),
    },
    {
      name: 'workScheduleId',
      label: 'Lịch làm việc',
      type: 'select',
      required: true,
      disabled: !form.doctorId,
      placeholder: form.doctorId ? 'Chọn' : 'Chọn bác sĩ trước',
      options: workScheduleOptions,
    },
    {
      name: 'startTime',
      label: 'Thời gian bắt đầu',
      type: 'datetime-local',
      required: true,
      min: scheduleStartLimit || undefined,
      max: scheduleEndLimit || undefined,
      step: 60,
      disabled: !form.workScheduleId,
    },
    {
      name: 'endTime',
      label: 'Thời gian kết thúc',
      type: 'datetime-local',
      required: true,
      min: scheduleStartLimit || undefined,
      max: scheduleEndLimit || undefined,
      step: 60,
      disabled: !form.workScheduleId,
    },
    {
      name: 'reason',
      label: 'Lý do khám',
      type: 'textarea',
      full: true,
    },
  ];

  const columns = [
    { key: 'id', label: 'Mã lịch' },
    { key: 'patient', label: 'Bệnh nhân' },
    { key: 'doctor', label: 'Bác sĩ' },
    {
      key: 'startTime',
      label: 'Thời gian',
      render: (row) => formatDateTime(row.start_time),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="action-row wrap">
          {(user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') && row.status === 'SCHEDULED' && (
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await api.checkInAppointment(row.id);
                  notify('Đã tiếp nhận bệnh nhân (Check-in)');
                  await loadAllData();
                } catch (err) {
                  notify(err.message || 'Check-in thất bại', 'error');
                }
              }}
            >
              Check-in
            </button>
          )}

          {(user?.role === 'ADMIN' || user?.role === 'DOCTOR') && row.status === 'WAITING' && (
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await api.updateAppointmentStatus(row.id, 'INPROGRESS');
                  notify('Đã bắt đầu khám');
                  await loadAllData();
                } catch (err) {
                  notify(err.message || 'Không thể bắt đầu khám', 'error');
                }
              }}
            >
              Bắt đầu khám
            </button>
          )}

          {(user?.role === 'ADMIN' || user?.role === 'DOCTOR') && row.status === 'INPROGRESS' && (
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await api.updateAppointmentStatus(row.id, 'COMPLETED');
                  notify('Đã hoàn tất khám');
                  await loadAllData();
                } catch (err) {
                  notify(err.message || 'Không thể hoàn tất', 'error');
                }
              }}
            >
              Hoàn tất
            </button>
          )}

          {!['CANCELLED', 'COMPLETED'].includes(row.status) && (
            <button
              className="text-button danger-text"
              onClick={async () => {
                if (!window.confirm('Hủy lịch hẹn này?')) return;

                try {
                  await api.cancelAppointment(row.id);
                  notify('Đã hủy lịch hẹn');
                  await loadAllData();
                } catch (err) {
                  notify(err.message || 'Không thể hủy lịch hẹn', 'error');
                }
              }}
            >
              Hủy lịch
            </button>
          )}
        </div>
      ),
    },
  ];

  function onFieldChange(name, value) {
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === 'doctorId') {
        next.workScheduleId = '';
        next.startTime = '';
        next.endTime = '';
      }

      if (name === 'workScheduleId') {
        const ws = db.workSchedules.find((item) => sameId(item.id, value));

        if (!ws) {
          next.startTime = '';
          next.endTime = '';
          return next;
        }

        const shift = db.shifts.find((item) => sameId(item.id, ws.shift_id));

        if (!shift) {
          next.startTime = '';
          next.endTime = '';
          return next;
        }

        next.startTime = makeDateTimeLocal(ws.work_date, shift.start_time);
        next.endTime = makeDateTimeLocal(ws.work_date, shift.end_time);
      }

      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();

    let payload = form;

    if (user?.role === 'PATIENT') {
      if (!currentPatient?.id) {
        notify('Tài khoản chưa có hồ sơ bệnh nhân. Vui lòng liên hệ lễ tân/admin để tạo hồ sơ bệnh nhân.', 'error');
        return;
      }

      payload = {
        ...form,
        patientId: currentPatient.id,
      };
    }

    if (!payload.patientId || !payload.doctorId || !payload.workScheduleId || !payload.startTime || !payload.endTime) {
      notify('Vui lòng điền đủ thông tin bắt buộc', 'error');
      return;
    }

    const start = normalizeDateTimeLocal(payload.startTime);
    const end = normalizeDateTimeLocal(payload.endTime);

    if (start >= end) {
      notify('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc', 'error');
      return;
    }

    if (scheduleStartLimit && scheduleEndLimit) {
      if (start < scheduleStartLimit || start > scheduleEndLimit) {
        notify(
          `Thời gian bắt đầu phải nằm trong ca ${scheduleStartLimit.replace('T', ' ')} đến ${scheduleEndLimit.replace('T', ' ')}`,
          'error'
        );
        return;
      }

      if (end < scheduleStartLimit || end > scheduleEndLimit) {
        notify(
          `Thời gian kết thúc phải nằm trong ca ${scheduleStartLimit.replace('T', ' ')} đến ${scheduleEndLimit.replace('T', ' ')}`,
          'error'
        );
        return;
      }
    }

    const ok = await saveAppointment(
      editing === 'new' ? payload : { ...payload, id: editing },
      user?.id
    );

    if (ok) {
      setEditing(null);
      setForm(empty);
    }
  }

  function openCreateForm() {
    if (user?.role === 'PATIENT' && !currentPatient?.id) {
      notify('Tài khoản chưa có hồ sơ bệnh nhân. Vui lòng liên hệ lễ tân/admin để tạo hồ sơ bệnh nhân.', 'error');
      return;
    }

    setEditing('new');
    setForm(user?.role === 'PATIENT'
      ? { ...empty, patientId: currentPatient?.id || '' }
      : empty
    );
  }

  return (
    <section>
      <PageHeader
        title="Lịch hẹn khám"
        subtitle="Quản lý lịch hẹn và trạng thái khám."
        action={
          user?.role !== 'DOCTOR' ? (
            <button className="button" onClick={openCreateForm}>
              Tạo lịch hẹn
            </button>
          ) : null
        }
      />

      <div className="stats-grid compact-stats">
        {queueStats.map(([title, value]) => (
          <div className="card stat-card" key={title}>
            <span>{title}</span>
            <strong>{value}</strong>
            <small>Theo trạng thái lịch hẹn</small>
          </div>
        ))}
      </div>

      <div className="filters card filter-grid">
        <label>
          <span>Ngày khám</span>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </label>

        <label>
          <span>Trạng thái</span>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Tất cả</option>
            <option value="SCHEDULED">Đã đặt lịch</option>
            <option value="WAITING">Chờ khám</option>
            <option value="INPROGRESS">Đang khám</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </label>

        {user?.role !== 'DOCTOR' && (
          <label>
            <span>Bác sĩ</span>
            <select
              value={filters.doctorId}
              onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}
            >
              <option value="">Tất cả bác sĩ</option>
              {db.doctors.map((x) => (
                <option key={x.id} value={x.id}>
                  {doctorName(x.id)}
                </option>
              ))}
            </select>
          </label>
        )}

        {user?.role !== 'PATIENT' && (
          <label>
            <span>Bệnh nhân</span>
            <select
              value={filters.patientId}
              onChange={(e) => setFilters({ ...filters, patientId: e.target.value })}
            >
              <option value="">Tất cả bệnh nhân</option>
              {db.patients.map((x) => (
                <option key={x.id} value={x.id}>
                  {patientName(x.id)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {editing ? (
        <EntityForm
          title={editing === 'new' ? 'Tạo lịch hẹn khám' : 'Cập nhật lịch hẹn'}
          fields={fields.filter((field) => !(user?.role === 'PATIENT' && field.name === 'patientId'))}
          value={form}
          onChange={onFieldChange}
          onSubmit={submit}
          onCancel={() => {
            setEditing(null);
            setForm(empty);
          }}
        />
      ) : null}

      <DataTable columns={columns} rows={rows} emptyMessage="Chưa có lịch hẹn." />
    </section>
  );
}