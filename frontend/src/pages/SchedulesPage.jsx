import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { formatDate, formatTime } from '../utils/helpers';

const empty = { doctorId: '', clinicId: '', shiftId: '', workDate: '' };

export default function SchedulesPage() {
  const { user } = useAuth();
  const { db, saveSchedule, doctorName, getClinic, getShift } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const rows = useMemo(() => db.workSchedules.map((item) => {
    const shift = getShift(item.shiftId);
    return {
      ...item,
      doctor: doctorName(item.doctorId),
      clinic: getClinic(item.clinicId)?.name || '—',
      shiftText: shift ? `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}` : '—',
    };
  }), [db.workSchedules, doctorName, getClinic, getShift]);

  const columns = [
    { key: 'id', label: 'Mã lịch' },
    { key: 'doctor', label: 'Bác sĩ' },
    { key: 'workDate', label: 'Ngày làm', render: (row) => formatDate(row.workDate) },
    { key: 'shiftText', label: 'Ca làm' },
    { key: 'clinic', label: 'Phòng khám' },
    { key: 'actions', label: 'Thao tác', render: (row) => <button className="text-button" onClick={() => { setEditing(row.id); setForm(row); }}>Cập nhật</button> },
  ];

  const fields = [
    { name: 'doctorId', label: 'Bác sĩ', type: 'select', options: db.doctors.map((x) => ({ value: x.id, label: doctorName(x.id) })) },
    { name: 'workDate', label: 'Ngày làm việc', type: 'date' },
    { name: 'shiftId', label: 'Ca khám', type: 'select', options: db.shifts.map((x) => ({ value: x.id, label: `${formatTime(x.startTime)} - ${formatTime(x.endTime)}` })) },
    { name: 'clinicId', label: 'Phòng khám', type: 'select', options: db.clinics.map((x) => ({ value: x.id, label: x.name })) },
  ];

  function submit(event) {
    event.preventDefault();
    if (saveSchedule(editing === 'new' ? form : { ...form, id: editing }, user.id)) {
      setEditing(null);
      setForm(empty);
    }
  }

  return <section><PageHeader title="Lịch làm việc" subtitle="Thiết lập lịch làm việc theo bác sĩ, phòng khám và ca khám." action={<button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>Tạo lịch làm việc</button>} />{editing ? <EntityForm title={editing === 'new' ? 'Tạo lịch làm việc' : 'Cập nhật lịch làm việc'} fields={fields} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => setEditing(null)} /> : null}<DataTable columns={columns} rows={rows} /></section>;
}
