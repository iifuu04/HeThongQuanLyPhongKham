import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { appointmentStatusLabel, formatDateTime } from '../utils/helpers';

const empty = { appointmentId: '', patientId: '', doctorId: '', note: '', symptoms: '', diagnosis: '', result: '', prescription: '', status: 'INCOMPLETE' };

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const { db, saveMedicalRecord, finalizeMedicalRecord, patientName, doctorName, getAppointment } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [selectedId, setSelectedId] = useState(null);
  const currentDoctor = db.doctors.find((item) => item.profile_id === user?.id);
  const currentPatient = db.patients.find((item) => item.profile_id === user?.id);

  // Map backend data to frontend format
  const mappedRecords = useMemo(() => {
    return db.medicalRecords.filter((item) => {
      if (user?.role === 'DOCTOR' || user?.role === 'doctor') return item.doctor_id === currentDoctor?.id;
      if (user?.role === 'PATIENT' || user?.role === 'patient') return item.patient_id === currentPatient?.id;
      return true;
    }).map((item) => ({
      ...item,
      patient: patientName(item.patient_id),
      doctor: doctorName(item.doctor_id)
    }));
  }, [db.medicalRecords, user?.role, currentDoctor, currentPatient, patientName, doctorName]);

  const selectedRecord = mappedRecords.find((item) => item.id === selectedId) || mappedRecords[0] || null;
  const appointment = selectedRecord ? getAppointment(selectedRecord.appointment_id) : null;
  const queueRows = useMemo(() => db.appointments.filter((item) => {
    if (!['WAITING', 'INPROGRESS', 'COMPLETED'].includes(item.status)) return false;
    if (user?.role === 'DOCTOR' || user?.role === 'doctor') return item.doctor_id === currentDoctor?.id;
    if (user?.role === 'PATIENT' || user?.role === 'patient') return item.patient_id === currentPatient?.id;
    return true;
  }).map((item) => ({ ...item, patient: patientName(item.patient_id), doctor: doctorName(item.doctor_id) })), [db.appointments, user?.role, currentDoctor, currentPatient, patientName, doctorName]);

  const fields = [
    { name: 'appointmentId', label: 'Lịch hẹn', type: 'select', options: db.appointments.filter((x) => x.status === 'COMPLETED' || x.status === 'INPROGRESS').map((x) => ({ value: x.id, label: `#${x.id} • ${patientName(x.patient_id)} • ${appointmentStatusLabel(x.status)}` })) },
    { name: 'note', label: 'Ghi chú lâm sàng', type: 'textarea', full: true },
    { name: 'symptoms', label: 'Triệu chứng', type: 'textarea', full: true },
    { name: 'diagnosis', label: 'Chẩn đoán', type: 'textarea', full: true },
    { name: 'result', label: 'Kết quả khám', type: 'textarea', full: true },
    { name: 'prescription', label: 'Chỉ định/Đơn thuốc', type: 'textarea', full: true },
  ];

  const columns = [
    { key: 'id', label: 'Mã BA' },
    { key: 'patient', label: 'Bệnh nhân' },
    { key: 'doctor', label: 'Bác sĩ' },
    { key: 'diagnosis', label: 'Chẩn đoán', render: (row) => row.diagnosis || '—' },
    { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'actions', label: 'Thao tác', render: (row) => user?.role === 'PATIENT' || user?.role === 'patient' ? <button className="text-button" onClick={() => setSelectedId(row.id)}>Xem chi tiết</button> : <div className="action-row wrap"><button className="text-button" onClick={() => setSelectedId(row.id)}>Xem chi tiết</button>{row.status !== 'COMPLETED' && <button className="text-button" onClick={() => { setEditing(row.id); setForm({ appointmentId: row.appointment_id, note: row.note, symptoms: row.symptoms, diagnosis: row.diagnosis, result: row.result, prescription: row.prescription }); }}>Cập nhật</button>}{row.status !== 'COMPLETED' && <button className="text-button danger-text" onClick={() => finalizeMedicalRecord(row.id, user?.id)}>Hoàn tất</button>}</div> },
  ];

  function submit(event) {
    event.preventDefault();
    const relatedAppointment = getAppointment(form.appointmentId);
    const payload = {
      ...form,
      patientId: relatedAppointment?.patient_id,
      doctorId: currentDoctor?.id || form.doctorId || relatedAppointment?.doctor_id,
    };
    if (saveMedicalRecord(editing === 'new' ? payload : { ...payload, id: editing }, user?.id)) {
      setEditing(null);
      setForm(empty);
    }
  }

  return <section><PageHeader title="Bệnh án điện tử" subtitle="Quản lý hồ sơ bệnh án điện tử." action={user?.role !== 'PATIENT' && user?.role !== 'patient' ? <button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>Tạo bệnh án</button> : null} />
  {editing ? <EntityForm title={editing === 'new' ? 'Tạo hồ sơ bệnh án' : 'Cập nhật hồ sơ bệnh án'} fields={fields} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => setEditing(null)} submitLabel={editing === 'new' ? 'Tạo' : 'Lưu'} /> : null}
  <div className="content-grid-2 details-grid"><DataTable columns={columns} rows={mappedRecords} emptyMessage="Chưa có hồ sơ bệnh án nào." /><SectionCard title="Chi tiết bệnh án" subtitle="Thông tin chi tiết bệnh án.">{selectedRecord ? <div className="detail-stack"><div className="detail-highlight"><strong>{selectedRecord.patient}</strong><span className="muted">BA #{selectedRecord.id} • {selectedRecord.doctor}</span></div><div className="detail-grid"><div><span className="muted">Triệu chứng</span><strong>{selectedRecord.symptoms || '—'}</strong></div><div><span className="muted">Chẩn đoán</span><strong>{selectedRecord.diagnosis || '—'}</strong></div><div><span className="muted">Kết quả</span><strong>{selectedRecord.result || '—'}</strong></div><div><span className="muted">Trạng thái</span><strong><StatusBadge value={selectedRecord.status} /></strong></div><div className="span-2"><span className="muted">Chỉ định/Đơn thuốc</span><strong>{selectedRecord.prescription || '—'}</strong></div><div className="span-2"><span className="muted">Ghi chú lâm sàng</span><strong>{selectedRecord.note || '—'}</strong></div></div><div className="nested-card card"><div className="section-title-row"><div><h3>Lịch hẹn nguồn</h3><p>Lịch hẹn liên quan.</p></div></div>{appointment ? <div className="detail-grid"><div><span className="muted">Thời gian khám</span><strong>{formatDateTime(appointment.start_time)}</strong></div><div><span className="muted">Trạng thái lịch hẹn</span><strong>{appointmentStatusLabel(appointment.status)}</strong></div><div className="span-2"><span className="muted">Lý do khám</span><strong>{appointment.reason || '—'}</strong></div></div> : <div className="empty-state">Không tìm thấy lịch hẹn nguồn.</div>}</div></div> : <div className="empty-state">Chọn một hồ sơ bệnh án để xem chi tiết.</div>}</SectionCard></div>
  <SectionCard title="Hàng đợi khám" subtitle="Danh sách lịch hẹn phục vụ tra cứu nhanh."><div className="mini-table">{queueRows.length ? queueRows.map((item) => <div className="mini-row" key={item.id}><div><strong>{item.patient}</strong><span className="muted">{item.doctor}</span></div><div><span>{formatDateTime(item.start_time)}</span><span className="muted">{item.reason}</span></div><StatusBadge value={item.status} /></div>) : <div className="empty-state">Không có lịch hẹn nào trong hàng đợi điều trị.</div>}</div></SectionCard></section>;
}
