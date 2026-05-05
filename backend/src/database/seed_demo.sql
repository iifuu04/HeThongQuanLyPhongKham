-- ============================================================
-- MedSys Demo Seed Data
-- Database: MedSys
-- Chạy: mysql -u root -p MedSys < src/database/seed_demo.sql
-- ============================================================

USE MedSys;

-- ============================================================
-- BƯỚC 1: Xóa dữ liệu cũ (theo thứ tự ngược khóa ngoại)
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
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
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- BƯỚC 2: Specialties (6 chuyên khoa) - AUTO_INCREMENT
-- ============================================================
INSERT INTO Specialties (name, establish_at, description, status) VALUES
('Noi Tong Quat', '2015-01-15', 'Kham va theo doi cac benh ly noi khoa tong quat', 'ACTIVE'),
('Tai Muoi Hong', '2016-03-20', 'Kham va dieu tri cac benh ve tai mui hong', 'ACTIVE'),
('Nhi Khoa', '2017-05-10', 'Kham va cham soc suc khoe tre em', 'ACTIVE'),
('Da Lieu', '2018-07-15', 'Kham va tu van dieu tri benh da', 'ACTIVE'),
('Mat', '2019-02-28', 'Kham va dieu tri cac benh ve mat', 'ACTIVE'),
('Xet Nghiem', '2020-01-10', 'Cac xet nghiem can lam sang loc', 'ACTIVE');

-- ============================================================
-- BƯỚC 3: Clinics (4 phòng khám) - AUTO_INCREMENT
-- ============================================================
INSERT INTO Clinics (location, name, is_reserve) VALUES
('Tang 1 - Khu A', 'Phong Kham 01', 0),
('Tang 1 - Khu B', 'Phong Kham 02', 0),
('Tang 2 - Khu A', 'Phong Kham 03', 0),
('Tang 2 - Khu B', 'Phong Kham 04', 1);

-- ============================================================
-- BƯỚC 4: Shifts (4 ca + 1 ca test max_patients=1) - AUTO_INCREMENT
-- Schema: id, start_time, end_time, max_patients, created_at, updated_at
-- ============================================================
INSERT INTO Shifts (start_time, end_time, max_patients) VALUES
('07:00:00', '09:30:00', 16),    -- Ca 1
('09:30:00', '12:00:00', 14),    -- Ca 2
('13:00:00', '15:30:00', 14),    -- Ca 3
('15:30:00', '18:00:00', 12),    -- Ca 4
('08:00:00', '09:00:00', 1);     -- Ca Test Max=1 (chi 1 benh nhan, dung test max_patients)

-- ============================================================
-- BƯỚC 5: Services (8 dịch vụ) - AUTO_INCREMENT
-- ============================================================
INSERT INTO Services (name, price) VALUES
('Kham Chuyen Khoa', 150000.00),
('Noi Soi Tai Muoi Hong', 280000.00),
('Tu Van Dieu Tri', 120000.00),
('Thuoc Ke Don', 180000.00),
('Xet Nghiem Mau', 200000.00),
('Chup X-Quang', 350000.00),
('Dien Tim (ECG)', 250000.00),
('Sieu Am (SA)', 300000.00);

-- ============================================================
-- BƯỚC 6: Profiles (6 tài khoản) - AUTO_INCREMENT
-- Password: 123456 | Bcrypt: $2b$10$bfDXlrPT.rPEAHOGIn82H.JwapIB9P3VQ0Z96rZepjtf1r.brSeZ6
-- ============================================================

-- ADMIN
INSERT INTO Profiles (username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address, is_deleted) VALUES
('admin01', '$2b$10$bfDXlrPT.rPEAHOGIn82H.JwapIB9P3VQ0Z96rZepjtf1r.brSeZ6', 'ADMIN', 'An', 'Nguyen', '1988-05-10', 'Male', 'admin01@medsys.vn', '0901000001', 'Q1, Ho Chi Minh', 0);

-- RECEPTIONIST
INSERT INTO Profiles (username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address, is_deleted) VALUES
('reception01', '$2b$10$bfDXlrPT.rPEAHOGIn82H.JwapIB9P3VQ0Z96rZepjtf1r.brSeZ6', 'RECEPTIONIST', 'Chi', 'Le', '1994-03-12', 'Female', 'reception01@medsys.vn', '0902000001', 'Q3, Ho Chi Minh', 0);

-- DOCTOR 1 (profile_id = 3)
INSERT INTO Profiles (username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address, is_deleted) VALUES
('doctor01', '$2b$10$bfDXlrPT.rPEAHOGIn82H.JwapIB9P3VQ0Z96rZepjtf1r.brSeZ6', 'DOCTOR', 'Minh', 'Tran', '1985-07-25', 'Male', 'doctor01@medsys.vn', '0903000001', 'Q1, Ho Chi Minh', 0);

-- DOCTOR 2 (profile_id = 4)
INSERT INTO Profiles (username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address, is_deleted) VALUES
('doctor02', '$2b$10$bfDXlrPT.rPEAHOGIn82H.JwapIB9P3VQ0Z96rZepjtf1r.brSeZ6', 'DOCTOR', 'Ha', 'Pham', '1987-11-03', 'Female', 'doctor02@medsys.vn', '0904000001', 'QBT, Ho Chi Minh', 0);

-- PATIENT 1 (profile_id = 5)
INSERT INTO Profiles (username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address, is_deleted) VALUES
('patient01', '$2b$10$bfDXlrPT.rPEAHOGIn82H.JwapIB9P3VQ0Z96rZepjtf1r.brSeZ6', 'PATIENT', 'Mai', 'Nguyen', '2004-10-21', 'Female', 'patient01@medsys.vn', '0905000001', 'Q7, Ho Chi Minh', 0);

-- PATIENT 2 (profile_id = 6)
INSERT INTO Profiles (username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address, is_deleted) VALUES
('patient02', '$2b$10$bfDXlrPT.rPEAHOGIn82H.JwapIB9P3VQ0Z96rZepjtf1r.brSeZ6', 'PATIENT', 'Binh', 'Tran', '1999-03-14', 'Male', 'patient02@medsys.vn', '0906000001', 'Thu Duc, Ho Chi Minh', 0);

-- ============================================================
-- BƯỚC 7: Doctors (2 bác sĩ) - VARCHAR(6) PRIMARY KEY
-- ============================================================
INSERT INTO Doctors (id, profile_id, specialty_id) VALUES
('D00001', 3, 1),  -- doctor01 -> Noi Tong Quat
('D00002', 4, 2);  -- doctor02 -> Tai Muoi Hong

-- ============================================================
-- BƯỚC 8: Patients (2 bệnh nhân) - VARCHAR(6) PRIMARY KEY
-- ============================================================
INSERT INTO Patients (id, profile_id) VALUES
('P00001', 5),  -- patient01
('P00002', 6);  -- patient02

-- ============================================================
-- BƯỚC 9: Work_Schedules - AUTO_INCREMENT
-- Dùng ngày cố định: 2026-05-10 để test conflict dễ dàng
-- ============================================================
INSERT INTO Work_Schedules (doctor_id, clinic_id, shift_id, work_date) VALUES
-- doctor01: Ca 1, Ca 2, Ca Test (2026-05-10)
('D00001', 1, 1, '2026-05-10'),  -- id=1: Ca 1, patient01 sẽ đặt slot 08:00
('D00001', 1, 2, '2026-05-10'),  -- id=2: Ca 2
('D00001', 1, 5, '2026-05-10'),  -- id=3: Ca Test Max=1, patient01 đã đặt, patient02 test fail
-- doctor01: Ca 3, Ca 4 (2026-05-11)
('D00001', 1, 3, '2026-05-11'),  -- id=4
('D00001', 1, 4, '2026-05-11'),  -- id=5
-- doctor02: Ca 1, Ca 2 (2026-05-10)
('D00002', 2, 1, '2026-05-10'),  -- id=6
('D00002', 2, 2, '2026-05-10');  -- id=7

-- ============================================================
-- BƯỚC 10: Appointments - AUTO_INCREMENT
-- Test all status + conflict cases
-- ============================================================
INSERT INTO Appointments (patient_id, doctor_id, work_schedule_id, start_time, end_time, status) VALUES
-- CASE A: patient01 đã đặt doctor01, work_schedule_id=1, start_time='2026-05-10 08:00:00'
-- => patient02 test đặt trùng sẽ FAIL
('P00001', 'D00001', 1, '2026-05-10 08:00:00', '2026-05-10 08:30:00', 'SCHEDULED'),
-- WAITING appointment
('P00001', 'D00001', 2, '2026-05-10 10:00:00', '2026-05-10 10:30:00', 'WAITING'),
-- INPROGRESS appointment (để doctor tạo medical record)
('P00001', 'D00002', 6, '2026-05-10 07:30:00', '2026-05-10 08:00:00', 'INPROGRESS'),
-- COMPLETED appointment (đã có medical record + bill)
('P00002', 'D00001', 4, '2026-05-11 13:00:00', '2026-05-11 13:30:00', 'COMPLETED'),
-- CANCELLED appointment (slot đã hủy, patient02 có thể đặt lại)
('P00001', 'D00001', 1, '2026-05-10 09:30:00', '2026-05-10 10:00:00', 'CANCELLED'),
-- CASE B: patient01 đã đặt work_schedule_id=3 (max_patients=1) đầy rồi
-- => patient02 test đặt work_schedule_id=3 sẽ FAIL (vì max_patients=1 đã đầy)
('P00001', 'D00001', 3, '2026-05-10 08:00:00', '2026-05-10 08:30:00', 'SCHEDULED');

-- ============================================================
-- BƯỚC 11: Appointment_Request - AUTO_INCREMENT
-- 1 PENDING, 1 APPROVED, 1 REJECTED
-- ============================================================
INSERT INTO Appointment_Request (apointment_id, patient_id, doctor_id, specialty_id, shift_id, created_at, action, request_by, response_by, response_at, status) VALUES
-- PENDING request
(1, 'P00001', 'D00001', 1, 1, CURDATE(), 'CANCEL', 5, NULL, NULL, 'PENDING'),
-- APPROVED request
(2, 'P00001', 'D00001', 1, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'RESCHEDULE', 5, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'APPROVED'),
-- REJECTED request
(3, 'P00001', 'D00002', 2, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'CANCEL', 5, 4, CURDATE(), 'REJECTED');

-- ============================================================
-- BƯỚC 12: Medical_Records - AUTO_INCREMENT
-- CASE D: appointment_id=4 đã có medical_record, tạo thêm sẽ FAIL
-- ============================================================
INSERT INTO Medical_Records (patient_id, doctor_id, appointment_id, note, symptoms, diagnosis, result, prescription, status) VALUES
-- COMPLETED record cho appointment 4 (P00002, D00001)
('P00002', 'D00001', 4, 'Theo doi sau kham', 'Dau dau, met moi', 'Cum nhe', 'O dinh', 'Paracetamol, nghi ngoi', 'COMPLETED'),
-- INCOMPLETE record cho appointment 3 (để doctor hoàn tất)
('P00001', 'D00002', 3, 'Dang kham', 'Trieu chung test', 'Chan doan test', NULL, NULL, 'INCOMPLETE');

-- ============================================================
-- BƯỚC 13: Bills - AUTO_INCREMENT
-- CASE E: medical_record_id=1 đã có bill, tạo thêm sẽ FAIL
-- CASE F: bill status=COMPLETED, confirm payment lại sẽ FAIL
-- ============================================================
INSERT INTO Bills (medical_record_id, total_amount, created_at, updated_at, updated_by, payment_method, status) VALUES
-- PENDING bill (chưa thanh toán)
(1, 430000.00, CURDATE(), CURDATE(), 2, 'CASH', 'PENDING'),
-- COMPLETED bill (đã thanh toán)
(2, 0.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(CURDATE(), INTERVAL 1 DAY), 2, 'BANKING', 'COMPLETED');

-- ============================================================
-- BƯỚC 14: Bill_Items - AUTO_INCREMENT
-- ============================================================
INSERT INTO Bill_Items (bill_id, service_id, quantity, price) VALUES
-- Bill 1 (PENDING): Kham Chuyen Khoa + Noi Soi
(1, 1, 1, 150000.00),
(1, 2, 1, 280000.00);

-- ============================================================
-- BƯỚC 15: Audit_Logs - AUTO_INCREMENT
-- Enum action_type: CREATE, UPDATE, DELETE, LOGIN, LOGOUT
-- Chi tiet thao tac ghi vao cot description
-- ============================================================
INSERT INTO Audit_Logs (user_id, action_type, table_name, record_id, old_data, new_data, description, ip_address, created_at) VALUES
(1, 'LOGIN', 'Profiles', 1, NULL, NULL, 'Admin dang nhap', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 'LOGIN', 'Profiles', 3, NULL, NULL, 'Doctor01 dang nhap', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(5, 'LOGIN', 'Profiles', 5, NULL, NULL, 'Patient01 dang nhap', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
(2, 'CREATE', 'Bills', 1, NULL, '{"status":"PENDING"}', 'Tao hoa don', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(2, 'UPDATE', 'Bills', 2, '{"status":"PENDING"}', '{"status":"COMPLETED"}', 'Xac nhan thanh toan CASH', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 5 MINUTE));

-- ============================================================
-- HOAN TAT!
-- ============================================================
SELECT '========================================' AS '';
SELECT '  Seed data da duoc import thanh cong!' AS message;
SELECT '  Database: MedSys' AS info;
SELECT '========================================' AS '';

-- Xac nhan so luong du lieu
SELECT 'Specialties' AS table_name, COUNT(*) AS cnt FROM Specialties
UNION ALL SELECT 'Clinics', COUNT(*) FROM Clinics
UNION ALL SELECT 'Shifts', COUNT(*) FROM Shifts
UNION ALL SELECT 'Services', COUNT(*) FROM Services
UNION ALL SELECT 'Profiles', COUNT(*) FROM Profiles
UNION ALL SELECT 'Doctors', COUNT(*) FROM Doctors
UNION ALL SELECT 'Patients', COUNT(*) FROM Patients
UNION ALL SELECT 'Work_Schedules', COUNT(*) FROM Work_Schedules
UNION ALL SELECT 'Appointments', COUNT(*) FROM Appointments
UNION ALL SELECT 'Medical_Records', COUNT(*) FROM Medical_Records
UNION ALL SELECT 'Bills', COUNT(*) FROM Bills
UNION ALL SELECT 'Bill_Items', COUNT(*) FROM Bill_Items
UNION ALL SELECT 'Appointment_Request', COUNT(*) FROM Appointment_Request
UNION ALL SELECT 'Audit_Logs', COUNT(*) FROM Audit_Logs;
