import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { formatDate } from '../utils/helpers';

const ACTION_LABEL = {
  RESCHEDULE: 'Đổi lịch',
  CANCEL: 'Hủy lịch',
};

const empty = { appointmentId: '', action: 'CANCEL', detail: '' };

export default function RequestsPage() {
  const { user } = useAuth();
  const { db, resolveRequest, createRequest, patientName, doctorName, profileName } = useClinic();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(empty);

  const rows = useMemo(() => db.appointmentRequests.map((item) => ({
    ...item,
    patient: patientName(item.patient_id),
    doctor: doctorName(item.doctor_id),
    requesterName: profileName(item.request_by),
    actionLabel: ACTION_LABEL[item.action] || item.action || '—',
    createdAtFormatted: formatDate(item.created_at),
  })), [db.appointmentRequests, patientName, doctorName, profileName]);

  const columns = [
    { key: 'id', label: 'Mã YC' },
    { key: 'patient', label: 'Bệnh nhân' },
    { key: 'doctor', label: 'Bác sĩ' },
    { key: 'actionLabel', label: 'Loại yêu cầu' },
    { key: 'requesterName', label: 'Người gửi' },
    { key: 'createdAtFormatted', label: 'Ngày gửi' },
    { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (user?.role === 'ADMIN' && row.status === 'PENDING') ? (
        <div className="action-row">
          <button className="text-button" onClick={() => resolveRequest(row.id, 'APPROVED', user.id)}>Duyệt</button>
          <button className="text-button danger-text" onClick={() => resolveRequest(row.id, 'REJECTED', user.id)}>Từ chối</button>
        </div>
      ) : '—',
    },
  ];

  // Appointments that can have request created (active appointments)
  const eligibleAppointments = useMemo(() => {
    return db.appointments
      .filter((a) => ['SCHEDULED', 'WAITING'].includes(a.status))
      .map((a) => ({
        value: a.id,
        label: `#${a.id} • ${patientName(a.patient_id)} • BS ${doctorName(a.doctor_id)}`,
      }));
  }, [db.appointments, patientName, doctorName]);

  const fields = [
    { name: 'appointmentId', label: 'Lịch hẹn', type: 'select', options: eligibleAppointments },
    { name: 'action', label: 'Loại yêu cầu', type: 'select', options: [
      { value: 'CANCEL', label: 'Hủy lịch' },
      { value: 'RESCHEDULE', label: 'Đổi lịch' },
    ] },
    { name: 'detail', label: 'Lý do / Ghi chú', type: 'textarea', full: true },
  ];

  async function submit(event) {
    event.preventDefault();
    if (!form.appointmentId) return;
    const apt = db.appointments.find((a) => a.id === Number(form.appointmentId));
    if (!apt) return;
    const ok = await createRequest({
      appointmentId: apt.id,
      patientId: apt.patient_id,
      doctorId: apt.doctor_id,
      action: form.action,
      detail: form.detail,
    }, user.id);
    if (ok) {
      setCreating(false);
      setForm(empty);
    }
  }

  const canCreate = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  return (
    <section>
      <PageHeader
        title="Yêu cầu xử lý lịch hẹn"
        subtitle="Duyệt yêu cầu đổi hoặc hủy lịch hẹn."
        action={canCreate ? (
          <button className="button" onClick={() => { setCreating(true); setForm(empty); }}>Tạo yêu cầu</button>
        ) : null}
      />
      {creating ? (
        <EntityForm
          title="Tạo yêu cầu xử lý lịch hẹn"
          fields={fields}
          value={form}
          onChange={(name, value) => setForm({ ...form, [name]: value })}
          onSubmit={submit}
          onCancel={() => { setCreating(false); setForm(empty); }}
          submitLabel="Gửi yêu cầu"
        />
      ) : null}
      <DataTable columns={columns} rows={rows} emptyMessage="Chưa có yêu cầu xử lý nào." />
    </section>
  );
}
