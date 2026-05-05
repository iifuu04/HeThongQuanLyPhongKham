import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { api } from '../api/client';
import { formatDateTime, formatTime } from '../utils/helpers';

const empty = { patientId: '', doctorId: '', workScheduleId: '', startTime: '', endTime: '', reason: '' };

// Combine work_date + shift.start_time into datetime-local string YYYY-MM-DDTHH:mm
function makeDateTimeLocal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '';
  const date = String(dateStr).split('T')[0];
  const time = String(timeStr).slice(0, 5);
  return `${date}T${time}`;
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { db, saveAppointment, patientName, doctorName, getWorkSchedule, getShift, loadAllData, notify } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [filters, setFilters] = useState({ date: '', status: '', doctorId: '', patientId: '' });

  const currentDoctor = db.doctors.find((item) => item.profile_id === user?.id);
  const currentPatient = db.patients.find((item) => item.profile_id === user?.id);

  const scopedAppointments = useMemo(() => db.appointments.filter((item) => {
    if (user?.role === 'DOCTOR') return item.doctor_id === currentDoctor?.id;
    if (user?.role === 'PATIENT') return item.patient_id === currentPatient?.id;
    return true;
  }), [db.appointments, user, currentDoctor, currentPatient]);

  const rows = useMemo(() => scopedAppointments.filter((item) => {
    const startTime = item.start_time || '';
    const itemDate = String(startTime).split('T')[0];
    if (filters.date && itemDate !== filters.date) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.doctorId && item.doctor_id !== filters.doctorId) return false;
    if (filters.patientId && item.patient_id !== filters.patientId) return false;
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

  // Work schedule options filtered by selected doctor
  const workScheduleOptions = useMemo(() => {
    if (!form.doctorId) return [];
    return db.workSchedules
      .filter((ws) => ws.doctor_id === form.doctorId)
      .map((ws) => {
        const shift = getShift(ws.shift_id);
        const range = shift ? `${formatTime(shift.start_time)}–${formatTime(shift.end_time)}` : '';
        return {
          value: ws.id,
          label: `${ws.work_date} • ${range}`,
        };
      });
  }, [db.workSchedules, form.doctorId, getShift]);

  const fields = [
    { name: 'patientId', label: 'Bệnh nhân', type: 'select', options: db.patients.map((x) => ({ value: x.id, label: patientName(x.id) })) },
    { name: 'doctorId', label: 'Bác sĩ', type: 'select', options: db.doctors.map((x) => ({ value: x.id, label: doctorName(x.id) })) },
    { name: 'workScheduleId', label: 'Lịch làm việc', type: 'select', options: workScheduleOptions },
    { name: 'startTime', label: 'Thời gian bắt đầu', type: 'datetime-local' },
    { name: 'endTime', label: 'Thời gian kết thúc', type: 'datetime-local' },
    { name: 'reason', label: 'Lý do khám', type: 'textarea', full: true },
  ];

  const columns = [
    { key: 'id', label: 'Mã lịch' },
    { key: 'patient', label: 'Bệnh nhân' },
    { key: 'doctor', label: 'Bác sĩ' },
    { key: 'startTime', label: 'Thời gian', render: (row) => formatDateTime(row.start_time) },
    { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="action-row wrap">
          {/* Check-in: SCHEDULED -> WAITING (Receptionist/Admin) */}
          {(user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') && row.status === 'SCHEDULED' && (
            <button className="text-button" onClick={async () => {
              try {
                await api.checkInAppointment(row.id);
                notify('Đã tiếp nhận bệnh nhân (Check-in)');
                await loadAllData();
              } catch (err) {
                notify(err.message || 'Check-in thất bại', 'error');
              }
            }}>Check-in</button>
          )}
          {/* Start: WAITING -> INPROGRESS (Doctor/Admin) */}
          {(user?.role === 'ADMIN' || user?.role === 'DOCTOR') && row.status === 'WAITING' && (
            <button className="text-button" onClick={async () => {
              try {
                await api.updateAppointmentStatus(row.id, 'INPROGRESS');
                notify('Đã bắt đầu khám');
                await loadAllData();
              } catch (err) {
                notify(err.message || 'Không thể bắt đầu khám', 'error');
              }
            }}>Bắt đầu khám</button>
          )}
          {/* Complete: INPROGRESS -> COMPLETED (Doctor/Admin) */}
          {(user?.role === 'ADMIN' || user?.role === 'DOCTOR') && row.status === 'INPROGRESS' && (
            <button className="text-button" onClick={async () => {
              try {
                await api.updateAppointmentStatus(row.id, 'COMPLETED');
                notify('Đã hoàn tất khám');
                await loadAllData();
              } catch (err) {
                notify(err.message || 'Không thể hoàn tất', 'error');
              }
            }}>Hoàn tất</button>
          )}
          {/* Cancel: not COMPLETED/CANCELLED */}
          {!['CANCELLED', 'COMPLETED'].includes(row.status) && (
            <button className="text-button danger-text" onClick={async () => {
              if (!window.confirm('Hủy lịch hẹn này?')) return;
              try {
                await api.cancelAppointment(row.id);
                notify('Đã hủy lịch hẹn');
                await loadAllData();
              } catch (err) {
                notify(err.message || 'Không thể hủy lịch hẹn', 'error');
              }
            }}>Hủy lịch</button>
          )}
        </div>
      ),
    },
  ];

  function onFieldChange(name, value) {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'doctorId') {
        next.workScheduleId = '';
        next.startTime = '';
        next.endTime = '';
      }
      // Auto-fill start/end time from selected work schedule
      if (name === 'workScheduleId' && value) {
        const ws = getWorkSchedule(value);
        const shift = ws ? getShift(ws.shift_id) : null;
        if (ws && shift) {
          next.startTime = makeDateTimeLocal(ws.work_date, shift.start_time);
          next.endTime = makeDateTimeLocal(ws.work_date, shift.end_time);
        }
      }
      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (user?.role === 'PATIENT' && !currentPatient?.id) {
      notify('Tài khoản chưa liên kết hồ sơ bệnh nhân', 'error');
      return;
    }
    const payload = user?.role === 'PATIENT' ? { ...form, patientId: currentPatient.id } : form;
    if (!payload.patientId || !payload.doctorId || !payload.workScheduleId || !payload.startTime || !payload.endTime) {
      notify('Vui lòng điền đủ thông tin bắt buộc', 'error');
      return;
    }
    const ok = await saveAppointment(editing === 'new' ? payload : { ...payload, id: editing }, user?.id);
    if (ok) {
      setEditing(null);
      setForm(empty);
    }
  }

  return (
    <section>
      <PageHeader
        title="Lịch hẹn khám"
        subtitle="Quản lý lịch hẹn và trạng thái khám."
        action={
          (user?.role !== 'DOCTOR') ? (
            <button className="button" onClick={() => {
              setEditing('new');
              setForm(user?.role === 'PATIENT' ? { ...empty, patientId: currentPatient?.id || '' } : empty);
            }}>Tạo lịch hẹn</button>
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
          <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        </label>
        <label>
          <span>Trạng thái</span>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
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
            <select value={filters.doctorId} onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}>
              <option value="">Tất cả bác sĩ</option>
              {db.doctors.map((x) => <option key={x.id} value={x.id}>{doctorName(x.id)}</option>)}
            </select>
          </label>
        )}
        {user?.role !== 'PATIENT' && (
          <label>
            <span>Bệnh nhân</span>
            <select value={filters.patientId} onChange={(e) => setFilters({ ...filters, patientId: e.target.value })}>
              <option value="">Tất cả bệnh nhân</option>
              {db.patients.map((x) => <option key={x.id} value={x.id}>{patientName(x.id)}</option>)}
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
          onCancel={() => { setEditing(null); setForm(empty); }}
        />
      ) : null}
      <DataTable columns={columns} rows={rows} emptyMessage="Chưa có lịch hẹn." />
    </section>
  );
}
