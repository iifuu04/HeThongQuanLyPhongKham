import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AccountsPage from './pages/AccountsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import BillingPage from './pages/BillingPage';
import ClinicsPage from './pages/ClinicsPage';
import DashboardPage from './pages/DashboardPage';
import DoctorsPage from './pages/DoctorsPage';
import LoginPage from './pages/LoginPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import NotFoundPage from './pages/NotFoundPage';
import PatientsPage from './pages/PatientsPage';
import RequestsPage from './pages/RequestsPage';
import SchedulesPage from './pages/SchedulesPage';
import ServicesPage from './pages/ServicesPage';
import ShiftsPage from './pages/ShiftsPage';
import SpecialtiesPage from './pages/SpecialtiesPage';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Role mapping: frontend uses lowercase, backend uses uppercase
const roleAccess = {
  '/patients': ['admin', 'receptionist', 'doctor', 'ADMIN', 'RECEPTIONIST', 'DOCTOR'],
  '/doctors': ['admin', 'ADMIN'],
  '/specialties': ['admin', 'ADMIN'],
  '/clinics': ['admin', 'ADMIN'],
  '/shifts': ['admin', 'ADMIN'],
  '/services': ['admin', 'receptionist', 'ADMIN', 'RECEPTIONIST'],
  '/schedules': ['admin', 'ADMIN'],
  '/appointments': ['admin', 'receptionist', 'doctor', 'patient', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'],
  '/medical-records': ['admin', 'doctor', 'patient', 'ADMIN', 'DOCTOR', 'PATIENT'],
  '/billing': ['admin', 'receptionist', 'patient', 'ADMIN', 'RECEPTIONIST', 'PATIENT'],
  '/requests': ['admin', 'ADMIN'],
  '/accounts': ['admin', 'ADMIN'],
  '/audit-logs': ['admin', 'ADMIN'],
};

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Đang tải...</p>
      </div>
    );
  }

  return user ? <DashboardLayout /> : <Navigate to="/login" replace />;
}

function ProtectedPage({ path, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roleAccess[path] && !roleAccess[path].includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function LoginRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginRoute />} />
        </Route>
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/patients" element={<ProtectedPage path="/patients"><PatientsPage /></ProtectedPage>} />
          <Route path="/doctors" element={<ProtectedPage path="/doctors"><DoctorsPage /></ProtectedPage>} />
          <Route path="/specialties" element={<ProtectedPage path="/specialties"><SpecialtiesPage /></ProtectedPage>} />
          <Route path="/clinics" element={<ProtectedPage path="/clinics"><ClinicsPage /></ProtectedPage>} />
          <Route path="/shifts" element={<ProtectedPage path="/shifts"><ShiftsPage /></ProtectedPage>} />
          <Route path="/services" element={<ProtectedPage path="/services"><ServicesPage /></ProtectedPage>} />
          <Route path="/schedules" element={<ProtectedPage path="/schedules"><SchedulesPage /></ProtectedPage>} />
          <Route path="/appointments" element={<ProtectedPage path="/appointments"><AppointmentsPage /></ProtectedPage>} />
          <Route path="/medical-records" element={<ProtectedPage path="/medical-records"><MedicalRecordsPage /></ProtectedPage>} />
          <Route path="/billing" element={<ProtectedPage path="/billing"><BillingPage /></ProtectedPage>} />
          <Route path="/requests" element={<ProtectedPage path="/requests"><RequestsPage /></ProtectedPage>} />
          <Route path="/accounts" element={<ProtectedPage path="/accounts"><AccountsPage /></ProtectedPage>} />
          <Route path="/audit-logs" element={<ProtectedPage path="/audit-logs"><AuditLogsPage /></ProtectedPage>} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
