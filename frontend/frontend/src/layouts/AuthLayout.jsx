import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div>
          <span className="eyebrow">MedSys Clinic</span>
          <h1>Website quản lý phòng khám</h1>
          <p>
            Quản lý bệnh nhân, lịch hẹn, hồ sơ bệnh án, thanh toán và vận hành phòng khám trên một nền tảng thống nhất.
          </p>
        </div>
      </div>

      <div className="auth-content">
        <Outlet />
      </div>
    </div>
  );
}