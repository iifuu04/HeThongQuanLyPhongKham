import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { useClinic } from '../contexts/ClinicContext';
import { formatDateTime } from '../utils/helpers';

export default function AuditLogsPage() {
  const { db, profileName } = useClinic();
  const [filters, setFilters] = useState({ userId: '', actionType: '', tableName: '', date: '' });

  const rows = useMemo(() => db.auditLogs
    .map((item) => ({ ...item, actor: profileName(item.userId) }))
    .filter((item) => {
      if (filters.userId && String(item.userId) !== filters.userId) return false;
      if (filters.actionType && item.actionType !== filters.actionType) return false;
      if (filters.tableName && item.tableName !== filters.tableName) return false;
      if (filters.date && !String(item.createdAt).startsWith(filters.date)) return false;
      return true;
    }), [db.auditLogs, filters, profileName]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'actor', label: 'Người thực hiện' },
    { key: 'actionType', label: 'Action' },
    { key: 'tableName', label: 'Bảng dữ liệu' },
    { key: 'recordId', label: 'Record' },
    { key: 'description', label: 'Mô tả' },
    { key: 'createdAt', label: 'Thời điểm', render: (row) => formatDateTime(row.createdAt) },
  ];

  return <section><PageHeader title="Nhật ký hoạt động" subtitle="Theo dõi lịch sử thao tác trên hệ thống." /><div className="filters card filter-grid"><label><span>Người dùng</span><select value={filters.userId} onChange={(e) => setFilters({ ...filters, userId: e.target.value })}><option value="">Tất cả</option>{db.profiles.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label><span>Action</span><select value={filters.actionType} onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}><option value="">Tất cả</option>{['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'].map((x) => <option key={x} value={x}>{x}</option>)}</select></label><label><span>Bảng dữ liệu</span><select value={filters.tableName} onChange={(e) => setFilters({ ...filters, tableName: e.target.value })}><option value="">Tất cả</option>{Array.from(new Set(db.auditLogs.map((x) => x.tableName))).map((x) => <option key={x} value={x}>{x}</option>)}</select></label><label><span>Ngày phát sinh</span><input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} /></label></div><DataTable columns={columns} rows={rows} /></section>;
}
