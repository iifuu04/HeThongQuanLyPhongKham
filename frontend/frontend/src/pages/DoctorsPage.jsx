import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { formatDate, formatTime } from '../utils/helpers';

const empty = { profileId: '', specialtyId: '', clinicId: '', status: 'ACTIVE' };
const emptyAccount = {
  username: '',
  password: '123456',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: 'Male',
  dateOfBirth: '',
  specialtyId: '',
};

export default function DoctorsPage() {
  const { user } = useAuth();
  const { db, saveDoctor, profileName, getSpecialty, getClinic, getShift, loadAllData, notify } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [selectedId, setSelectedId] = useState(null);

  const mappedDoctors = useMemo(() => {
    return db.doctors.map((item) => ({
      ...item,
      profileId: item.profile_id,
      doctorName: profileName(item.profile_id) || `${item.first_name || ''} ${item.last_name || ''}`.trim() || '—',
      specialtyName: getSpecialty(item.specialty_id)?.name || item.specialty_name || '—',
      clinicName: getClinic(item.clinic_id)?.name || '—'
    }));
  }, [db.doctors, profileName, getSpecialty, getClinic]);

  const selectedDoctor = mappedDoctors.find((item) => item.id === selectedId) || mappedDoctors[0] || null;
  const scheduleRows = useMemo(() => {
    if (!selectedDoctor) return [];
    return db.workSchedules.filter((item) => item.doctor_id === selectedDoctor.id || item.doctorId === selectedDoctor.id).map((item) => {
      const shift = getShift(item.shift_id || item.shiftId);
      return { ...item, clinicName: getClinic(item.clinic_id || item.clinicId)?.name || '—', shiftText: shift ? `${formatTime(shift.start_time || shift.startTime)} - ${formatTime(shift.end_time || shift.endTime)}` : '—' };
    });
  }, [db.workSchedules, selectedDoctor, getShift, getClinic]);

  const columns = [
    { key: 'id', label: 'Mã BS' },
    { key: 'doctorName', label: 'Bác sĩ' },
    { key: 'specialtyName', label: 'Chuyên khoa' },
    { key: 'actions', label: 'Thao tác', render: (row) => <div className="action-row"><button className="text-button" onClick={() => setSelectedId(row.id)}>Xem chi tiết</button><button className="text-button" onClick={() => { setEditing(row.id); setForm({ profileId: row.profile_id, specialtyId: row.specialty_id, status: 'ACTIVE' }); }}>Cập nhật</button></div> },
  ];

  const availableDoctorProfiles = useMemo(() => {
    const linkedProfileIds = new Set(db.doctors.filter(d => d.id !== editing).map(d => d.profile_id));
    return db.profiles
      .filter((x) => x.role === 'DOCTOR' && !linkedProfileIds.has(x.id) && !x.is_deleted)
      .map((x) => ({
        value: x.id,
        label: `${x.first_name || ''} ${x.last_name || ''}`.trim() + ` • ${x.username}`,
      }));
  }, [db.profiles, db.doctors, editing]);

  const fields = [
    { name: 'profileId', label: 'Tài khoản bác sĩ', type: 'select', options: availableDoctorProfiles },
    { name: 'specialtyId', label: 'Chuyên khoa', type: 'select', options: db.specialties.map((x) => ({ value: x.id, label: x.name })) },
  ];

  async function submit(event) {
    event.preventDefault();
    if (!form.profileId || !form.specialtyId) {
      alert('Vui lòng chọn tài khoản và chuyên khoa');
      return;
    }
    const dataToSave = {
      profile_id: form.profileId,
      specialty_id: form.specialtyId
    };
    if (editing !== 'new') {
      dataToSave.id = editing;
    }
    const ok = await saveDoctor(dataToSave, user.id);
    if (ok) {
      setEditing(null);
      setForm(empty);
    }
  }

  async function submitDoctorAccount(event) {
    event.preventDefault();
    if (!accountForm.username || !accountForm.password || !accountForm.firstName || !accountForm.lastName || !accountForm.specialtyId) {
      notify('Vui lòng nhập đủ username, mật khẩu, họ tên và chuyên khoa.', 'error');
      return;
    }

    try {
      const profileRes = await api.createProfile({
        username: accountForm.username,
        password: accountForm.password,
        role: 'DOCTOR',
        first_name: accountForm.firstName,
        last_name: accountForm.lastName,
        email: accountForm.email || null,
        phone: accountForm.phone || null,
        gender: accountForm.gender || null,
        date_of_birth: accountForm.dateOfBirth || null,
      });

      const profileId = profileRes.data?.id;
      if (!profileId) {
        throw new Error('Không lấy được ID tài khoản bác sĩ vừa tạo.');
      }

      await api.createDoctor({
        profile_id: profileId,
        specialty_id: Number(accountForm.specialtyId),
      });

      notify('Đã đăng ký tài khoản bác sĩ và tạo hồ sơ bác sĩ.');
      setEditing(null);
      setAccountForm(emptyAccount);
      await loadAllData();
    } catch (err) {
      notify(err.message || 'Không thể đăng ký tài khoản bác sĩ.', 'error');
    }
  }

  return (
    <section>
      <PageHeader
        title="Bác sĩ"
        subtitle="Quản lý hồ sơ bác sĩ, lịch làm việc và đăng ký tài khoản bác sĩ."
        action={(
          <div className="action-row">
            <button className="button secondary" onClick={() => { setEditing('account'); setAccountForm(emptyAccount); }}>Đăng ký tài khoản bác sĩ</button>
            <button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>Thêm bác sĩ</button>
          </div>
        )}
      />

      {editing === 'account' ? (
        <SectionCard title="Đăng ký tài khoản bác sĩ" subtitle="Tạo tài khoản role DOCTOR và tự động liên kết hồ sơ bác sĩ.">
          <form onSubmit={submitDoctorAccount} className="form-stack">
            <div className="form-row">
              <label className="form-field"><span>Tên đăng nhập</span><input value={accountForm.username} onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })} required /></label>
              <label className="form-field"><span>Mật khẩu</span><input type="password" value={accountForm.password} onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })} required /></label>
            </div>
            <div className="form-row">
              <label className="form-field"><span>Họ</span><input value={accountForm.firstName} onChange={(e) => setAccountForm({ ...accountForm, firstName: e.target.value })} required /></label>
              <label className="form-field"><span>Tên</span><input value={accountForm.lastName} onChange={(e) => setAccountForm({ ...accountForm, lastName: e.target.value })} required /></label>
            </div>
            <div className="form-row">
              <label className="form-field"><span>Email</span><input type="email" value={accountForm.email} onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })} /></label>
              <label className="form-field"><span>Điện thoại</span><input value={accountForm.phone} onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })} /></label>
            </div>
            <div className="form-row">
              <label className="form-field"><span>Ngày sinh</span><input type="date" value={accountForm.dateOfBirth} onChange={(e) => setAccountForm({ ...accountForm, dateOfBirth: e.target.value })} /></label>
              <label className="form-field"><span>Giới tính</span><select value={accountForm.gender} onChange={(e) => setAccountForm({ ...accountForm, gender: e.target.value })}><option value="Male">Nam</option><option value="Female">Nữ</option></select></label>
            </div>
            <label className="form-field"><span>Chuyên khoa</span><select value={accountForm.specialtyId} onChange={(e) => setAccountForm({ ...accountForm, specialtyId: e.target.value })} required><option value="">Chọn chuyên khoa</option>{db.specialties.filter((x) => x.status !== 'LOCKED').map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
            <div className="action-row">
              <button type="submit" className="button primary">Tạo tài khoản bác sĩ</button>
              <button type="button" className="button secondary" onClick={() => { setEditing(null); setAccountForm(emptyAccount); }}>Hủy</button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      {editing === 'new' && availableDoctorProfiles.length === 0 ? (
        <div className="card" style={{ background: '#fff7e6', border: '1px solid #f5c067', padding: '12px 16px', marginBottom: 12 }}>
          <strong>Chưa có tài khoản DOCTOR nào khả dụng.</strong>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Bấm <strong>Đăng ký tài khoản bác sĩ</strong> để tạo tài khoản và hồ sơ bác sĩ trong một bước.
          </p>
        </div>
      ) : null}
      {editing && editing !== 'account' ? <EntityForm title={editing === 'new' ? 'Tạo hồ sơ bác sĩ' : 'Cập nhật hồ sơ bác sĩ'} fields={fields} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => { setEditing(null); setForm(empty); }} submitLabel={editing === 'new' ? 'Tạo' : 'Lưu'} /> : null}
      <div className="content-grid-2 details-grid">
        <DataTable columns={columns} rows={mappedDoctors} />
        <SectionCard title="Chi tiết bác sĩ" subtitle="Thông tin bác sĩ và lịch làm việc gần nhất.">
          {selectedDoctor ? (
            <div className="detail-stack">
              <div className="detail-highlight">
                <strong>{selectedDoctor.doctorName}</strong>
                <span className="muted">{selectedDoctor.id} • {selectedDoctor.specialtyName}</span>
              </div>
              <div className="detail-grid">
                <div><span className="muted">Trạng thái</span><strong>Đang hoạt động</strong></div>
                <div><span className="muted">Tài khoản</span><strong>{selectedDoctor.username || '—'}</strong></div>
                <div><span className="muted">Email</span><strong>{selectedDoctor.email || '—'}</strong></div>
                <div><span className="muted">Điện thoại</span><strong>{selectedDoctor.phone || '—'}</strong></div>
              </div>
              <div className="nested-card card">
                <div className="section-title-row"><div><h3>Lịch làm việc đã thiết lập</h3><p>Hiển thị theo bác sĩ, ngày làm và ca khám.</p></div></div>
                {scheduleRows.length ? scheduleRows.map((item) => (
                  <div className="mini-row compact" key={item.id}>
                    <div>
                      <strong>{formatDate(item.work_date || item.workDate)} • {item.shiftText}</strong>
                      <span className="muted">{item.clinicName}</span>
                    </div>
                    <span className="muted">LS #{item.id}</span>
                  </div>
                )) : <div className="empty-state">Bác sĩ này chưa được phân lịch làm việc.</div>}
              </div>
            </div>
          ) : <div className="empty-state">Chọn một bác sĩ để xem thông tin chi tiết.</div>}
        </SectionCard>
      </div>
    </section>
  );
}
