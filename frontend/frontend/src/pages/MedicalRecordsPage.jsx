import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { api } from '../api/client';
import { appointmentStatusLabel, formatDateTime } from '../utils/helpers';

const empty = { appointmentId: '', symptoms: '', diagnosis: '', result: '', prescription: '', note: '' };

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const { db, saveMedicalRecord, finalizeMedicalRecord, patientName, doctorName, getAppointment, loadAllData, notify, getDoctor } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [selectedId, setSelectedId] = useState(null);

  const currentDoctor = useMemo(() => {
    return db.doctors.find((item) => item.profile_id === user?.id);
  }, [db.doctors, user?.id]);

  const currentPatient = useMemo(() => {
    return db.patients.find((item) => item.profile_id === user?.id);
  }, [db.patients, user?.id]);

  // Filter and map medical records based on role
  // DOCTOR sees ALL records (FR16 - xem lịch sử khám), but can only edit their own
  const mappedRecords = useMemo(() => {
    return db.medicalRecords
      .filter((item) => {
        if (user?.role === 'PATIENT') {
          return item.patient_id === currentPatient?.id;
        }
        return true; // ADMIN, RECEPTIONIST, DOCTOR see all
      })
      .map((item) => ({
        ...item,
        patient: patientName(item.patient_id),
        doctor: doctorName(item.doctor_id),
        symptomsDisplay: item.symptoms || '—',
        diagnosisDisplay: item.diagnosis || '—',
        resultDisplay: item.result || '—',
        prescriptionDisplay: item.prescription || '—',
      }));
  }, [db.medicalRecords, user?.role, currentPatient, patientName, doctorName]);

  const selectedRecord = mappedRecords.find((item) => item.id === selectedId) || mappedRecords[0] || null;

  // Get related appointment for selected record
  const relatedAppointment = useMemo(() => {
    if (!selectedRecord) return null;
    return db.appointments.find((apt) => apt.id === selectedRecord.appointment_id);
  }, [selectedRecord, db.appointments]);

  // Patient history (all records of the selected patient) - for FR16
  const patientHistory = useMemo(() => {
    if (!selectedRecord) return [];
    return db.medicalRecords
      .filter((mr) => mr.patient_id === selectedRecord.patient_id && mr.id !== selectedRecord.id)
      .map((mr) => ({
        ...mr,
        doctor: doctorName(mr.doctor_id),
      }))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [selectedRecord, db.medicalRecords, doctorName]);

  // Appointments that can have medical records created
  // Only INPROGRESS appointments of the current doctor
  const availableAppointments = useMemo(() => {
    if (user?.role !== 'DOCTOR') return [];
    return db.appointments
      .filter((apt) => {
        if (apt.doctor_id !== currentDoctor?.id) return false;
        if (!['WAITING', 'INPROGRESS'].includes(apt.status)) return false;
        // Check if already has medical record
        const hasRecord = db.medicalRecords.some((mr) => mr.appointment_id === apt.id);
        return !hasRecord;
      })
      .map((apt) => ({
        value: apt.id,
        label: `#${apt.id} • ${patientName(apt.patient_id)} • ${appointmentStatusLabel(apt.status)} • ${formatDateTime(apt.start_time)}`,
      }));
  }, [db.appointments, db.medicalRecords, currentDoctor, user?.role, patientName]);

  const fields = [
    {
      name: 'appointmentId',
      label: 'Lịch hẹn',
      type: 'select',
      options: availableAppointments,
    },
    { name: 'symptoms', label: 'Triệu chứng', type: 'textarea', full: true },
    { name: 'diagnosis', label: 'Chẩn đoán', type: 'textarea', full: true },
    { name: 'result', label: 'Kết quả khám', type: 'textarea', full: true },
    { name: 'prescription', label: 'Chỉ định/Đơn thuốc', type: 'textarea', full: true },
    { name: 'note', label: 'Ghi chú lâm sàng', type: 'textarea', full: true },
  ];

  const columns = [
    { key: 'id', label: 'Mã BA' },
    { key: 'patient', label: 'Bệnh nhân' },
    { key: 'doctor', label: 'Bác sĩ' },
    {
      key: 'diagnosisDisplay',
      label: 'Chẩn đoán',
      render: (row) => row.diagnosisDisplay,
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="action-row wrap">
          <button className="text-button" onClick={() => setSelectedId(row.id)}>Xem</button>
          {user?.role === 'DOCTOR' && row.doctor_id === currentDoctor?.id && row.status !== 'COMPLETED' && (
            <button
              className="text-button"
              onClick={() => {
                setEditing(row.id);
                setForm({
                  appointmentId: row.appointment_id,
                  symptoms: row.symptoms || '',
                  diagnosis: row.diagnosis || '',
                  result: row.result || '',
                  prescription: row.prescription || '',
                  note: row.note || '',
                });
              }}
            >
              Sửa
            </button>
          )}
          {user?.role === 'DOCTOR' && row.doctor_id === currentDoctor?.id && row.status !== 'COMPLETED' && (
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await api.finalizeMedicalRecord(row.id);
                  notify('Đã hoàn tất bệnh án');
                  await loadAllData();
                } catch (err) {
                  notify(err.message || 'Không thể hoàn tất bệnh án', 'error');
                }
              }}
            >
              Hoàn tất
            </button>
          )}
        </div>
      ),
    },
  ];

  async function submit(event) {
    event.preventDefault();
    const success = await saveMedicalRecord(
      editing === 'new' ? form : { ...form, id: editing },
      user?.id
    );
    if (success) {
      setEditing(null);
      setForm(empty);
    }
  }

  // Queue of appointments for quick reference (DOCTOR only)
  const queueRows = useMemo(() => {
    if (user?.role !== 'DOCTOR') return [];
    return db.appointments
      .filter((apt) => {
        if (apt.doctor_id !== currentDoctor?.id) return false;
        if (!['WAITING', 'INPROGRESS'].includes(apt.status)) return false;
        return true;
      })
      .map((apt) => ({
        ...apt,
        patient: patientName(apt.patient_id),
      }));
  }, [db.appointments, currentDoctor, user?.role, patientName]);

  return (
    <section>
      <PageHeader
        title="Bệnh án điện tử"
        subtitle="Quản lý hồ sơ bệnh án điện tử."
        action={
          user?.role === 'DOCTOR' && availableAppointments.length > 0 ? (
            <button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>
              Tạo bệnh án
            </button>
          ) : null
        }
      />

      {editing ? (
        <EntityForm
          title={editing === 'new' ? 'Tạo hồ sơ bệnh án' : 'Cập nhật hồ sơ bệnh án'}
          fields={fields}
          value={form}
          onChange={(name, value) => setForm({ ...form, [name]: value })}
          onSubmit={submit}
          onCancel={() => { setEditing(null); setForm(empty); }}
          submitLabel={editing === 'new' ? 'Tạo' : 'Lưu'}
        />
      ) : null}

      <div className="content-grid-2 details-grid">
        <DataTable
          columns={columns}
          rows={mappedRecords}
          emptyMessage="Chưa có hồ sơ bệnh án nào."
        />
        <SectionCard title="Chi tiết bệnh án" subtitle="Thông tin chi tiết bệnh án.">
          {selectedRecord ? (
            <div className="detail-stack">
              <div className="detail-highlight">
                <strong>{selectedRecord.patient}</strong>
                <span className="muted">
                  BA #{selectedRecord.id} • {selectedRecord.doctor}
                </span>
              </div>
              <div className="detail-grid">
                <div>
                  <span className="muted">Triệu chứng</span>
                  <strong>{selectedRecord.symptomsDisplay}</strong>
                </div>
                <div>
                  <span className="muted">Chẩn đoán</span>
                  <strong>{selectedRecord.diagnosisDisplay}</strong>
                </div>
                <div>
                  <span className="muted">Kết quả</span>
                  <strong>{selectedRecord.resultDisplay}</strong>
                </div>
                <div>
                  <span className="muted">Trạng thái</span>
                  <StatusBadge value={selectedRecord.status} />
                </div>
                <div className="span-2">
                  <span className="muted">Chỉ định/Đơn thuốc</span>
                  <strong>{selectedRecord.prescriptionDisplay}</strong>
                </div>
                {selectedRecord.note && (
                  <div className="span-2">
                    <span className="muted">Ghi chú lâm sàng</span>
                    <strong>{selectedRecord.note}</strong>
                  </div>
                )}
              </div>
              {relatedAppointment && (
                <div className="nested-card card">
                  <div className="section-title-row">
                    <div>
                      <h3>Lịch hẹn nguồn</h3>
                      <p>Lịch hẹn liên quan.</p>
                    </div>
                  </div>
                  <div className="detail-grid">
                    <div>
                      <span className="muted">Thời gian khám</span>
                      <strong>{formatDateTime(relatedAppointment.start_time)}</strong>
                    </div>
                    <div>
                      <span className="muted">Trạng thái lịch hẹn</span>
                      <strong>{appointmentStatusLabel(relatedAppointment.status)}</strong>
                    </div>
                    <div className="span-2">
                      <span className="muted">Lý do khám</span>
                      <strong>{relatedAppointment.reason || '—'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {(user?.role === 'DOCTOR' || user?.role === 'ADMIN' || user?.role === 'PATIENT') && patientHistory.length > 0 && (
                <div className="nested-card card">
                  <div className="section-title-row">
                    <div>
                      <h3>Lịch sử khám của bệnh nhân</h3>
                      <p>{patientHistory.length} lần khám trước đó của {selectedRecord.patient}.</p>
                    </div>
                  </div>
                  <div className="mini-table">
                    {patientHistory.map((mr) => (
                      <div className="mini-row" key={mr.id}>
                        <div>
                          <strong>BA #{mr.id}</strong>
                          <span className="muted">{formatDateTime(mr.created_at)}</span>
                        </div>
                        <div>
                          <span>{mr.diagnosis || '—'}</span>
                          <span className="muted">BS {mr.doctor}</span>
                        </div>
                        <button className="text-button" onClick={() => setSelectedId(mr.id)}>Xem</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">Chọn một hồ sơ bệnh án để xem chi tiết.</div>
          )}
        </SectionCard>
      </div>

      {user?.role === 'DOCTOR' && queueRows.length > 0 && (
        <SectionCard title="Hàng đợi khám" subtitle="Danh sách lịch hẹn cần tạo bệnh án.">
          <div className="mini-table">
            {queueRows.map((item) => (
              <div className="mini-row" key={item.id}>
                <div>
                  <strong>{item.patient}</strong>
                  <span className="muted">{formatDateTime(item.start_time)}</span>
                </div>
                <div>
                  <span>{item.reason || '—'}</span>
                  <span className="muted">{appointmentStatusLabel(item.status)}</span>
                </div>
                <StatusBadge value={item.status} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </section>
  );
}