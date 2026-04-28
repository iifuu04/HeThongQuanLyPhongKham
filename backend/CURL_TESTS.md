# ============================================
# Curl Test Commands for Backend API
# ============================================
# Run backend: cd backend && npm run dev
# Get token first from login, then use it in Authorization header
# ============================================

# ============================================
# AUTH - Login first to get token
# ============================================
# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Login as doctor (example)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "doctor1", "password": "doctor123"}'

# ============================================
# SPECIALTIES (UC6)
# ============================================
# Base URL: http://localhost:3000/api/specialties

# Get all specialties (ADMIN, DOCTOR, RECEPTIONIST)
curl -X GET http://localhost:3000/api/specialties \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get specialty by ID
curl -X GET http://localhost:3000/api/specialties/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create specialty (ADMIN only)
curl -X POST http://localhost:3000/api/specialties \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "Cardiology", "description": "Heart and cardiovascular system"}'

# Update specialty (ADMIN only)
curl -X PUT http://localhost:3000/api/specialties/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "Cardiology Updated", "description": "Heart care department"}'

# Disable specialty (ADMIN only)
curl -X PATCH http://localhost:3000/api/specialties/1/disable \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Enable specialty (ADMIN only)
curl -X PATCH http://localhost:3000/api/specialties/1/unlock \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Delete specialty (ADMIN only)
curl -X DELETE http://localhost:3000/api/specialties/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# ============================================
# CLINICS (UC5)
# ============================================
# Base URL: http://localhost:3000/api/clinics

# Get all clinics (ADMIN, DOCTOR, RECEPTIONIST)
curl -X GET http://localhost:3000/api/clinics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get clinic by ID
curl -X GET http://localhost:3000/api/clinics/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create clinic (ADMIN only)
curl -X POST http://localhost:3000/api/clinics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "Main Clinic", "location": "123 Medical Street", "is_reserve": false}'

# Update clinic (ADMIN only)
curl -X PUT http://localhost:3000/api/clinics/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "Main Clinic Updated", "location": "456 New Medical Street", "is_reserve": true}'

# ============================================
# SHIFTS
# ============================================
# Base URL: http://localhost:3000/api/shifts

# Get all shifts (ADMIN, DOCTOR, RECEPTIONIST)
curl -X GET http://localhost:3000/api/shifts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get shift by ID
curl -X GET http://localhost:3000/api/shifts/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create shift (ADMIN only)
curl -X POST http://localhost:3000/api/shifts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "Morning Shift", "start_time": "08:00:00", "end_time": "12:00:00", "max_patients": 20}'

# Create afternoon shift
curl -X POST http://localhost:3000/api/shifts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "Afternoon Shift", "start_time": "13:00:00", "end_time": "17:00:00", "max_patients": 20}'

# Update shift (ADMIN only)
curl -X PUT http://localhost:3000/api/shifts/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"start_time": "07:00:00", "end_time": "11:00:00", "max_patients": 25}'

# Delete shift (ADMIN only)
curl -X DELETE http://localhost:3000/api/shifts/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# ============================================
# DOCTORS (UC5)
# ============================================
# Base URL: http://localhost:3000/api/doctors

# Get all doctors (ADMIN, DOCTOR, RECEPTIONIST)
curl -X GET http://localhost:3000/api/doctors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get all doctors including inactive (ADMIN only)
curl -X GET "http://localhost:3000/api/doctors?include_inactive=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get doctor by ID
curl -X GET http://localhost:3000/api/doctors/DOC00001 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get doctor with full details
curl -X GET http://localhost:3000/api/doctors/DOC00001/details \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get doctors by specialty
curl -X GET http://localhost:3000/api/doctors/specialty/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create doctor (ADMIN only)
# Note: Requires a Profile with role DOCTOR first
curl -X POST http://localhost:3000/api/doctors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"profile_id": 1, "specialty_id": 1}'

# Update doctor (ADMIN only)
curl -X PUT http://localhost:3000/api/doctors/DOC00001 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"specialty_id": 2}'

# Disable doctor (ADMIN only)
curl -X PATCH http://localhost:3000/api/doctors/DOC00001/disable \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Enable doctor (ADMIN only)
curl -X PATCH http://localhost:3000/api/doctors/DOC00001/enable \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Delete doctor (ADMIN only) - soft delete
curl -X DELETE http://localhost:3000/api/doctors/DOC00001 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# ============================================
# WORK SCHEDULES (UC5, UC7)
# ============================================
# Base URL: http://localhost:3000/api/work-schedules

# Get all work schedules (ADMIN, DOCTOR, RECEPTIONIST)
curl -X GET http://localhost:3000/api/work-schedules \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get work schedules with filters (for appointment booking)
curl -X GET "http://localhost:3000/api/work-schedules?doctor_id=DOC00001&work_date=2026-05-01&specialty_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get work schedules by doctor
curl -X GET http://localhost:3000/api/work-schedules/doctor/DOC00001 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get work schedules by date
curl -X GET http://localhost:3000/api/work-schedules/date/2026-05-01 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get work schedule by ID
curl -X GET http://localhost:3000/api/work-schedules/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create work schedule (ADMIN only)
curl -X POST http://localhost:3000/api/work-schedules \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"doctor_id": "DOC00001", "clinic_id": 1, "shift_id": 1, "work_date": "2026-05-01"}'

# Update work schedule (ADMIN only)
curl -X PUT http://localhost:3000/api/work-schedules/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"clinic_id": 2}'

# Delete work schedule (ADMIN only)
curl -X DELETE http://localhost:3000/api/work-schedules/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# ============================================
# WORKFLOW EXAMPLES
# ============================================

# Example: Create a complete doctor workflow
# 1. Create profile with DOCTOR role
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dr_nguyen",
    "password": "SecurePass123",
    "role": "DOCTOR",
    "first_name": "Nguyen",
    "last_name": "Van A",
    "email": "dr.nguyen@clinic.com",
    "phone": "0909123456",
    "date_of_birth": "1985-05-15",
    "gender": "Male"
  }'

# 2. Create specialty
curl -X POST http://localhost:3000/api/specialties \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "Internal Medicine", "description": "General internal medicine"}'

# 3. Create doctor with profile_id and specialty_id
# First get profile_id from the register response
curl -X POST http://localhost:3000/api/doctors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "PROFILE_ID_HERE", "specialty_id": 1}'

# 4. Create shifts
curl -X POST http://localhost:3000/api/shifts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "Morning", "start_time": "08:00", "end_time": "12:00", "max_patients": 15}'

# 5. Create work schedule
curl -X POST http://localhost:3000/api/work-schedules \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"doctor_id": "DOC00001", "clinic_id": 1, "shift_id": 1, "work_date": "2026-05-01"}'

# Example: Frontend booking workflow
# 1. Get available specialties
curl -X GET http://localhost:3000/api/specialties \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 2. Get doctors by specialty
curl -X GET http://localhost:3000/api/doctors/specialty/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. Get available schedules (with filters)
curl -X GET "http://localhost:3000/api/work-schedules?specialty_id=1&work_date=2026-05-01" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 4. Get shift details
curl -X GET http://localhost:3000/api/shifts/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# ============================================
# APPOINTMENTS (UC8, UC9, UC10, UC11, UC12)
# ============================================
# Base URL: http://localhost:3000/api/appointments

# Login as patient first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "patient1", "password": "patient123"}'

# Login as receptionist
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "receptionist", "password": "reception123"}'

# Get all appointments (ADMIN, DOCTOR, RECEPTIONIST can see all, PATIENT sees own)
curl -X GET http://localhost:3000/api/appointments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get appointments with filters
curl -X GET "http://localhost:3000/api/appointments?date=2026-05-01&doctor_id=DOC00001&status=SCHEDULED" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get appointments by date
curl -X GET http://localhost:3000/api/appointments/date/2026-05-01 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get waiting appointments
curl -X GET http://localhost:3000/api/appointments/status/waiting \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get appointment by ID
curl -X GET http://localhost:3000/api/appointments/APT00001 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create appointment (PATIENT books own, RECEPTIONIST books for patient)
# Get work schedule first to get start_time and end_time
curl -X GET "http://localhost:3000/api/work-schedules?doctor_id=DOC00001&work_date=2026-05-02" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create appointment (PATIENT)
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer PATIENT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "DOC00001",
    "work_schedule_id": 1,
    "start_time": "08:00:00",
    "end_time": "08:30:00",
    "reason": "Regular checkup"
  }'

# Create appointment (RECEPTIONIST - booking for patient)
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer RECEPTIONIST_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "P00001",
    "doctor_id": "DOC00001",
    "work_schedule_id": 1,
    "start_time": "08:30:00",
    "end_time": "09:00:00",
    "reason": "Follow-up visit"
  }'

# Try to create duplicate appointment (should fail with conflict message)
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer PATIENT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "DOC00001",
    "work_schedule_id": 1,
    "start_time": "08:00:00",
    "end_time": "08:30:00",
    "reason": "This should fail - duplicate slot"
  }'

# Check-in patient (RECEPTIONIST only)
curl -X PATCH http://localhost:3000/api/appointments/APT00001/check-in \
  -H "Authorization: Bearer RECEPTIONIST_TOKEN_HERE"

# Update appointment status to INPROGRESS (DOCTOR)
curl -X PATCH http://localhost:3000/api/appointments/APT00001/status \
  -H "Authorization: Bearer DOCTOR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"status": "INPROGRESS"}'

# Update appointment status to COMPLETED (DOCTOR)
curl -X PATCH http://localhost:3000/api/appointments/APT00001/status \
  -H "Authorization: Bearer DOCTOR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'

# Cancel appointment (PATIENT cancels own)
curl -X PATCH http://localhost:3000/api/appointments/APT00001/cancel \
  -H "Authorization: Bearer PATIENT_TOKEN_HERE"

# Cancel appointment (RECEPTIONIST requests cancel - creates request)
curl -X PATCH http://localhost:3000/api/appointments/APT00001/cancel \
  -H "Authorization: Bearer RECEPTIONIST_TOKEN_HERE"

# ============================================
# APPOINTMENT REQUESTS
# ============================================
# Base URL: http://localhost:3000/api/appointment-requests

# Get all requests (ADMIN only)
curl -X GET http://localhost:3000/api/appointment-requests \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

# Get pending requests (ADMIN only)
curl -X GET http://localhost:3000/api/appointment-requests/pending \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

# Get request by ID
curl -X GET http://localhost:3000/api/appointment-requests/REQ00001 \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

# Create cancel request (RECEPTIONIST or DOCTOR)
curl -X POST http://localhost:3000/api/appointment-requests \
  -H "Authorization: Bearer RECEPTIONIST_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": "APT00001",
    "action": "CANCEL",
    "reason": "Patient requested cancellation"
  }'

# Create reschedule request (RECEPTIONIST or DOCTOR)
curl -X POST http://localhost:3000/api/appointment-requests \
  -H "Authorization: Bearer RECEPTIONIST_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": "APT00001",
    "action": "RESCHEDULE",
    "reason": "Doctor unavailable, need to reschedule",
    "new_data": "{\"start_time\": \"10:00:00\", \"end_time\": \"10:30:00\"}"
  }'

# Approve request (ADMIN only)
curl -X PATCH http://localhost:3000/api/appointment-requests/REQ00001/approve \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

# Reject request (ADMIN only)
curl -X PATCH http://localhost:3000/api/appointment-requests/REQ00001/reject \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Cannot cancel within 24 hours of appointment"}'

# ============================================
# FULL WORKFLOW TEST
# ============================================

# Step 1: Login as admin to setup data
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Step 2: Login as patient
PATIENT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Step 3: Login as receptionist
RECEP_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Step 4: Login as doctor
DOCTOR_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Step 5: Create work schedule (if not exists)
# First check existing schedules
curl -X GET "http://localhost:3000/api/work-schedules?doctor_id=DOC00001&work_date=2026-05-03" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Step 6: Patient books appointment
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "DOC00001",
    "work_schedule_id": 1,
    "start_time": "09:00:00",
    "end_time": "09:30:00",
    "reason": "Annual health checkup"
  }'

# Step 7: Receptionist checks in patient
curl -X PATCH http://localhost:3000/api/appointments/APT00002/check-in \
  -H "Authorization: Bearer $RECEP_TOKEN"

# Step 8: Doctor updates status to INPROGRESS
curl -X PATCH http://localhost:3000/api/appointments/APT00002/status \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "INPROGRESS"}'

# Step 9: Doctor completes appointment
curl -X PATCH http://localhost:3000/api/appointments/APT00002/status \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'

# Step 10: Patient tries to cancel own appointment
curl -X PATCH http://localhost:3000/api/appointments/APT00003/cancel \
  -H "Authorization: Bearer $PATIENT_TOKEN"

# Step 11: Receptionist requests cancel for another patient
curl -X PATCH http://localhost:3000/api/appointments/APT00004/cancel \
  -H "Authorization: Bearer $RECEP_TOKEN"

# Step 12: Admin views pending requests
curl -X GET http://localhost:3000/api/appointment-requests/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Step 13: Admin approves cancellation
curl -X PATCH http://localhost:3000/api/appointment-requests/REQ00001/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# ============================================
# ERROR SCENARIO TESTS
# ============================================

# Test: Create duplicate appointment (should return conflict error)
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "DOC00001",
    "work_schedule_id": 1,
    "start_time": "08:00:00",
    "end_time": "08:30:00"
  }'
# Expected: "Khung gio nay da duoc dat, vui long chon khung gio khac"

# Test: Patient tries to cancel another patient's appointment
curl -X PATCH http://localhost:3000/api/appointments/APT00005/cancel \
  -H "Authorization: Bearer $PATIENT_TOKEN"
# Expected: 400 error "You can only cancel your own appointments"

# Test: Invalid status transition (skip status)
curl -X PATCH http://localhost:3000/api/appointments/APT00006/status \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'
# Expected: 400 error "Invalid status transition from SCHEDULED to COMPLETED"

# Test: Cancel already cancelled appointment
curl -X PATCH http://localhost:3000/api/appointments/APT00007/cancel \
  -H "Authorization: Bearer $PATIENT_TOKEN"
# Expected: 400 error "Appointment is already cancelled"

# Test: Receptionist tries to approve request (should fail)
curl -X PATCH http://localhost:3000/api/appointment-requests/REQ00001/approve \
  -H "Authorization: Bearer $RECEP_TOKEN"
# Expected: 403 Forbidden "Only ADMIN can approve requests"

# ============================================
# MEDICAL RECORDS (UC14, UC15)
# ============================================
# Base URL: http://localhost:3000/api/medical-records

# Login as doctor
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "doctor1", "password": "doctor123"}'

# Login as patient
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "patient1", "password": "patient123"}'

# Get all medical records (ADMIN, DOCTOR, RECEPTIONIST)
curl -X GET http://localhost:3000/api/medical-records \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get medical record by ID
curl -X GET http://localhost:3000/api/medical-records/MR00001 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get medical records by patient ID
curl -X GET "http://localhost:3000/api/medical-records/patient/P00001/history" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get medical record by appointment ID
curl -X GET http://localhost:3000/api/medical-records/appointment/APT00002 \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

# Create medical record (DOCTOR only)
# Note: Appointment must be WAITING or INPROGRESS
curl -X POST http://localhost:3000/api/medical-records \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": "APT00002",
    "symptoms": " headache, mild fever",
    "diagnosis": "Common cold",
    "result": "Patient advised rest and hydration",
    "prescription": "Paracetamol 500mg, 3 times daily after meals",
    "note": "Follow up in 3 days if symptoms persist"
  }'

# Update medical record (DOCTOR only - own records)
curl -X PUT http://localhost:3000/api/medical-records/MR00001 \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diagnosis": "Viral upper respiratory infection",
    "result": "Symptoms improved after treatment"
  }'

# Finalize medical record (DOCTOR only)
# This will also update appointment status to COMPLETED
curl -X PATCH http://localhost:3000/api/medical-records/MR00001/finalize \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

# Delete medical record (ADMIN only - soft delete)
curl -X DELETE http://localhost:3000/api/medical-records/MR00001 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# ============================================
# MEDICAL RECORDS WORKFLOW TESTS
# ============================================

# Step 1: Patient views their own medical history
curl -X GET "http://localhost:3000/api/medical-records/patient/P00001/history" \
  -H "Authorization: Bearer $PATIENT_TOKEN"

# Step 2: Doctor creates medical record for their appointment
# First ensure appointment is INPROGRESS
curl -X PATCH http://localhost:3000/api/appointments/APT00003/status \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "INPROGRESS"}'

# Then create medical record
curl -X POST http://localhost:3000/api/medical-records \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": "APT00003",
    "symptoms": "Persistent cough for 2 weeks",
    "diagnosis": "Acute bronchitis",
    "result": "Chest X-ray normal, prescribed antibiotics",
    "prescription": "Amoxicillin 500mg, 3 times daily for 7 days",
    "note": "Return if no improvement after 1 week"
  }'

# Step 3: Doctor updates medical record
curl -X PUT http://localhost:3000/api/medical-records/MR00002 \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "result": "Follow-up examination completed"
  }'

# Step 4: Doctor finalizes medical record (completes appointment)
curl -X PATCH http://localhost:3000/api/medical-records/MR00002/finalize \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

# Step 5: Receptionist views patient medical history (masked data)
curl -X GET "http://localhost:3000/api/medical-records/patient/P00001/history" \
  -H "Authorization: Bearer $RECEP_TOKEN"
# Note: Receptionist only sees basic info, not diagnosis/prescription

# ============================================
# MEDICAL RECORDS ERROR SCENARIO TESTS
# ============================================

# Test: Patient tries to create medical record (should fail)
curl -X POST http://localhost:3000/api/medical-records \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": "APT00004", "diagnosis": "Test"}'
# Expected: 403 Forbidden "Only DOCTOR can create medical records"

# Test: Doctor tries to create record for another doctor's appointment (should fail)
curl -X POST http://localhost:3000/api/medical-records \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": "APT00005", "diagnosis": "Test"}'
# Expected: 400 Bad Request "You can only create records for your own appointments"

# Test: Create record for SCHEDULED appointment (should fail)
curl -X POST http://localhost:3000/api/medical-records \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": "APT00006", "diagnosis": "Test"}'
# Expected: 400 Bad Request "Cannot create medical record: appointment status must be WAITING or INPROGRESS"

# Test: Update finalized medical record (should fail)
curl -X PUT http://localhost:3000/api/medical-records/MR00003 \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"diagnosis": "Updated diagnosis"}'
# Expected: 400 Bad Request "Cannot update a finalized medical record"

# Test: Patient tries to view another patient's history (should fail)
curl -X GET "http://localhost:3000/api/medical-records/patient/P00002/history" \
  -H "Authorization: Bearer $PATIENT_TOKEN"
# Expected: 200 OK but empty array (access denied)

# Test: Receptionist tries to update medical record (should fail)
curl -X PUT http://localhost:3000/api/medical-records/MR00001 \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"diagnosis": "Updated"}'
# Expected: 403 Forbidden "Only DOCTOR can update medical records"

# ============================================
# SERVICES (UC16)
# ============================================
# Base URL: http://localhost:3000/api/services

# Get all services
curl -X GET http://localhost:3000/api/services \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get service by ID
curl -X GET http://localhost:3000/api/services/SVC00001 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Create service (ADMIN only)
curl -X POST http://localhost:3000/api/services \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "General Checkup",
    "price": 150000,
    "description": "Basic health examination",
    "unit": "session"
  }'

# Create more services
curl -X POST http://localhost:3000/api/services \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Blood Test", "price": 200000, "description": "Complete blood count test", "unit": "test"}'

curl -X POST http://localhost:3000/api/services \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "X-Ray", "price": 350000, "description": "Chest X-ray examination", "unit": "examination"}'

curl -X POST http://localhost:3000/api/services \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "ECG", "price": 250000, "description": "Electrocardiogram test", "unit": "test"}'

# Update service (ADMIN only)
curl -X PUT http://localhost:3000/api/services/SVC00001 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": 175000}'

# Delete service (ADMIN only)
curl -X DELETE http://localhost:3000/api/services/SVC00005 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# ============================================
# BILLS (UC17)
# ============================================
# Base URL: http://localhost:3000/api/bills

# Get all bills (ADMIN, RECEPTIONIST)
curl -X GET http://localhost:3000/api/bills \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get bills with filters
curl -X GET "http://localhost:3000/api/bills?status=PENDING" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get bill by ID
curl -X GET http://localhost:3000/api/bills/BIL00001 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get bill full detail
curl -X GET http://localhost:3000/api/bills/BIL00001/detail \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get bills by patient
curl -X GET "http://localhost:3000/api/bills/patient/P00001" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Create bill from medical record (RECEPTIONIST only)
# Note: Medical record must be COMPLETED and appointment must be COMPLETED
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"medical_record_id": "MR00001"}'

# Add bill item (RECEPTIONIST only)
curl -X POST http://localhost:3000/api/bills/BIL00001/items \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": "SVC00001",
    "quantity": 1,
    "notes": "Standard consultation"
  }'

# Add more bill items
curl -X POST http://localhost:3000/api/bills/BIL00001/items \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service_id": "SVC00002", "quantity": 1}'

curl -X POST http://localhost:3000/api/bills/BIL00001/items \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service_id": "SVC00003", "quantity": 1}'

# Get bill items
curl -X GET http://localhost:3000/api/bills/BIL00001/items \
  -H "Authorization: Bearer $RECEP_TOKEN"

# Update bill item
curl -X PUT http://localhost:3000/api/bills/items/BI00001 \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 2}'

# Delete bill item
curl -X DELETE http://localhost:3000/api/bills/items/BI00003 \
  -H "Authorization: Bearer $RECEP_TOKEN"

# Confirm payment (RECEPTIONIST only)
curl -X PATCH http://localhost:3000/api/bills/BIL00001/pay \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "CASH"}'

# Try to pay again (should fail - already paid)
curl -X PATCH http://localhost:3000/api/bills/BIL00001/pay \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "CARD"}'

# ============================================
# BILLS WORKFLOW TESTS
# ============================================

# Step 1: Create bill from completed medical record
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"medical_record_id": "MR00002"}'

# Step 2: Add services to bill
curl -X POST http://localhost:3000/api/bills/BIL00002/items \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service_id": "SVC00001", "quantity": 1}'

curl -X POST http://localhost:3000/api/bills/BIL00002/items \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service_id": "SVC00004", "quantity": 1}'

# Step 3: View bill detail with items
curl -X GET http://localhost:3000/api/bills/BIL00002/detail \
  -H "Authorization: Bearer $RECEP_TOKEN"

# Step 4: Confirm payment
curl -X PATCH http://localhost:3000/api/bills/BIL00002/pay \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "CARD"}'

# Step 5: Patient views their own bill
curl -X GET http://localhost:3000/api/bills/patient/P00001 \
  -H "Authorization: Bearer $PATIENT_TOKEN"

# ============================================
# BILLS ERROR SCENARIO TESTS
# ============================================

# Test: Patient tries to create bill (should fail)
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"medical_record_id": "MR00003"}'
# Expected: 403 Forbidden "Only RECEPTIONIST can create bills"

# Test: Create bill for non-existent medical record (should fail)
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"medical_record_id": "MR99999"}'
# Expected: 400 Bad Request "Medical record not found"

# Test: Create bill for appointment not completed (should fail)
# (MR00003 has APT00006 which is SCHEDULED)
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"medical_record_id": "MR00003"}'
# Expected: 400 Bad Request "Cannot create bill: appointment not completed"

# Test: Create duplicate bill for same medical record (should fail)
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"medical_record_id": "MR00001"}'
# Expected: 400 Bad Request "Bill already exists for this medical record"

# Test: Add item to completed bill (should fail)
curl -X POST http://localhost:3000/api/bills/BIL00001/items \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service_id": "SVC00001", "quantity": 1}'
# Expected: 400 Bad Request "Cannot add items to completed bill"

# Test: Confirm payment on already paid bill (should fail)
curl -X PATCH http://localhost:3000/api/bills/BIL00001/pay \
  -H "Authorization: Bearer $RECEP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "CASH"}'
# Expected: 400 Bad Request "Bill already paid"

# Test: Patient tries to view another patient's bill (should fail)
curl -X GET http://localhost:3000/api/bills/patient/P00002 \
  -H "Authorization: Bearer $PATIENT_TOKEN"
# Expected: empty array (access denied)

# ============================================
# AUDIT LOGS (NFR Security)
# ============================================
# Base URL: http://localhost:3000/api/audit-logs
# Only ADMIN can view audit logs

# Get all audit logs
curl -X GET http://localhost:3000/api/audit-logs \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get audit logs with filters
curl -X GET "http://localhost:3000/api/audit-logs?user_id=1&table_name=Appointments&action_type=CREATE" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get audit logs by user
curl -X GET http://localhost:3000/api/audit-logs/user/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get audit logs by record
curl -X GET http://localhost:3000/api/audit-logs/record/Appointments/APT00001 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get audit logs by action type
curl -X GET http://localhost:3000/api/audit-logs/action/CREATE \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get audit logs by time range
curl -X GET "http://localhost:3000/api/audit-logs/range?from=2026-04-01&to=2026-04-30" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get audit log statistics
curl -X GET http://localhost:3000/api/audit-logs/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get audit log statistics by date range
curl -X GET "http://localhost:3000/api/audit-logs/stats?from_date=2026-04-01&to_date=2026-04-30" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get recent activity
curl -X GET http://localhost:3000/api/audit-logs/recent \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get recent activity with limit
curl -X GET "http://localhost:3000/api/audit-logs/recent?limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get valid action types
curl -X GET http://localhost:3000/api/audit-logs/valid-actions \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get valid table names
curl -X GET http://localhost:3000/api/audit-logs/valid-tables \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# ============================================
# AUDIT LOGS ERROR SCENARIO TESTS
# ============================================

# Test: Non-admin tries to view audit logs (should fail)
curl -X GET http://localhost:3000/api/audit-logs \
  -H "Authorization: Bearer $RECEP_TOKEN"
# Expected: 403 Forbidden

# Test: Patient tries to view audit logs (should fail)
curl -X GET http://localhost:3000/api/audit-logs \
  -H "Authorization: Bearer $PATIENT_TOKEN"
# Expected: 403 Forbidden

# Test: Doctor tries to view audit logs (should fail)
curl -X GET http://localhost:3000/api/audit-logs \
  -H "Authorization: Bearer $DOCTOR_TOKEN"
# Expected: 403 Forbidden

# ============================================
# SECURITY TESTS (NFR Security)
# ============================================

# Test: Access without token (should fail)
curl -X GET http://localhost:3000/api/appointments
# Expected: 401 Unauthorized "Access denied. No token provided."

# Test: Access with invalid token (should fail)
curl -X GET http://localhost:3000/api/appointments \
  -H "Authorization: Bearer invalid_token_here"
# Expected: 401 Unauthorized "Invalid or expired token."

# Test: Login logs audit trail
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
# Expected: Login successful, check audit logs for LOGIN entry

# Test: Password is hashed (profile response should not contain password_hash)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: Response should NOT contain password_hash field

# Test: Create user with password hashing
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "SecurePass123",
    "role": "PATIENT",
    "first_name": "New",
    "last_name": "User",
    "email": "newuser@clinic.com",
    "phone": "0909999999"
  }'
# Expected: Password should be hashed in database

# Test: Update password should rehash
curl -X PUT http://localhost:3000/api/profiles/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewSecurePass456"
  }'
# Expected: Password should be rehashed
