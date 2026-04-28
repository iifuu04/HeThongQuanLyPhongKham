import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';

export default function RequestsPage() {
  const { user } = useAuth();
  const { db, resolveRequest, patientName, doctorName, getProfile } = useClinic();

  const rows = db.appointmentRequests.map((item) => ({
    ...item,
    patient: patientName(item.patientId),
    doctor: doctorName(item.doctorId),
    requestedByName: getProfile(item.requestBy)?.name || item.requestBy,
  }));

  const columns = [
    { key: 'id', label: 'Mã YC' },
    { key: 'patient', label: 'Bệnh nhân' },
    { key: 'doctor', label: 'Bác sĩ' },
    { key: 'action', label: 'Loại yêu cầu' },
    { key: 'detail', label: 'Nội dung' },
    { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'actions', label: 'Thao tác', render: (row) => row.status === 'PENDING' ? <div className="action-row"><button className="text-button" onClick={() => resolveRequest(row.id, 'APPROVED', user.id)}>Duyệt</button><button className="text-button danger-text" onClick={() => resolveRequest(row.id, 'REJECTED', user.id)}>Từ chối</button></div> : '—' },
  ];

  return <section><PageHeader title="Yêu cầu xử lý lịch hẹn" subtitle="Duyệt yêu cầu đổi hoặc hủy lịch hẹn." /><DataTable columns={columns} rows={rows} emptyMessage="Chưa có yêu cầu xử lý nào." /></section>;
}
