import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import Toast from '../components/Toast';

const groups = [
  {
    title: 'Điều hành',
    items: [
      { to: '/', label: 'Tổng quan', roles: ['admin', 'ADMIN', 'receptionist', 'RECEPTIONIST', 'doctor', 'DOCTOR', 'patient', 'PATIENT'] },
      { to: '/appointments', label: 'Lịch hẹn', roles: ['admin', 'ADMIN', 'receptionist', 'RECEPTIONIST', 'doctor', 'DOCTOR', 'patient', 'PATIENT'] },
      { to: '/medical-records', label: 'Bệnh án', roles: ['admin', 'ADMIN', 'doctor', 'DOCTOR', 'patient', 'PATIENT'] },
      { to: '/billing', label: 'Hóa đơn', roles: ['admin', 'ADMIN', 'receptionist', 'RECEPTIONIST', 'patient', 'PATIENT'] },
    ],
  },
  {
    title: 'Danh mục',
    items: [
      { to: '/patients', label: 'Bệnh nhân', roles: ['admin', 'ADMIN', 'receptionist', 'RECEPTIONIST', 'doctor', 'DOCTOR'] },
      { to: '/doctors', label: 'Bác sĩ', roles: ['admin', 'ADMIN'] },
      { to: '/specialties', label: 'Chuyên khoa', roles: ['admin', 'ADMIN'] },
      { to: '/clinics', label: 'Phòng khám', roles: ['admin', 'ADMIN'] },
      { to: '/shifts', label: 'Ca khám', roles: ['admin', 'ADMIN'] },
      { to: '/services', label: 'Dịch vụ', roles: ['admin', 'ADMIN', 'receptionist', 'RECEPTIONIST'] },
      { to: '/schedules', label: 'Lịch làm việc', roles: ['admin', 'ADMIN'] },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { to: '/requests', label: 'Yêu cầu lịch hẹn', roles: ['admin', 'ADMIN'] },
      { to: '/accounts', label: 'Tài khoản', roles: ['admin', 'ADMIN'] },
      { to: '/audit-logs', label: 'Nhật ký hoạt động', roles: ['admin', 'ADMIN'] },
    ],
  },
];

function getRoleLabel(role) {
  const labels = {
    'admin': 'Quản trị',
    'ADMIN': 'Quản trị',
    'receptionist': 'Lễ tân',
    'RECEPTIONIST': 'Lễ tân',
    'doctor': 'Bác sĩ',
    'DOCTOR': 'Bác sĩ',
    'patient': 'Bệnh nhân',
    'PATIENT': 'Bệnh nhân',
  };
  return labels[role] || role;
}

function getUserDisplayName(user) {
  if (!user) return '';
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  if (user.name) return user.name;
  return user.username || '';
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { toast, loadAllData } = useClinic();
  const navigate = useNavigate();

  async function handleRefresh() {
    await loadAllData();
  }

  async function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">+</span>
          <div>
            <strong>MedSys Clinic</strong>
            <small>Phần mềm quản lý phòng khám</small>
          </div>
        </div>

        <div className="sidebar-user card-glass">
          <div>
            <div className="muted light">Tài khoản</div>
            <strong>{getUserDisplayName(user)}</strong>
          </div>
          <span className="badge primary">{getRoleLabel(user?.role)}</span>
        </div>

        <nav className="nav-groups">
          {groups.map((group) => {
            const items = group.items.filter((item) => item.roles.includes(user?.role));
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
            <button className="button secondary" onClick={handleRefresh}>Làm mới dữ liệu</button>
            <button className="button secondary" onClick={handleLogout}>Đăng xuất</button>
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
