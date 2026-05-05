# Hệ Thống Quản Lý Phòng Khám (MedSys Clinic)

> Hệ thống quản lý phòng khám hoàn chỉnh với Node.js, Express, MySQL và React

---

## Mục Lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Cấu trúc Project](#2-cấu-trúc-project)
3. [Cài đặt](#3-cài-đặt)
4. [Chạy hệ thống](#4-chạy-hệ-thống)
5. [Tài khoản Demo](#5-tài-khoản-demo)
6. [Flow Demo Chuẩn](#6-flow-demo-chuẩn)
7. [Flow Test Xung Đột](#7-flow-test-xung-đột)
8. [API Test (PowerShell)](#8-api-test-powershell)
9. [Lưu ý](#9-lưu-ý)
10. [Kết luận](#10-kết-luận)

---

## 1. Giới Thiệu

### Tên Project
**MedSys Clinic** - Hệ Thống Quản Lý Phòng Khám

### Mô Tả
Hệ thống quản lý phòng khám đa người dùng với các chức năng:
- Quản lý bệnh nhân, bác sĩ, lịch hẹn
- Tạo và quản lý bệnh án
- Thanh toán hóa đơn
- Phân quyền người dùng (RBAC)
- Xử lý xung đột lịch hẹn

### Công Nghệ

| Layer | Công nghệ |
|-------|-----------|
| Backend | Node.js + Express.js |
| Frontend | React + Vite |
| Database | MySQL |
| Authentication | JWT |
| Password | Bcrypt |

---

## 2. Cấu Trúc Project

```
HeThongQuanLyPhongKham/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/           # Database configuration
│   │   ├── database/         # SQL schema & seed
│   │   │   ├── MedSys.sql      # Schema
│   │   │   └── seed_demo.sql   # Demo data
│   │   ├── middlewares/     # Auth, Role middlewares
│   │   ├── modules/         # Business logic
│   │   │   ├── Auth/
│   │   │   ├── Patient/
│   │   │   ├── Doctor/
│   │   │   ├── Appointment/
│   │   │   ├── MedicalRecord/
│   │   │   ├── Bill/
│   │   │   └── ...
│   │   ├── routes/          # API routes
│   │   ├── utils/          # Helpers
│   │   └── server.js       # Entry point
│   ├── test-api.js         # API test suite
│   └── package.json
│
├── frontend/                  # React + Vite
│   └── frontend/
│       ├── src/
│       │   ├── api/         # API client
│       │   ├── components/  # UI components
│       │   ├── contexts/    # React contexts
│       │   ├── layouts/     # Layouts
│       │   ├── pages/       # Pages
│       │   └── App.jsx
│       └── package.json
│
└── README_FINAL.md          # This file
```

---

## 3. Cài Đặt

### 3.1 Cài Node.js

1. Tải Node.js từ: https://nodejs.org/
2. Chọn phiên bản LTS (Recommended)
3. Cài đặt mặc định
4. Kiểm tra cài đặt:
```powershell
node --version
npm --version
```

### 3.2 Cài MySQL

1. Tải MySQL từ: https://dev.mysql.com/downloads/mysql/
2. Chọn phiên bản Community (miễn phí)
3. Cài đặt mặc định, đặt password root
4. Thêm MySQL vào PATH:
   - System Properties → Environment Variables → PATH
   - Thêm: `C:\Program Files\MySQL\MySQL Server 8.0\bin`

### 3.3 Tạo Database

```sql
CREATE DATABASE MedSys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 4. Chạy Hệ Thống

### 4.1 Import Database Schema & Data

```powershell
cd HeThongQuanLyPhongKham/backend
mysql -u root -p MedSys < src/database/MedSys.sql
mysql -u root -p MedSys < src/database/seed_demo.sql
```

### 4.2 Chạy Backend

```powershell
# Mở terminal 1
cd HeThongQuanLyPhongKham/backend
npm install
npm run dev
```

> **Backend chạy tại**: http://localhost:3000

### 4.3 Chạy Frontend

```powershell
# Mở terminal 2
cd HeThongQuanLyPhongKham/frontend
cd ../frontend/frontend
npm install
npm run dev
```

> **Frontend chạy tại**: http://localhost:5173

---

## 5. Tài Khoản Demo

| Username | Password | Role | Mô tả |
|----------|----------|------|--------|
| admin01 | 123456 | ADMIN | Quản trị hệ thống |
| reception01 | 123456 | RECEPTIONIST | Lễ tân, tạo bệnh nhân, hóa đơn |
| doctor01 | 123456 | DOCTOR | Bác sĩ, tạo bệnh án |
| patient01 | 123456 | PATIENT | Bệnh nhân, đặt lịch |
| patient02 | 123456 | PATIENT | Bệnh nhân, đặt lịch |

> **Password hash**: `$2b$10$bfDXlrPT.rPEAHOGIn82H.JwapIB9P3VQ0Z96rZepjtf1r.brSeZ6`

---

## 6. Flow Demo Chuẩn

### Bước 1: Admin Login → Xem Dashboard

```
1. Mở trình duyệt: http://localhost:5173
2. Login: admin01 / 123456
3. Xem Dashboard
4. Quản lý: Bác sĩ, Chuyên khoa, Lịch làm việc
```

### Bước 2: Receptionist Tạo Bệnh Nhân

```
1. Logout → Login: reception01 / 123456
2. Vào mục "Bệnh nhân"
3. Tạo bệnh nhân mới (nếu cần)
```

### Bước 3: Patient Đặt Lịch

```
1. Logout → Login: patient01 / 123456
2. Vào mục "Lịch hẹn"
3. Chọn bác sĩ, ngày, giờ
4. Đặt lịch hẹn mới
```

### Bước 4: Receptionist Check-in

```
1. Logout → Login: reception01 / 123456
2. Vào mục "Lịch hẹn"
3. Tìm lịch hẹn SCHEDULED
4. Click "Check-in" (SCHEDULED → WAITING)
```

### Bước 5: Doctor Khám → Tạo Bệnh Án

```
1. Logout → Login: doctor01 / 123456
2. Vào mục "Lịch hẹn"
3. Tìm lịch WAITING → Click "Bắt đầu khám" (→ INPROGRESS)
4. Nhập: Triệu chứng, Chẩn đoán, Kết quả, Đơn thuốc
5. Click "Tạo bệnh án"
6. Click "Hoàn tất khám" (→ COMPLETED)
```

### Bước 6: Receptionist Tạo Hóa Đơn

```
1. Logout → Login: reception01 / 123456
2. Vào mục "Hóa đơn"
3. Chọn bệnh án đã hoàn thành
4. Thêm dịch vụ (Khám, Xét nghiệm,...)
5. Click "Lưu hóa đơn"
```

### Bước 7: Receptionist Thanh Toán

```
1. Trong mục "Hóa đơn"
2. Chọn hóa đơn PENDING
3. Click "Xác nhận thanh toán"
4. Chọn phương thức: Tiền mặt / Chuyển khoản / VISA
5. Trạng thái: PENDING → COMPLETED
```

### Bước 8: Patient Xem Lịch Sử Khám

```
1. Logout → Login: patient01 / 123456
2. Xem lịch hẹn của mình
3. Xem lịch sử khám (bệnh án)
4. Xem hóa đơn
```

---

## 7. Flow Test Xung Đột

### Chuẩn Bị

```powershell
# Import seed data
mysql -u root -p MedSys < src/database/seed_demo.sql
```

### CASE A: Trùng Slot - FAIL

**Mục tiêu**: Test hệ thống từ chối đặt trùng giờ

```
1. patient01 đã đặt: doctor01, work_schedule_id=1, start_time='2026-05-10 08:00:00'
2. patient02 thử đặt cùng giờ → FAIL
```

```powershell
# Login patient02
$body = @{username="patient02";password="123456"} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $login.data.token

# Thử đặt trùng slot
$body = @{
    patient_id="P00002"
    doctor_id="D00001"
    work_schedule_id=1
    start_time="2026-05-10 08:00:00"
    end_time="2026-05-10 08:30:00"
} | ConvertTo-Json

$res = Invoke-WebRequest -Uri "http://localhost:3000/api/appointments" -Method POST -Body $body -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -ErrorAction SilentlyContinue
$res.StatusCode  # Expected: 400
```

**Expected**: Status 400, message chứa "trùng" hoặc "đã đặt"

---

### CASE B: Vượt max_patients - FAIL

**Mục tiêu**: Test hệ thống từ chối khi ca đầy

```
1. work_schedule_id=3 có max_patients=1
2. patient01 đã đặt trong work_schedule này
3. patient02 thử đặt → FAIL
```

```powershell
# Ca Test có max_patients=1
$body = @{
    patient_id="P00002"
    doctor_id="D00001"
    work_schedule_id=3
    start_time="2026-05-10 08:30:00"
    end_time="2026-05-10 09:00:00"
} | ConvertTo-Json

$res = Invoke-WebRequest -Uri "http://localhost:3000/api/appointments" -Method POST -Body $body -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -ErrorAction SilentlyContinue
$res.StatusCode  # Expected: 400
```

**Expected**: Status 400, message chứa "max_patients" hoặc "đầy"

---

### CASE C: Hủy Lịch Mở Lại Slot - SUCCESS

**Mục tiêu**: Slot đã hủy có thể đặt lại

```
1. Appointment 5 đã CANCELLED
2. patient02 đặt lại → SUCCESS
```

```powershell
# Appointment 5 đã CANCELLED tại doctor01, WS1, 09:30
$body = @{
    patient_id="P00002"
    doctor_id="D00001"
    work_schedule_id=1
    start_time="2026-05-10 09:30:00"
    end_time="2026-05-10 10:00:00"
} | ConvertTo-Json

$res = Invoke-WebRequest -Uri "http://localhost:3000/api/appointments" -Method POST -Body $body -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -ErrorAction SilentlyContinue
$res.StatusCode  # Expected: 201
```

**Expected**: Status 201, tạo thành công

---

### CASE D: Tạo Bệnh Án Trùng - FAIL

**Mục tiêu**: Test UNIQUE constraint appointment_id

```
1. Appointment 4 đã có medical_record
2. Thử tạo thêm → FAIL
```

```powershell
# Login reception để tạo
$body = @{username="reception01";password="123456"} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $login.data.token

# Thử tạo medical_record trùng
$body = @{
    appointment_id=4
    symptoms="Trieu chung moi"
    diagnosis="Chan doan moi"
    result="Ket qua moi"
    prescription="Thuoc moi"
} | ConvertTo-Json

$res = Invoke-WebRequest -Uri "http://localhost:3000/api/medical-records" -Method POST -Body $body -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -ErrorAction SilentlyContinue
$res.StatusCode  # Expected: 400
```

**Expected**: Status 400, message chứa "đã có"

---

### CASE E: Tạo Hóa Đơn Trùng - FAIL

**Mục tiêu**: Test UNIQUE constraint medical_record_id

```
1. medical_record_id=1 đã có bill
2. Thử tạo thêm → FAIL
```

```powershell
# medical_record_id=1 đã có bill (id=1)
$body = @{medical_record_id=1} | ConvertTo-Json

$res = Invoke-WebRequest -Uri "http://localhost:3000/api/bills" -Method POST -Body $body -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -ErrorAction SilentlyContinue
$res.StatusCode  # Expected: 400
```

**Expected**: Status 400, message chứa "đã có"

---

### CASE F: Thanh Toán Trùng - FAIL

**Mục tiêu**: Test chỉ thanh toán được PENDING

```
1. Bill 2 đã COMPLETED
2. Thử confirm lại → FAIL
```

```powershell
# Bill 2 đã COMPLETED
$body = @{paymentMethod="CASH"} | ConvertTo-Json

$res = Invoke-WebRequest -Uri "http://localhost:3000/api/bills/2/pay" -Method PATCH -Body $body -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -ErrorAction SilentlyContinue
$res.StatusCode  # Expected: 400
```

**Expected**: Status 400, message chứa "đã thanh toán"

---

## 8. API Test (PowerShell)

### 8.1 Login và lấy Token

```powershell
# Login
$body = @{
    username = "admin01"
    password = "123456"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$token = $login.data.token
Write-Host "Token: $token"
```

### 8.2 Gọi API có Auth

```powershell
# Xem dashboard
Invoke-RestMethod -Uri "http://localhost:3000/api/reports/dashboard" `
    -Method GET `
    -Headers @{Authorization="Bearer $token"}

# Xem patients
Invoke-RestMethod -Uri "http://localhost:3000/api/patients" `
    -Method GET `
    -Headers @{Authorization="Bearer $token"}

# Xem appointments
Invoke-RestMethod -Uri "http://localhost:3000/api/appointments" `
    -Method GET `
    -Headers @{Authorization="Bearer $token"}
```

### 8.3 Test Unauthorized

```powershell
# Không có token → 401
$res = Invoke-WebRequest -Uri "http://localhost:3000/api/patients" -Method GET
$res.StatusCode  # Expected: 401
```

### 8.4 Test Forbidden

```powershell
# Patient thử truy cập admin route → 403
$body = @{username="patient01";password="123456"} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$patientToken = $login.data.token

$res = Invoke-WebRequest -Uri "http://localhost:3000/api/profiles" `
    -Method GET `
    -Headers @{Authorization="Bearer $patientToken"}
$res.StatusCode  # Expected: 403
```

---

## 9. Lưu Ý

### ⚠️ Thứ tự chạy

```
1. Chạy MySQL (đảm bảo service đang chạy)
2. Import seed data
3. Chạy Backend (terminal 1)
4. Chạy Frontend (terminal 2)
```

### ⚠️ Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|-----------|
| ECONNREFUSED | Backend chưa chạy | Chạy `npm run dev` trong backend |
| Login failed | Data sai | Import lại seed: `mysql -u root -p MedSys < seed_demo.sql` |
| 401 Unauthorized | Token hết hạn hoặc thiếu | Login lại, thêm Header Authorization |
| 403 Forbidden | Không đủ quyền | Kiểm tra role của tài khoản |
| Duplicate entry | Data trùng lặp | Xóa và import lại seed |

### ⚠️ Reset Database

```powershell
mysql -u root -p MedSys < src/database/seed_demo.sql
```

---

## 10. Kết Luận

| Module | Chức năng |
|--------|-----------|
| **CRUD** | Create, Read, Update, Delete đầy đủ |
| **RBAC** | Phân quyền ADMIN, DOCTOR, RECEPTIONIST, PATIENT |
| **Appointment** | Đặt lịch, check-in, khám, hoàn thành |
| **Medical Record** | Tạo bệnh án, theo dõi điều trị |
| **Billing** | Tạo hóa đơn, thanh toán |
| **Conflict Handling** | Trùng slot, max_patients, cancel |

### RBAC Permission Matrix

| Module | ADMIN | DOCTOR | RECEPTIONIST | PATIENT |
|--------|:-----:|:------:|:------------:|:-------:|
| Dashboard | ✓ | ✓ | ✓ | ✗ |
| Profiles | CRUD | ✗ | ✗ | ✗ |
| Patients | CRUD | R | CRUD | R(own) |
| Doctors | CRUD | R | R | ✗ |
| Appointments | CRUD | R(own) | CRUD | CRU(own) |
| Medical Records | CRUD | CRU(own) | R | R(own) |
| Bills | CRUD | R | CRUD | R(own) |
| Audit Logs | R | ✗ | ✗ | ✗ |

### Test Case Summary

| Case | Mô tả | Expected |
|------|--------|----------|
| A | Trùng slot | FAIL |
| B | Vượt max_patients | FAIL |
| C | Đặt lại slot hủy | SUCCESS |
| D | Trùng medical_record | FAIL |
| E | Trùng bill | FAIL |
| F | Double payment | FAIL |

---

> **MedSys Clinic** - Hệ thống quản lý phòng khám hiện đại
> 
> Built with using Node.js, Express, MySQL, React
