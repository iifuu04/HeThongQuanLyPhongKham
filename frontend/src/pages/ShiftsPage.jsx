import { useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { formatTime } from '../utils/helpers';

const empty = { startTime: '', endTime: '', maxPatients: 12 };

export default function ShiftsPage() {
  const { user } = useAuth();
  const { db, saveShift } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const columns = [
    { key: 'id', label: 'Mã ca' },
    { key: 'startTime', label: 'Bắt đầu', render: (row) => formatTime(row.startTime) },
    { key: 'endTime', label: 'Kết thúc', render: (row) => formatTime(row.endTime) },
    { key: 'maxPatients', label: 'Số bệnh nhân tối đa' },
    { key: 'actions', label: 'Thao tác', render: (row) => <button className="text-button" onClick={() => { setEditing(row.id); setForm(row); }}>Cập nhật</button> },
  ];

  const fields = [
    { name: 'startTime', label: 'Giờ bắt đầu', type: 'time' },
    { name: 'endTime', label: 'Giờ kết thúc', type: 'time' },
    { name: 'maxPatients', label: 'Số bệnh nhân tối đa', type: 'number' },
  ];

  function submit(event) {
    event.preventDefault();
    saveShift(editing === 'new' ? form : { ...form, id: editing }, user.id);
    setEditing(null);
    setForm(empty);
  }

  return <section><PageHeader title="Ca khám" subtitle="Quản lý danh mục ca khám." action={<button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>Thêm ca khám</button>} />{editing ? <EntityForm title={editing === 'new' ? 'Tạo ca khám' : 'Cập nhật ca khám'} fields={fields} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => setEditing(null)} /> : null}<DataTable columns={columns} rows={db.shifts} /></section>;
}
