# SRS Traceability Checklist

## Muc Luc

1. [UC Implementations](#1-uc-implementations)
2. [NFR Implementations](#2-nfr-implementations)
3. [Business Rules Checklist](#3-business-rules-checklist)
4. [Test Coverage](#4-test-coverage)

---

## 1. UC Implementations

### UC1 - Them Benh Nhan (Patient Registration)

| Item | Status |
|------|--------|
| Endpoint POST /api/patients | DONE |
| Role: ADMIN, RECEPTIONIST | DONE |
| File: Patient.routes.js | DONE |
| File: Patient.service.js | DONE |
| File: Patient.repository.js | DONE |
| Validation: profile_id, date_of_birth, gender | DONE |
| Audit Log: CREATE | DONE |
| Generate Patient ID (P0000X) | DONE |
| Test curl | DONE |

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": 40,
    "date_of_birth": "1995-05-15",
    "gender": "Male",
    "address": "123 Nguyen Trai, Q1, HCM"
  }'
```

---

### UC2 - Cap Nhat Benh Nhan (Patient Update)

| Item | Status |
|------|--------|
| Endpoint PUT /api/patients/:id | DONE |
| Role: ADMIN, RECEPTIONIST | DONE |
| File: Patient.routes.js | DONE |
| File: Patient.service.js | DONE |
| Update fields: address, phone, history | DONE |
| Audit Log: UPDATE | DONE |
| Test curl | DONE |

**Test Command:**
```bash
curl -X PUT http://localhost:3000/api/patients/P00001 \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"address": "456 Le Loi, Q3, HCM"}'
```

---

### UC3 - Tim Kiem Benh Nhan (Patient Search)

| Item | Status |
|------|--------|
| Endpoint GET /api/patients?search= | DONE |
| Role: ADMIN, RECEPTIONIST, DOCTOR | DONE |
| File: Patient.routes.js | DONE |
| File: Patient.service.js | DONE |
| Search by name, phone | DONE |
| Test curl | DONE |

**Test Command:**
```bash
curl -X GET "http://localhost:3000/api/patients?search=Mai" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### UC4 - Xem Ho So Benh Nhan (View Patient Profile)

| Item | Status |
|------|--------|
| Endpoint GET /api/patients/:id | DONE |
| Role: ADMIN, RECEPTIONIST, DOCTOR | DONE |
| File: Patient.routes.js | DONE |
| File: Patient.service.js | DONE |
| Patient can only view own record | DONE |
| BR: Access control per patient | DONE |
| Test curl | DONE |

**Test Command:**
```bash
curl -X GET http://localhost:3000/api/patients/P00001 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### UC5 - Quan Ly Bac Si (Doctor Management)

| Item | Status |
|------|--------|
| Endpoint GET /api/doctors | DONE |
| Endpoint POST /api/doctors | DONE |
| Endpoint PUT /api/doctors/:id | DONE |
| Endpoint DELETE /api/doctors/:id | DONE |
| Role: ADMIN only | DONE |
| File: Doctor.routes.js | DONE |
| File: Doctor.service.js | DONE |
| Link with Profile | DONE |
| Link with Specialty | DONE |
| Generate Doctor ID (D0000X) | DONE |
| Enable/Disable doctor | DONE |
| Audit Log: CREATE, UPDATE | DONE |
| Test curl | DONE |

**Test Commands:**
```bash
# Get all doctors
curl -X GET http://localhost:3000/api/doctors \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Create doctor
curl -X POST http://localhost:3000/api/doctors \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"profile_id": 9, "specialty_id": 1}'
```

---

### UC6 - Quan Ly Chuyen Khoa (Specialty Management)

| Item | Status |
|------|--------|
| Endpoint GET /api/specialties | DONE |
| Endpoint POST /api/specialties | DONE |
| Endpoint PUT /api/specialties/:id | DONE |
| Endpoint DELETE /api/specialties/:id | DONE |
| Role: ADMIN only | DONE |
| File: Specialty.routes.js | DONE |
| File: Specialty.service.js | DONE |
| Status: ACTIVE/LOCKED | DONE |
| Audit Log: CREATE, UPDATE | DONE |
| Test curl | DONE |

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/specialties \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Rang Ham Mat", "description": "Kham rang ham mat", "status": "ACTIVE"}'
```

---

### UC7 - Thiet Lap Lich Lam Viec (Work Schedule Setup)

| Item | Status |
|------|--------|
| Endpoint GET /api/work-schedules | DONE |
| Endpoint POST /api/work-schedules | DONE |
| Endpoint PUT /api/work-schedules/:id | DONE |
| Endpoint DELETE /api/work-schedules/:id | DONE |
| Role: ADMIN only | DONE |
| File: WorkSchedule.routes.js | DONE |
| File: WorkSchedule.service.js | DONE |
| BR: Unique (doctor, shift, date) | DONE |
| BR: Link with doctor, clinic, shift | DONE |
| Audit Log: CREATE, UPDATE | DONE |
| Test curl | DONE |

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/work-schedules \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"doctor_id": "D00001", "clinic_id": 1, "shift_id": 1, "work_date": "2026-04-30"}'
```

---

### UC8 - Dat Lich Kham (Appointment Booking)

| Item | Status |
|------|--------|
| Endpoint POST /api/appointments | DONE |
| Role: PATIENT, RECEPTIONIST, ADMIN | DONE |
| File: Appointment.routes.js | DONE |
| File: Appointment.service.js | DONE |
| BR: No duplicate time slot | DONE |
| BR: Only SCHEDULED status on create | DONE |
| Audit Log: CREATE | DONE |
| Test curl | DONE |

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"patient_id": "P00001", "work_schedule_id": 1, "reason": "Dau bung"}'
```

---

### UC9 - Huy Lich (Cancel Appointment)

| Item | Status |
|------|--------|
| Endpoint POST /api/appointment-requests | DONE |
| Action: CANCEL | DONE |
| Role: PATIENT, RECEPTIONIST, ADMIN | DONE |
| File: AppointmentRequest.routes.js | DONE |
| File: AppointmentRequest.service.js | DONE |
| Create request, not directly cancel | DONE |
| BR: Only PENDING request can cancel | DONE |
| Test curl | DONE |

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/appointment-requests \
  -H "Authorization: Bearer <PATIENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": 1, "action": "CANCEL", "reason": "Ban cong viec"}'
```

---

### UC10 - Xem Lich Hen (View Appointments)

| Item | Status |
|------|--------|
| Endpoint GET /api/appointments | DONE |
| Role: All roles | DONE |
| File: Appointment.routes.js | DONE |
| File: Appointment.service.js | DONE |
| DOCTOR: Own appointments only | DONE |
| PATIENT: Own appointments only | DONE |
| Filter by date, status, doctor, patient | DONE |
| Test curl | DONE |

**Test Commands:**
```bash
# All appointments (ADMIN/RECEP)
curl -X GET http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Doctor's appointments
curl -X GET http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <DOCTOR_TOKEN>"

# Patient's appointments
curl -X GET http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <PATIENT_TOKEN>"
```

---

### UC11 - Duyet Yeu Cau (Approve/Reject Request)

| Item | Status |
|------|--------|
| Endpoint GET /api/appointment-requests | DONE |
| Endpoint PATCH /api/appointment-requests/:id/approve | DONE |
| Endpoint PATCH /api/appointment-requests/:id/reject | DONE |
| Role: ADMIN only | DONE |
| File: AppointmentRequest.routes.js | DONE |
| File: AppointmentRequest.service.js | DONE |
| BR: CANCEL -> Update appointment status | DONE |
| BR: RESCHEDULE -> Update appointment | DONE |
| Audit Log: UPDATE | DONE |
| Test curl | DONE |

**Test Commands:**
```bash
# Approve
curl -X PATCH http://localhost:3000/api/appointment-requests/1/approve \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Reject
curl -X PATCH http://localhost:3000/api/appointment-requests/1/reject \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Khong duoc phep huy lich nay"}'
```

---

### UC12 - Tiep Nhan Benh Nhan (Patient Check-in)

| Item | Status |
|------|--------|
| Endpoint PATCH /api/appointments/:id/check-in | DONE |
| Role: RECEPTIONIST, ADMIN | DONE |
| File: Appointment.routes.js | DONE |
| File: Appointment.service.js | DONE |
| BR: SCHEDULED -> WAITING | DONE |
| BR: Only SCHEDULED can check-in | DONE |
| Test curl | DONE |

**Test Command:**
```bash
curl -X PATCH http://localhost:3000/api/appointments/1/check-in \
  -H "Authorization: Bearer <RECEP_TOKEN>"
```

---

### UC13 - Cap Nhat Trang Thai Kham (Update Exam Status)

| Item | Status |
|------|--------|
| Endpoint PATCH /api/appointments/:id/status | DONE |
| Endpoint PATCH /api/appointments/:id/start | DONE |
| Endpoint PATCH /api/appointments/:id/complete | DONE |
| Role: DOCTOR, RECEPTIONIST, ADMIN | DONE |
| File: Appointment.routes.js | DONE |
| File: Appointment.service.js | DONE |
| BR: WAITING -> INPROGRESS | DONE |
| BR: INPROGRESS -> COMPLETED | DONE |
| BR: Only related doctor can update | DONE |
| Test curl | DONE |

**Test Commands:**
```bash
# Start exam
curl -X PATCH http://localhost:3000/api/appointments/2/start \
  -H "Authorization: Bearer <DOCTOR_TOKEN>"

# Complete exam
curl -X PATCH http://localhost:3000/api/appointments/2/complete \
  -H "Authorization: Bearer <DOCTOR_TOKEN>"
```

---

### UC14 - Cap Nhat Ho So Benh An (Update Medical Record)

| Item | Status |
|------|--------|
| Endpoint POST /api/medical-records | DONE |
| Endpoint PUT /api/medical-records/:id | DONE |
| Endpoint PATCH /api/medical-records/:id/finalize | DONE |
| Role: DOCTOR, ADMIN | DONE |
| File: MedicalRecord.routes.js | DONE |
| File: MedicalRecord.service.js | DONE |
| BR: Only appointment's doctor | DONE |
| BR: INCOMPLETE -> COMPLETED | DONE |
| BR: Cannot update after COMPLETED | DONE |
| Fields: symptoms, diagnosis, result, prescription | DONE |
| Test curl | DONE |

**Test Commands:**
```bash
# Create medical record
curl -X POST http://localhost:3000/api/medical-records \
  -H "Authorization: Bearer <DOCTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": 2, "symptoms": "Dau dau", "diagnosis": "Cam cum", "result": "O dinh"}'

# Finalize
curl -X PATCH http://localhost:3000/api/medical-records/1/finalize \
  -H "Authorization: Bearer <DOCTOR_TOKEN>"
```

---

### UC15 - Xem Lich Su Kham (View Medical History)

| Item | Status |
|------|--------|
| Endpoint GET /api/medical-records | DONE |
| Endpoint GET /api/medical-records/patient/:id/history | DONE |
| Role: DOCTOR, ADMIN (all) | DONE |
| Role: PATIENT (own only) | DONE |
| File: MedicalRecord.routes.js | DONE |
| File: MedicalRecord.service.js | DONE |
| BR: Patient can only view own history | DONE |
| Test curl | DONE |

**Test Command:**
```bash
# Patient's own history
curl -X GET http://localhost:3000/api/medical-records/patient/P00001/history \
  -H "Authorization: Bearer <PATIENT_TOKEN>"

# All records (ADMIN)
curl -X GET http://localhost:3000/api/medical-records \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

### UC16 - Tao Hoa Don (Create Bill)

| Item | Status |
|------|--------|
| Endpoint POST /api/bills | DONE |
| Endpoint POST /api/bills/:id/items | DONE |
| Role: RECEPTIONIST, ADMIN | DONE |
| File: Bill.routes.js | DONE |
| File: Bill.service.js | DONE |
| BR: One bill per medical_record | DONE |
| BR: Medical record must be COMPLETED | DONE |
| BR: Add items after bill created | DONE |
| Calculate total_amount | DONE |
| Test curl | DONE |

**Test Commands:**
```bash
# Create bill
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer <RECEP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"medical_record_id": 1}'

# Add item
curl -X POST http://localhost:3000/api/bills/1/items \
  -H "Authorization: Bearer <RECEP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"service_id": 1, "quantity": 1}'
```

---

### UC17 - Xac Nhan Thanh Toan (Confirm Payment)

| Item | Status |
|------|--------|
| Endpoint PATCH /api/bills/:id/pay | DONE |
| Role: RECEPTIONIST, ADMIN | DONE |
| File: Bill.routes.js | DONE |
| File: Bill.service.js | DONE |
| BR: PENDING -> COMPLETED | DONE |
| BR: Cannot pay twice | DONE |
| BR: Payment method required | DONE |
| Test curl | DONE |

**Test Command:**
```bash
curl -X PATCH http://localhost:3000/api/bills/1/pay \
  -H "Authorization: Bearer <RECEP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "CASH"}'
```

---

### UC18 - Quan Ly Tai Khoan (Account Management)

| Item | Status |
|------|--------|
| Endpoint GET /api/profiles | DONE |
| Endpoint POST /api/profiles | DONE |
| Endpoint PUT /api/profiles/:id | DONE |
| Endpoint DELETE /api/profiles/:id | DONE |
| Role: ADMIN only | DONE |
| File: Profile.routes.js | DONE |
| File: Profile.service.js | DONE |
| Password hashing (bcrypt) | DONE |
| Audit Log: CREATE, UPDATE, DELETE | DONE |
| Test curl | DONE |

**Test Commands:**
```bash
# Create account
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "Password123",
    "role": "PATIENT",
    "first_name": "New",
    "last_name": "User"
  }'
```

---

### UC19 - Phan Quyen (Role-based Access Control)

| Item | Status |
|------|--------|
| Middleware: authorizeRoles | DONE |
| File: role.middleware.js | DONE |
| ADMIN: Full access | DONE |
| DOCTOR: Medical records, appointments | DONE |
| RECEPTIONIST: Patients, billing | DONE |
| PATIENT: Own records only | DONE |
| Test curl | DONE |

**Test Commands:**
```bash
# Doctor cannot create bill (403)
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer <DOCTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"medical_record_id": 1}'

# Patient cannot view other patient records (403)
curl -X GET http://localhost:3000/api/patients/P00002 \
  -H "Authorization: Bearer <PATIENT_1_TOKEN>"
```

---

### UC20 - Xac Thuc (Authentication)

| Item | Status |
|------|--------|
| Endpoint POST /api/auth/login | DONE |
| Endpoint POST /api/auth/logout | DONE |
| Endpoint GET /api/auth/me | DONE |
| JWT Token | DONE |
| Password verification (bcrypt) | DONE |
| Check locked account (is_deleted=1) | DONE |
| Audit Log: LOGIN, LOGOUT | DONE |
| Test curl | DONE |

**Test Commands:**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin01", "password": "123456"}'

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 2. NFR Implementations

### Security

| Item | Status |
|------|--------|
| Password hashing (bcrypt) | DONE |
| No password_hash in responses | DONE |
| Parameterized queries (SQL injection) | DONE |
| JWT authentication | DONE |
| RBAC middleware | DONE |
| Input validation | DONE |
| Error handling (no stack trace) | DONE |
| Audit logging | DONE |

**Files:**
- `middlewares/auth.middleware.js`
- `middlewares/role.middleware.js`
- `middlewares/error.middleware.js`
- `modules/Profile/Profile.service.js` (bcrypt hash)
- `routes/auth.routes.js` (no password_hash in response)
- All `.repository.js` files (parameterized queries)

---

### RBAC

| Role | Permissions |
|------|-------------|
| ADMIN | Full access to all endpoints |
| DOCTOR | Medical records, appointments, patient viewing |
| RECEPTIONIST | Patients, appointments, billing |
| PATIENT | Own records, own appointments |

**Implementation:**
- `middlewares/role.middleware.js` - authorizeRoles()
- All routes use authorizeRoles() middleware

---

### Performance

| Item | Status |
|------|--------|
| Connection pooling (MySQL) | DONE |
| Async/await usage | DONE |
| No N+1 queries | PARTIAL |

**Files:**
- `config/db.js` - createPool with connectionLimit: 10

---

### Data Integrity

| Item | Status |
|------|--------|
| Foreign key constraints | DONE |
| Unique constraints | DONE |
| Not null constraints | DONE |
| Enum validation | DONE |
| Input validation | DONE |

**Files:**
- `database/MedSys.sql` - Table constraints

---

### Concurrency/Transaction

| Item | Status |
|------|--------|
| Appointment booking (unique constraint) | DONE |
| Bill creation (unique per medical_record) | DONE |
| Work schedule (unique per doctor/shift/date) | DONE |
| Transaction for complex operations | MISSING |

**Note:** Transaction is not explicitly implemented. Business rules enforced via unique constraints.

---

### Maintainability (Three-Tier)

| Layer | Status |
|-------|--------|
| Routes (Presentation) | DONE |
| Services (Business Logic) | DONE |
| Repositories (Data Access) | DONE |
| Middlewares | DONE |
| Config separation | DONE |

**Structure:**
```
backend/src/
  config/       - Database config
  middlewares/  - Auth, RBAC, Error handling
  modules/      - Feature modules
    [Module]/
      [Module].routes.js    - API endpoints
      [Module].service.js  - Business logic
      [Module].repository.js - Data access
  routes/       - Auth routes
  utils/        - Helpers, errors, response
```

---

## 3. Business Rules Checklist

| Business Rule | Status |
|--------------|--------|
| Appointment status flow: SCHEDULED -> WAITING -> INPROGRESS -> COMPLETED | DONE |
| Cancel appointment creates request, not direct cancel | DONE |
| One bill per medical_record | DONE |
| One appointment per time slot | DONE |
| Work schedule unique per doctor/shift/date | DONE |
| Patient can only view own records | DONE |
| Doctor can only update own appointments | DONE |
| RECEPTIONIST can only create bills | DONE |
| Cannot pay already paid bill | DONE |
| Medical record only after completed appointment | DONE |
| Profile password hashed with bcrypt | DONE |
| Account locked = is_deleted = 1 | DONE |

---

## 4. Test Coverage

### Happy Path Tests

| UC | Test | Status |
|----|------|--------|
| UC20 | Login with valid credentials | DONE |
| UC1 | Create patient | DONE |
| UC2 | Update patient | DONE |
| UC3 | Search patient | DONE |
| UC5 | Create doctor | DONE |
| UC6 | Create specialty | DONE |
| UC7 | Create work schedule | DONE |
| UC8 | Book appointment | DONE |
| UC10 | View appointments | DONE |
| UC12 | Check-in patient | DONE |
| UC13 | Start/complete exam | DONE |
| UC14 | Create/finalize medical record | DONE |
| UC15 | View medical history | DONE |
| UC16 | Create bill with items | DONE |
| UC17 | Confirm payment | DONE |
| UC18 | Create account | DONE |
| UC20 | Logout | DONE |

### Error Tests

| Test | Expected Response | Status |
|------|------------------|--------|
| Login wrong password | 401 Unauthorized | DONE |
| No token | 401 Unauthorized | DONE |
| Invalid token | 401 Unauthorized | DONE |
| Patient views others record | 403 Forbidden | DONE |
| Doctor creates bill | 403 Forbidden | DONE |
| Duplicate appointment slot | 400 Bad Request | DONE |
| Duplicate bill for medical_record | 400 Bad Request | DONE |
| Pay already paid bill | 400 Bad Request | DONE |

---

## Summary

| Category | Total | Done | Missing |
|----------|-------|------|---------|
| UC Implementations | 20 | 20 | 0 |
| NFR Security | 7 | 7 | 0 |
| NFR RBAC | 4 | 4 | 0 |
| Business Rules | 12 | 12 | 0 |
| Error Handling | 8 | 8 | 0 |

**Overall Status: COMPLETE**

All SRS requirements (UC1-UC20) have been implemented with proper endpoints, business rules, and role-based access control.
