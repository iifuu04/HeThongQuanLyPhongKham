import { useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { formatCurrency } from '../utils/helpers';

const empty = { name: '', price: 0 };

export default function ServicesPage() {
  const { user } = useAuth();
  const { db, saveService } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const columns = [
    { key: 'id', label: 'Mã DV' },
    { key: 'name', label: 'Tên dịch vụ' },
    { key: 'price', label: 'Đơn giá', render: (row) => formatCurrency(row.price) },
    { key: 'actions', label: 'Thao tác', render: (row) => <button className="text-button" onClick={() => { setEditing(row.id); setForm(row); }}>Cập nhật</button> },
  ];

  const fields = [
    { name: 'name', label: 'Tên dịch vụ' },
    { name: 'price', label: 'Đơn giá', type: 'number' },
  ];

  function submit(event) {
    event.preventDefault();
    saveService(editing === 'new' ? form : { ...form, id: editing }, user.id);
    setEditing(null);
    setForm(empty);
  }

  return <section><PageHeader title="Dịch vụ" subtitle="Quản lý danh mục dịch vụ." action={<button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>Thêm dịch vụ</button>} />{editing ? <EntityForm title={editing === 'new' ? 'Tạo dịch vụ' : 'Cập nhật dịch vụ'} fields={fields} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => setEditing(null)} /> : null}<DataTable columns={columns} rows={db.services} /></section>;
}
