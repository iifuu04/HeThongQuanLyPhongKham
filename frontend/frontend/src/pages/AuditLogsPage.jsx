import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { useClinic } from '../contexts/ClinicContext';
import { api } from '../api/client';
import { formatDateTime } from '../utils/helpers';

export default function AuditLogsPage() {
  const { db, profileName } = useClinic();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ userId: '', actionType: '', tableName: '', date: '' });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.getAuditLogs()
      .then((res) => { if (alive) setLogs(res.data || []); })
      .catch(() => { if (alive) setLogs([]); })
      .finally(() => { if (alive) setLoading(false); });
  }, []);

  const rows = useMemo(() => logs.map((item) => {
    const userName = item.user_first_name
      ? `${item.user_first_name} ${item.user_last_name || ''}`.trim()
      : (item.user_username || profileName(item.user_id) || '—');
    return {
      ...item,
      actor: userName,
      actionType: item.action_type,
      tableName: item.table_name,
      recordId: item.record_id,
      createdAt: item.created_at,
      userId: item.user_id,
    };
  }).filter((item) => {
    if (filters.userId && String(item.userId) !== filters.userId) return false;
    if (filters.actionType && item.actionType !== filters.actionType) return false;
    if (filters.tableName && item.tableName !== filters.tableName) return false;
    if (filters.date && !String(item.createdAt).startsWith(filters.date)) return false;
    return true;
  }), [logs, filters, profileName]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'actor', label: 'Người thực hiện' },
    { key: 'actionType', label: 'Hành động' },
    { key: 'tableName', label: 'Bảng dữ liệu' },
    { key: 'recordId', label: 'Record' },
    { key: 'description', label: 'Mô tả' },
    { key: 'createdAt', label: 'Thời điểm', render: (row) => formatDateTime(row.createdAt) },
  ];

  const distinctTables = useMemo(() => Array.from(new Set(logs.map((x) => x.table_name).filter(Boolean))), [logs]);

  return (
    <section>
      <PageHeader title="Nhật ký hoạt động" subtitle="Theo dõi lịch sử thao tác trên hệ thống." />
      <div className="filters card filter-grid">
        <label>
          <span>Người dùng</span>
          <select value={filters.userId} onChange={(e) => setFilters({ ...filters, userId: e.target.value })}>
            <option value="">Tất cả</option>
            {db.profiles.map((x) => (
              <option key={x.id} value={x.id}>
                {`${x.first_name || ''} ${x.last_name || ''}`.trim() || x.username}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Hành động</span>
          <select value={filters.actionType} onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}>
            <option value="">Tất cả</option>
            {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'].map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <label>
          <span>Bảng dữ liệu</span>
          <select value={filters.tableName} onChange={(e) => setFilters({ ...filters, tableName: e.target.value })}>
            <option value="">Tất cả</option>
            {distinctTables.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <label>
          <span>Ngày phát sinh</span>
          <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        </label>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage={loading ? 'Đang tải…' : 'Chưa có nhật ký phù hợp.'}
      />
    </section>
  );
}
