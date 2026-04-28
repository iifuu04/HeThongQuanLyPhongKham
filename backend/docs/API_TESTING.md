# MedSys API Testing Guide

## Muc Luc

1. [Cach chay he thong](#1-cach-chay-he-thong)
2. [Cach import database](#2-cach-import-database)
3. [Tai khoan demo](#3-tai-khoan-demo)
4. [UC20 - Dang nhap (Authentication)](#4-uc20---dang-nhap-authentication)
5. [UC18 - Quan ly tai khoan](#5-uc18---quan-ly-tai-khoan)
6. [UC19 - Phan quyen](#6-uc19---phan-quyen-rbac)
7. [UC1 - Them benh nhan](#7-uc1---them-benh-nhan)
8. [UC2 - Cap nhat benh nhan](#8-uc2---cap-nhat-benh-nhan)
9. [UC3 - Tim kiem benh nhan](#9-uc3---tim-kiem-benh-nhan)
10. [UC4 - Xem ho so benh nhan](#10-uc4---xem-ho-so-benh-nhan)
11. [UC5 - Quan ly bac si](#11-uc5---quan-ly-bac-si)
12. [UC6 - Quan ly chuyen khoa](#12-uc6---quan-ly-chuyen-khoa)
13. [UC7 - Thiet lap lich lam viec](#13-uc7---thiet-lap-lich-lam-viec)
14. [UC8 - Dat lich kham](#14-uc8---dat-lich-kham)
15. [UC9 - Huy lich](#15-uc9---huy-lich)
16. [UC10 - Xem lich hen](#16-uc10---xem-lich-hen)
17. [UC11 - Duyet yeu cau](#17-uc11---duyet-yeu-cau-thay-doihuy-lich)
18. [UC12 - Tiep nhan benh nhan](#18-uc12---tiep-nhan-benh-nhan)
19. [UC13 - Cap nhat trang thai kham](#19-uc13---cap-nhat-trang-thai-kham)
20. [UC14 - Cap nhat ho so benh an](#20-uc14---cap-nhat-ho-so-benh-an)
21. [UC15 - Xem lich su kham](#21-uc15---xem-lich-su-kham)
22. [UC16 - Tao hoa don](#22-uc16---tao-hoa-don)
23. [UC17 - Xac nhan thanh toan](#23-uc17---xac-nhan-thanh-toan)
24. [Test loi](#24-test-loi)

---

## 1. Cach Chay He Thong

### 1.1 Backend

```bash
cd HeThongQuanLyPhongKham/backend
npm install
npm run dev
```

Backend se chay tai: `http://localhost:3000`

### 1.2 Frontend

```bash
cd HeThongQuanLyPhongKham/frontend/frontend
npm install
npm run dev
```

Frontend se chay tai: `http://localhost:5173`

---

## 2. Cach Import Database

### 2.1 Tao Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS MedSys;
EXIT;
```

### 2.2 Import Schema

```bash
cd HeThongQuanLyPhongKham/backend
mysql -u root -p MedSys < src/database/MedSys.sql
```

### 2.3 Import Dummy Data

```bash
mysql -u root -p MedSys < src/database/dummy_data.sql
```

### 2.4 Import Demo Data (Khuyen nghi)

```bash
mysql -u root -p MedSys < src/database/seed_demo.sql
```

---

## 3. Tai Khoan Demo

| Role | Username | Password | Profile ID |
|------|----------|----------|-----------|
| ADMIN | admin01 | 123456 | 1 |
| RECEPTIONIST | reception01 | 123456 | 2 |
| DOCTOR | doctor01 | 123456 | 7 |
| DOCTOR | doctor02 | 123456 | 8 |
| PATIENT | patient01 | 123456 | 31 |
| PATIENT | patient02 | 123456 | 32 |

---

## 4. UC20 - Dang Nhap (Authentication)

### 4.1 Dang nhap thanh cong

**Endpoint:** `/api/auth/login`
**Method:** POST

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin01",
    "password": "123456"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin01",
      "role": "ADMIN",
      "first_name": "An",
      "last_name": "Nguyen",
      "email": "admin01@medsys.vn"
    }
  }
}
```

### 4.2 Dang nhap that bai - Sai mat khau

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin01",
    "password": "wrongpassword"
  }'
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

### 4.3 Dang xuat

**Endpoint:** `/api/auth/logout`
**Method:** POST

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <TOKEN>"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

### 4.4 Lay thong tin nguoi dung hien tai

**Endpoint:** `/api/auth/me`
**Method:** GET

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 5. UC18 - Quan Ly Tai Khoan

### 5.1 Lay danh sach tai khoan (ADMIN)

**Endpoint:** `/api/profiles`
**Method:** GET
**Auth:** Required (ADMIN)

```bash
curl -X GET http://localhost:3000/api/profiles \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 5.2 Tao tai khoan moi (ADMIN)

**Endpoint:** `/api/profiles`
**Method:** POST
**Auth:** Required (ADMIN)

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "Password123",
    "role": "PATIENT",
    "first_name": "New",
    "last_name": "User",
    "email": "newuser@medsys.vn",
    "phone": "0933000000",
    "date_of_birth": "2000-01-01",
    "gender": "Male"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Profile created successfully",
  "data": {
    "id": 100,
    "username": "newuser",
    "role": "PATIENT",
    "first_name": "New",
    "last_name": "User",
    "email": "newuser@medsys.vn"
  }
}
```

### 5.3 Cap nhat tai khoan (ADMIN)

**Endpoint:** `/api/profiles/:id`
**Method:** PUT
**Auth:** Required (ADMIN)

```bash
curl -X PUT http://localhost:3000/api/profiles/100 \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "phone": "0933111111"
  }'
```

### 5.4 Khoa/Mo tai khoan (ADMIN)

**Endpoint:** `/api/profiles/:id/status`
**Method:** PATCH
**Auth:** Required (ADMIN)

```bash
curl -X PATCH http://localhost:3000/api/profiles/100/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "lock"
  }'
```

---

## 6. UC19 - Phan Quyen (RBAC)

### 6.1 RECEPTIONIST khong the truy cap audit logs

```bash
curl -X GET http://localhost:3000/api/audit-logs \
  -H "Authorization: Bearer <RECEP_TOKEN>"
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

### 6.2 PATIENT khong the xem ho so nguoi khac

```bash
curl -X GET http://localhost:3000/api/patients/P00002 \
  -H "Authorization: Bearer <PATIENT_TOKEN_1>"
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Access denied"
}
```

---

## 7. UC1 - Them Benh Nhan

### 7.1 Tao benh nhan moi (RECEPTIONIST/ADMIN)

**Endpoint:** `/api/patients`
**Method:** POST
**Auth:** Required (RECEPTIONIST, ADMIN)

```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": 33,
    "date_of_birth": "1995-05-15",
    "gender": "Male",
    "address": "123 Nguyen Trai, Q1, HCM",
    "phone": "0933999999",
    "history": "Khong co tien su"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Patient created successfully",
  "data": {
    "id": "P00003",
    "profile_id": 33,
    "date_of_birth": "1995-05-15",
    "gender": "Male"
  }
}
```

---

## 8. UC2 - Cap Nhat Benh Nhan

### 8.1 Cap nhat thong tin benh nhan

**Endpoint:** `/api/patients/:id`
**Method:** PUT
**Auth:** Required (RECEPTIONIST, ADMIN)

```bash
curl -X PUT http://localhost:3000/api/patients/P00001 \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "456 Le Loi, Q3, HCM",
    "phone": "0933888888"
  }'
```

---

## 9. UC3 - Tim Kiem Benh Nhan

### 9.1 Lay danh sach benh nhan

**Endpoint:** `/api/patients`
**Method:** GET
**Auth:** Required (ADMIN, RECEPTIONIST, DOCTOR)

```bash
curl -X GET http://localhost:3000/api/patients \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 9.2 Tim kiem theo ten/so dien thoai

**Endpoint:** `/api/patients?search=keyword`
**Method:** GET

```bash
curl -X GET "http://localhost:3000/api/patients?search=Mai" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 10. UC4 - Xem Ho So Benh Nhan

### 10.1 Lay chi tiet benh nhan

**Endpoint:** `/api/patients/:id`
**Method:** GET

```bash
curl -X GET http://localhost:3000/api/patients/P00001 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 11. UC5 - Quan Ly Bac Si

### 11.1 Lay danh sach bac si

**Endpoint:** `/api/doctors`
**Method:** GET
**Auth:** Required (ADMIN)

```bash
curl -X GET http://localhost:3000/api/doctors \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 11.2 Tao bac si moi

**Endpoint:** `/api/doctors`
**Method:** POST
**Auth:** Required (ADMIN)

```bash
curl -X POST http://localhost:3000/api/doctors \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": 9,
    "specialty_id": 1
  }'
```

---

## 12. UC6 - Quan Ly Chuyen Khoa

### 12.1 Lay danh sach chuyen khoa

**Endpoint:** `/api/specialties`
**Method:** GET
**Auth:** Required (ADMIN)

```bash
curl -X GET http://localhost:3000/api/specialties \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 12.2 Tao chuyen khoa moi

**Endpoint:** `/api/specialties`
**Method:** POST
**Auth:** Required (ADMIN)

```bash
curl -X POST http://localhost:3000/api/specialties \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rang Ham Mat",
    "description": "Kham va dieu tri cac benh rang ham mat",
    "status": "ACTIVE"
  }'
```

---

## 13. UC7 - Thiet Lap Lich Lam Viec

### 13.1 Tao lich lam viec

**Endpoint:** `/api/work-schedules`
**Method:** POST
**Auth:** Required (ADMIN)

```bash
curl -X POST http://localhost:3000/api/work-schedules \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "D00001",
    "clinic_id": 1,
    "shift_id": 1,
    "work_date": "2026-04-30"
  }'
```

### 13.2 Lay danh sach lich lam viec

**Endpoint:** `/api/work-schedules`
**Method:** GET

```bash
curl -X GET http://localhost:3000/api/work-schedules \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 14. UC8 - Dat Lich Kham

### 14.1 Dat lich kham moi (PATIENT)

**Endpoint:** `/api/appointments`
**Method:** POST
**Auth:** Required (PATIENT, ADMIN, RECEPTIONIST)

```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <PATIENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "P00001",
    "work_schedule_id": 1,
    "reason": "Dau bung"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "id": 100,
    "patient_id": "P00001",
    "status": "SCHEDULED"
  }
}
```

### 14.2 Dat lich trung - BI TU CHOI

```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <PATIENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "P00002",
    "work_schedule_id": 1,
    "reason": "Thu lai"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "This time slot is already booked"
}
```

---

## 15. UC9 - Huy Lich

### 15.1 Gui yeu cau huy lich (PATIENT)

**Endpoint:** `/api/appointment-requests`
**Method:** POST
**Auth:** Required (PATIENT)

```bash
curl -X POST http://localhost:3000/api/appointment-requests \
  -H "Authorization: Bearer <PATIENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": 1,
    "action": "CANCEL",
    "reason": "Ban cong viec dot xuat"
  }'
```

---

## 16. UC10 - Xem Lich Hen

### 16.1 Lay danh sach lich hen (ADMIN/RECEP)

**Endpoint:** `/api/appointments`
**Method:** GET
**Auth:** Required (ADMIN, RECEPTIONIST)

```bash
curl -X GET http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 16.2 Lay lich hen cua bac si (DOCTOR)

**Endpoint:** `/api/appointments`
**Method:** GET
**Auth:** Required (DOCTOR)

```bash
curl -X GET http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <DOCTOR_TOKEN>"
```

### 16.3 Lay lich hen cua benh nhan (PATIENT)

**Endpoint:** `/api/appointments`
**Method:** GET
**Auth:** Required (PATIENT)

```bash
curl -X GET http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <PATIENT_TOKEN>"
```

---

## 17. UC11 - Duyet Yeu Cau Thay Doi/Huy Lich

### 17.1 Lay danh sach yeu cau (ADMIN)

**Endpoint:** `/api/appointment-requests`
**Method:** GET
**Auth:** Required (ADMIN)

```bash
curl -X GET http://localhost:3000/api/appointment-requests \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 17.2 Duyet yeu cau (APPROVE)

**Endpoint:** `/api/appointment-requests/:id/approve`
**Method:** PATCH
**Auth:** Required (ADMIN)

```bash
curl -X PATCH http://localhost:3000/api/appointment-requests/1/approve \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 17.3 Tu choi yeu cau (REJECT)

**Endpoint:** `/api/appointment-requests/:id/reject`
**Method:** PATCH
**Auth:** Required (ADMIN)

```bash
curl -X PATCH http://localhost:3000/api/appointment-requests/1/reject \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Lich hen quan trong, vui long giu lai"
  }'
```

---

## 18. UC12 - Tiep Nhan Benh Nhan

### 18.1 Check-in lich hen (RECEPTIONIST)

**Endpoint:** `/api/appointments/:id/check-in`
**Method:** PATCH
**Auth:** Required (RECEPTIONIST)

```bash
curl -X PATCH http://localhost:3000/api/appointments/1/check-in \
  -H "Authorization: Bearer <RECEP_TOKEN>"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Patient checked in successfully",
  "data": {
    "id": 1,
    "status": "WAITING"
  }
}
```

---

## 19. UC13 - Cap Nhat Trang Thai Kham

### 19.1 Bat dau kham (DOCTOR)

**Endpoint:** `/api/appointments/:id/start`
**Method:** PATCH
**Auth:** Required (DOCTOR)

```bash
curl -X PATCH http://localhost:3000/api/appointments/2/start \
  -H "Authorization: Bearer <DOCTOR_TOKEN>"
```

### 19.2 Hoan tat kham (DOCTOR)

**Endpoint:** `/api/appointments/:id/complete`
**Method:** PATCH
**Auth:** Required (DOCTOR)

```bash
curl -X PATCH http://localhost:3000/api/appointments/2/complete \
  -H "Authorization: Bearer <DOCTOR_TOKEN>"
```

---

## 20. UC14 - Cap Nhat Ho So Benh An

### 20.1 Tao ho so benh an (DOCTOR)

**Endpoint:** `/api/medical-records`
**Method:** POST
**Auth:** Required (DOCTOR)

```bash
curl -X POST http://localhost:3000/api/medical-records \
  -H "Authorization: Bearer <DOCTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": 2,
    "symptoms": "Dau dau, sot nhe",
    "diagnosis": "Cam cum",
    "result": "O dinh sau 3 ngay",
    "prescription": "Paracetamol 500mg, 3 lan/ngay"
  }'
```

### 20.2 Cap nhat benh an (DOCTOR)

**Endpoint:** `/api/medical-records/:id`
**Method:** PUT
**Auth:** Required (DOCTOR)

```bash
curl -X PUT http://localhost:3000/api/medical-records/1 \
  -H "Authorization: Bearer <DOCTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "result": "Cap nhat: can them xet nghiem"
  }'
```

### 20.3 Hoan tat benh an (DOCTOR)

**Endpoint:** `/api/medical-records/:id/finalize`
**Method:** PATCH
**Auth:** Required (DOCTOR)

```bash
curl -X PATCH http://localhost:3000/api/medical-records/1/finalize \
  -H "Authorization: Bearer <DOCTOR_TOKEN>"
```

---

## 21. UC15 - Xem Lich Su Kham

### 21.1 Lay lich su kham benh nhan (PATIENT)

**Endpoint:** `/api/medical-records/patient/:patientId/history`
**Method:** GET
**Auth:** Required (PATIENT - chi benh nhan cua minh)

```bash
curl -X GET http://localhost:3000/api/medical-records/patient/P00001/history \
  -H "Authorization: Bearer <PATIENT_TOKEN>"
```

### 21.2 Lay lich su kham (ADMIN/DOCTOR)

```bash
curl -X GET http://localhost:3000/api/medical-records \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 22. UC16 - Tao Hoa Don

### 22.1 Tao hoa don (RECEPTIONIST)

**Endpoint:** `/api/bills`
**Method:** POST
**Auth:** Required (RECEPTIONIST, ADMIN)

```bash
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer <RECEP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "medical_record_id": 1
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Bill created successfully",
  "data": {
    "id": 100,
    "medical_record_id": 1,
    "total_amount": 0,
    "status": "PENDING"
  }
}
```

### 22.2 Them dich vu vao hoa don

**Endpoint:** `/api/bills/:id/items`
**Method:** POST
**Auth:** Required (RECEPTIONIST, ADMIN)

```bash
curl -X POST http://localhost:3000/api/bills/100/items \
  -H "Authorization: Bearer <RECEP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1,
    "quantity": 1
  }'
```

### 22.3 Tao bill trung medical_record - BI TU CHOI

```bash
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer <RECEP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "medical_record_id": 1
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Bill already exists for this medical record. Use existing bill."
}
```

---

## 23. UC17 - Xac Nhan Thanh Toan

### 23.1 Xac nhan thanh toan (RECEPTIONIST)

**Endpoint:** `/api/bills/:id/pay`
**Method:** PATCH
**Auth:** Required (RECEPTIONIST, ADMIN)

```bash
curl -X PATCH http://localhost:3000/api/bills/100/pay \
  -H "Authorization: Bearer <RECEP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "CASH"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "id": 100,
    "status": "COMPLETED",
    "payment_method": "CASH"
  }
}
```

### 23.2 Thanh toan lan 2 - BI TU CHOI

```bash
curl -X PATCH http://localhost:3000/api/bills/100/pay \
  -H "Authorization: Bearer <RECEP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "BANKING"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Bill already paid"
}
```

### 23.3 Lay chi tiet hoa don

**Endpoint:** `/api/bills/:id/detail`
**Method:** GET

```bash
curl -X GET http://localhost:3000/api/bills/100/detail \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 24. Test Loi

### 24.1 Login sai mat khau

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin01", "password": "saiman"}'
```

**Response (401):** `Invalid username or password`

### 24.2 Khong co token

```bash
curl -X GET http://localhost:3000/api/appointments
```

**Response (401):** `Access denied. No token provided.`

### 24.3 Token het han

```bash
curl -X GET http://localhost:3000/api/appointments \
  -H "Authorization: Bearer expired_token_here"
```

**Response (401):** `Invalid or expired token.`

### 24.4 Patient xem ho so nguoi khac - BI CAM

```bash
curl -X GET http://localhost:3000/api/patients/P00002 \
  -H "Authorization: Bearer <PATIENT_1_TOKEN>"
```

**Response (403):** `Access denied`

### 24.5 Doctor khong duoc tao bill - BI CAM

```bash
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer <DOCTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"medical_record_id": 1}'
```

**Response (403):** `Only RECEPTIONIST can create bills`

### 24.6 Dat lich trung - BI TU CHOI

```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <PATIENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "P00001",
    "work_schedule_id": 1,
    "reason": "Lich trung"
  }'
```

**Response (400):** `This time slot is already booked`

### 24.7 Tao bill trung medical_record - BI TU CHOI

```bash
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer <RECEP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"medical_record_id": 1}'
```

**Response (400):** `Bill already exists for this medical record`

### 24.8 Thanh toan bill da thanh toan - BI TU CHOI

```bash
curl -X PATCH http://localhost:3000/api/bills/100/pay \
  -H "Authorization: Bearer <RECEP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "CARD"}'
```

**Response (400):** `Bill already paid`

### 24.9 Tao bill khi appointment chua hoan tat - BI TU CHOI

```bash
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer <RECEP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"medical_record_id": 99}'
```

**Response (400):** `Medical record not found`

### 24.10 Khong the tao bill khi chua co medical_record - BI TU CHOI

```bash
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer <RECEP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"medical_record_id": 999}'
```

**Response (400):** `Medical record not found`

---

## Phu Luc: Danh Sach Endpoint Day Du

### Authentication
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`
- GET `/api/auth/roles`

### Profiles
- GET `/api/profiles`
- GET `/api/profiles/:id`
- POST `/api/profiles`
- PUT `/api/profiles/:id`
- DELETE `/api/profiles/:id`
- PATCH `/api/profiles/:id/status`
- PATCH `/api/profiles/:id/role`

### Patients
- GET `/api/patients`
- GET `/api/patients/:id`
- POST `/api/patients`
- PUT `/api/patients/:id`

### Doctors
- GET `/api/doctors`
- GET `/api/doctors/:id`
- POST `/api/doctors`
- PUT `/api/doctors/:id`

### Specialties
- GET `/api/specialties`
- GET `/api/specialties/:id`
- POST `/api/specialties`
- PUT `/api/specialties/:id`
- DELETE `/api/specialties/:id`

### Clinics
- GET `/api/clinics`
- GET `/api/clinics/:id`
- POST `/api/clinics`
- PUT `/api/clinics/:id`

### Shifts
- GET `/api/shifts`
- GET `/api/shifts/:id`
- POST `/api/shifts`
- PUT `/api/shifts/:id`
- DELETE `/api/shifts/:id`

### Services
- GET `/api/services`
- GET `/api/services/:id`
- POST `/api/services`
- PUT `/api/services/:id`
- DELETE `/api/services/:id`

### Work Schedules
- GET `/api/work-schedules`
- GET `/api/work-schedules/:id`
- POST `/api/work-schedules`
- PUT `/api/work-schedules/:id`
- DELETE `/api/work-schedules/:id`

### Appointments
- GET `/api/appointments`
- GET `/api/appointments/:id`
- POST `/api/appointments`
- PUT `/api/appointments/:id`
- PATCH `/api/appointments/:id/check-in`
- PATCH `/api/appointments/:id/start`
- PATCH `/api/appointments/:id/complete`
- PATCH `/api/appointments/:id/cancel`

### Appointment Requests
- GET `/api/appointment-requests`
- GET `/api/appointment-requests/:id`
- POST `/api/appointment-requests`
- PATCH `/api/appointment-requests/:id/approve`
- PATCH `/api/appointment-requests/:id/reject`

### Medical Records
- GET `/api/medical-records`
- GET `/api/medical-records/:id`
- GET `/api/medical-records/patient/:patientId/history`
- POST `/api/medical-records`
- PUT `/api/medical-records/:id`
- PATCH `/api/medical-records/:id/finalize`

### Bills
- GET `/api/bills`
- GET `/api/bills/:id`
- GET `/api/bills/:id/detail`
- GET `/api/bills/:id/items`
- GET `/api/bills/patient/:patientId`
- POST `/api/bills`
- PUT `/api/bills/:id`
- POST `/api/bills/:id/items`
- PUT `/api/bills/items/:itemId`
- DELETE `/api/bills/items/:itemId`
- PATCH `/api/bills/:id/pay`

### Audit Logs
- GET `/api/audit-logs`
- GET `/api/audit-logs/stats`
- GET `/api/audit-logs/recent`
- GET `/api/audit-logs/user/:userId`
- GET `/api/audit-logs/record/:tableName/:recordId`
- GET `/api/audit-logs/action/:actionType`
- GET `/api/audit-logs/range`
