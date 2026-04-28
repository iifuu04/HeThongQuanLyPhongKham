# Demo Test Accounts - MedSys

## Muc Luc

1. [Tai khoan test](#1-tai-khoan-test)
2. [Lenh Import Seed](#2-lenh-import-seed)
3. [Cac ban ghi da tao](#3-cac-ban-ghi-da-tao)
4. [Flow Test trung lich](#4-flow-test-trung-lich)
5. [Flow Test dat lich hop le](#5-flow-test-dat-lich-hop-le)
6. [Lenh curl test](#6-lenh-curl-test)

---

## 1. Tai Khoan Test

| Username | Password | Role | Profile ID | Entity ID |
|----------|----------|------|-----------|-----------|
| admin_test | 123456 | ADMIN | 101 | - |
| reception_test | 123456 | RECEPTIONIST | 102 | - |
| doctor_test1 | 123456 | DOCTOR | 103 | D00010 |
| doctor_test2 | 123456 | DOCTOR | 104 | D00011 |
| patient_test1 | 123456 | PATIENT | 105 | P00010 |
| patient_test2 | 123456 | PATIENT | 106 | P00011 |

**Chu y:** Password hash su dung: `$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe` (hash cua '123456')

---

## 2. Lenh Import Seed

### 2.1 Import seed_test_accounts.sql

```bash
cd HeThongQuanLyPhongKham/backend
mysql -u root -p MedSys < src/database/seed_test_accounts.sql
```

### 2.2 Hoac su dung MySQL CLI

```bash
mysql -u root -p
```

```sql
USE MedSys;
SOURCE src/database/seed_test_accounts.sql;
EXIT;
```

---

## 3. Cac Ban Ghi Da Tao

### 3.1 Specialties (Chuyen khoa)
| ID | Name | Status |
|----|------|--------|
| 10 | Noi Tong Quat Test | ACTIVE |
| 11 | Nhi Khoa Test | ACTIVE |

### 3.2 Clinics (Phong kham)
| ID | Name | Location |
|----|------|----------|
| 10 | Phong Kham Test 01 | Tang 3 - Khu Test A |
| 11 | Phong Kham Test 02 | Tang 3 - Khu Test B |

### 3.3 Shifts (Ca lam viec)
| ID | Start | End | Max Patients |
|----|-------|-----|--------------|
| 10 | 08:00 | 10:00 | 10 |
| 11 | 10:00 | 12:00 | 10 |

### 3.4 Work Schedules (Lich lam viec)
| ID | Doctor | Clinic | Shift | Date |
|----|--------|--------|-------|------|
| 100 | D00010 (doctor_test1) | 10 | 10 | Current + 7 days |
| 101 | D00010 (doctor_test1) | 10 | 11 | Current + 7 days |
| 102 | D00011 (doctor_test2) | 11 | 10 | Current + 8 days |

### 3.5 Appointments (Lich hen)
| ID | Patient | Doctor | Work Schedule | Start Time | Status |
|----|---------|--------|---------------|------------|--------|
| 100 | P00010 (patient_test1) | D00010 (doctor_test1) | 100 | Current + 7 days 08:00 | SCHEDULED |

---

## 4. Flow Test Trung Lich

### 4.1 Muc tieu
Kiem tra he thong tu choi dat lich khi khung gio da co nguoi dat.

### 4.2 Buoc thuc hien

**Buoc 1: Login voi patient_test2**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "patient_test2", "password": "123456"}'
```

**Ket qua mong doi (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 106,
      "username": "patient_test2",
      "role": "PATIENT"
    }
  }
}
```

**Buoc 2: Lay token va dat lich trung**

Su dung token tu buoc 1 de dat lich cung doctor_test1, cung work_schedule_id=100, cung start_time=08:00.

```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <PATIENT_TEST2_TOKEN>" \
  -d '{
    "patient_id": "P00011",
    "work_schedule_id": 100,
    "reason": "Test trung lich"
  }'
```

**Ket qua mong doi (400):**
```json
{
  "success": false,
  "message": "This time slot is already booked"
}
```

### 4.3 Lenh PowerShell day du

```powershell
# Buoc 1: Login patient_test2
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username": "patient_test2", "password": "123456"}'

$token = $login.data.token
Write-Host "Token: $token"

# Buoc 2: Thu dat lich trung
$appointment = Invoke-RestMethod -Uri "http://localhost:3000/api/appointments" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -Body '{
    "patient_id": "P00011",
    "work_schedule_id": 100,
    "reason": "Test trung lich"
  }'

Write-Host "Result: $($appointment | ConvertTo-Json)"
```

---

## 5. Flow Test Dat Lich Hop Le

### 5.1 Muc tieu
Kiem tra he thong chap nhan dat lich khi khung gio chua co nguoi dat.

### 5.2 Buoc thuc hien

**Buoc 1: Login voi patient_test2**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "patient_test2", "password": "123456"}'
```

**Buoc 2: Dat lich khac gio**

Su dung work_schedule_id=101 (ca 10:00-12:00) thay vi 100.

```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <PATIENT_TEST2_TOKEN>" \
  -d '{
    "patient_id": "P00011",
    "work_schedule_id": 101,
    "reason": "Kham benh thong thuong"
  }'
```

**Ket qua mong doi (201):**
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "id": 200,
    "patient_id": "P00011",
    "doctor_id": "D00010",
    "status": "SCHEDULED"
  }
}
```

---

## 6. Lenh Curl Test

### 6.1 Test Login cac tai khoan

**Admin Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin_test", "password": "123456"}'
```

**Reception Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "reception_test", "password": "123456"}'
```

**Doctor1 Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "doctor_test1", "password": "123456"}'
```

**Doctor2 Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "doctor_test2", "password": "123456"}'
```

**Patient1 Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "patient_test1", "password": "123456"}'
```

**Patient2 Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "patient_test2", "password": "123456"}'
```

### 6.2 Test trung lich day du

```bash
# 1. Login patient_test2
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "patient_test2", "password": "123456"}' | jq -r '.data.token')

# 2. Thu dat lich trung
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"patient_id": "P00011", "work_schedule_id": 100, "reason": "Test trung lich"}'
```

### 6.3 Test dat lich thanh cong

```bash
# 1. Login patient_test2
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "patient_test2", "password": "123456"}' | jq -r '.data.token')

# 2. Dat lich khac gio (work_schedule_id=101)
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"patient_id": "P00011", "work_schedule_id": 101, "reason": "Kham thong thuong"}'
```

### 6.4 Test kiem tra RBAC - Doctor khong the tao bill

```bash
# 1. Login doctor_test1
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "doctor_test1", "password": "123456"}' | jq -r '.data.token')

# 2. Thu tao bill (se bi tu choi 403)
curl -X POST http://localhost:3000/api/bills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"medical_record_id": 1}'
```

**Ket qua mong doi (403):**
```json
{
  "success": false,
  "message": "Only RECEPTIONIST can create bills"
}
```

### 6.5 Test kiem tra RBAC - Patient khong xem duoc ho so nguoi khac

```bash
# 1. Login patient_test1
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "patient_test1", "password": "123456"}' | jq -r '.data.token')

# 2. Thu xem ho so patient_test2 (se bi tu choi 403)
curl -X GET http://localhost:3000/api/patients/P00011 \
  -H "Authorization: Bearer $TOKEN"
```

**Ket qua mong doi (403):**
```json
{
  "success": false,
  "message": "Access denied"
}
```

---

## Tong Ket

| Test Case | Expected Result | Status |
|-----------|----------------|--------|
| Login patient_test2 | Success (200) | Ready |
| Dat lich trung (P00011 + WS=100 + 08:00) | Rejected (400) | Ready |
| Dat lich khac (P00011 + WS=101) | Success (201) | Ready |
| Doctor tao bill | Rejected (403) | Ready |
| Patient xem ho so nguoi khac | Rejected (403) | Ready |

---

**Version:** 1.0.0
**Last Updated:** 2026-04-29
