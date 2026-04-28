import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { formatDate, formatTime } from '../utils/helpers';

const empty = { doctorId: '', clinicId: '', shiftId: '', workDate: '' };

// Format time from "HH:mm:ss" to "HH:mm"
function formatShiftTime(value) {
  if (!value) return '—';
  if (typeof value === 'string' && value.includes(':')) {
    return value.substring(0, 5);
  }
  return String(value).substring(0, 5) || '—';
}

export default function SchedulesPage() {
  const { user } = useAuth();
  const { db, saveSchedule, doctorName, getClinic, getShift } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  // Map backend data to frontend format (snake_case to camelCase)
  const mappedSchedules = useMemo(() => {
    return db.workSchedules.map((item) => {
      const shift = getShift(item.shift_id);
      return {
        ...item,
        doctorId: item.doctor_id,
        clinicId: item.clinic_id,
        shiftId: item.shift_id,
        workDate: item.work_date,
        doctor: doctorName(item.doctor_id),
        clinic: getClinic(item.clinic_id)?.name || '—',
        shiftText: shift ? `${formatShiftTime(shift.start_time)} - ${formatShiftTime(shift.end_time)}` : '—',
      };
    });
  }, [db.workSchedules, doctorName, getClinic, getShift]);

  const columns = [
    { key: 'id', label: 'Mã lịch' },
    { key: 'doctor', label: 'Bác sĩ' },
    { key: 'workDate', label: 'Ngày làm', render: (row) => formatDate(row.work_date || row.workDate) },
    { key: 'shiftText', label: 'Ca làm' },
    { key: 'clinic', label: 'Phòng khám' },
    { key: 'actions', label: 'Thao tác', render: (row) => <button className="text-button" onClick={() => { setEditing(row.id); setForm({ doctorId: row.doctor_id, clinicId: row.clinic_id, shiftId: row.shift_id, workDate: row.work_date }); }}>Cập nhật</button> },
  ];

  const fields = [
    { name: 'doctorId', label: 'Bác sĩ', type: 'select', options: db.doctors.map((x) => ({ value: x.id, label: doctorName(x.id) || `${x.first_name || ''} ${x.last_name || ''}`.trim() })) },
    { name: 'workDate', label: 'Ngày làm việc', type: 'date' },
    { name: 'shiftId', label: 'Ca khám', type: 'select', options: db.shifts.map((x) => ({ value: x.id, label: `${formatShiftTime(x.start_time)} - ${formatShiftTime(x.end_time)}` })) },
    { name: 'clinicId', label: 'Phòng khám', type: 'select', options: db.clinics.map((x) => ({ value: x.id, label: x.name })) },
  ];

  function submit(event) {
    event.preventDefault();
    const dataToSave = {
      doctor_id: form.doctorId,
      clinic_id: form.clinicId,
      shift_id: form.shiftId,
      work_date: form.workDate
    };
    if (editing !== 'new') {
      dataToSave.id = editing;
    }
    if (saveSchedule(dataToSave, user.id)) {
      setEditing(null);
      setForm(empty);
    }
  }

  return <section><PageHeader title="Lịch làm việc" subtitle="Thiết lập lịch làm việc theo bác sĩ, phòng khám và ca khám." action={<button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>Tạo lịch làm việc</button>} />{editing ? <EntityForm title={editing === 'new' ? 'Tạo lịch làm việc' : 'Cập nhật lịch làm việc'} fields={fields} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => setEditing(null)} submitLabel={editing === 'new' ? 'Tạo' : 'Lưu'} /> : null}<DataTable columns={columns} rows={mappedSchedules} /></section>;
}
