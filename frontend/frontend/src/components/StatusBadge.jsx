import { classNames, appointmentStatusLabel, genericStatusLabel, roleLabel } from '../utils/helpers';

const map = {
  active: 'success',
  locked: 'danger',
  ACTIVE: 'success',
  LOCKED: 'danger',
  SCHEDULED: 'info',
  WAITING: 'warning',
  INPROGRESS: 'primary',
  CANCELLED: 'danger',
  COMPLETED: 'success',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  INCOMPLETE: 'warning',
  admin: 'primary',
  receptionist: 'info',
  doctor: 'success',
  patient: 'muted',
};

function label(value) {
  if (['admin', 'receptionist', 'doctor', 'patient'].includes(value)) return roleLabel(value);
  if (['SCHEDULED', 'WAITING', 'INPROGRESS', 'CANCELLED', 'COMPLETED'].includes(value)) return appointmentStatusLabel(value);
  return genericStatusLabel(value);
}

export default function StatusBadge({ value }) {
  return <span className={classNames('badge', map[value] || 'muted')}>{label(value)}</span>;
}
