# KỊCH BẢN TEST HỆ THỐNG QUẢN LÝ PHÒNG KHÁM (MedSys)
**Môn học:** Công nghệ Phần mềm  

---

## MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan)
2. [Môi trường & Cấu hình](#2-môi-trường)
3. [Tài khoản test](#3-tài-khoản-test)
4. [Dữ liệu tham chiếu (Seed Data)](#4-dữ-liệu-tham-chiếu)
5. [Kịch bản Test – Module Auth](#5-module-auth)
6. [Kịch bản Test – Module Specialty & Clinic & Shift](#6-module-danh-mục)
7. [Kịch bản Test – Module Doctor & Patient](#7-module-doctor--patient)
8. [Kịch bản Test – Module Work Schedule](#8-module-work-schedule)
9. [Kịch bản Test – Module Appointment (Luồng chính)](#9-module-appointment)
10. [Kịch bản Test – Module Appointment Request](#10-module-appointment-request)
11. [Kịch bản Test – Module Medical Record](#11-module-medical-record)
12. [Kịch bản Test – Module Bill & Thanh toán](#12-module-bill)
13. [Kịch bản Test – Module Report & Audit Log](#13-module-report--audit-log)
14. [Kiểm thử bảo mật & Phân quyền](#14-kiểm-thử-bảo-mật)
15. [Luồng End-to-End tổng hợp](#15-luồng-end-to-end)

---

## 1. TỔNG QUAN

### Kiến trúc hệ thống

| Thành phần | Công nghệ | Cổng |
|---|---|---|
| Backend API | Node.js + Express | 3000 |
| Frontend | React + Vite | 5173 |
| Cơ sở dữ liệu | MySQL 8.x | 3306 |
| Xác thực | JWT (Bearer Token) | — |

### Các vai trò (Roles)

| Vai trò | Mô tả |
|---|---|
| **ADMIN** | Toàn quyền hệ thống |
| **DOCTOR** | Xem/thực hiện lịch khám của bản thân, tạo bệnh án |
| **RECEPTIONIST** | Quản lý lịch hẹn, check-in, tạo hóa đơn |
| **PATIENT** | Đặt lịch hẹn, xem bệnh án & hóa đơn của bản thân |

### Luồng trạng thái Appointment

```
SCHEDULED → WAITING → INPROGRESS → COMPLETED
    ↓             ↓          ↓
 CANCELLED    CANCELLED  CANCELLED
```

### Luồng trạng thái Medical Record

```
INCOMPLETE → COMPLETED
```

### Luồng trạng thái Bill

```
PENDING → COMPLETED (sau khi xác nhận thanh toán)
```

---

## 2. MÔI TRƯỜNG

### Cài đặt & Khởi động

```bash
# 1. Import database
mysql -u root -p < backend/src/database/MedSys.sql
mysql -u root -p MedSys < backend/src/database/seed_demo.sql

# 2. Chạy backend
cd backend
npm install
npm start   # Chạy trên cổng 3000

# 3. Chạy frontend (tuỳ chọn)
cd frontend/frontend
npm install
npm run dev  # Chạy trên cổng 5173
```

### Biến môi trường (`.env`)

```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=MedSys
JWT_SECRET=clinic_secret_key_change_in_production
JWT_EXPIRES_IN=1d
```

### Base URL

```
http://localhost:3000/api
```

### Header mẫu (cho các API yêu cầu xác thực)

```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

---

## 3. TÀI KHOẢN TEST

> Mật khẩu tất cả tài khoản: **`123456`**

| STT | Username | Vai trò | Họ tên | Email |
|---|---|---|---|---|
| 1 | `admin01` | ADMIN | Nguyễn An | admin01@medsys.vn |
| 2 | `reception01` | RECEPTIONIST | Lê Chí | reception01@medsys.vn |
| 3 | `doctor01` | DOCTOR | Trần Minh | doctor01@medsys.vn |
| 4 | `doctor02` | DOCTOR | Phạm Hà | doctor02@medsys.vn |
| 5 | `patient01` | PATIENT | Nguyễn Mai | patient01@medsys.vn |
| 6 | `patient02` | PATIENT | Trần Bình | patient02@medsys.vn |

---

## 4. DỮ LIỆU THAM CHIẾU (SEED DATA)

### Chuyên khoa (Specialties)

| ID | Tên |
|---|---|
| 1 | Nội Tổng Quát |
| 2 | Tai Mũi Họng |
| 3 | Nhi Khoa |
| 4 | Da Liễu |
| 5 | Mắt |
| 6 | Xét Nghiệm |

### Phòng khám (Clinics)

| ID | Tên | Vị trí |
|---|---|---|
| 1 | Phòng Khám 01 | Tầng 1 - Khu A |
| 2 | Phòng Khám 02 | Tầng 1 - Khu B |
| 3 | Phòng Khám 03 | Tầng 2 - Khu A |
| 4 | Phòng Khám 04 | Tầng 2 - Khu B (dự phòng) |

### Ca làm việc (Shifts)

| ID | Giờ bắt đầu | Giờ kết thúc | Số BN tối đa | Ghi chú |
|---|---|---|---|---|
| 1 | 07:00 | 09:30 | 16 | Ca sáng sớm |
| 2 | 09:30 | 12:00 | 14 | Ca sáng muộn |
| 3 | 13:00 | 15:30 | 14 | Ca chiều sớm |
| 4 | 15:30 | 18:00 | 12 | Ca chiều muộn |
| 5 | 08:00 | 09:00 | **1** | ⚠️ Ca test giới hạn (dùng để test max_patients) |

### Dịch vụ (Services)

| ID | Tên | Giá |
|---|---|---|
| 1 | Khám Chuyên Khoa | 150,000 VNĐ |
| 2 | Nội Soi Tai Mũi Họng | 280,000 VNĐ |
| 3 | Tư Vấn Điều Trị | 120,000 VNĐ |
| 4 | Thuốc Kê Đơn | 180,000 VNĐ |
| 5 | Xét Nghiệm Máu | 200,000 VNĐ |
| 6 | Chụp X-Quang | 350,000 VNĐ |
| 7 | Điện Tim (ECG) | 250,000 VNĐ |
| 8 | Siêu Âm (SA) | 300,000 VNĐ |

---

## 5. MODULE AUTH

### TC-AUTH-01: Đăng nhập thành công

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-AUTH-01 |
| **Tên** | Đăng nhập với tài khoản hợp lệ |
| **Actor** | Tất cả vai trò |
| **Điều kiện tiên quyết** | Hệ thống đang chạy, dữ liệu seed đã import |
| **Phương thức** | `POST /api/auth/login` |

**Body yêu cầu:**
```json
{
  "username": "admin01",
  "password": "123456"
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- Trả về `token` (JWT) và thông tin user
- `token` có thể decode được, chứa `role: "ADMIN"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail  
**Ghi chú:**

---

### TC-AUTH-02: Đăng nhập sai mật khẩu

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-AUTH-02 |
| **Tên** | Đăng nhập với mật khẩu sai |
| **Phương thức** | `POST /api/auth/login` |

**Body yêu cầu:**
```json
{
  "username": "admin01",
  "password": "wrongpassword"
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `401 Unauthorized`
- Message: `"Invalid username or password"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-AUTH-03: Đăng nhập thiếu trường bắt buộc

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-AUTH-03 |
| **Tên** | Đăng nhập không có password |
| **Phương thức** | `POST /api/auth/login` |

**Body yêu cầu:**
```json
{
  "username": "admin01"
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `400 Bad Request`
- Message: `"Username and password are required"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-AUTH-04: Truy cập API không có token

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-AUTH-04 |
| **Tên** | Gọi API bảo vệ mà không có Bearer Token |
| **Phương thức** | `GET /api/appointments` (không header Authorization) |

**Kết quả kỳ vọng:**
- HTTP Status: `401 Unauthorized`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-AUTH-05: Lấy thông tin user hiện tại

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-AUTH-05 |
| **Tên** | GET /api/auth/me trả về thông tin đúng |
| **Actor** | doctor01 |
| **Phương thức** | `GET /api/auth/me` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- `data.username` = `"doctor01"`, `data.role` = `"DOCTOR"`
- Không có trường `password_hash`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-AUTH-06: Đăng xuất

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-AUTH-06 |
| **Tên** | Đăng xuất thành công |
| **Actor** | patient01 |
| **Phương thức** | `POST /api/auth/logout` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- Message: `"Logout successful"`
- Audit log ghi nhận action `LOGOUT`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

## 6. MODULE DANH MỤC (Specialty, Clinic, Shift, MedicalService)

### TC-SPEC-01: Lấy danh sách chuyên khoa

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-SPEC-01 |
| **Actor** | Bất kỳ vai trò (sau khi đăng nhập) |
| **Phương thức** | `GET /api/specialties` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- Trả về mảng ≥ 6 chuyên khoa
- Mỗi phần tử có `id`, `name`, `status`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-SPEC-02: Admin tạo chuyên khoa mới

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-SPEC-02 |
| **Actor** | admin01 |
| **Phương thức** | `POST /api/specialties` |

**Body yêu cầu:**
```json
{
  "name": "Tim Mạch",
  "establish_at": "2024-01-01",
  "description": "Khám và điều trị bệnh lý tim mạch"
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `201 Created`
- `data.name` = `"Tim Mạch"`, `data.status` = `"ACTIVE"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-SPEC-03: Non-admin không được tạo chuyên khoa

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-SPEC-03 |
| **Actor** | reception01 |
| **Phương thức** | `POST /api/specialties` |

**Body yêu cầu:** (giống TC-SPEC-02)

**Kết quả kỳ vọng:**
- HTTP Status: `403 Forbidden`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-SHIFT-01: Lấy danh sách ca làm việc

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-SHIFT-01 |
| **Actor** | admin01 |
| **Phương thức** | `GET /api/shifts` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- Trả về 5 ca từ seed data

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-SVC-01: Lấy danh sách dịch vụ y tế

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-SVC-01 |
| **Actor** | Bất kỳ vai trò |
| **Phương thức** | `GET /api/services` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- Trả về 8 dịch vụ từ seed data

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

## 7. MODULE DOCTOR & PATIENT

### TC-DOC-01: Lấy danh sách bác sĩ

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-DOC-01 |
| **Actor** | admin01 |
| **Phương thức** | `GET /api/doctors` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- Trả về ít nhất 2 bác sĩ (doctor01, doctor02)
- Mỗi phần tử có `id`, `profile_id`, `specialty_id`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-DOC-02: Lấy danh sách bác sĩ theo chuyên khoa

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-DOC-02 |
| **Actor** | reception01 |
| **Phương thức** | `GET /api/doctors?specialty_id=1` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- Tất cả phần tử trả về có `specialty_id = 1`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-PAT-01: Admin lấy danh sách bệnh nhân

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-PAT-01 |
| **Actor** | admin01 |
| **Phương thức** | `GET /api/patients` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- Trả về ít nhất 2 bệnh nhân

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-PAT-02: Patient không được xem danh sách bệnh nhân khác

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-PAT-02 |
| **Actor** | patient01 |
| **Phương thức** | `GET /api/patients` |

**Kết quả kỳ vọng:**
- HTTP Status: `403 Forbidden`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

## 8. MODULE WORK SCHEDULE

> ⚠️ **Lưu ý:** Cần biết `doctor_id` (dạng VARCHAR 6 ký tự như "D00001") và `shift_id`, `clinic_id` trước khi chạy các test case này. Lấy từ kết quả TC-DOC-01.

### TC-WS-01: Admin tạo lịch làm việc cho bác sĩ

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-WS-01 |
| **Actor** | admin01 |
| **Phương thức** | `POST /api/work-schedules` |

**Body yêu cầu:**
```json
{
  "doctor_id": "<doctor_id của doctor01>",
  "clinic_id": 1,
  "shift_id": 1,
  "work_date": "2026-06-10"
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `201 Created`
- `data` chứa `id`, `doctor_id`, `clinic_id`, `shift_id`, `work_date`

**Kết quả thực tế:** ☐ Pass / ☐ Fail  
**Lưu ID lịch làm việc:** `work_schedule_id = ______`

---

### TC-WS-02: Tạo lịch trùng (duplicate)

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-WS-02 |
| **Actor** | admin01 |
| **Mô tả** | Tạo lịch trùng doctor_id + shift_id + work_date với TC-WS-01 |
| **Phương thức** | `POST /api/work-schedules` |

**Body yêu cầu:** (giống TC-WS-01)

**Kết quả kỳ vọng:**
- HTTP Status: `400 Bad Request`
- Thông báo lỗi về lịch trùng lặp

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-WS-03: Doctor xem lịch làm việc của bản thân

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-WS-03 |
| **Actor** | doctor01 |
| **Phương thức** | `GET /api/work-schedules/doctor/<doctor_id>` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- Trả về các lịch làm việc của doctor01

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-WS-04: Non-admin không được tạo lịch làm việc

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-WS-04 |
| **Actor** | doctor01 |
| **Phương thức** | `POST /api/work-schedules` |

**Kết quả kỳ vọng:**
- HTTP Status: `403 Forbidden`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

## 9. MODULE APPOINTMENT

> ⚠️ **Điều kiện tiên quyết:** Đã có `work_schedule_id` hợp lệ từ TC-WS-01 và `patient_id` từ TC-PAT-01.

### TC-APT-01: Đặt lịch hẹn thành công (Receptionist)

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-APT-01 |
| **Actor** | reception01 |
| **Phương thức** | `POST /api/appointments` |

**Body yêu cầu:**
```json
{
  "patient_id": "<patient_id của patient01>",
  "doctor_id": "<doctor_id của doctor01>",
  "work_schedule_id": <work_schedule_id từ TC-WS-01>,
  "start_time": "2026-06-10T07:00:00"
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `201 Created`
- `data.status` = `"SCHEDULED"`
- `data.patient_id` và `data.doctor_id` khớp

**Kết quả thực tế:** ☐ Pass / ☐ Fail  
**Lưu ID lịch hẹn:** `appointment_id_1 = ______`

---

### TC-APT-02: Patient tự đặt lịch

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-APT-02 |
| **Actor** | patient02 |
| **Phương thức** | `POST /api/appointments` |

**Body yêu cầu:**
```json
{
  "patient_id": "<patient_id của patient02>",
  "doctor_id": "<doctor_id của doctor01>",
  "work_schedule_id": <work_schedule_id>,
  "start_time": "2026-06-10T07:15:00"
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `201 Created`
- `data.status` = `"SCHEDULED"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail  
**Lưu ID lịch hẹn:** `appointment_id_2 = ______`

---

### TC-APT-03: Đặt lịch trùng slot (duplicate)

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-APT-03 |
| **Actor** | reception01 |
| **Mô tả** | Đặt lại đúng `doctor_id + work_schedule_id + start_time` của TC-APT-01 |
| **Phương thức** | `POST /api/appointments` |

**Kết quả kỳ vọng:**
- HTTP Status: `400 Bad Request`
- Thông báo lỗi về slot đã bị đặt

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-APT-04: Check-in bệnh nhân (SCHEDULED → WAITING)

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-APT-04 |
| **Actor** | reception01 |
| **Phương thức** | `PATCH /api/appointments/<appointment_id_1>/check-in` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- `data.status` = `"WAITING"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-APT-05: Patient không được check-in

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-APT-05 |
| **Actor** | patient01 |
| **Phương thức** | `PATCH /api/appointments/<appointment_id_1>/check-in` |

**Kết quả kỳ vọng:**
- HTTP Status: `403 Forbidden`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-APT-06: Bắt đầu khám (WAITING → INPROGRESS)

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-APT-06 |
| **Actor** | doctor01 |
| **Phương thức** | `PATCH /api/appointments/<appointment_id_1>/start` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- `data.status` = `"INPROGRESS"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-APT-07: Doctor không được bắt đầu khám của bác sĩ khác

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-APT-07 |
| **Actor** | doctor02 |
| **Phương thức** | `PATCH /api/appointments/<appointment_id_1>/start` |

**Kết quả kỳ vọng:**
- HTTP Status: `400 Bad Request` hoặc `403 Forbidden`
- Không được phép thao tác lịch hẹn của bác sĩ khác

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-APT-08: Hoàn tất khám (INPROGRESS → COMPLETED)

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-APT-08 |
| **Actor** | doctor01 |
| **Phương thức** | `PATCH /api/appointments/<appointment_id_1>/complete` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- `data.status` = `"COMPLETED"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-APT-09: Hủy lịch hẹn bởi Patient (SCHEDULED → CANCELLED)

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-APT-09 |
| **Actor** | patient02 |
| **Phương thức** | `PATCH /api/appointments/<appointment_id_2>/cancel` |

**Điều kiện:** `appointment_id_2` vẫn ở trạng thái `SCHEDULED`

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- `data.status` = `"CANCELLED"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-APT-10: Không thể hủy lịch đã COMPLETED

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-APT-10 |
| **Actor** | reception01 |
| **Phương thức** | `PATCH /api/appointments/<appointment_id_1>/cancel` |

**Điều kiện:** `appointment_id_1` đã ở trạng thái `COMPLETED` từ TC-APT-08

**Kết quả kỳ vọng:**
- HTTP Status: `400 Bad Request`
- Thông báo không thể hủy lịch đã hoàn tất

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-APT-11: Test giới hạn số bệnh nhân (max_patients = 1)

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-APT-11 |
| **Actor** | admin01 → reception01 |
| **Mô tả** | Tạo lịch làm việc với shift_id = 5 (max = 1), đặt 2 lịch hẹn |

**Bước 1:** Admin tạo work_schedule mới với `shift_id = 5`  
**Bước 2:** Đặt lịch hẹn thứ nhất → Kỳ vọng: `201 Created`  
**Bước 3:** Đặt lịch hẹn thứ hai cùng ca → Kỳ vọng: `400 Bad Request`

**Kết quả kỳ vọng bước 3:**
- HTTP Status: `400 Bad Request`
- Thông báo ca đã đầy bệnh nhân

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-APT-12: Lịch đã hủy có thể đặt lại (slot được giải phóng)

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-APT-12 |
| **Actor** | reception01 |
| **Mô tả** | Sau khi `appointment_id_2` bị hủy (TC-APT-09), đặt lại slot đó |

**Body yêu cầu:** (giống TC-APT-02)

**Kết quả kỳ vọng:**
- HTTP Status: `201 Created`
- Hệ thống chấp nhận vì slot đã được giải phóng

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

## 10. MODULE APPOINTMENT REQUEST

### TC-REQ-01: Gửi yêu cầu hủy lịch hẹn

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-REQ-01 |
| **Actor** | patient01 |
| **Phương thức** | `POST /api/appointment-requests` |

**Body yêu cầu:**
```json
{
  "appointment_id": <appointment_id>,
  "action": "CANCEL",
  "patient_id": "<patient_id của patient01>",
  "doctor_id": "<doctor_id của doctor01>"
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `201 Created`
- `data.status` = `"PENDING"`, `data.action` = `"CANCEL"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail  
**Lưu ID yêu cầu:** `request_id = ______`

---

### TC-REQ-02: Admin duyệt yêu cầu

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-REQ-02 |
| **Actor** | admin01 |
| **Phương thức** | `PATCH /api/appointment-requests/<request_id>/approve` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- `data.status` = `"APPROVED"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-REQ-03: Admin từ chối yêu cầu

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-REQ-03 |
| **Actor** | admin01 |
| **Mô tả** | Tạo một yêu cầu mới rồi từ chối |
| **Phương thức** | `PATCH /api/appointment-requests/<request_id>/reject` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- `data.status` = `"REJECTED"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

## 11. MODULE MEDICAL RECORD

> ⚠️ **Điều kiện tiên quyết:** `appointment_id_1` đã ở trạng thái `COMPLETED` (từ TC-APT-08).

### TC-MR-01: Doctor tạo bệnh án

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-MR-01 |
| **Actor** | doctor01 |
| **Phương thức** | `POST /api/medical-records` |

**Body yêu cầu:**
```json
{
  "patient_id": "<patient_id của patient01>",
  "doctor_id": "<doctor_id của doctor01>",
  "appointment_id": <appointment_id_1>,
  "symptoms": "Sốt cao, đau đầu, mệt mỏi",
  "diagnosis": "Cảm cúm thông thường",
  "note": "Bệnh nhân cần nghỉ ngơi 3-5 ngày",
  "prescription": "Paracetamol 500mg x 3 lần/ngày",
  "result": "Tốt sau điều trị"
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `201 Created`
- `data.status` = `"INCOMPLETE"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail  
**Lưu ID bệnh án:** `medical_record_id = ______`

---

### TC-MR-02: Doctor cập nhật bệnh án

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-MR-02 |
| **Actor** | doctor01 |
| **Phương thức** | `PUT /api/medical-records/<medical_record_id>` |

**Body yêu cầu:**
```json
{
  "diagnosis": "Cảm cúm thông thường - cập nhật sau xét nghiệm",
  "prescription": "Paracetamol 500mg x 3 lần/ngày + Vitamin C"
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- `data.diagnosis` đã được cập nhật

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-MR-03: Hoàn tất bệnh án (INCOMPLETE → COMPLETED)

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-MR-03 |
| **Actor** | doctor01 |
| **Phương thức** | `PATCH /api/medical-records/<medical_record_id>/finalize` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- `data.status` = `"COMPLETED"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-MR-04: Patient xem lịch sử bệnh án của mình

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-MR-04 |
| **Actor** | patient01 |
| **Phương thức** | `GET /api/medical-records/patient/<patient_id>/history` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- Trả về danh sách bệnh án của patient01

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-MR-05: Patient không xem được bệnh án của người khác

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-MR-05 |
| **Actor** | patient01 |
| **Phương thức** | `GET /api/medical-records/patient/<patient_id_của_patient02>/history` |

**Kết quả kỳ vọng:**
- HTTP Status: `403 Forbidden` hoặc mảng rỗng

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-MR-06: Doctor khác không tạo được bệnh án cho lịch hẹn của doctor01

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-MR-06 |
| **Actor** | doctor02 |
| **Phương thức** | `POST /api/medical-records` |

**Body yêu cầu:** (giống TC-MR-01, `appointment_id` thuộc doctor01)

**Kết quả kỳ vọng:**
- HTTP Status: `400 Bad Request` hoặc `403 Forbidden`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

## 12. MODULE BILL

> ⚠️ **Điều kiện tiên quyết:** `medical_record_id` đã ở trạng thái `COMPLETED` (từ TC-MR-03).

### TC-BILL-01: Receptionist tạo hóa đơn

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-BILL-01 |
| **Actor** | reception01 |
| **Phương thức** | `POST /api/bills` |

**Body yêu cầu:**
```json
{
  "medical_record_id": <medical_record_id>
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `201 Created`
- `data.status` = `"PENDING"`
- `data.total_amount` = `0` (chưa có dịch vụ)

**Kết quả thực tế:** ☐ Pass / ☐ Fail  
**Lưu ID hóa đơn:** `bill_id = ______`

---

### TC-BILL-02: Thêm dịch vụ vào hóa đơn

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-BILL-02 |
| **Actor** | reception01 |
| **Phương thức** | `POST /api/bills/<bill_id>/items` |

**Body yêu cầu (lần 1 - Khám chuyên khoa):**
```json
{
  "service_id": 1,
  "quantity": 1,
  "price": 150000
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `201 Created`

**Tiếp theo, thêm dịch vụ thứ 2 (Xét nghiệm máu):**
```json
{
  "service_id": 5,
  "quantity": 1,
  "price": 200000
}
```

**Kết quả kỳ vọng:** Thêm thành công, tổng 2 dịch vụ

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-BILL-03: Xem chi tiết hóa đơn với dịch vụ

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-BILL-03 |
| **Actor** | reception01 |
| **Phương thức** | `GET /api/bills/<bill_id>/detail` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- `data.items` chứa 2 dịch vụ đã thêm
- `data.total_amount` = `350000` (150000 + 200000)

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-BILL-04: Xác nhận thanh toán (PENDING → COMPLETED)

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-BILL-04 |
| **Actor** | reception01 |
| **Phương thức** | `PATCH /api/bills/<bill_id>/pay` |

**Body yêu cầu:**
```json
{
  "paymentMethod": "CASH"
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- `data.status` = `"COMPLETED"`
- `data.payment_method` = `"CASH"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-BILL-05: Không thể thanh toán lại hóa đơn đã COMPLETED

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-BILL-05 |
| **Actor** | reception01 |
| **Phương thức** | `PATCH /api/bills/<bill_id>/pay` |

**Điều kiện:** `bill_id` đã ở trạng thái `COMPLETED`

**Body yêu cầu:**
```json
{
  "paymentMethod": "BANKING"
}
```

**Kết quả kỳ vọng:**
- HTTP Status: `400 Bad Request`
- Thông báo hóa đơn đã được thanh toán

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-BILL-06: Patient xem hóa đơn của mình

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-BILL-06 |
| **Actor** | patient01 |
| **Phương thức** | `GET /api/bills/<bill_id>` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- Trả về chi tiết hóa đơn

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-BILL-07: Doctor không được tạo hóa đơn

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-BILL-07 |
| **Actor** | doctor01 |
| **Phương thức** | `POST /api/bills` |

**Kết quả kỳ vọng:**
- HTTP Status: `403 Forbidden`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

## 13. MODULE REPORT & AUDIT LOG

### TC-RPT-01: Admin xem báo cáo doanh thu

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-RPT-01 |
| **Actor** | admin01 |
| **Phương thức** | `GET /api/reports/revenue?from=2026-01-01&to=2026-12-31` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- Trả về dữ liệu doanh thu tổng hợp

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-RPT-02: Admin xem báo cáo lịch hẹn

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-RPT-02 |
| **Actor** | admin01 |
| **Phương thức** | `GET /api/reports/appointments?from=2026-01-01&to=2026-12-31` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-RPT-03: Non-admin không xem được báo cáo doanh thu

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-RPT-03 |
| **Actor** | doctor01 |
| **Phương thức** | `GET /api/reports/revenue` |

**Kết quả kỳ vọng:**
- HTTP Status: `403 Forbidden`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-RPT-04: Dashboard summary (tất cả vai trò)

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-RPT-04 |
| **Actor** | doctor01, reception01, patient01 |
| **Phương thức** | `GET /api/reports/dashboard` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK` cho tất cả vai trò

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-LOG-01: Admin xem nhật ký hệ thống

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-LOG-01 |
| **Actor** | admin01 |
| **Phương thức** | `GET /api/audit-logs` |

**Kết quả kỳ vọng:**
- HTTP Status: `200 OK`
- Nhật ký bao gồm các action: LOGIN, LOGOUT, CREATE, UPDATE, CANCEL...

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-LOG-02: Non-admin không xem được audit logs

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-LOG-02 |
| **Actor** | patient01 |
| **Phương thức** | `GET /api/audit-logs` |

**Kết quả kỳ vọng:**
- HTTP Status: `403 Forbidden`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

## 14. KIỂM THỬ BẢO MẬT & PHÂN QUYỀN

### TC-SEC-01: Token giả mạo

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-SEC-01 |
| **Mô tả** | Gửi request với JWT token bị sửa đổi |
| **Phương thức** | `GET /api/appointments` (Header: `Bearer invalid.token.here`) |

**Kết quả kỳ vọng:**
- HTTP Status: `401 Unauthorized`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-SEC-02: Patient leo thang đặc quyền (privilege escalation)

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-SEC-02 |
| **Actor** | patient01 |
| **Mô tả** | Patient cố gắng tạo chuyên khoa (chỉ ADMIN được phép) |
| **Phương thức** | `POST /api/specialties` |

**Kết quả kỳ vọng:**
- HTTP Status: `403 Forbidden`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-SEC-03: Doctor xem dữ liệu của doctor khác

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-SEC-03 |
| **Actor** | doctor02 |
| **Mô tả** | doctor02 cố gắng xem lịch hẹn của doctor01 |
| **Phương thức** | `GET /api/appointments/doctor/<doctor01_id>` |

**Kết quả kỳ vọng:**
- HTTP Status: `403 Forbidden` hoặc mảng rỗng (phụ thuộc implementation)

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

### TC-SEC-04: Tài khoản bị khóa không thể đăng nhập

| Trường | Nội dung |
|---|---|
| **Test Case ID** | TC-SEC-04 |
| **Actor** | admin01 (thực hiện khóa trước) |
| **Mô tả** | Admin khóa tài khoản patient01, sau đó patient01 đăng nhập |

**Bước 1:** Admin set `is_deleted = 1` cho patient01 (qua API update profile)  
**Bước 2:** patient01 đăng nhập

**Kết quả kỳ vọng bước 2:**
- HTTP Status: `403 Forbidden`
- Message: `"Account is locked"`

**Kết quả thực tế:** ☐ Pass / ☐ Fail

---

## 15. LUỒNG END-TO-END TỔNG HỢP

> Kịch bản này mô phỏng đầy đủ một ngày làm việc tại phòng khám, thực hiện tuần tự từng bước.

### Mô tả kịch bản

**Nhân vật:**
- **Admin (admin01):** Thiết lập hệ thống
- **Receptionist (reception01):** Tiếp nhận bệnh nhân
- **Doctor (doctor01):** Thực hiện khám
- **Patient (patient01):** Bệnh nhân đến khám

---

### Bước 1 – Admin thiết lập lịch làm việc

| # | Hành động | Actor | API | Kỳ vọng |
|---|---|---|---|---|
| 1.1 | Đăng nhập | admin01 | `POST /api/auth/login` | 200, nhận token |
| 1.2 | Tạo lịch làm việc cho doctor01 | admin01 | `POST /api/work-schedules` | 201, lưu `ws_id` |

---

### Bước 2 – Bệnh nhân đặt lịch

| # | Hành động | Actor | API | Kỳ vọng |
|---|---|---|---|---|
| 2.1 | Đăng nhập | patient01 | `POST /api/auth/login` | 200, nhận token |
| 2.2 | Xem lịch làm việc của doctor01 | patient01 | `GET /api/work-schedules/doctor/<id>` | 200, có ca khám |
| 2.3 | Đặt lịch hẹn | patient01 | `POST /api/appointments` | 201, status=SCHEDULED |

---

### Bước 3 – Receptionist tiếp nhận

| # | Hành động | Actor | API | Kỳ vọng |
|---|---|---|---|---|
| 3.1 | Đăng nhập | reception01 | `POST /api/auth/login` | 200 |
| 3.2 | Xem danh sách đang chờ | reception01 | `GET /api/appointments/waiting` | 200, có appointment |
| 3.3 | Check-in bệnh nhân | reception01 | `PATCH /api/appointments/<id>/check-in` | 200, status=WAITING |

---

### Bước 4 – Bác sĩ thực hiện khám

| # | Hành động | Actor | API | Kỳ vọng |
|---|---|---|---|---|
| 4.1 | Đăng nhập | doctor01 | `POST /api/auth/login` | 200 |
| 4.2 | Xem danh sách chờ | doctor01 | `GET /api/appointments/waiting` | 200 |
| 4.3 | Bắt đầu khám | doctor01 | `PATCH /api/appointments/<id>/start` | 200, status=INPROGRESS |
| 4.4 | Tạo bệnh án | doctor01 | `POST /api/medical-records` | 201, status=INCOMPLETE |
| 4.5 | Hoàn tất khám | doctor01 | `PATCH /api/appointments/<id>/complete` | 200, status=COMPLETED |
| 4.6 | Hoàn tất bệnh án | doctor01 | `PATCH /api/medical-records/<id>/finalize` | 200, status=COMPLETED |

---

### Bước 5 – Thanh toán

| # | Hành động | Actor | API | Kỳ vọng |
|---|---|---|---|---|
| 5.1 | Tạo hóa đơn | reception01 | `POST /api/bills` | 201, status=PENDING |
| 5.2 | Thêm dịch vụ (Khám CK) | reception01 | `POST /api/bills/<id>/items` | 201 |
| 5.3 | Thêm dịch vụ (Xét nghiệm) | reception01 | `POST /api/bills/<id>/items` | 201 |
| 5.4 | Xem chi tiết hóa đơn | reception01 | `GET /api/bills/<id>/detail` | 200, có 2 items |
| 5.5 | Xác nhận thanh toán | reception01 | `PATCH /api/bills/<id>/pay` | 200, status=COMPLETED |

---

### Bước 6 – Kiểm tra kết quả cuối

| # | Hành động | Actor | API | Kỳ vọng |
|---|---|---|---|---|
| 6.1 | Patient xem bệnh án | patient01 | `GET /api/medical-records/patient/<id>/history` | 200, có bệnh án COMPLETED |
| 6.2 | Patient xem hóa đơn | patient01 | `GET /api/bills/<id>` | 200, status=COMPLETED |
| 6.3 | Admin xem audit log | admin01 | `GET /api/audit-logs` | 200, ghi nhận toàn bộ hoạt động |
| 6.4 | Admin xem báo cáo | admin01 | `GET /api/reports/revenue` | 200, doanh thu > 0 |

---

## BẢNG TỔNG KẾT KẾT QUẢ TEST

| Module | Tổng TC | Pass | Fail | Tỷ lệ |
|---|---|---|---|---|
| Auth | 6 | | | |
| Danh mục (Specialty, Clinic, Shift, Service) | 4 | | | |
| Doctor & Patient | 4 | | | |
| Work Schedule | 4 | | | |
| Appointment | 12 | | | |
| Appointment Request | 3 | | | |
| Medical Record | 6 | | | |
| Bill | 7 | | | |
| Report & Audit Log | 6 | | | |
| Bảo mật & Phân quyền | 4 | | | |
| **TỔNG** | **56** | | | |

---

## PHỤ LỤC – POSTMAN COLLECTION MẪU

### Cài đặt biến môi trường Postman

```
base_url        = http://localhost:3000/api
token_admin     = (lấy từ TC-AUTH-01)
token_doctor    = (lấy từ TC-AUTH-01 với doctor01)
token_recep     = (lấy từ TC-AUTH-01 với reception01)
token_patient   = (lấy từ TC-AUTH-01 với patient01)
doctor01_id     = (lấy từ TC-DOC-01)
patient01_id    = (lấy từ TC-PAT-01)
ws_id           = (lấy từ TC-WS-01)
apt_id          = (lấy từ TC-APT-01)
mr_id           = (lấy từ TC-MR-01)
bill_id         = (lấy từ TC-BILL-01)
```

### Script lấy token tự động (Postman Pre-request Script)

```javascript
// Dán vào tab "Pre-request Script" của Collection
pm.sendRequest({
    url: pm.environment.get("base_url") + "/auth/login",
    method: "POST",
    header: { "Content-Type": "application/json" },
    body: {
        mode: "raw",
        raw: JSON.stringify({ username: "admin01", password: "123456" })
    }
}, function (err, response) {
    pm.environment.set("token_admin", response.json().data.token);
});
```

---
