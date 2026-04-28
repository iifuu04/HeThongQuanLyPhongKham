# DEMO_FLOW.md - MedSys Clinic Management System

## Chuẩn bị trước khi demo

### 1. Khởi động backend
```bash
cd backend
npm run dev
```
Server chạy tại http://localhost:3000

### 2. Khởi động frontend
```bash
cd frontend/frontend
npm run dev
```
Frontend chạy tại http://localhost:5173

### 3. Tài khoản demo (password: 123456)
| Username | Password | Role | Chức năng demo |
|----------|----------|------|-----------------|
| admin01 | 123456 | ADMIN | Quản lý hệ thống |
| reception01 | 123456 | RECEPTIONIST | Tiếp nhận bệnh nhân |
| doctor01 | 123456 | DOCTOR | Khám bệnh |
| patient01 | 123456 | PATIENT | Đặt lịch khám |

---

## FLOW 1: ĐĂNG NHẬP VÀ RBAC

### Bước 1: Đăng nhập ADMIN
1. Mở trình duyệt http://localhost:5173
2. Nhập username: `admin01`, password: `123456`
3. Click "Đăng nhập"
4. Quan sát: Dashboard hiển thị menu đầy đủ (Accounts, Doctors, Specialties, Schedules, Patients, Appointments, Medical Records, Billing, Audit Logs)

### Bước 2: Đăng nhập RECEPTIONIST
1. Logout (click avatar -> Đăng xuất)
2. Đăng nhập: `reception01` / `123456`
3. Quan sát: Menu chỉ có Patients, Appointments, Billing

### Bước 3: Đăng nhập DOCTOR
1. Logout
2. Đăng nhập: `doctor01` / `123456`
3. Quan sát: Menu có Appointments, Medical Records, Schedules

### Bước 4: Đăng nhập PATIENT
1. Logout
2. Đăng nhập: `patient01` / `123456`
3. Quan sát: Menu có Appointments, Medical Records, Billing

---

## FLOW 2: ADMIN QUẢN LÝ HỆ THỐNG

### 2.1 Quản lý Tài khoản (UC18)
1. Đăng nhập `admin01`
2. Menu > Tài khoản
3. Xem danh sách tài khoản
4. Click "Thêm tài khoản" > Tạo tài khoản mới
5. Thử tạo username trùng > Báo lỗi
6. Lock/Unlock tài khoản

### 2.2 Quản lý Bác sĩ (UC5)
1. Menu > Bác sĩ
2. Xem danh sách bác sĩ
3. Click "Thêm bác sĩ" > Tạo bác sĩ mới
4. Disable bác sĩ > Kiểm tra không thể đặt lịch

### 2.3 Quản lý Chuyên khoa (UC6)
1. Menu > Chuyên khoa
2. Thêm/Sửa/Vô hiệu hóa chuyên khoa
3. Thử tạo trùng tên chuyên khoa active > Báo lỗi

### 2.4 Thiết lập Lịch làm việc (UC7)
1. Menu > Lịch làm việc
2. Click "Thêm lịch" > Chọn bác sĩ, ca, ngày
3. Thử tạo trùng lịch > Báo lỗi "Đã tồn tại"

---

## FLOW 3: RECEPTIONIST TIẾP NHẬN BỆNH NHÂN

### 3.1 Thêm bệnh nhân (UC1)
1. Đăng nhập `reception01`
2. Menu > Bệnh nhân
3. Click "Thêm bệnh nhân"
4. Điền: Họ tên, ngày sinh, số điện thoại
5. Submit > Bệnh nhân được tạo với Patient ID

### 3.2 Tìm kiếm bệnh nhân (UC3)
1. Trang Bệnh nhân
2. Search theo tên, SĐT, hoặc ID
3. Xem chi tiết bệnh nhân

### 3.3 Đặt lịch khám (UC8)
1. Menu > Lịch hẹn
2. Click "Đặt lịch"
3. Chọn bệnh nhân, bác sĩ, ca làm việc
4. Submit > Lịch hẹn được tạo

### 3.4 Tiếp nhận bệnh nhân (UC12)
1. Menu > Lịch hẹn
2. Tìm lịch hẹn đang SCHEDULED
3. Click "Tiếp nhận" > Status chuyển sang WAITING

### 3.5 Cập nhật trạng thái (UC13)
1. Chọn lịch WAITING
2. Click "Bắt đầu khám" > INPROGRESS
3. Click "Hoàn thành" > COMPLETED

---

## FLOW 4: DOCTOR KHÁM BỆNH

### 4.1 Xem lịch hẹn (UC10)
1. Đăng nhập `doctor01`
2. Menu > Lịch hẹn
3. Quan sát: Chỉ thấy lịch của mình

### 4.2 Cập nhật hồ sơ bệnh án (UC14)
1. Menu > Hồ sơ bệnh án
2. Chọn bệnh nhân có lịch COMPLETED
3. Tạo hồ sơ bệnh án: Triệu chứng, chẩn đoán, kê đơn
4. Finalize hồ sơ

---

## FLOW 5: RECEPTIONIST TẠO HÓA ĐƠN

### 5.1 Tạo hóa đơn (UC16)
1. Đăng nhập `reception01`
2. Menu > Hóa đơn
3. Click "Tạo hóa đơn"
4. Chọn hồ sơ bệnh án đã finalize
5. Thêm dịch vụ: Khám, thuốc, xét nghiệm
6. Submit > Hóa đơn được tạo với tổng tiền

### 5.2 Xác nhận thanh toán (UC17)
1. Chọn hóa đơn PENDING
2. Click "Thanh toán"
3. Chọn phương thức: Tiền mặt / Chuyển khoản / VISA
4. Xác nhận > Status chuyển sang COMPLETED
5. Thử thanh toán lần nữa > Báo lỗi "Bill already paid"

---

## FLOW 6: PATIENT ĐẶT LỊCH VÀ XEM HÓA ĐƠN

### 6.1 Đặt lịch khám (UC8)
1. Đăng nhập `patient01`
2. Menu > Lịch hẹn
3. Click "Đặt lịch mới"
4. Chọn bác sĩ, ca làm việc
5. Submit

### 6.2 Xem lịch hẹn của mình (UC10)
1. Quan sát: Chỉ thấy lịch của mình
2. Không thấy lịch của bệnh nhân khác

### 6.3 Xem hồ sơ bệnh án (UC15)
1. Menu > Hồ sơ bệnh án
2. Xem lịch sử khám của mình

### 6.4 Xem hóa đơn
1. Menu > Hóa đơn
2. Xem hóa đơn của mình

---

## FLOW 7: ADMIN DUYỆT YÊU CẦU (UC11)

### 7.1 Tạo yêu cầu hủy lịch
1. Đăng nhập `patient01`
2. Hủy lịch của mình > Tạo request

### 7.2 Duyệt yêu cầu
1. Đăng nhập `admin01`
2. Menu > Yêu cầu
3. Xem request PENDING
4. Approve/Reject request
5. Nếu Approve: Lịch hẹn chuyển sang CANCELLED

---

## Troubleshooting

### Lỗi "Khung giờ này đã được đặt"
- Bác sĩ đã có lịch hẹn vào khung giờ đó
- Chọn khung giờ khác

### Lỗi "Appointment not completed"
- Cần hoàn thành khám trước khi tạo hồ sơ bệnh án

### Lỗi "Medical record not finalized"
- Cần finalize hồ sơ bệnh án trước khi tạo hóa đơn

### Lỗi login
- Kiểm tra password: `123456`
- Kiểm tra tài khoản không bị lock (is_deleted = 0)

---

## Tổng kết thời gian demo

| Flow | Thời gian | Nội dung |
|------|------------|----------|
| Flow 1 | 3 phút | Login & RBAC |
| Flow 2 | 5 phút | Admin quản lý |
| Flow 3 | 5 phút | Receptionist tiếp nhận |
| Flow 4 | 3 phút | Doctor khám bệnh |
| Flow 5 | 3 phút | Tạo & thanh toán hóa đơn |
| Flow 6 | 3 phút | Patient đặt lịch |
| **Tổng** | **22 phút** | Demo hoàn chỉnh |
