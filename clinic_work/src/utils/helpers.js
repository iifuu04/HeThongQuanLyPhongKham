export function nextId(prefix, list) {
  const max = list.reduce((acc, item) => {
    const value = String(item.id ?? '');
    const num = Number(prefix ? value.replace(prefix, '') : value);
    return Number.isFinite(num) ? Math.max(acc, num) : acc;
  }, 0);
  return prefix ? `${prefix}${String(max + 1).padStart(5, '0')}` : max + 1;
}

export function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} đ`;
}

export function formatDate(value) {
  if (!value) return '—';
  const date = typeof value === 'string' && value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatTime(value) {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

export function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function roleLabel(role) {
  return {
    admin: 'Quản trị viên',
    receptionist: 'Lễ tân',
    doctor: 'Bác sĩ',
    patient: 'Bệnh nhân',
  }[role] || role;
}

export function genderLabel(value) {
  return value === 'Male' ? 'Nam' : value === 'Female' ? 'Nữ' : value || '—';
}

export function appointmentStatusLabel(value) {
  return {
    SCHEDULED: 'Đã đặt lịch',
    WAITING: 'Chờ khám',
    INPROGRESS: 'Đang khám',
    CANCELLED: 'Đã hủy',
    COMPLETED: 'Hoàn tất',
  }[value] || value;
}

export function genericStatusLabel(value) {
  return {
    ACTIVE: 'Đang hoạt động',
    LOCKED: 'Đã khóa',
    PENDING: 'Chờ xử lý',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
    COMPLETED: 'Hoàn tất',
    INCOMPLETE: 'Chưa hoàn chỉnh',
  }[value] || value;
}
