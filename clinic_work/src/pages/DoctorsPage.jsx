import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { formatDate, formatTime } from '../utils/helpers';

const empty = { profileId: '', specialtyId: '', clinicId: '', status: 'ACTIVE' };

export default function DoctorsPage() {
  const { user } = useAuth();
  const { db, saveDoctor, profileName, getSpecialty, getClinic, getShift } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [selectedId, setSelectedId] = useState(null);

  const rows = useMemo(() => db.doctors.map((item) => ({
    ...item,
    doctorName: profileName(item.profileId),
    specialtyName: getSpecialty(item.specialtyId)?.name || '—',
    clinicName: getClinic(item.clinicId)?.name || '—',
  })), [db.doctors, profileName, getSpecialty, getClinic]);

  const selectedDoctor = rows.find((item) => item.id === selectedId) || rows[0] || null;
  const scheduleRows = useMemo(() => {
    if (!selectedDoctor) return [];
    return db.workSchedules.filter((item) => item.doctorId === selectedDoctor.id).map((item) => {
      const shift = getShift(item.shiftId);
      return { ...item, clinicName: getClinic(item.clinicId)?.name || '—', shiftText: shift ? `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}` : '—' };
    });
  }, [db.workSchedules, selectedDoctor, getShift, getClinic]);

  const columns = [
    { key: 'id', label: 'Mã BS' },
    { key: 'doctorName', label: 'Bác sĩ' },
    { key: 'specialtyName', label: 'Chuyên khoa' },
    { key: 'clinicName', label: 'Phòng khám' },
    { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'actions', label: 'Thao tác', render: (row) => <div className="action-row"><button className="text-button" onClick={() => setSelectedId(row.id)}>Xem chi tiết</button><button className="text-button" onClick={() => { setEditing(row.id); setForm(row); }}>Cập nhật</button></div> },
  ];

  const fields = [
    { name: 'profileId', label: 'Tài khoản bác sĩ', type: 'select', options: db.profiles.filter((x) => x.role === 'doctor').map((x) => ({ value: x.id, label: `${x.name} • ${x.username}` })) },
    { name: 'specialtyId', label: 'Chuyên khoa', type: 'select', options: db.specialties.map((x) => ({ value: x.id, label: x.name })) },
    { name: 'clinicId', label: 'Phòng khám mặc định', type: 'select', options: db.clinics.map((x) => ({ value: x.id, label: x.name })) },
    { name: 'status', label: 'Trạng thái', type: 'select', options: [{ value: 'ACTIVE', label: 'Đang hoạt động' }, { value: 'LOCKED', label: 'Tạm khóa' }] },
  ];

  function submit(event) {
    event.preventDefault();
    saveDoctor(editing === 'new' ? form : { ...form, id: editing }, user.id);
    setEditing(null);
    setForm(empty);
  }

  return (
    <section>
      <PageHeader title="Bác sĩ" subtitle="Quản lý hồ sơ bác sĩ và lịch làm việc." action={<button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>Thêm bác sĩ</button>} />
      {editing ? <EntityForm title={editing === 'new' ? 'Tạo hồ sơ bác sĩ' : 'Cập nhật hồ sơ bác sĩ'} fields={fields} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => setEditing(null)} /> : null}
      <div className="content-grid-2 details-grid">
        <DataTable columns={columns} rows={rows} />
        <SectionCard title="Chi tiết bác sĩ" subtitle="Thông tin bác sĩ và lịch làm việc gần nhất.">
          {selectedDoctor ? (
            <div className="detail-stack">
              <div className="detail-highlight">
                <strong>{selectedDoctor.doctorName}</strong>
                <span className="muted">{selectedDoctor.id} • {selectedDoctor.specialtyName}</span>
              </div>
              <div className="detail-grid">
                <div><span className="muted">Phòng khám mặc định</span><strong>{selectedDoctor.clinicName}</strong></div>
                <div><span className="muted">Trạng thái</span><strong><StatusBadge value={selectedDoctor.status} /></strong></div>
              </div>
              <div className="nested-card card">
                <div className="section-title-row"><div><h3>Lịch làm việc đã thiết lập</h3><p>Hiển thị theo bác sĩ, ngày làm và ca khám.</p></div></div>
                {scheduleRows.length ? scheduleRows.map((item) => (
                  <div className="mini-row compact" key={item.id}>
                    <div>
                      <strong>{formatDate(item.workDate)} • {item.shiftText}</strong>
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
