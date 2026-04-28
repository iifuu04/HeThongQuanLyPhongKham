# API_QUICK_TEST.md - MedSys API Quick Test

## Setup
Backend phải đang chạy tại http://localhost:3000

## Authentication

### Login - Nhận JWT token
```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\": \"admin01\", \"password\": \"123456\"}"
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin01",
      "role": "ADMIN",
      "first_name": "An",
      "last_name": "Nguyen"
    }
  }
}
```

### Get Current User
```bash
curl http://localhost:3000/api/auth/me ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Profiles (UC18)

### Get All Profiles (ADMIN only)
```bash
curl http://localhost:3000/api/profiles ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Profile
```bash
curl -X POST http://localhost:3000/api/profiles ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{
    \"username\": \"newdoctor\",
    \"password\": \"123456\",
    \"role\": \"DOCTOR\",
    \"first_name\": \"Test\",
    \"last_name\": \"Doctor\",
    \"email\": \"testdoc@medsys.vn\",
    \"phone\": \"0909000001\"
  }"
```

---

## Patients (UC1-UC4)

### Get All Patients
```bash
curl http://localhost:3000/api/patients ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Search Patients
```bash
curl "http://localhost:3000/api/patients?search=nguyen" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Patient
```bash
curl -X POST http://localhost:3000/api/patients ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{
    \"username\": \"newpatient\",
    \"password\": \"123456\",
    \"first_name\": \"Nguyen\",
    \"last_name\": \"Van A\",
    \"date_of_birth\": \"1990-05-15\",
    \"gender\": \"Male\",
    \"phone\": \"0909123456\",
    \"email\": \"patient1@medsys.vn\"
  }"
```

### Get Patient by ID
```bash
curl http://localhost:3000/api/patients/P00001 ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Doctors (UC5)

### Get All Doctors
```bash
curl http://localhost:3000/api/doctors ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Doctor (Requires Profile first)
```bash
curl -X POST http://localhost:3000/api/doctors ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{
    \"profile_id\": 5,
    \"specialty_id\": 1
  }"
```

---

## Specialties (UC6)

### Get All Specialties
```bash
curl http://localhost:3000/api/specialties ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Specialty
```bash
curl -X POST http://localhost:3000/api/specialties ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{
    \"name\": \"Tim mach\",
    \"description\": \"Chuyen khoa tim mach\",
    \"establish_at\": \"2020-01-01\"
  }"
```

---

## Work Schedules (UC7)

### Get All Schedules
```bash
curl http://localhost:3000/api/work-schedules ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Schedules by Date
```bash
curl "http://localhost:3000/api/work-schedules?work_date=2026-04-29" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Schedule
```bash
curl -X POST http://localhost:3000/api/work-schedules ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{
    \"doctor_id\": \"D00001\",
    \"clinic_id\": 1,
    \"shift_id\": 1,
    \"work_date\": \"2026-04-30\"
  }"
```

---

## Appointments (UC8, UC10, UC12, UC13)

### Get Appointments
```bash
curl http://localhost:3000/api/appointments ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Appointments by Status
```bash
curl "http://localhost:3000/api/appointments?status=SCHEDULED" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Appointment
```bash
curl -X POST http://localhost:3000/api/appointments ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{
    \"patient_id\": \"P00001\",
    \"doctor_id\": \"D00001\",
    \"work_schedule_id\": 1,
    \"start_time\": \"2026-04-29 07:30:00\",
    \"end_time\": \"2026-04-29 08:00:00\"
  }"
```

### Check-in Appointment
```bash
curl -X PATCH http://localhost:3000/api/appointments/1/check-in ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Appointment Status
```bash
curl -X PATCH http://localhost:3000/api/appointments/1/status ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"status\": \"WAITING\"}"
```

### Cancel Appointment
```bash
curl -X PATCH http://localhost:3000/api/appointments/1/cancel ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Medical Records (UC14)

### Get Medical Records
```bash
curl http://localhost:3000/api/medical-records ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Patient History
```bash
curl http://localhost:3000/api/medical-records/patient/P00001/history ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Medical Record
```bash
curl -X POST http://localhost:3000/api/medical-records ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{
    \"patient_id\": \"P00001\",
    \"doctor_id\": \"D00001\",
    \"appointment_id\": 1,
    \"symptoms\": \"Dau hong, sot nhe\",
    \"diagnosis\": \"Viem hong cap\",
    \"result\": \"O dinh sau 3 ngay\",
    \"prescription\": \"Thuoc khang sinh 5 ngay\",
    \"note\": \"Theo doi tai nha\"
  }"
```

### Finalize Medical Record
```bash
curl -X PATCH http://localhost:3000/api/medical-records/1/finalize ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Bills (UC16, UC17)

### Get Bills
```bash
curl http://localhost:3000/api/bills ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Bill Detail
```bash
curl http://localhost:3000/api/bills/1/detail ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Bill
```bash
curl -X POST http://localhost:3000/api/bills ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"medical_record_id\": 1}"
```

### Add Bill Item
```bash
curl -X POST http://localhost:3000/api/bills/1/items ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{
    \"service_id\": 1,
    \"quantity\": 2,
    \"price\": 150000
  }"
```

### Confirm Payment
```bash
curl -X PATCH http://localhost:3000/api/bills/1/pay ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"paymentMethod\": \"CASH\"}"
```

---

## Appointment Requests (UC11)

### Get Pending Requests
```bash
curl http://localhost:3000/api/appointment-requests/pending ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Approve Request
```bash
curl -X PATCH http://localhost:3000/api/appointment-requests/1/approve ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Reject Request
```bash
curl -X PATCH http://localhost:3000/api/appointment-requests/1/reject ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"reason\": \"Khong phu hop\"}"
```

---

## Services

### Get All Services
```bash
curl http://localhost:3000/api/services ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Shifts

### Get All Shifts
```bash
curl http://localhost:3000/api/shifts ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Clinics

### Get All Clinics
```bash
curl http://localhost:3000/api/clinics ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Audit Logs

### Get Recent Logs
```bash
curl http://localhost:3000/api/audit-logs ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Quick Test Script (PowerShell)

Lưu file này thành `test-api.ps1` và chạy:

```powershell
$baseUrl = "http://localhost:3000/api"
$token = ""

# 1. Login
Write-Host "1. Testing Login..."
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"admin01","password":"123456"}'
$token = $login.data.token
Write-Host "Token received: $($token.Substring(0, [Math]::Min(50, $token.Length)))..."

# 2. Get Profiles
Write-Host "`n2. Testing GET /profiles..."
$profiles = Invoke-RestMethod -Uri "$baseUrl/profiles" -Method Get -Headers @{"Authorization"="Bearer $token"}
Write-Host "Profiles count: $($profiles.data.Count)"

# 3. Get Patients
Write-Host "`n3. Testing GET /patients..."
$patients = Invoke-RestMethod -Uri "$baseUrl/patients" -Method Get -Headers @{"Authorization"="Bearer $token"}
Write-Host "Patients count: $($patients.data.Count)"

# 4. Get Doctors
Write-Host "`n4. Testing GET /doctors..."
$doctors = Invoke-RestMethod -Uri "$baseUrl/doctors" -Method Get -Headers @{"Authorization"="Bearer $token"}
Write-Host "Doctors count: $($doctors.data.Count)"

# 5. Get Specialties
Write-Host "`n5. Testing GET /specialties..."
$specialties = Invoke-RestMethod -Uri "$baseUrl/specialties" -Method Get -Headers @{"Authorization"="Bearer $token"}
Write-Host "Specialties count: $($specialties.data.Count)"

# 6. Get Appointments
Write-Host "`n6. Testing GET /appointments..."
$appointments = Invoke-RestMethod -Uri "$baseUrl/appointments" -Method Get -Headers @{"Authorization"="Bearer $token"}
Write-Host "Appointments count: $($appointments.data.Count)"

Write-Host "`n=== All tests passed! ==="
```
