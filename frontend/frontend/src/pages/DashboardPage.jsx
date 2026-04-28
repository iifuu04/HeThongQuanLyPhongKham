import { useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { appointmentStatusLabel, formatCurrency, formatDateTime } from '../utils/helpers';

export default function DashboardPage() {
  const { user } = useAuth();
  const { db, patientName, doctorName, getMedicalRecord, loading } = useClinic();

  useEffect(() => {
    if (loading) {
      // Data is loading
    }
  }, [loading]);

  const currentDoctor = db.doctors.find((x) => x.profile_id === user?.id || x.profileId === user?.id);
  const currentPatient = db.patients.find((x) => x.profile_id === user?.id || x.profileId === user?.id);

  const totals = {
    waiting: db.appointments.filter((x) => x.status === 'WAITING').length,
    pendingRequests: db.appointmentRequests.filter((x) => x.status === 'PENDING').length,
    revenue: db.bills.filter((x) => x.status === 'COMPLETED').reduce((sum, item) => sum + Number(item.total_amount || item.totalAmount || 0), 0),
    activeDoctors: db.doctors.filter((x) => x.status === 'ACTIVE').length,
  };

  const roleConfig = {
    admin: {
      subtitle: 'Tổng quan vận hành và dữ liệu hệ thống.',
      stats: [
        ['Tài khoản hoạt động', db.profiles.filter((x) => x.is_deleted === 0 || x.status === 'active').length, 'Tài khoản đang sử dụng'],
        ['Bác sĩ hoạt động', totals.activeDoctors, 'Bác sĩ đang nhận lịch'],
        ['Yêu cầu chờ duyệt', totals.pendingRequests, 'Yêu cầu đổi hoặc hủy lịch'],
        ['Doanh thu', formatCurrency(totals.revenue), 'Hóa đơn đã thanh toán'],
      ],
    },
    receptionist: {
      subtitle: 'Theo dõi tiếp nhận, lịch hẹn và thanh toán trong ngày.',
      stats: [
        ['Lịch chờ check-in', db.appointments.filter((x) => x.status === 'SCHEDULED').length, 'Sẵn sàng tiếp nhận'],
        ['Bệnh nhân chờ khám', totals.waiting, 'Đang trong hàng đợi'],
        ['Hóa đơn chờ thanh toán', db.bills.filter((x) => x.status === 'PENDING').length, 'Cần thu ngân xử lý'],
        ['Bệnh nhân', db.patients.length, 'Hồ sơ đang quản lý'],
      ],
    },
    doctor: {
      subtitle: 'Theo dõi lịch khám và hoàn thiện bệnh án.',
      stats: [
        ['Lịch hôm nay', db.appointments.filter((x) => x.doctor_id === currentDoctor?.id || x.doctorId === currentDoctor?.id).length, 'Lịch được phân công'],
        ['Đang chờ khám', db.appointments.filter((x) => (x.doctor_id === currentDoctor?.id || x.doctorId === currentDoctor?.id) && x.status === 'WAITING').length, 'Bệnh nhân trong hàng đợi'],
        ['Bệnh án đang xử lý', db.medicalRecords.filter((x) => (x.doctor_id === currentDoctor?.id || x.doctorId === currentDoctor?.id) && x.status !== 'COMPLETED').length, 'Cần hoàn thiện'],
        ['Bệnh án hoàn tất', db.medicalRecords.filter((x) => (x.doctor_id === currentDoctor?.id || x.doctorId === currentDoctor?.id) && x.status === 'COMPLETED').length, 'Đã khóa hồ sơ'],
      ],
    },
    patient: {
      subtitle: 'Theo dõi lịch khám, bệnh án và hóa đơn cá nhân.',
      stats: [
        ['Lịch sắp tới', db.appointments.filter((x) => (x.patient_id === currentPatient?.id || x.patientId === currentPatient?.id) && ['SCHEDULED', 'WAITING'].includes(x.status)).length, 'Lịch cần lưu ý'],
        ['Bệnh án', db.medicalRecords.filter((x) => x.patient_id === currentPatient?.id || x.patientId === currentPatient?.id).length, 'Hồ sơ đã ghi nhận'],
        ['Hóa đơn', db.bills.filter((x) => x.patient_id === currentPatient?.id || x.patientId === currentPatient?.id).length, 'Tổng hóa đơn phát sinh'],
        ['Chờ thanh toán', db.bills.filter((x) => (x.patient_id === currentPatient?.id || x.patientId === currentPatient?.id) && x.status === 'PENDING').length, 'Chưa thanh toán'],
      ],
    },
  };

  const config = roleConfig[user?.role] || roleConfig.admin;
  const visibleAppointments = db.appointments
    .filter((item) => {
      if (user?.role === 'doctor') return item.doctor_id === currentDoctor?.id || item.doctorId === currentDoctor?.id;
      if (user?.role === 'patient') return item.patient_id === currentPatient?.id || item.patientId === currentPatient?.id;
      return true;
    })
    .slice(0, 5)
    .map((item) => ({ ...item, patient: patientName(item.patient_id || item.patientId), doctor: doctorName(item.doctor_id || item.doctorId) }));

  const visibleBills = db.bills
    .filter((bill) => (user?.role === 'patient' ? bill.patient_id === currentPatient?.id || bill.patientId === currentPatient?.id : true))
    .slice(0, 4)
    .map((bill) => ({ ...bill, patient: patientName(bill.patient_id || bill.patientId), record: getMedicalRecord(bill.medical_record_id || bill.medicalRecordId) }));

  const quickBlocks = {
    admin: [
      ['Phòng khám', `${db.clinics.length}`, 'Phòng đang cấu hình'],
      ['Ca khám', `${db.shifts.length}`, 'Ca làm việc'],
      ['Nhật ký hệ thống', `${db.auditLogs.length}`, 'Bản ghi gần đây'],
    ],
    receptionist: [
      ['Check-in', `${db.appointments.filter((x) => x.status === 'SCHEDULED').length}`, 'Lịch cần tiếp nhận'],
      ['Thu ngân', `${db.bills.filter((x) => x.status === 'PENDING').length}`, 'Hóa đơn chờ xử lý'],
      ['Bệnh nhân mới', `${db.patients.length}`, 'Hồ sơ có sẵn'],
    ],
    doctor: [
      ['Lịch làm việc', `${db.workSchedules.filter((x) => x.doctor_id === currentDoctor?.id || x.doctorId === currentDoctor?.id).length}`, 'Ca làm việc'],
      ['Đang khám', `${db.appointments.filter((x) => (x.doctor_id === currentDoctor?.id || x.doctorId === currentDoctor?.id) && x.status === 'INPROGRESS').length}`, 'Ca đang thực hiện'],
      ['Lịch sử khám', `${db.medicalRecords.filter((x) => x.doctor_id === currentDoctor?.id || x.doctorId === currentDoctor?.id).length}`, 'Hồ sơ đã lập'],
    ],
    patient: [
      ['Lịch hẹn', `${db.appointments.filter((x) => x.patient_id === currentPatient?.id || x.patientId === currentPatient?.id).length}`, 'Tất cả lịch đã đặt'],
      ['Kết quả khám', `${db.medicalRecords.filter((x) => (x.patient_id === currentPatient?.id || x.patientId === currentPatient?.id) && x.status === 'COMPLETED').length}`, 'Bệnh án hoàn tất'],
      ['Thanh toán', `${db.bills.filter((x) => x.patient_id === currentPatient?.id || x.patientId === currentPatient?.id).length}`, 'Hóa đơn phát sinh'],
    ],
  };

  if (loading) {
    return (
      <section>
        <PageHeader title="Tổng quan" subtitle="Đang tải dữ liệu..." />
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Đang tải dữ liệu từ server...</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageHeader title="Tổng quan" subtitle={config.subtitle} />

      <div className="stats-grid">{config.stats.map(([title, value, note]) => <StatCard key={title} title={title} value={value} note={note} />)}</div>

      <div className="hero-grid">
        <SectionCard title="Chỉ số cần theo dõi">
          <div className="metric-list">
            <div><span>Yêu cầu chờ xử lý</span><strong>{totals.pendingRequests}</strong></div>
            <div><span>Bệnh án chưa hoàn tất</span><strong>{db.medicalRecords.filter((x) => x.status !== 'COMPLETED').length}</strong></div>
            <div><span>Hóa đơn chưa thanh toán</span><strong>{db.bills.filter((x) => x.status !== 'COMPLETED').length}</strong></div>
          </div>
        </SectionCard>

        <SectionCard title="Truy cập nhanh">
          <div className="quick-grid">
            {(quickBlocks[user?.role] || quickBlocks.admin).map(([title, value, note]) => (
              <div key={title}>
                <strong>{title}</strong>
                <span>{value}</span>
                <small className="muted">{note}</small>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="content-grid-2">
        <SectionCard title="Lịch hẹn gần nhất">
          <div className="mini-table">
            {visibleAppointments.length > 0 ? visibleAppointments.map((item) => (
              <div className="mini-row" key={item.id}>
                <div>
                  <strong>{item.patient}</strong>
                  <span className="muted">{item.doctor}</span>
                </div>
                <div>
                  <span>{formatDateTime(item.start_time || item.startTime)}</span>
                  <span className="muted">{appointmentStatusLabel(item.status)}</span>
                </div>
                <StatusBadge value={item.status} />
              </div>
            )) : <div className="empty-state">Chưa có lịch hẹn.</div>}
          </div>
        </SectionCard>

        <SectionCard title="Hóa đơn gần đây">
          <div className="mini-table">
            {visibleBills.length > 0 ? visibleBills.map((item) => (
              <div className="mini-row" key={item.id}>
                <div>
                  <strong>{item.patient}</strong>
                  <span className="muted">BA #{item.medical_record_id || item.medicalRecordId}</span>
                </div>
                <div>
                  <span>{formatCurrency(item.total_amount || item.totalAmount)}</span>
                  <span className="muted">{item.payment_method || item.paymentMethod || 'Chưa chọn phương thức'}</span>
                </div>
                <StatusBadge value={item.status} />
              </div>
            )) : <div className="empty-state">Chưa có hóa đơn.</div>}
          </div>
        </SectionCard>
      </div>
    </section>
  );
}
