import { useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';

const empty = { name: '', location: '', isReserve: false };

export default function ClinicsPage() {
  const { user } = useAuth();
  const { db, saveClinic } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const columns = [
    { key: 'id', label: 'Mã PK' },
    { key: 'name', label: 'Tên phòng khám' },
    { key: 'location', label: 'Vị trí' },
    { key: 'reserve', label: 'Dự phòng', render: (row) => <StatusBadge value={row.isReserve ? 'ACTIVE' : 'LOCKED'} /> },
    { key: 'actions', label: 'Thao tác', render: (row) => <button className="text-button" onClick={() => { setEditing(row.id); setForm({ ...row, isReserve: String(row.isReserve) }); }}>Cập nhật</button> },
  ];

  const fields = [
    { name: 'name', label: 'Tên phòng khám' },
    { name: 'location', label: 'Vị trí' },
    { name: 'isReserve', label: 'Phòng dự phòng', type: 'select', options: [{ value: 'false', label: 'Không' }, { value: 'true', label: 'Có' }] },
  ];

  function submit(event) {
    event.preventDefault();
    saveClinic(editing === 'new' ? { ...form, isReserve: form.isReserve === 'true' } : { ...form, id: editing, isReserve: form.isReserve === 'true' }, user.id);
    setEditing(null);
    setForm(empty);
  }

  return <section><PageHeader title="Quản lý phòng khám" subtitle="Quản lý danh mục phòng khám." action={<button className="button" onClick={() => { setEditing('new'); setForm({ ...empty, isReserve: 'false' }); }}>Thêm phòng khám</button>} />{editing ? <EntityForm title={editing === 'new' ? 'Tạo phòng khám' : 'Cập nhật phòng khám'} fields={fields} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => setEditing(null)} /> : null}<DataTable columns={columns} rows={db.clinics} /></section>;
}
