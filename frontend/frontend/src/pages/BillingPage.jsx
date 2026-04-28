import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { formatCurrency } from '../utils/helpers';

export default function BillingPage() {
  const { user } = useAuth();
  const { db, saveBill, confirmPayment, patientName, getService } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ medicalRecordId: '', patientId: '', paymentMethod: 'CASH', status: 'PENDING', totalAmount: 0 });
  const [items, setItems] = useState([{ serviceId: '', quantity: 1, price: 0 }]);
  const currentPatient = db.patients.find((item) => item.profile_id === user?.id);

  // Map backend data to frontend format
  const mappedBills = useMemo(() => {
    return db.bills.map((item) => ({
      ...item,
      patientId: item.patient_id,
      medicalRecordId: item.medical_record_id,
      totalAmount: item.total_amount,
      paymentMethod: item.payment_method,
      patient: patientName(item.patient_id)
    }));
  }, [db.bills, patientName]);

  const rows = useMemo(() => mappedBills.filter((item) => {
    if (user?.role === 'PATIENT' || user?.role === 'patient') return item.patient_id === currentPatient?.id;
    return true;
  }), [mappedBills, user?.role, currentPatient]);

  const selectedBillId = rows[0]?.id;

  const columns = [
    { key: 'id', label: 'Mã HĐ' },
    { key: 'patient', label: 'Bệnh nhân' },
    { key: 'medicalRecordId', label: 'Mã BA', render: (row) => row.medical_record_id || row.medicalRecordId || '—' },
    { key: 'paymentMethod', label: 'Phương thức', render: (row) => row.payment_method || row.paymentMethod || '—' },
    { key: 'totalAmount', label: 'Tổng tiền', render: (row) => formatCurrency(row.total_amount || row.totalAmount) },
    { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge value={row.status} /> },
    { key: 'actions', label: 'Thao tác', render: (row) => (user?.role === 'PATIENT' || user?.role === 'patient' || row.status === 'COMPLETED') ? '—' : <button className="text-button" onClick={() => confirmPayment(row.id, row.payment_method || 'CASH', user?.id)}>Xác nhận thanh toán</button> },
  ];

  const fields = [
    { name: 'medicalRecordId', label: 'Bệnh án', type: 'select', options: db.medicalRecords.map((x) => ({ value: x.id, label: `BA #${x.id} • ${patientName(x.patient_id)}` })) },
    { name: 'patientId', label: 'Bệnh nhân', type: 'select', options: db.patients.map((x) => ({ value: x.id, label: patientName(x.id) })) },
    { name: 'paymentMethod', label: 'Phương thức thanh toán', type: 'select', options: [{ value: 'CASH', label: 'Tiền mặt' }, { value: 'BANKING', label: 'Chuyển khoản' }, { value: 'VISA', label: 'Thẻ VISA' }] },
  ];

  function updateItem(index, patch) {
    const next = items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch, price: patch.serviceId ? (getService(Number(patch.serviceId))?.price || item.price) : item.price } : item);
    setItems(next);
  }

  function submit(event) {
    event.preventDefault();
    const normalizedItems = items.map((item) => ({ ...item, serviceId: Number(item.serviceId), quantity: Number(item.quantity), price: Number(item.price) }));
    const totalAmount = normalizedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    if (saveBill({ ...form, medicalRecordId: Number(form.medicalRecordId), totalAmount, status: 'PENDING' }, normalizedItems, user?.id)) {
      setEditing(null);
      setItems([{ serviceId: '', quantity: 1, price: 0 }]);
    }
  }

  return (
    <section>
      <PageHeader title="Hóa đơn thanh toán" subtitle="Quản lý hóa đơn và thanh toán." action={user?.role !== 'PATIENT' && user?.role !== 'patient' ? <button className="button" onClick={() => { setEditing('new'); setForm({ medicalRecordId: '', patientId: '', paymentMethod: 'CASH', status: 'PENDING' }); setItems([{ serviceId: '', quantity: 1, price: 0 }]); }}>Tạo hóa đơn</button> : null} />

      {editing ? (
        <SectionCard title="Lập hóa đơn" subtitle="Lập hóa đơn cho hồ sơ bệnh án.">
          <EntityForm title="Thông tin hóa đơn" fields={fields} value={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={submit} onCancel={() => setEditing(null)} submitLabel="Lưu hóa đơn" />
          <div className="card nested-card">
            <div className="section-title-row"><h3>Dòng dịch vụ</h3><button className="text-button" type="button" onClick={() => setItems([...items, { serviceId: '', quantity: 1, price: 0 }])}>+ Thêm dòng</button></div>
            <div className="item-editor">
              {items.map((item, index) => (
                <div key={index} className="item-row">
                  <select value={item.serviceId} onChange={(e) => updateItem(index, { serviceId: e.target.value, price: getService(Number(e.target.value))?.price || 0 })}>
                    <option value="">Chọn dịch vụ</option>
                    {db.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                  </select>
                  <input type="number" value={item.quantity} onChange={(e) => updateItem(index, { quantity: e.target.value })} />
                  <input type="number" value={item.price} onChange={(e) => updateItem(index, { price: e.target.value })} />
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      ) : null}

      <div className="content-grid-2">
        <DataTable columns={columns} rows={rows} emptyMessage="Chưa có hóa đơn thanh toán." />
        <SectionCard title="Chi tiết hóa đơn" subtitle={selectedBillId ? `Hóa đơn #${selectedBillId}` : 'Chọn hóa đơn để theo dõi chi tiết dịch vụ'}>
          <div className="mini-table">
            <div className="empty-state">Chọn một hóa đơn để xem chi tiết dịch vụ.</div>
          </div>
        </SectionCard>
      </div>
    </section>
  );
}
