import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { api } from '../api/client';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function BillingPage() {
  const { user } = useAuth();
  const { db, saveBill, confirmPayment, patientName, getService, loadAllData, notify } = useClinic();
  const [editing, setEditing] = useState(null);
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [form, setForm] = useState({ medicalRecordId: '', paymentMethod: 'CASH' });
  const [items, setItems] = useState([{ serviceId: '', quantity: 1, price: 0 }]);

  const currentPatient = useMemo(() => {
    return db.patients.find((item) => item.profile_id === user?.id);
  }, [db.patients, user?.id]);

  const isReceptionistOrAdmin = user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN';

  // Map bills with full details for display
  const mappedBills = useMemo(() => {
    return db.bills.map((bill) => {
      // Find related medical record
      const medicalRecord = db.medicalRecords.find((mr) => mr.id === bill.medical_record_id);
      // Get patient info from medical record
      const patientId = medicalRecord?.patient_id || bill.patient_id;
      
      return {
        ...bill,
        patient: patientName(patientId),
        medicalRecordId: bill.medical_record_id,
        diagnosis: medicalRecord?.diagnosis || '—',
        appointmentTime: medicalRecord?.appointment_start_time,
      };
    });
  }, [db.bills, db.medicalRecords, patientName]);

  // Filter bills based on role
  const rows = useMemo(() => {
    if (user?.role === 'PATIENT') {
      return mappedBills.filter((bill) => {
        const medicalRecord = db.medicalRecords.find((mr) => mr.id === bill.medical_record_id);
        return medicalRecord?.patient_id === currentPatient?.id;
      });
    }
    return mappedBills;
  }, [mappedBills, user?.role, currentPatient, db.medicalRecords]);

  const selectedBill = useMemo(() => {
    return rows.find((item) => item.id === selectedBillId) || rows[0] || null;
  }, [rows, selectedBillId]);

  // Get bill items for selected bill
  const selectedBillItems = useMemo(() => {
    if (!selectedBill) return [];
    return db.billItems?.filter((item) => item.bill_id === selectedBill.id) || [];
  }, [selectedBill, db.billItems]);

  // Filter medical records: only COMPLETED status, no existing bill
  const availableMedicalRecords = useMemo(() => {
    return db.medicalRecords
      .filter((mr) => {
        if (mr.status !== 'COMPLETED') return false;
        const hasBill = db.bills.some((b) => b.medical_record_id === mr.id);
        return !hasBill;
      })
      .map((mr) => ({
        value: mr.id,
        label: `#${mr.id} • ${patientName(mr.patient_id)} • ${mr.diagnosis || 'Không chẩn đoán'}`
      }));
  }, [db.medicalRecords, db.bills, patientName]);

  // Calculate total from items
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + (qty * price);
    }, 0);
  };

  // Update item
  const updateItem = (index, patch) => {
    const next = items.map((item, itemIndex) => {
      if (itemIndex === index) {
        const updated = { ...item, ...patch };
        if (patch.serviceId) {
          const service = getService(Number(patch.serviceId));
          updated.price = service?.price || 0;
        }
        return updated;
      }
      return item;
    });
    setItems(next);
  };

  // Add item row
  const addItemRow = () => {
    setItems([...items, { serviceId: '', quantity: 1, price: 0 }]);
  };

  // Remove item row
  const removeItemRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Submit bill
  async function submit(event) {
    event.preventDefault();
    if (!form.medicalRecordId) {
      notify('Vui lòng chọn bệnh án', 'error');
      return;
    }

    const validItems = items.filter((item) => item.serviceId && parseFloat(item.quantity) > 0);
    if (validItems.length === 0) {
      notify('Vui lòng thêm ít nhất một dịch vụ', 'error');
      return;
    }

    const normalizedItems = validItems.map((item) => ({
      serviceId: Number(item.serviceId),
      quantity: Number(item.quantity),
      price: Number(item.price)
    }));

    const success = await saveBill(
      { medicalRecordId: Number(form.medicalRecordId), paymentMethod: form.paymentMethod },
      normalizedItems,
      user?.id
    );
    
    if (success) {
      setEditing(null);
      setForm({ medicalRecordId: '', paymentMethod: 'CASH' });
      setItems([{ serviceId: '', quantity: 1, price: 0 }]);
    }
  }

  // Handle payment confirmation
  async function handleConfirmPayment(billId, paymentMethod) {
    try {
      await api.confirmPayment(billId, paymentMethod);
      notify('Đã xác nhận thanh toán');
      await loadAllData();
    } catch (err) {
      notify(err.message || 'Không thể xác nhận thanh toán', 'error');
    }
  }

  const paymentMethodLabel = (method) => {
    const labels = { CASH: 'Tiền mặt', BANKING: 'Chuyển khoản', VISA: 'Thẻ VISA' };
    return labels[method] || method || '—';
  };

  const columns = [
    { key: 'id', label: 'Mã HĐ' },
    { key: 'patient', label: 'Bệnh nhân' },
    { key: 'medicalRecordId', label: 'Mã BA', render: (row) => `#${row.medicalRecordId || row.medical_record_id || '—'}` },
    { 
      key: 'totalAmount', 
      label: 'Tổng tiền', 
      render: (row) => formatCurrency(row.total_amount || row.totalAmount || 0) 
    },
    { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => {
        if (user?.role === 'PATIENT') return '—';
        if (row.status === 'COMPLETED') return <span className="muted">Đã thanh toán</span>;
        return (
          <button 
            className="text-button" 
            onClick={() => handleConfirmPayment(row.id, row.payment_method || 'CASH')}
          >
            Thanh toán
          </button>
        );
      }
    },
  ];

  return (
    <section>
      <PageHeader
        title="Hóa đơn thanh toán"
        subtitle="Quản lý hóa đơn và thanh toán."
        action={isReceptionistOrAdmin && availableMedicalRecords.length > 0 ? (
          <button className="button" onClick={() => {
            setEditing('new');
            setForm({ medicalRecordId: '', paymentMethod: 'CASH' });
            setItems([{ serviceId: '', quantity: 1, price: 0 }]);
          }}>
            Tạo hóa đơn
          </button>
        ) : null}
      />

      {editing && (
        <SectionCard title="Lập hóa đơn" subtitle="Lập hóa đơn cho hồ sơ bệnh án đã hoàn thành.">
          <form onSubmit={submit} className="form-stack">
            <div className="form-row">
              <label className="form-field">
                <span>Bệnh án</span>
                <select
                  value={form.medicalRecordId}
                  onChange={(e) => setForm({ ...form, medicalRecordId: e.target.value })}
                  required
                >
                  <option value="">Chọn bệnh án đã hoàn thành</option>
                  {availableMedicalRecords.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Phương thức thanh toán</span>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="BANKING">Chuyển khoản</option>
                  <option value="VISA">Thẻ VISA</option>
                </select>
              </label>
            </div>

            <div className="card nested-card">
              <div className="section-title-row">
                <div>
                  <h3>Dịch vụ</h3>
                  <p>Thêm các dịch vụ đã sử dụng.</p>
                </div>
                <button type="button" className="text-button" onClick={addItemRow}>+ Thêm dịch vụ</button>
              </div>

              <div className="item-editor">
                <div className="item-header">
                  <span>Dịch vụ</span>
                  <span>Số lượng</span>
                  <span>Đơn giá</span>
                  <span>Thành tiền</span>
                  <span></span>
                </div>
                {items.map((item, index) => (
                  <div key={index} className="item-row">
                    <select
                      value={item.serviceId}
                      onChange={(e) => updateItem(index, { serviceId: e.target.value })}
                    >
                      <option value="">Chọn dịch vụ</option>
                      {db.services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} - {formatCurrency(service.price)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: e.target.value })}
                    />
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={item.price}
                      onChange={(e) => updateItem(index, { price: e.target.value })}
                    />
                    <span className="line-total">{formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0))}</span>
                    <button
                      type="button"
                      className="text-button danger-text"
                      onClick={() => removeItemRow(index)}
                      disabled={items.length === 1}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="total-row">
                <strong>Tổng cộng:</strong>
                <strong className="total-amount">{formatCurrency(calculateTotal())}</strong>
              </div>
            </div>

            <div className="action-row">
              <button type="submit" className="button primary">Lưu hóa đơn</button>
              <button type="button" className="button secondary" onClick={() => setEditing(null)}>Hủy</button>
            </div>
          </form>
        </SectionCard>
      )}

      <div className="content-grid-2">
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage="Chưa có hóa đơn thanh toán."
          onRowClick={(row) => setSelectedBillId(row.id)}
        />

        <SectionCard
          title="Chi tiết hóa đơn"
          subtitle={selectedBill ? `Hóa đơn #${selectedBill.id}` : 'Chọn hóa đơn để xem chi tiết'}
        >
          {selectedBill ? (
            <div className="detail-stack">
              <div className="detail-highlight">
                <strong>{selectedBill.patient}</strong>
                <span className="muted">HĐ #{selectedBill.id}</span>
              </div>

              <div className="detail-grid">
                <div>
                  <span className="muted">Mã bệnh án</span>
                  <strong>#{selectedBill.medicalRecordId || selectedBill.medical_record_id || '—'}</strong>
                </div>
                <div>
                  <span className="muted">Trạng thái</span>
                  <strong><StatusBadge value={selectedBill.status} /></strong>
                </div>
                <div>
                  <span className="muted">Ngày tạo</span>
                  <strong>{selectedBill.created_at ? formatDate(selectedBill.created_at) : '—'}</strong>
                </div>
                <div>
                  <span className="muted">Phương thức</span>
                  <strong>{paymentMethodLabel(selectedBill.payment_method || selectedBill.paymentMethod)}</strong>
                </div>
              </div>

              <div className="nested-card card">
                <h3>Dịch vụ đã sử dụng</h3>
                {selectedBillItems.length > 0 ? (
                  <>
                    <table className="mini-table">
                      <thead>
                        <tr>
                          <th>Dịch vụ</th>
                          <th>SL</th>
                          <th>Đơn giá</th>
                          <th>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBillItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.service_name || getService(item.service_id)?.name || `Dịch vụ #${item.service_id}`}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.price || item.service_price || 0)}</td>
                            <td>{formatCurrency((item.quantity || 0) * (item.price || item.service_price || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="total-row">
                      <strong>Tổng tiền:</strong>
                      <strong className="total-amount">{formatCurrency(selectedBill.total_amount || selectedBill.totalAmount || 0)}</strong>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">Không có dịch vụ nào.</div>
                )}
              </div>

              {selectedBill.status !== 'COMPLETED' && isReceptionistOrAdmin && (
                <div className="action-row">
                  <button
                    className="button primary"
                    onClick={() => handleConfirmPayment(selectedBill.id, selectedBill.payment_method || 'CASH')}
                  >
                    Xác nhận thanh toán
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">Chọn một hóa đơn để xem chi tiết.</div>
          )}
        </SectionCard>
      </div>
    </section>
  );
}
