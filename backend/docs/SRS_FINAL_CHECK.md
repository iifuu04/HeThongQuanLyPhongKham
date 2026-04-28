# SRS_FINAL_CHECK.md - MedSys Clinic Management System

## Tổng quan kiến trúc
- Backend: NodeJS + Express + MySQL
- Kiến trúc 3 lớp: Routes -> Services -> Repositories
- Frontend: React + Vite

## Checklist SRS UC1-UC20

| UC | Tên | Trạng thái | Endpoint | File liên quan |
|----|------|------------|----------|----------------|
| UC20 | Đăng nhập | ✅ DONE | POST /api/auth/login | auth.routes.js |
| UC18 | Quản lý tài khoản | ✅ DONE | /api/profiles/* | Profile.routes.js |
| UC19 | RBAC | ✅ DONE | Middleware | auth.middleware.js, role.middleware.js |
| UC1 | Thêm bệnh nhân | ✅ DONE | POST /api/patients | Patient.routes.js |
| UC2 | Cập nhật bệnh nhân | ✅ DONE | PUT /api/patients/:id | Patient.routes.js |
| UC3 | Tìm kiếm bệnh nhân | ✅ DONE | GET /api/patients?search= | Patient.routes.js |
| UC4 | Xem hồ sơ bệnh nhân | ✅ DONE | GET /api/patients/:id | Patient.routes.js |
| UC5 | Quản lý bác sĩ | ✅ DONE | /api/doctors/* | Doctor.routes.js |
| UC6 | Quản lý chuyên khoa | ✅ DONE | /api/specialties/* | Specialty.routes.js |
| UC7 | Lịch làm việc | ✅ DONE | /api/work-schedules/* | WorkSchedule.routes.js |
| UC8 | Đặt lịch khám | ✅ DONE | POST /api/appointments | Appointment.routes.js |
| UC9 | Hủy lịch | ⚠️ PARTIAL | PATCH /api/appointments/:id/cancel | Appointment.routes.js |
| UC10 | Xem lịch hẹn | ✅ DONE | GET /api/appointments | Appointment.routes.js |
| UC11 | Duyệt yêu cầu | ✅ DONE | /api/appointment-requests/* | AppointmentRequest.routes.js |
| UC12 | Tiếp nhận bệnh nhân | ✅ DONE | PATCH /api/appointments/:id/check-in | Appointment.routes.js |
| UC13 | Cập nhật trạng thái khám | ✅ DONE | PATCH /api/appointments/:id/status | Appointment.routes.js |
| UC14 | Hồ sơ bệnh án | ✅ DONE | /api/medical-records/* | MedicalRecord.routes.js |
| UC15 | Xem lịch sử khám | ✅ DONE | GET /api/medical-records/patient/:id/history | MedicalRecord.routes.js |
| UC16 | Tạo hóa đơn | ✅ DONE | POST /api/bills | Bill.routes.js |
| UC17 | Xác nhận thanh toán | ⚠️ PARTIAL | PATCH /api/bills/:id/pay | Bill.routes.js |

## Chi tiết từng UC

### UC20 - Đăng nhập (✅ DONE)
- **Endpoint**: `POST /api/auth/login`
- **Kiểm tra**: username + password -> JWT + user info + role
- **Roles**: ADMIN, DOCTOR, RECEPTIONIST, PATIENT
- **is_deleted**: Không cho login nếu is_deleted = 1
- **Password**: bcrypt hash, so sánh với bcrypt.compare
- **Response**: Không có password_hash
- **Files**: `routes/auth.routes.js`, `modules/Profile/Profile.repository.js`

### UC18 - Quản lý tài khoản (✅ DONE)
- **Endpoints**: GET/POST/PUT/DELETE /api/profiles
- **Role**: Chỉ ADMIN được tạo/sửa/xóa
- **Username unique**: Kiểm tra trong ProfileService
- **Password**: Hash bằng bcrypt trước khi lưu
- **Response**: Không trả password_hash
- **Files**: `modules/Profile/*`

### UC19 - RBAC (✅ DONE)
- **Middleware**: `authenticateToken` - Xác thực JWT
- **Middleware**: `authorizeRoles(...roles)` - Kiểm tra quyền
- **Roles**: ADMIN > DOCTOR > RECEPTIONIST > PATIENT
- **Files**: `middlewares/auth.middleware.js`, `middlewares/role.middleware.js`

### UC1-UC4 - Bệnh nhân (✅ DONE)
- **CREATE**: RECEPTIONIST/ADMIN tạo bệnh nhân
- **UPDATE**: RECEPTIONIST/ADMIN cập nhật
- **SEARCH**: Tìm theo patient_id, họ tên, số điện thoại
- **VIEW**: RECEPTIONIST/DOCTOR xem tất cả, PATIENT chỉ xem chính mình
- **Files**: `modules/Patient/*`

### UC5-UC7 - Bác sĩ, Chuyên khoa, Lịch (✅ DONE)
- **Doctor**: ADMIN CRUD, liên kết Profile(DOCTOR) + Specialty
- **Specialty**: ADMIN CRUD, không trùng tên active
- **Schedule**: ADMIN CRUD, kiểm tra trùng doctor_id + shift_id + work_date
- **Files**: `modules/Doctor/*`, `modules/Specialty/*`, `modules/WorkSchedule/*`

### UC8 - Đặt lịch khám (✅ DONE)
- **CREATE**: PATIENT/RECEPTIONIST/ADMIN
- **Validation**: 
  - Kiểm tra work_schedule hợp lệ
  - Kiểm tra doctor đang ACTIVE
  - Kiểm tra không trùng: doctor_id + work_schedule_id + start_time
  - Kiểm tra không phải ngày trong quá khứ
- **Error**: "Khung gio nay da duoc dat, vui long chon khung gio khac"
- **Transaction**: Sử dụng transaction cho atomic operation
- **Files**: `modules/Appointment/*`

### UC9 - Hủy lịch (⚠️ PARTIAL)
- **PATIENT**: Hủy lịch của chính mình -> CANCELLED
- **RECEPTIONIST/DOCTOR**: Tạo Appointment_Request chờ ADMIN duyệt
- **⚠️ ISSUE**: Appointment_Request thiếu specialty_id, shift_id

### UC10-UC13 - Lịch hẹn & Trạng thái (✅ DONE)
- **VIEW**: Role-based filtering (PATIENT chỉ xem lịch mình, DOCTOR chỉ xem lịch liên quan)
- **CHECK-IN**: RECEPTIONIST/ADMIN: SCHEDULED -> WAITING
- **STATUS**: Thứ tự bắt buộc: SCHEDULED -> WAITING -> INPROGRESS -> COMPLETED
- **FILES**: `modules/Appointment/*`

### UC14-UC15 - Hồ sơ bệnh án (✅ DONE)
- **CREATE/UPDATE**: Chỉ DOCTOR
- **Validation**: Doctor chỉ xử lý appointment của mình
- **History**: DOCTOR xem tất cả bệnh nhân, PATIENT chỉ xem lịch sử của mình
- **Fields**: note, symptoms, diagnosis, result, prescription
- **Files**: `modules/MedicalRecord/*`

### UC16-UC17 - Hóa đơn & Thanh toán (⚠️ PARTIAL)
- **CREATE**: RECEPTIONIST tạo sau khi medical_record COMPLETED
- **Bill Items**: service_id, quantity, price, total_amount
- **total_amount**: = sum(quantity * price)
- **PAY**: RECEPTIONIST xác nhận: PENDING -> COMPLETED
- **⚠️ ISSUE**: Chưa kiểm tra bill đã COMPLETED rồi không cho thanh toán lại
- **Files**: `modules/Bill/*`

## NFR Compliance

### Security (✅)
- [x] Password bcrypt hash
- [x] Parameterized queries (chống SQL injection)
- [x] JWT authentication
- [x] RBAC middleware

### RBAC (✅)
- [x] Kiểm tra role ở middleware
- [x] Kiểm tra role ở service cho logic phức tạp

### Data Integrity (✅)
- [x] Input validation
- [x] Business rule validation trước khi ghi
- [x] Transaction cho các operation quan trọng

### Concurrency (⚠️ PARTIAL)
- [x] Transaction cho appointment booking
- [ ] Transaction cho bill payment

### Maintainability (✅)
- [x] GUI-BUS-DAL architecture
- [x] Code có comment SRS

## API Endpoints Summary

```
AUTH:
  POST   /api/auth/login          - Login
  POST   /api/auth/logout         - Logout
  GET    /api/auth/me             - Current user

PROFILES:
  GET    /api/profiles           - List all (ADMIN)
  GET    /api/profiles/:id       - Get by ID
  POST   /api/profiles            - Create (ADMIN)
  PUT    /api/profiles/:id       - Update
  PATCH  /api/profiles/:id/role  - Update role (ADMIN)
  PATCH  /api/profiles/:id/status - Lock/unlock (ADMIN)
  DELETE /api/profiles/:id       - Soft delete (ADMIN)

PATIENTS:
  GET    /api/patients           - List/Search
  GET    /api/patients/:id      - Get with details
  POST   /api/patients           - Create
  PUT    /api/patients/:id       - Update
  DELETE /api/patients/:id       - Delete (ADMIN)

DOCTORS:
  GET    /api/doctors             - List
  GET    /api/doctors/:id        - Get by ID
  POST   /api/doctors            - Create (ADMIN)
  PUT    /api/doctors/:id        - Update (ADMIN)
  PATCH  /api/doctors/:id/status - Update status (ADMIN)

SPECIALTIES:
  GET    /api/specialties        - List
  POST   /api/specialties        - Create (ADMIN)
  PUT    /api/specialties/:id   - Update (ADMIN)
  DELETE /api/specialties/:id   - Delete (ADMIN)

WORK_SCHEDULES:
  GET    /api/work-schedules     - List with filters
  GET    /api/work-schedules/:id - Get by ID
  POST   /api/work-schedules     - Create (ADMIN)
  PUT    /api/work-schedules/:id - Update (ADMIN)
  DELETE /api/work-schedules/:id - Delete (ADMIN)

APPOINTMENTS:
  GET    /api/appointments       - List with filters
  GET    /api/appointments/:id  - Get by ID
  POST   /api/appointments       - Create
  PUT    /api/appointments/:id  - Update
  PATCH  /api/appointments/:id/cancel - Cancel
  PATCH  /api/appointments/:id/check-in - Check-in
  PATCH  /api/appointments/:id/status - Update status

APPOINTMENT_REQUESTS:
  GET    /api/appointment-requests - List
  GET    /api/appointment-requests/pending - Pending list
  POST   /api/appointment-requests - Create
  PATCH  /api/appointment-requests/:id/approve - Approve
  PATCH  /api/appointment-requests/:id/reject - Reject

MEDICAL_RECORDS:
  GET    /api/medical-records    - List
  GET    /api/medical-records/:id - Get by ID
  GET    /api/medical-records/patient/:id/history - Patient history
  POST   /api/medical-records   - Create (DOCTOR)
  PUT    /api/medical-records/:id - Update (DOCTOR)
  PATCH  /api/medical-records/:id/finalize - Finalize (DOCTOR)

BILLS:
  GET    /api/bills              - List
  GET    /api/bills/:id          - Get by ID
  GET    /api/bills/:id/detail  - Full detail with items
  POST   /api/bills             - Create (RECEPTIONIST)
  PATCH  /api/bills/:id/pay     - Confirm payment (RECEPTIONIST)
  POST   /api/bills/:id/items   - Add item
  PUT    /api/bills/items/:id   - Update item
  DELETE /api/bills/items/:id   - Delete item

CLINICS:
  GET    /api/clinics            - List
  POST   /api/clinics           - Create (ADMIN)
  PUT    /api/clinics/:id       - Update (ADMIN)

SHIFTS:
  GET    /api/shifts             - List
  POST   /api/shifts            - Create (ADMIN)
  PUT    /api/shifts/:id        - Update (ADMIN)
  DELETE /api/shifts/:id        - Delete (ADMIN)

SERVICES:
  GET    /api/services          - List
  POST   /api/services         - Create (ADMIN)
  PUT    /api/services/:id     - Update (ADMIN)
  DELETE /api/services/:id     - Delete (ADMIN)

AUDIT_LOGS:
  GET    /api/audit-logs       - List (ADMIN)
```

## Issues cần lưu ý

1. **UC9**: Appointment_Request thiếu specialty_id, shift_id columns
2. **UC17**: Bill payment chưa kiểm tra đã COMPLETED rồi
3. **AuditLog**: Create log có thể fail nếu có undefined values

## Status cuối cùng

- **Backend**: 17/20 DONE, 3/20 PARTIAL
- **Frontend**: Đã tích hợp API thật, không dùng fake data
- **Database**: Schema đúng, seed data đã thêm
- **Demo**: Có thể demo được end-to-end flow
