import { useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';

const empty = { username: '', password: '123456', firstName: '', lastName: '', name: '', role: 'patient', email: '', phone: '', status: 'active' };

export default function AccountsPage() {
  const { user } = useAuth();
  const { db, saveAccount, toggleAccountStatus } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const columns = [
    { key: 'id', label: 'Mã TK' },
    { key: 'name', label: 'Họ tên' },
    { key: 'username', label: 'Tài khoản' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Vai trò', render: (row) => <StatusBadge value={row.role} /> },
    { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'actions', label: 'Thao tác', render: (row) => <div className="action-row"><button className="text-button" onClick={() => { setEditing(row.id); setForm(row); }}>Cập nhật</button><button className="text-button danger-text" onClick={() => toggleAccountStatus(row.id, user.id)}>{row.status === 'active' ? 'Khóa' : 'Mở khóa'}</button></div> },
  ];

  const fields = [
    { name: 'username', label: 'Tên đăng nhập' },
    { name: 'password', label: 'Mật khẩu' },
    { name: 'name', label: 'Họ tên hiển thị' },
    { name: 'email', label: 'Email' },
    { name: 'phone', label: 'Điện thoại' },
    { name: 'role', label: 'Vai trò', type: 'select', options: [{ value: 'admin', label: 'Quản trị viên' }, { value: 'receptionist', label: 'Lễ tân' }, { value: 'doctor', label: 'Bác sĩ' }, { value: 'patient', label: 'Bệnh nhân' }] },
    { name: 'status', label: 'Trạng thái', type: 'select', options: [{ value: 'active', label: 'Đang hoạt động' }, { value: 'locked', label: 'Tạm khóa' }] },
  ];

  function submit(event) {
    event.preventDefault();
    saveAccount(editing === 'new' ? form : { ...form, id: editing }, user.id);
    setEditing(null);
    setForm(empty);
  }

  return <section><PageHeader title="Tài khoản và phân quyền" subtitle="Quản lý tài khoản và phân quyền." action={<button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>Tạo tài khoản</button>} />{editing ? <EntityForm title={editing === 'new' ? 'Tạo tài khoản người dùng' : 'Cập nhật tài khoản'} fields={fields} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => setEditing(null)} /> : null}<DataTable columns={columns} rows={db.profiles} /></section>;
}
