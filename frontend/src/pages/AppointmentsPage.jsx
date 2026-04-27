import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { appointmentStatusLabel, formatDateTime } from '../utils/helpers';

const empty = { patientId: '', doctorId: '', workScheduleId: '', startTime: '', endTime: '', status: 'SCHEDULED', reason: '' };

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { db, saveAppointment, updateAppointmentStatus, createRequest, patientName, doctorName, getWorkSchedule, getDoctor } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [filters, setFilters] = useState({ date: '', status: '', doctorId: '', patientId: '' });
  const currentDoctor = db.doctors.find((item) => item.profileId === user.id);
  const currentPatient = db.patients.find((item) => item.profileId === user.id);

  const scopedAppointments = useMemo(() => db.appointments.filter((item) => {
    if (user.role === 'doctor') return item.doctorId === currentDoctor?.id;
    if (user.role === 'patient') return item.patientId === currentPatient?.id;
    return true;
  }), [db.appointments, user.role, currentDoctor, currentPatient]);

  const rows = useMemo(() => scopedAppointments.filter((item) => {
    if (filters.date && !String(item.startTime).startsWith(filters.date)) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.doctorId && item.doctorId !== filters.doctorId) return false;
    if (filters.patientId && item.patientId !== filters.patientId) return false;
    return true;
  }).map((item) => ({
    ...item,
    patient: patientName(item.patientId),
    doctor: doctorName(item.doctorId),
    scheduleText: (() => {
      const schedule = getWorkSchedule(item.workScheduleId);
      return schedule ? `${schedule.workDate} • BS ${doctorName(schedule.doctorId)}` : '—';
    })(),
  })), [scopedAppointments, filters, patientName, doctorName, getWorkSchedule]);

  const queueStats = [
    ['Đã đặt lịch', scopedAppointments.filter((x) => x.status === 'SCHEDULED').length],
    ['Chờ khám', scopedAppointments.filter((x) => x.status === 'WAITING').length],
    ['Đang khám', scopedAppointments.filter((x) => x.status === 'INPROGRESS').length],
    ['Hoàn tất', scopedAppointments.filter((x) => x.status === 'COMPLETED').length],
  ];

  const fields = [
    { name: 'patientId', label: 'Bệnh nhân', type: 'select', options: db.patients.map((x) => ({ value: x.id, label: patientName(x.id) })) },
    { name: 'doctorId', label: 'Bác sĩ', type: 'select', options: db.doctors.map((x) => ({ value: x.id, label: doctorName(x.id) })) },
    { name: 'workScheduleId', label: 'Lịch làm việc', type: 'select', options: db.workSchedules.map((x) => ({ value: x.id, label: `${doctorName(x.doctorId)} • ${x.workDate}` })) },
    { name: 'startTime', label: 'Thời gian bắt đầu', type: 'datetime-local' },
    { name: 'endTime', label: 'Thời gian kết thúc', type: 'datetime-local' },
    { name: 'reason', label: 'Lý do khám', type: 'textarea', full: true },
  ];

  const columns = [
    { key: 'id', label: 'Mã lịch' },
    { key: 'patient', label: 'Bệnh nhân' },
    { key: 'doctor', label: 'Bác sĩ' },
    { key: 'startTime', label: 'Thời gian', render: (row) => formatDateTime(row.startTime) },
    { key: 'reason', label: 'Lý do khám' },
    { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="action-row wrap">
          {(user.role === 'admin' || user.role === 'receptionist') && <button className="text-button" onClick={() => { setEditing(row.id); setForm(db.appointments.find((x) => x.id === row.id)); }}>Cập nhật</button>}
          {user.role === 'receptionist' && row.status === 'SCHEDULED' && <button className="text-button" onClick={() => updateAppointmentStatus(row.id, 'WAITING', user.id)}>Check-in</button>}
          {user.role === 'doctor' && row.status === 'WAITING' && <button className="text-button" onClick={() => updateAppointmentStatus(row.id, 'INPROGRESS', user.id)}>Bắt đầu khám</button>}
          {user.role === 'doctor' && row.status === 'INPROGRESS' && <button className="text-button" onClick={() => updateAppointmentStatus(row.id, 'COMPLETED', user.id)}>Hoàn tất</button>}
          {!['CANCELLED', 'COMPLETED'].includes(row.status) && <button className="text-button danger-text" onClick={() => createRequest({ appointmentId: row.id, patientId: row.patientId, doctorId: row.doctorId, specialtyId: getDoctor(row.doctorId)?.specialtyId, shiftId: getWorkSchedule(row.workScheduleId)?.shiftId, createdAt: new Date().toISOString().slice(0, 10), action: 'CANCEL', requestBy: user.id, detail: 'Yêu cầu hủy lịch hẹn từ giao diện' }, user.id)}>Yêu cầu hủy</button>}
        </div>
      ),
    },
  ];

  function submit(event) {
    event.preventDefault();
    const payload = user.role === 'patient' ? { ...form, patientId: currentPatient?.id } : form;
    if (saveAppointment(editing === 'new' ? payload : { ...payload, id: editing }, user.id)) {
      setEditing(null);
      setForm(empty);
    }
  }

  return <section><PageHeader title="Lịch hẹn khám" subtitle="Quản lý lịch hẹn và trạng thái khám." action={<button className="button" onClick={() => { setEditing('new'); setForm(user.role === 'patient' ? { ...empty, patientId: currentPatient?.id } : empty); }}>Tạo lịch hẹn</button>} />
  <div className="stats-grid compact-stats">{queueStats.map(([title, value]) => <div className="card stat-card" key={title}><span>{title}</span><strong>{value}</strong><small>{title === 'Chờ khám' ? 'Theo dõi hàng đợi phòng khám' : 'Theo trạng thái lịch hẹn'}</small></div>)}</div>
  <div className="filters card filter-grid">
    <label><span>Ngày khám</span><input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} /></label>
    <label><span>Trạng thái</span><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Tất cả</option><option value="SCHEDULED">Đã đặt lịch</option><option value="WAITING">Chờ khám</option><option value="INPROGRESS">Đang khám</option><option value="COMPLETED">Hoàn tất</option><option value="CANCELLED">Đã hủy</option></select></label>
    {user.role !== 'doctor' && <label><span>Bác sĩ</span><select value={filters.doctorId} onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}><option value="">Tất cả bác sĩ</option>{db.doctors.map((x) => <option key={x.id} value={x.id}>{doctorName(x.id)}</option>)}</select></label>}
    {user.role !== 'patient' && <label><span>Bệnh nhân</span><select value={filters.patientId} onChange={(e) => setFilters({ ...filters, patientId: e.target.value })}><option value="">Tất cả bệnh nhân</option>{db.patients.map((x) => <option key={x.id} value={x.id}>{patientName(x.id)}</option>)}</select></label>}
  </div>
  {editing ? <EntityForm title={editing === 'new' ? 'Tạo lịch hẹn khám' : 'Cập nhật lịch hẹn'} fields={fields.filter((field) => !(user.role === 'patient' && field.name === 'patientId'))} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => setEditing(null)} /> : null}
  <div className="content-grid-2 details-grid"><DataTable columns={columns} rows={rows} /><SectionCard title="Quy tắc lịch hẹn" subtitle="Các quy tắc nghiệp vụ đang áp dụng."><div className="metric-list"><div><span>Không trùng lịch theo work schedule và khung giờ</span><strong>Đang kiểm tra</strong></div><div><span>Không hủy lịch đã hoàn tất</span><strong>Đang kiểm tra</strong></div><div><span>Yêu cầu đã duyệt sẽ cập nhật trạng thái lịch hẹn</span><strong>Tự động</strong></div></div></SectionCard></div></section>;
}
