import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';

const empty = { startTime: '', endTime: '', maxPatients: 12 };

// Format time from "HH:mm:ss" or "HH:mm" to "HH:mm"
function formatShiftTime(value) {
  if (!value) return '—';
  if (typeof value === 'string' && value.includes(':')) {
    return value.substring(0, 5);
  }
  return String(value).substring(0, 5) || '—';
}

export default function ShiftsPage() {
  const { user } = useAuth();
  const { db, saveShift } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  // Map backend data to frontend format (snake_case to camelCase)
  const mappedShifts = useMemo(() => {
    return db.shifts.map(s => ({
      ...s,
      startTime: s.start_time || s.startTime,
      endTime: s.end_time || s.endTime,
      maxPatients: s.max_patients || s.maxPatients
    }));
  }, [db.shifts]);

  const columns = [
    { key: 'id', label: 'Mã ca' },
    { key: 'startTime', label: 'Bắt đầu', render: (row) => formatShiftTime(row.start_time || row.startTime) },
    { key: 'endTime', label: 'Kết thúc', render: (row) => formatShiftTime(row.end_time || row.endTime) },
    { key: 'maxPatients', label: 'Số bệnh nhân tối đa', render: (row) => row.max_patients || row.maxPatients || '—' },
    { key: 'actions', label: 'Thao tác', render: (row) => <button className="text-button" onClick={() => { setEditing(row.id); setForm({ startTime: (row.start_time || row.startTime || '').substring(0, 5), endTime: (row.end_time || row.endTime || '').substring(0, 5), maxPatients: row.max_patients || row.maxPatients || 12 }); }}>Cập nhật</button> },
  ];

  const fields = [
    { name: 'startTime', label: 'Giờ bắt đầu', type: 'time' },
    { name: 'endTime', label: 'Giờ kết thúc', type: 'time' },
    { name: 'maxPatients', label: 'Số bệnh nhân tối đa', type: 'number' },
  ];

  function submit(event) {
    event.preventDefault();
    const dataToSave = {
      start_time: form.startTime,
      end_time: form.endTime,
      max_patients: form.maxPatients
    };
    if (editing !== 'new') {
      dataToSave.id = editing;
    }
    saveShift(dataToSave, user.id);
    setEditing(null);
    setForm(empty);
  }

  return <section><PageHeader title="Ca khám" subtitle="Quản lý danh mục ca khám." action={<button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>Thêm ca khám</button>} />{editing ? <EntityForm title={editing === 'new' ? 'Tạo ca khám' : 'Cập nhật ca khám'} fields={fields} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => setEditing(null)} submitLabel={editing === 'new' ? 'Tạo' : 'Lưu'} /> : null}<DataTable columns={columns} rows={mappedShifts} /></section>;
}
