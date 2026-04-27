import { useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { formatDate } from '../utils/helpers';

const empty = { name: '', establishAt: '', description: '', status: 'ACTIVE' };

export default function SpecialtiesPage() {
  const { user } = useAuth();
  const { db, saveSpecialty } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const columns = [
    { key: 'id', label: 'Mã CK' },
    { key: 'name', label: 'Tên chuyên khoa' },
    { key: 'establishAt', label: 'Ngày thành lập', render: (row) => formatDate(row.establishAt) },
    { key: 'description', label: 'Mô tả' },
    { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'actions', label: 'Thao tác', render: (row) => <button className="text-button" onClick={() => { setEditing(row.id); setForm(row); }}>Cập nhật</button> },
  ];

  const fields = [
    { name: 'name', label: 'Tên chuyên khoa' },
    { name: 'establishAt', label: 'Ngày thành lập', type: 'date' },
    { name: 'status', label: 'Trạng thái', type: 'select', options: [{ value: 'ACTIVE', label: 'Đang hoạt động' }, { value: 'LOCKED', label: 'Tạm khóa' }] },
    { name: 'description', label: 'Mô tả', type: 'textarea', full: true },
  ];

  function submit(event) {
    event.preventDefault();
    saveSpecialty(editing === 'new' ? form : { ...form, id: editing }, user.id);
    setEditing(null);
    setForm(empty);
  }

  return <section><PageHeader title="Chuyên khoa" subtitle="Quản lý danh mục chuyên khoa." action={<button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>Thêm chuyên khoa</button>} />{editing ? <EntityForm title={editing === 'new' ? 'Tạo chuyên khoa' : 'Cập nhật chuyên khoa'} fields={fields} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => setEditing(null)} /> : null}<DataTable columns={columns} rows={db.specialties} /></section>;
}
