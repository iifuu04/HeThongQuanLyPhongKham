import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import Toast from '../components/Toast';
import { roleLabel } from '../utils/helpers';

const groups = [
  {
    title: 'Điều hành',
    items: [
      { to: '/', label: 'Tổng quan', roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'] },
      { to: '/accounts', label: 'Tài khoản', roles: ['ADMIN'] },
      { to: '/appointments', label: 'Lịch hẹn', roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'] },
      { to: '/requests', label: 'Yêu cầu xử lý lịch hẹn', roles: ['ADMIN', 'RECEPTIONIST'] },
      { to: '/medical-records', label: 'Bệnh án', roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
      { to: '/billing', label: 'Hóa đơn & Thanh toán', roles: ['ADMIN', 'RECEPTIONIST', 'PATIENT'] },
    ],
  },
  {
    title: 'Quản lý',
    items: [
      { to: '/patients', label: 'Bệnh nhân', roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
      { to: '/doctors', label: 'Bác sĩ', roles: ['ADMIN'] },
      { to: '/specialties', label: 'Chuyên khoa', roles: ['ADMIN'] },
      { to: '/clinics', label: 'Phòng khám', roles: ['ADMIN'] },
      { to: '/shifts', label: 'Ca khám', roles: ['ADMIN'] },
      { to: '/services', label: 'Dịch vụ', roles: ['ADMIN', 'RECEPTIONIST'] },
      { to: '/schedules', label: 'Lịch làm việc', roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { to: '/audit-logs', label: 'Nhật ký hoạt động', roles: ['ADMIN'] },
    ],
  },
];

function getDisplayName(user) {
  if (!user) return '';
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.username || '';
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { toast } = useClinic();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const displayName = getDisplayName(user);

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
            <strong>{displayName}</strong>
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
