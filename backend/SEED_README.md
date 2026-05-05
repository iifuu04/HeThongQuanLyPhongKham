# MedSys Demo Seed Data

## Tài Khoản Demo

| Username | Password | Role |
|----------|----------|------|
| admin01 | 123456 | ADMIN |
| reception01 | 123456 | RECEPTIONIST |
| doctor01 | 123456 | DOCTOR |
| doctor02 | 123456 | DOCTOR |
| patient01 | 123456 | PATIENT |
| patient02 | 123456 | PATIENT |

**Lưu ý**: Password hash bcrypt cho '123456':
`$2b$10$bfDXlrPT.rPEAHOGIn82H.JwapIB9P3VQ0Z96rZepjtf1r.brSeZ6`

---

## Import Dữ Liệu

### Lệnh Import
```bash
cd HeThongQuanLyPhongKham/backend
mysql -u root -p MedSys < src/database/seed_demo.sql
```

### Xóa Dữ Liệu Cũ
Script tự động xóa theo thứ tự ngược khóa ngoại:
```sql
TRUNCATE TABLE Audit_Logs;
TRUNCATE TABLE Bill_Items;
TRUNCATE TABLE Bills;
TRUNCATE TABLE Medical_Records;
TRUNCATE TABLE Appointment_Request;
TRUNCATE TABLE Appointments;
TRUNCATE TABLE Work_Schedules;
TRUNCATE TABLE Patients;
TRUNCATE TABLE Doctors;
TRUNCATE TABLE Profiles;
TRUNCATE TABLE Services;
TRUNCATE TABLE Shifts;
TRUNCATE TABLE Clinics;
TRUNCATE TABLE Specialties;
```

---

## Danh Mục (Seed)

| Bảng | Số dòng | Ghi chú |
|------|---------|---------|
| Specialties | 6 | Nội Tổng Quát, Tai Mũi Họng, Nhi Khoa, Da Liễu, Mắt, Xét Nghiệm |
| Clinics | 4 | Tầng 1-2, Khu A-B |
| Shifts | 5 | 4 ca thường + 1 ca test max_patients=1 |
| Services | 8 | Khám, Nội Soi, Tư Vấn, Thuốc, Xét Nghiệm, X-Quang, Điện Tim, Siêu Âm |
| Profiles | 6 | 1 ADMIN, 1 RECEPTIONIST, 2 DOCTOR, 2 PATIENT |
| Doctors | 2 | D00001 (doctor01), D00002 (doctor02) |
| Patients | 2 | P00001 (patient01), P00002 (patient02) |
| Work_Schedules | 7 | doctor01: 5 lịch, doctor02: 2 lịch |
| Appointments | 6 | Đủ 5 trạng thái |
| Medical_Records | 2 | 1 COMPLETED, 1 INCOMPLETE |
| Bills | 2 | 1 PENDING, 1 COMPLETED |
| Bill_Items | 2 | Dịch vụ cho bill PENDING |
| Appointment_Request | 3 | 1 PENDING, 1 APPROVED, 1 REJECTED |
| Audit_Logs | 5 | Mẫu log |

---

## Dữ Liệu Nghiệp Vụ

### Liên Kết
- **doctor01** (profile_id=3) → D00001 → Noi Tong Quat (specialty_id=1)
- **doctor02** (profile_id=4) → D00002 → Tai Muoi Hong (specialty_id=2)
- **patient01** (profile_id=5) → P00001
- **patient02** (profile_id=6) → P00002

### Work Schedules
```
doctor01 (D00001):
  - WS1: 2026-05-10, Ca 1 (07:00-09:30), Phong 1
  - WS2: 2026-05-10, Ca 2 (09:30-12:00), Phong 1
  - WS3: 2026-05-10, Ca Test (08:00-09:00, max_patients=1), Phong 1
  - WS4: 2026-05-11, Ca 3 (13:00-15:30), Phong 1
  - WS5: 2026-05-11, Ca 4 (15:30-18:00), Phong 1

doctor02 (D00002):
  - WS6: 2026-05-10, Ca 1 (07:00-09:30), Phong 2
  - WS7: 2026-05-10, Ca 2 (09:30-12:00), Phong 2
```

### Appointments
| ID | Patient | Doctor | WorkSchedule | Start Time | Status |
|----|---------|--------|--------------|------------|--------|
| 1 | P00001 | D00001 | WS1 | 2026-05-10 08:00 | SCHEDULED |
| 2 | P00001 | D00001 | WS2 | 2026-05-10 10:00 | WAITING |
| 3 | P00001 | D00002 | WS6 | 2026-05-10 07:30 | INPROGRESS |
| 4 | P00002 | D00001 | WS4 | 2026-05-11 13:00 | COMPLETED |
| 5 | P00001 | D00001 | WS1 | 2026-05-10 09:30 | CANCELLED |
| 6 | P00001 | D00001 | WS3 | 2026-05-10 08:00 | SCHEDULED |

---

## Flow Demo Chính

### 1. Admin: Xem Dashboard
```powershell
# Login admin
$body = @{username="admin01";password="123456"} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $login.data.token

# Xem dashboard
Invoke-RestMethod -Uri "http://localhost:3000/api/reports/dashboard" -Method GET -Headers @{Authorization="Bearer $token"}
```

### 2. Admin: Quản Lý Bác Sĩ/Chuyên Khoa/Lịch Làm Việc
```powershell
# Tạo chuyên khoa mới
$body = @{name="Rang Ham Mat";description="Kham rang ham mat"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/specialties" -Method POST -Body $body -Headers @{Authorization="Bearer $token"} -ContentType "application/json"

# Xem danh sách bác sĩ
Invoke-RestMethod -Uri "http://localhost:3000/api/doctors" -Method GET -Headers @{Authorization="Bearer $token"}
```

### 3. Receptionist: Quản Lý Bệnh Nhân
```powershell
# Login reception
$body = @{username="reception01";password="123456"} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$receptionToken = $login.data.token

# Tạo bệnh nhân mới
$body = @{profile_id=99;first_name="Test";last_name="Patient"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/patients" -Method POST -Body $body -Headers @{Authorization="Bearer $receptionToken"} -ContentType "application/json"
```

### 4. Patient: Đặt Lịch
```powershell
# Login patient01
$body = @{username="patient01";password="123456"} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$patientToken = $login.data.token

# Xem lịch bác sĩ
Invoke-RestMethod -Uri "http://localhost:3000/api/work-schedules?doctor_id=D00001" -Method GET -Headers @{Authorization="Bearer $patientToken"}

# Tạo appointment mới (cho ngày mai)
$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
$body = @{
    patient_id="P00001"
    doctor_id="D00002"
    work_schedule_id=6
    start_time="$tomorrow 07:00:00"
    end_time="$tomorrow 07:30:00"
    reason="Kham deu"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/appointments" -Method POST -Body $body -Headers @{Authorization="Bearer $patientToken"} -ContentType "application/json"
```

### 5. Receptionist: Check-in Lịch Hẹn
```powershell
# Check-in appointment 1 (SCHEDULED -> WAITING)
Invoke-RestMethod -Uri "http://localhost:3000/api/appointments/1/check-in" -Method PATCH -Headers @{Authorization="Bearer $receptionToken"}
```

### 6. Doctor: Cập Nhật Trạng Thái Khám & Tạo Bệnh Án
```powershell
# Login doctor01
$body = @{username="doctor01";password="123456"} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$doctorToken = $login.data.token

# Start examination (WAITING -> INPROGRESS)
Invoke-RestMethod -Uri "http://localhost:3000/api/appointments/2/start" -Method PATCH -Headers @{Authorization="Bearer $doctorToken"}

# Tạo medical record
$body = @{
    appointment_id=2
    symptoms="Dau hong keo dai"
    diagnosis="Viem hong cap"
    result="O dinh"
    prescription="Amoxillin 500mg"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/medical-records" -Method POST -Body $body -Headers @{Authorization="Bearer $doctorToken"} -ContentType "application/json"

# Hoan tat kham (INPROGRESS -> COMPLETED)
Invoke-RestMethod -Uri "http://localhost:3000/api/appointments/2/complete" -Method PATCH -Headers @{Authorization="Bearer $doctorToken"}
```

### 7. Receptionist: Tạo Hóa Đơn
```powershell
# Tạo bill cho medical_record mới (id=2)
$body = @{medical_record_id=2} | ConvertTo-Json
$billRes = Invoke-RestMethod -Uri "http://localhost:3000/api/bills" -Method POST -Body $body -Headers @{Authorization="Bearer $receptionToken"} -ContentType "application/json"
$billId = $billRes.data.id

# Thêm dịch vụ
$body = @{service_id=1;quantity=1} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/bills/$billId/items" -Method POST -Body $body -Headers @{Authorization="Bearer $receptionToken"} -ContentType "application/json"

# Xác nhận thanh toán
Invoke-RestMethod -Uri "http://localhost:3000/api/bills/$billId/pay" -Method PATCH -Body @{paymentMethod="CASH"} | ConvertTo-Json -Headers @{Authorization="Bearer $receptionToken"}
```

### 8. Patient: Xem Lịch Sử Khám & Hóa Đơn
```powershell
# Xem appointment của mình
Invoke-RestMethod -Uri "http://localhost:3000/api/appointments" -Method GET -Headers @{Authorization="Bearer $patientToken"}

# Xem medical records
Invoke-RestMethod -Uri "http://localhost:3000/api/medical-records" -Method GET -Headers @{Authorization="Bearer $patientToken"}

# Xem bills
Invoke-RestMethod -Uri "http://localhost:3000/api/bills" -Method GET -Headers @{Authorization="Bearer $patientToken"}
```

---

## Flow Test Xung Đột

> **Lưu ý**: Vì chỉ có 2 patient nên test max_patients dùng ca có `max_patients=1` (Ca Test).

### CASE A: Trùng Slot - FAIL
**Mục tiêu**: patient02 đặt trùng doctor01 + work_schedule_id=1 + start_time='2026-05-10 08:00:00'

```powershell
# Login patient02
$body = @{username="patient02";password="123456"} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $login.data.token

# Thử đặt trùng slot (appointment 1 đã có P00001 đặt D00001, WS1, 08:00)
$body = @{
    patient_id="P00002"
    doctor_id="D00001"
    work_schedule_id=1
    start_time="2026-05-10 08:00:00"
    end_time="2026-05-10 08:30:00"
} | ConvertTo-Json

$res = Invoke-WebRequest -Uri "http://localhost:3000/api/appointments" -Method POST -Body $body -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -ErrorAction SilentlyContinue
Write-Host "Status: $($res.StatusCode)" -ForegroundColor Yellow
Write-Host "Response: $($res.Content)"
```

**Expected**: Status 400, message chứa "trùng" hoặc "đã đặt"

---

### CASE B: Vượt max_patients - FAIL
**Mục tiêu**: patient02 thử đặt work_schedule_id=3 (max_patients=1) đã đầy

```powershell
# Ca Test (shift_id=5, work_schedule_id=3) có max_patients=1
# Appointment 6 đã có P00001 đặt trong work_schedule_id=3

$body = @{
    patient_id="P00002"
    doctor_id="D00001"
    work_schedule_id=3
    start_time="2026-05-10 08:30:00"
    end_time="2026-05-10 09:00:00"
} | ConvertTo-Json

$res = Invoke-WebRequest -Uri "http://localhost:3000/api/appointments" -Method POST -Body $body -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -ErrorAction SilentlyContinue
Write-Host "Status: $($res.StatusCode)" -ForegroundColor Yellow
Write-Host "Response: $($res.Content)"
```

**Expected**: Status 400, message chứa "max_patients" hoặc "đã đầy"

---

### CASE C: Hủy Lịch Mở Lại Slot - SUCCESS
**Mục tiêu**: Tạo appointment mới cho slot đã hủy (appointment 5 đã CANCELLED)

```powershell
# Appointment 5 đã CANCELLED tại doctor01, WS1, 09:30
# Patient02 có thể đặt lại slot này

$body = @{
    patient_id="P00002"
    doctor_id="D00001"
    work_schedule_id=1
    start_time="2026-05-10 09:30:00"
    end_time="2026-05-10 10:00:00"
} | ConvertTo-Json

$res = Invoke-WebRequest -Uri "http://localhost:3000/api/appointments" -Method POST -Body $body -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -ErrorAction SilentlyContinue
Write-Host "Status: $($res.StatusCode)" -ForegroundColor Yellow
Write-Host "Response: $($res.Content)"
```

**Expected**: Status 201, tạo thành công

---

### CASE D: Tạo Bệnh Án Trùng - FAIL
**Mục tiêu**: Thử tạo medical_record cho appointment đã có record

```powershell
# Appointment 4 đã có medical_record (id=1)
# Doctor01 thử tạo thêm record cho appointment 4

$body = @{
    appointment_id=4
    symptoms="Trieu chung moi"
    diagnosis="Chan doan moi"
    result="Ket qua moi"
    prescription="Thuoc moi"
} | ConvertTo-Json

$res = Invoke-WebRequest -Uri "http://localhost:3000/api/medical-records" -Method POST -Body $body -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -ErrorAction SilentlyContinue
Write-Host "Status: $($res.StatusCode)" -ForegroundColor Yellow
Write-Host "Response: $($res.Content)"
```

**Expected**: Status 400, message chứa "đã có" hoặc "tồn tại"

---

### CASE E: Tạo Hóa Đơn Trùng - FAIL
**Mục tiêu**: Thử tạo bill cho medical_record đã có bill

```powershell
# medical_record_id=1 đã có bill (id=1)
# Receptionist thử tạo thêm bill cho medical_record_id=1

$body = @{medical_record_id=1} | ConvertTo-Json
$res = Invoke-WebRequest -Uri "http://localhost:3000/api/bills" -Method POST -Body $body -Headers @{Authorization="Bearer $receptionToken"} -ContentType "application/json" -ErrorAction SilentlyContinue
Write-Host "Status: $($res.StatusCode)" -ForegroundColor Yellow
Write-Host "Response: $($res.Content)"
```

**Expected**: Status 400, message chứa "đã có" hoặc "tồn tại"

---

### CASE F: Thanh Toán Trùng - FAIL
**Mục tiêu**: Thử confirm payment cho bill đã COMPLETED

```powershell
# Bill 2 đã ở trạng thái COMPLETED
# Receptionist thử confirm payment lại

$body = @{paymentMethod="CASH"} | ConvertTo-Json
$res = Invoke-WebRequest -Uri "http://localhost:3000/api/bills/2/pay" -Method PATCH -Body $body -Headers @{Authorization="Bearer $receptionToken"} -ContentType "application/json" -ErrorAction SilentlyContinue
Write-Host "Status: $($res.StatusCode)" -ForegroundColor Yellow
Write-Host "Response: $($res.Content)"
```

**Expected**: Status 400, message chứa "đã thanh toán" hoặc "COMPLETED"

---

## Tạo Bcrypt Hash Mới

Nếu cần tạo hash mới cho password '123456':
```bash
cd HeThongQuanLyPhongKham/backend
node generate_hash.js
```

---

## Lưu Ý Quan Trọng

1. **TRUNCATE thay vì DELETE**: Script dùng `TRUNCATE` để reset AUTO_INCREMENT tránh duplicate ID
2. **Không insert ID**: Các bảng AUTO_INCREMENT không cần insert ID
3. **Thứ tự xóa**: Phải xóa theo thứ tự ngược khóa ngoại
4. **Chạy nhiều lần**: Script an toàn khi chạy lại nhiều lần
5. **Ngày cố định**: Work schedules và appointments dùng ngày 2026-05-10 để test xung đột dễ dàng
