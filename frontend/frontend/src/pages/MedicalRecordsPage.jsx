import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import EntityForm from '../components/EntityForm';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { api } from '../api/client';
import { appointmentStatusLabel, formatCurrency, formatDateTime } from '../utils/helpers';

const empty = { appointmentId: '', symptoms: '', diagnosis: '', result: '', prescription: '', note: '' };
const emptyBillItem = { serviceId: '', quantity: 1, price: 0 };

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const { db, saveMedicalRecord, patientName, doctorName, getService, loadAllData, notify } = useClinic();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [selectedId, setSelectedId] = useState(null);
  const [billingOpen, setBillingOpen] = useState(false);
  const [billItems, setBillItems] = useState([emptyBillItem]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [payAfterCreate, setPayAfterCreate] = useState(false);

  const currentDoctor = useMemo(() => db.doctors.find((item) => item.profile_id === user?.id), [db.doctors, user?.id]);
  const currentPatient = useMemo(() => db.patients.find((item) => item.profile_id === user?.id), [db.patients, user?.id]);
  const canManageBilling = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  const mappedRecords = useMemo(() => {
    return db.medicalRecords
      .filter((item) => {
        if (user?.role === 'PATIENT') return item.patient_id === currentPatient?.id;
        return true;
      })
      .map((item) => ({
        ...item,
        patient: patientName(item.patient_id),
        doctor: doctorName(item.doctor_id),
        symptomsDisplay: item.symptoms || '—',
        diagnosisDisplay: item.diagnosis || '—',
        resultDisplay: item.result || '—',
        prescriptionDisplay: item.prescription || '—',
      }));
  }, [db.medicalRecords, user?.role, currentPatient, patientName, doctorName]);

  const selectedRecord = mappedRecords.find((item) => item.id === selectedId) || mappedRecords[0] || null;

  const relatedAppointment = useMemo(() => {
    if (!selectedRecord) return null;
    return db.appointments.find((apt) => apt.id === selectedRecord.appointment_id);
  }, [selectedRecord, db.appointments]);

  const existingBill = useMemo(() => {
    if (!selectedRecord) return null;
    return db.bills.find((bill) => Number(bill.medical_record_id) === Number(selectedRecord.id)) || null;
  }, [db.bills, selectedRecord]);

  const existingBillItems = useMemo(() => {
    if (!existingBill) return [];
    return db.billItems.filter((item) => Number(item.bill_id) === Number(existingBill.id));
  }, [db.billItems, existingBill]);

  const patientHistory = useMemo(() => {
    if (!selectedRecord) return [];
    return db.medicalRecords
      .filter((mr) => mr.patient_id === selectedRecord.patient_id && mr.id !== selectedRecord.id)
      .map((mr) => ({ ...mr, doctor: doctorName(mr.doctor_id) }))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [selectedRecord, db.medicalRecords, doctorName]);

  const availableAppointments = useMemo(() => {
    if (user?.role !== 'DOCTOR') return [];
    return db.appointments
      .filter((apt) => {
        if (apt.doctor_id !== currentDoctor?.id) return false;
        if (!['WAITING', 'INPROGRESS'].includes(apt.status)) return false;
        return !db.medicalRecords.some((mr) => mr.appointment_id === apt.id);
      })
      .map((apt) => ({
        value: apt.id,
        label: `#${apt.id} • ${patientName(apt.patient_id)} • ${appointmentStatusLabel(apt.status)} • ${formatDateTime(apt.start_time)}`,
      }));
  }, [db.appointments, db.medicalRecords, currentDoctor, user?.role, patientName]);

  const fields = [
    { name: 'appointmentId', label: 'Lịch hẹn', type: 'select', options: availableAppointments },
    { name: 'symptoms', label: 'Triệu chứng', type: 'textarea', full: true },
    { name: 'diagnosis', label: 'Chẩn đoán', type: 'textarea', full: true },
    { name: 'result', label: 'Kết quả khám', type: 'textarea', full: true },
    { name: 'prescription', label: 'Chỉ định/Đơn thuốc', type: 'textarea', full: true },
    { name: 'note', label: 'Ghi chú lâm sàng', type: 'textarea', full: true },
  ];

  const columns = [
    { key: 'id', label: 'Mã BA' },
    { key: 'patient', label: 'Bệnh nhân' },
    { key: 'doctor', label: 'Bác sĩ' },
    { key: 'diagnosisDisplay', label: 'Chẩn đoán', render: (row) => row.diagnosisDisplay },
    { key: 'status', label: 'Trạng thái', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row) => (
        <div className="action-row wrap">
          <button className="text-button" onClick={() => { setSelectedId(row.id); setBillingOpen(false); }}>Xem</button>
          {user?.role === 'DOCTOR' && row.doctor_id === currentDoctor?.id && row.status !== 'COMPLETED' && (
            <button
              className="text-button"
              onClick={() => {
                setEditing(row.id);
                setForm({
                  appointmentId: row.appointment_id,
                  symptoms: row.symptoms || '',
                  diagnosis: row.diagnosis || '',
                  result: row.result || '',
                  prescription: row.prescription || '',
                  note: row.note || '',
                });
              }}
            >
              Sửa
            </button>
          )}
          {user?.role === 'DOCTOR' && row.doctor_id === currentDoctor?.id && row.status !== 'COMPLETED' && (
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await api.finalizeMedicalRecord(row.id);
                  notify('Đã hoàn tất bệnh án');
                  await loadAllData();
                } catch (err) {
                  notify(err.message || 'Không thể hoàn tất bệnh án', 'error');
                }
              }}
            >
              Hoàn tất
            </button>
          )}
        </div>
      ),
    },
  ];

  async function submit(event) {
    event.preventDefault();
    const success = await saveMedicalRecord(editing === 'new' ? form : { ...form, id: editing }, user?.id);
    if (success) {
      setEditing(null);
      setForm(empty);
    }
  }

  const queueRows = useMemo(() => {
    if (user?.role !== 'DOCTOR') return [];
    return db.appointments
      .filter((apt) => apt.doctor_id === currentDoctor?.id && ['WAITING', 'INPROGRESS'].includes(apt.status))
      .map((apt) => ({ ...apt, patient: patientName(apt.patient_id) }));
  }, [db.appointments, currentDoctor, user?.role, patientName]);

  function resetBillForm() {
    setBillItems([emptyBillItem]);
    setPaymentMethod('CASH');
    setPayAfterCreate(false);
  }

  function updateBillItem(index, patch) {
    setBillItems((prev) => prev.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const next = { ...item, ...patch };
      if (patch.serviceId) {
        const service = getService(Number(patch.serviceId));
        next.price = service?.price || 0;
      }
      return next;
    }));
  }

  const draftTotal = billItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);

  async function createBillFromRecord(event) {
    event.preventDefault();
    if (!selectedRecord) return;
    if (selectedRecord.status !== 'COMPLETED') {
      notify('Chỉ lập hóa đơn cho bệnh án đã hoàn tất.', 'error');
      return;
    }
    if (existingBill) {
      notify('Bệnh án này đã có hóa đơn.', 'error');
      return;
    }

    const validItems = billItems.filter((item) => item.serviceId && Number(item.quantity) > 0 && Number(item.price) >= 0);
    if (validItems.length === 0) {
      notify('Vui lòng thêm ít nhất một dịch vụ đã sử dụng.', 'error');
      return;
    }

    try {
      const billRes = await api.createBill({ medical_record_id: selectedRecord.id });
      const billId = billRes.data?.id || billRes.data?.bill_id;
      if (!billId) throw new Error('Không lấy được mã hóa đơn vừa tạo.');

      for (const item of validItems) {
        await api.addBillItem(billId, {
          service_id: Number(item.serviceId),
          quantity: Number(item.quantity),
          price: Number(item.price),
        });
      }

      if (payAfterCreate) {
        await api.confirmPayment(billId, paymentMethod);
        notify('Đã lập hóa đơn, cộng phí dịch vụ và xác nhận thanh toán.');
      } else {
        notify('Đã lập hóa đơn và cộng phí dịch vụ vào hóa đơn.');
      }

      setBillingOpen(false);
      resetBillForm();
      await loadAllData();
    } catch (err) {
      notify(err.message || 'Không thể lập hóa đơn từ bệnh án.', 'error');
    }
  }

  async function payExistingBill() {
    if (!existingBill) return;
    try {
      await api.confirmPayment(existingBill.id, paymentMethod || existingBill.payment_method || 'CASH');
      notify('Đã xác nhận thanh toán hóa đơn.');
      await loadAllData();
    } catch (err) {
      notify(err.message || 'Không thể xác nhận thanh toán.', 'error');
    }
  }

  return (
    <section>
      <PageHeader
        title="Bệnh án điện tử"
        subtitle="Quản lý hồ sơ bệnh án điện tử, dịch vụ đã sử dụng và hóa đơn liên quan."
        action={user?.role === 'DOCTOR' && availableAppointments.length > 0 ? (
          <button className="button" onClick={() => { setEditing('new'); setForm(empty); }}>
            Tạo bệnh án
          </button>
        ) : null}
      />

      {editing ? (
        <EntityForm
          title={editing === 'new' ? 'Tạo hồ sơ bệnh án' : 'Cập nhật hồ sơ bệnh án'}
          fields={fields}
          value={form}
          onChange={(name, value) => setForm({ ...form, [name]: value })}
          onSubmit={submit}
          onCancel={() => { setEditing(null); setForm(empty); }}
          submitLabel={editing === 'new' ? 'Tạo' : 'Lưu'}
        />
      ) : null}

      <div className="content-grid-2 details-grid">
        <DataTable columns={columns} rows={mappedRecords} emptyMessage="Chưa có hồ sơ bệnh án nào." />
        <SectionCard title="Chi tiết bệnh án" subtitle="Thông tin chi tiết bệnh án.">
          {selectedRecord ? (
            <div className="detail-stack">
              <div className="detail-highlight">
                <strong>{selectedRecord.patient}</strong>
                <span className="muted">BA #{selectedRecord.id} • {selectedRecord.doctor}</span>
              </div>
              <div className="detail-grid">
                <div><span className="muted">Triệu chứng</span><strong>{selectedRecord.symptomsDisplay}</strong></div>
                <div><span className="muted">Chẩn đoán</span><strong>{selectedRecord.diagnosisDisplay}</strong></div>
                <div><span className="muted">Kết quả</span><strong>{selectedRecord.resultDisplay}</strong></div>
                <div><span className="muted">Trạng thái</span><StatusBadge value={selectedRecord.status} /></div>
                <div className="span-2"><span className="muted">Chỉ định/Đơn thuốc</span><strong>{selectedRecord.prescriptionDisplay}</strong></div>
                {selectedRecord.note && <div className="span-2"><span className="muted">Ghi chú lâm sàng</span><strong>{selectedRecord.note}</strong></div>}
              </div>

              {relatedAppointment && (
                <div className="nested-card card">
                  <div className="section-title-row"><div><h3>Lịch hẹn nguồn</h3><p>Lịch hẹn liên quan.</p></div></div>
                  <div className="detail-grid">
                    <div><span className="muted">Thời gian khám</span><strong>{formatDateTime(relatedAppointment.start_time)}</strong></div>
                    <div><span className="muted">Trạng thái lịch hẹn</span><strong>{appointmentStatusLabel(relatedAppointment.status)}</strong></div>
                    <div className="span-2"><span className="muted">Lý do khám</span><strong>{relatedAppointment.reason || '—'}</strong></div>
                  </div>
                </div>
              )}

              <div className="nested-card card">
                <div className="section-title-row">
                  <div>
                    <h3>Dịch vụ và hóa đơn của bệnh án</h3>
                    <p>Chọn dịch vụ đã sử dụng, hệ thống tự tính tổng tiền và cộng vào hóa đơn bệnh nhân.</p>
                  </div>
                  {canManageBilling && selectedRecord.status === 'COMPLETED' && !existingBill ? (
                    <button className="text-button" onClick={() => { setBillingOpen(!billingOpen); resetBillForm(); }}>
                      {billingOpen ? 'Đóng' : '+ Lập hóa đơn từ bệnh án'}
                    </button>
                  ) : null}
                </div>

                {existingBill ? (
                  <div className="detail-stack">
                    <div className="detail-grid">
                      <div><span className="muted">Mã hóa đơn</span><strong>HĐ #{existingBill.id}</strong></div>
                      <div><span className="muted">Trạng thái</span><StatusBadge value={existingBill.status} /></div>
                      <div><span className="muted">Tổng tiền</span><strong>{formatCurrency(existingBill.total_amount || 0)}</strong></div>
                      <div><span className="muted">Thanh toán</span><strong>{existingBill.payment_method || '—'}</strong></div>
                    </div>
                    {existingBillItems.length ? (
                      <table className="mini-table">
                        <thead><tr><th>Dịch vụ</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                        <tbody>{existingBillItems.map((item) => <tr key={item.id}><td>{item.service_name || getService(item.service_id)?.name || `Dịch vụ #${item.service_id}`}</td><td>{item.quantity}</td><td>{formatCurrency(item.price || 0)}</td><td>{formatCurrency((item.quantity || 0) * (item.price || 0))}</td></tr>)}</tbody>
                      </table>
                    ) : <div className="empty-state">Hóa đơn chưa có dịch vụ.</div>}
                    {canManageBilling && existingBill.status !== 'COMPLETED' ? (
                      <div className="action-row">
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                          <option value="CASH">Tiền mặt</option><option value="BANKING">Chuyển khoản</option><option value="VISA">Thẻ VISA</option>
                        </select>
                        <button className="button primary" onClick={payExistingBill}>Xác nhận thanh toán</button>
                      </div>
                    ) : null}
                  </div>
                ) : selectedRecord.status !== 'COMPLETED' ? (
                  <div className="empty-state">Cần hoàn tất bệnh án trước khi lập hóa đơn.</div>
                ) : !canManageBilling ? (
                  <div className="empty-state">Chưa có hóa đơn. Chỉ ADMIN/Lễ tân được lập hóa đơn.</div>
                ) : billingOpen ? (
                  <form onSubmit={createBillFromRecord} className="form-stack">
                    <div className="item-editor">
                      <div className="item-header"><span>Dịch vụ</span><span>Số lượng</span><span>Đơn giá</span><span>Thành tiền</span><span></span></div>
                      {billItems.map((item, index) => (
                        <div key={index} className="item-row">
                          <select value={item.serviceId} onChange={(e) => updateBillItem(index, { serviceId: e.target.value })} required>
                            <option value="">Chọn dịch vụ</option>
                            {db.services.map((service) => <option key={service.id} value={service.id}>{service.name} - {formatCurrency(service.price)}</option>)}
                          </select>
                          <input type="number" min="1" value={item.quantity} onChange={(e) => updateBillItem(index, { quantity: e.target.value })} required />
                          <input type="number" min="0" step="1000" value={item.price} onChange={(e) => updateBillItem(index, { price: e.target.value })} required />
                          <span className="line-total">{formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0))}</span>
                          <button type="button" className="text-button danger-text" onClick={() => setBillItems(billItems.filter((_, i) => i !== index))} disabled={billItems.length === 1}>×</button>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="text-button" onClick={() => setBillItems([...billItems, emptyBillItem])}>+ Thêm dịch vụ</button>
                    <div className="total-row"><strong>Tổng cộng:</strong><strong className="total-amount">{formatCurrency(draftTotal)}</strong></div>
                    <div className="form-row">
                      <label className="form-field"><span>Phương thức thanh toán</span><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="CASH">Tiền mặt</option><option value="BANKING">Chuyển khoản</option><option value="VISA">Thẻ VISA</option></select></label>
                      <label className="form-field"><span>Thanh toán ngay</span><select value={payAfterCreate ? 'YES' : 'NO'} onChange={(e) => setPayAfterCreate(e.target.value === 'YES')}><option value="NO">Chỉ lưu hóa đơn chờ thanh toán</option><option value="YES">Lập hóa đơn và thanh toán ngay</option></select></label>
                    </div>
                    <div className="action-row"><button type="submit" className="button primary">Lưu hóa đơn dịch vụ</button><button type="button" className="button secondary" onClick={() => { setBillingOpen(false); resetBillForm(); }}>Hủy</button></div>
                  </form>
                ) : (
                  <div className="empty-state">Bệnh án đã hoàn tất và chưa có hóa đơn. Bấm “Lập hóa đơn từ bệnh án” để thêm dịch vụ.</div>
                )}
              </div>

              {(user?.role === 'DOCTOR' || user?.role === 'ADMIN' || user?.role === 'PATIENT') && patientHistory.length > 0 && (
                <div className="nested-card card">
                  <div className="section-title-row"><div><h3>Lịch sử khám của bệnh nhân</h3><p>{patientHistory.length} lần khám trước đó của {selectedRecord.patient}.</p></div></div>
                  <div className="mini-table">
                    {patientHistory.map((mr) => (
                      <div className="mini-row" key={mr.id}>
                        <div><strong>BA #{mr.id}</strong><span className="muted">{formatDateTime(mr.created_at)}</span></div>
                        <div><span>{mr.diagnosis || '—'}</span><span className="muted">BS {mr.doctor}</span></div>
                        <button className="text-button" onClick={() => setSelectedId(mr.id)}>Xem</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : <div className="empty-state">Chọn một hồ sơ bệnh án để xem chi tiết.</div>}
        </SectionCard>
      </div>

      {user?.role === 'DOCTOR' && queueRows.length > 0 && (
        <SectionCard title="Hàng đợi khám" subtitle="Danh sách lịch hẹn cần tạo bệnh án.">
          <div className="mini-table">
            {queueRows.map((item) => (
              <div className="mini-row" key={item.id}>
                <div><strong>{item.patient}</strong><span className="muted">{formatDateTime(item.start_time)}</span></div>
                <div><span>{item.reason || '—'}</span><span className="muted">{appointmentStatusLabel(item.status)}</span></div>
                <StatusBadge value={item.status} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </section>
  );
}
