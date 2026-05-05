import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';

const empty = { name: '', location: '', isReserve: false };

export default function ClinicsPage() {
  const { user } = useAuth();
  const { db, saveClinic } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  // Map backend data to frontend format
  const mappedClinics = useMemo(() => {
    return db.clinics.map(c => ({
      ...c,
      // is_reserve is a boolean in DB
      isReserve: c.is_reserve === 1 || c.is_reserve === true
    }));
  }, [db.clinics]);

  const columns = [
    { key: 'id', label: 'Mã PK' },
    { key: 'name', label: 'Tên phòng khám' },
    { key: 'location', label: 'Vị trí' },
    { key: 'reserve', label: 'Dự phòng', render: (row) => row.isReserve ? 'Có' : 'Không' },
    { key: 'actions', label: 'Thao tác', render: (row) => <button className="text-button" onClick={() => { setEditing(row.id); setForm({ name: row.name, location: row.location, isReserve: row.isReserve }); }}>Cập nhật</button> },
  ];

  const fields = [
    { name: 'name', label: 'Tên phòng khám' },
    { name: 'location', label: 'Vị trí' },
    { name: 'isReserve', label: 'Phòng dự phòng', type: 'select', options: [{ value: false, label: 'Không' }, { value: true, label: 'Có' }] },
  ];

  function submit(event) {
    event.preventDefault();
    const dataToSave = {
      name: form.name,
      location: form.location,
      is_reserve: form.isReserve
    };
    if (editing !== 'new') {
      dataToSave.id = editing;
    }
    saveClinic(dataToSave, user.id);
    setEditing(null);
    setForm(empty);
  }

  return <section><PageHeader title="Quản lý phòng khám" subtitle="Quản lý danh mục phòng khám." action={<button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>Thêm phòng khám</button>} />{editing ? <EntityForm title={editing === 'new' ? 'Tạo phòng khám' : 'Cập nhật phòng khám'} fields={fields} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => setEditing(null)} submitLabel={editing === 'new' ? 'Tạo' : 'Lưu'} /> : null}<DataTable columns={columns} rows={mappedClinics} /></section>;
}
