import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div>
          <span className="eyebrow">MedSys Clinic</span>
          <h1>Phần mềm quản lý phòng khám</h1>
          <p>
            Quản lý bệnh nhân, lịch hẹn, hồ sơ bệnh án, thanh toán và vận hành phòng khám trên một nền tảng thống nhất.
          </p>
        </div>
        <div className="auth-side-card card">
          <h3>Chức năng chính</h3>
          <ul>
            <li>Quản lý hồ sơ bệnh nhân và lịch hẹn</li>
            <li>Điều phối bác sĩ, phòng khám và lịch làm việc</li>
            <li>Quản lý bệnh án, hóa đơn và thanh toán</li>
            <li>Phân quyền truy cập theo từng vai trò</li>
          </ul>
        </div>
      </div>
      <div className="auth-content">
        <Outlet />
      </div>
    </div>
  );
}
