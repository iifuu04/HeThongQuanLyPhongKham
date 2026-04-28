import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { formatDate, formatDateTime, genderLabel } from '../utils/helpers';

const empty = { profileId: '', fullName: '', dateOfBirth: '', gender: 'Female', phone: '', address: '', history: '' };

export default function PatientsPage() {
  const { user } = useAuth();
  const { db, savePatient, patientName, doctorName, profileName } = useClinic();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  // Map backend data to frontend format (snake_case to camelCase)
  const mappedPatients = useMemo(() => {
    return db.patients.map((item) => {
      const profile = db.profiles.find(p => p.id === item.profile_id);
      return {
        ...item,
        profileId: item.profile_id,
        dateOfBirth: item.date_of_birth,
        displayName: profile ? profileName(item.profile_id) : `${item.first_name || ''} ${item.last_name || ''}`.trim() || '—'
      };
    });
  }, [db.patients, db.profiles, profileName]);

  const rows = useMemo(() => mappedPatients
    .filter((item) => {
      const haystack = {
        id: item.id,
        name: item.displayName,
        phone: item.phone || item.profile?.phone,
        all: [item.id, item.displayName, item.phone || item.profile?.phone].join(' '),
      };
      return String(haystack[searchType] || haystack.all).toLowerCase().includes(query.toLowerCase());
    }), [mappedPatients, query, searchType]);

  const selectedPatient = rows.find((item) => item.id === selectedId) || rows[0] || null;
  const patientHistory = useMemo(() => {
    if (!selectedPatient) return [];
    return db.medicalRecords
      .filter((item) => item.patient_id === selectedPatient.id)
      .map((item) => {
        const appointment = db.appointments.find((x) => x.id === item.appointment_id);
        return { ...item, doctor: doctorName(item.doctor_id), startTime: appointment?.start_time };
      });
  }, [db.medicalRecords, db.appointments, selectedPatient, doctorName]);

  const columns = [
    { key: 'id', label: 'Mã BN' },
    { key: 'displayName', label: 'Họ tên' },
    { key: 'gender', label: 'Giới tính', render: (row) => genderLabel(row.gender) },
    { key: 'dateOfBirth', label: 'Ngày sinh', render: (row) => formatDate(row.date_of_birth || row.dateOfBirth) },
    { key: 'phone', label: 'Điện thoại', render: (row) => row.phone || row.profile?.phone || '—' },
    { key: 'address', label: 'Địa chỉ', render: (row) => row.address || row.profile?.address || '—' },
    { key: 'actions', label: 'Thao tác', render: (row) => <div className="action-row"><button className="text-button" onClick={() => setSelectedId(row.id)}>Xem hồ sơ</button><button className="text-button" onClick={() => { const p = db.profiles.find(x => x.id === row.profile_id); setForm({ profileId: row.profile_id, dateOfBirth: row.date_of_birth, gender: row.gender, phone: row.phone || row.profile?.phone, address: row.address || row.profile?.address }); setEditing(row.id); }}>Cập nhật</button></div> },
  ];

  const fields = [
    { name: 'profileId', label: 'Tài khoản liên kết', type: 'select', options: [{ value: '', label: 'Chưa liên kết tài khoản' }, ...db.profiles.filter((x) => x.role === 'PATIENT').map((x) => ({ value: x.id, label: `${x.first_name || ''} ${x.last_name || ''} • ${x.username}` }))] },
    { name: 'phone', label: 'Số điện thoại' },
    { name: 'address', label: 'Địa chỉ' },
    { name: 'dateOfBirth', label: 'Ngày sinh', type: 'date' },
    { name: 'gender', label: 'Giới tính', type: 'select', options: [{ value: 'Male', label: 'Nam' }, { value: 'Female', label: 'Nữ' }] },
  ];

  function submit(event) {
    event.preventDefault();
    if (!form.dateOfBirth || !form.phone) return;
    const dataToSave = {
      phone: form.phone,
      address: form.address,
      date_of_birth: form.dateOfBirth
    };
    if (form.profileId) {
      dataToSave.profile_id = form.profileId;
    }
    if (editing !== 'new') {
      dataToSave.id = editing;
    }
    savePatient(dataToSave, user.id);
    setEditing(null);
    setForm(empty);
  }

  return (
    <section>
      <PageHeader
        title="Quản lý bệnh nhân"
        subtitle="Quản lý hồ sơ và lịch sử khám của bệnh nhân."
        action={<button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>Thêm bệnh nhân</button>}
      />

      <div className="filters card filter-grid">
        <label>
          Chế độ tìm kiếm
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="id">Mã bệnh nhân</option>
            <option value="name">Họ tên</option>
            <option value="phone">Số điện thoại</option>
          </select>
        </label>
        <label className="span-2">
          Từ khóa tìm kiếm
          <input placeholder="Nhập mã bệnh nhân, họ tên hoặc số điện thoại..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {editing ? (
        <EntityForm
          title={editing === 'new' ? 'Tiếp nhận hồ sơ bệnh nhân' : 'Cập nhật hồ sơ bệnh nhân'}
          fields={fields}
          value={form}
          onChange={(name, value) => setForm({ ...form, [name]: value })}
          onSubmit={submit}
          onCancel={() => { setEditing(null); setForm(empty); }}
          submitLabel={editing === 'new' ? 'Lưu hồ sơ' : 'Lưu cập nhật'}
        />
      ) : null}

      <div className="content-grid-2 details-grid">
        <DataTable columns={columns} rows={rows} emptyMessage="Chưa có hồ sơ bệnh nhân phù hợp." />
        <SectionCard title="Hồ sơ bệnh nhân" subtitle="Thông tin chi tiết và lịch sử khám.">
          {selectedPatient ? (
            <div className="detail-stack">
              <div className="detail-highlight">
                <strong>{selectedPatient.displayName}</strong>
                <span className="muted">{selectedPatient.id} • {genderLabel(selectedPatient.gender)} • {formatDate(selectedPatient.date_of_birth)}</span>
              </div>
              <div className="detail-grid">
                <div><span className="muted">Điện thoại</span><strong>{selectedPatient.phone || selectedPatient.profile?.phone || '—'}</strong></div>
                <div><span className="muted">Địa chỉ</span><strong>{selectedPatient.address || selectedPatient.profile?.address || '—'}</strong></div>
              </div>
              <div className="nested-card card">
                <div className="section-title-row">
                  <div><h3>Lịch sử khám bệnh</h3><p>Các hồ sơ bệnh án đã ghi nhận cho bệnh nhân này.</p></div>
                </div>
                {patientHistory.length ? patientHistory.map((item) => (
                  <div className="mini-row compact" key={item.id}>
                    <div>
                      <strong>{item.diagnosis || 'Chưa cập nhật chẩn đoán'}</strong>
                      <span className="muted">{item.doctor} • {item.startTime ? formatDateTime(item.startTime) : 'Không có lịch hẹn'}</span>
                    </div>
                    <span className="muted">BA #{item.id}</span>
                  </div>
                )) : <div className="empty-state">Bệnh nhân này chưa có lịch sử khám bệnh.</div>}
              </div>
            </div>
          ) : <div className="empty-state">Chọn một bệnh nhân để xem hồ sơ chi tiết.</div>}
        </SectionCard>
      </div>
    </section>
  );
}
