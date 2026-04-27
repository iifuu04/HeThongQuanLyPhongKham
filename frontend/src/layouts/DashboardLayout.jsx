import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import Toast from '../components/Toast';
import { roleLabel } from '../utils/helpers';

const groups = [
  {
    title: 'Điều hành',
    items: [
      { to: '/', label: 'Tổng quan', roles: ['admin', 'receptionist', 'doctor', 'patient'] },
      { to: '/appointments', label: 'Lịch hẹn', roles: ['admin', 'receptionist', 'doctor', 'patient'] },
      { to: '/medical-records', label: 'Bệnh án', roles: ['admin', 'doctor', 'patient'] },
      { to: '/billing', label: 'Hóa đơn', roles: ['admin', 'receptionist', 'patient'] },
    ],
  },
  {
    title: 'Danh mục',
    items: [
      { to: '/patients', label: 'Bệnh nhân', roles: ['admin', 'receptionist', 'doctor'] },
      { to: '/doctors', label: 'Bác sĩ', roles: ['admin'] },
      { to: '/specialties', label: 'Chuyên khoa', roles: ['admin'] },
      { to: '/clinics', label: 'Phòng khám', roles: ['admin'] },
      { to: '/shifts', label: 'Ca khám', roles: ['admin'] },
      { to: '/services', label: 'Dịch vụ', roles: ['admin', 'receptionist'] },
      { to: '/schedules', label: 'Lịch làm việc', roles: ['admin'] },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { to: '/requests', label: 'Yêu cầu lịch hẹn', roles: ['admin'] },
      { to: '/accounts', label: 'Tài khoản', roles: ['admin'] },
      { to: '/audit-logs', label: 'Nhật ký hoạt động', roles: ['admin'] },
    ],
  },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { toast, resetDb } = useClinic();
  const navigate = useNavigate();

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">✚</span>
          <div>
            <strong>MedSys Clinic</strong>
            <small>Phần mềm quản lý phòng khám</small>
          </div>
        </div>

        <div className="sidebar-user card-glass">
          <div>
            <div className="muted light">Tài khoản</div>
            <strong>{user.name}</strong>
          </div>
          <span className="badge primary">{roleLabel(user.role)}</span>
        </div>

        <nav className="nav-groups">
          {groups.map((group) => {
            const items = group.items.filter((item) => item.roles.includes(user.role));
            if (!items.length) return null;
            return (
              <div key={group.title} className="nav-group">
                <div className="nav-group-title">{group.title}</div>
                {items.map((item) => (
                  <NavLink key={item.to} to={item.to} end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div>
            <h2>MedSys Clinic</h2>
            <div className="topbar-subtitle">Bảng điều khiển</div>
          </div>
          <div className="action-row wrap">
            <button className="button secondary" onClick={resetDb}>Khôi phục dữ liệu</button>
            <button className="button secondary" onClick={() => { logout(); navigate('/login'); }}>Đăng xuất</button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
