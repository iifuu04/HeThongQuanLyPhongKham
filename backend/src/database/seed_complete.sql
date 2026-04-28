-- ============================================================
-- MedSys Comprehensive Seed Data
-- Database: MedSys
-- Password cho tất cả accounts: 123456
-- Bcrypt hash: $2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe
-- Chạy file này để thêm dữ liệu mẫu vào database
-- ============================================================

USE MedSys;

-- ============================================================
-- BƯỚC 1: Xóa dữ liệu cũ TRƯỚC KHI thêm mới
-- Quan trọng: Phải xóa theo thứ tự ngược khóa ngoại
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM Audit_Logs;
DELETE FROM Bill_Items;
DELETE FROM Bills;
DELETE FROM Medical_Records;
DELETE FROM Appointment_Request;
DELETE FROM Appointments;
DELETE FROM Work_Schedules;
DELETE FROM Patients;
DELETE FROM Doctors;
DELETE FROM Profiles;
DELETE FROM Services;
DELETE FROM Shifts;
DELETE FROM Clinics;
DELETE FROM Specialties;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- BƯỚC 2: Chuyên khoa (Specialties) - 6 dòng
-- ============================================================
INSERT INTO Specialties (id, name, establish_at, description, updated_at, is_deleted, status) VALUES
(1, 'Noi Tong Quat', '2015-01-15', 'Kham va theo doi cac benh ly noi khoa tong quat', NOW(), 0, 'ACTIVE'),
(2, 'Tai Muoi Hong', '2016-03-20', 'Kham va dieu tri cac benh ve tai mui hong', NOW(), 0, 'ACTIVE'),
(3, 'Nhi Khoa', '2017-05-10', 'Kham va cham soc suc khoe tre em', NOW(), 0, 'ACTIVE'),
(4, 'Da Lieu', '2018-07-15', 'Kham va tu van dieu tri benh da', NOW(), 0, 'ACTIVE'),
(5, 'Mat', '2019-02-28', 'Kham va dieu tri cac benh ve mat', NOW(), 0, 'ACTIVE'),
(6, 'Xet Nghiem', '2020-01-10', 'Cac xet nghiem can lam sang', NOW(), 0, 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- BƯỚC 3: Phòng khám (Clinics) - 6 phòng
-- ============================================================
INSERT INTO Clinics (id, location, name, is_reserve) VALUES
(1, 'Tang 1 - Khu A', 'Phong Kham 01', 0),
(2, 'Tang 1 - Khu B', 'Phong Kham 02', 0),
(3, 'Tang 2 - Khu A', 'Phong Kham 03', 0),
(4, 'Tang 2 - Khu B', 'Phong Kham 04', 1),
(5, 'Tang 3 - Khu A', 'Phong Kham 05', 0),
(6, 'Tang 3 - Khu B', 'Phong Kham 06', 0)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- BƯỚC 4: Ca làm việc (Shifts) - 6 ca
-- ============================================================
INSERT INTO Shifts (id, start_time, end_time, max_patients, created_at, updated_at) VALUES
(1, '07:00:00', '09:30:00', 16, NOW(), NOW()),
(2, '09:30:00', '12:00:00', 14, NOW(), NOW()),
(3, '13:00:00', '15:30:00', 14, NOW(), NOW()),
(4, '15:30:00', '18:00:00', 12, NOW(), NOW()),
(5, '18:00:00', '20:00:00', 10, NOW(), NOW()),
(6, '20:00:00', '22:00:00', 8, NOW(), NOW())
ON DUPLICATE KEY UPDATE start_time = VALUES(start_time);

-- ============================================================
-- BƯỚC 5: Dịch vụ (Services) - 10 dịch vụ
-- ============================================================
INSERT INTO Services (id, name, price) VALUES
(1, 'Kham Chuyen Khoa', 150000.00),
(2, 'Noi Soi Tai Muoi Hong', 280000.00),
(3, 'Tu Van Dieu Tri', 120000.00),
(4, 'Thuoc Ke Don', 180000.00),
(5, 'Xet Nghiem Mau', 200000.00),
(6, 'Chup X-Quang', 350000.00),
(7, 'Dien Tim (ECG)', 250000.00),
(8, 'Sieu Am (SA)', 300000.00),
(9, 'Tiem Phong', 150000.00),
(10, 'Boi Thuoc Da', 200000.00)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- BƯỚC 6: Người dùng (Profiles) - 16 tài khoản
-- ============================================================
-- ADMIN accounts
INSERT INTO Profiles (id, username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address, created_at, updated_at, is_deleted) VALUES
(1, 'admin01', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'ADMIN', 'An', 'Nguyen', '1988-05-10', 'Male', 'admin01@medsys.vn', '0901000001', '1 Nguyen Trai, Q1, Ho Chi Minh', NOW(), NOW(), 0),
(2, 'admin02', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'ADMIN', 'Binh', 'Tran', '1990-08-15', 'Male', 'admin02@medsys.vn', '0901000002', '2 Le Loi, Q1, Ho Chi Minh', NOW(), NOW(), 0)
ON DUPLICATE KEY UPDATE username = VALUES(username);

-- RECEPTIONIST accounts
INSERT INTO Profiles (id, username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address, created_at, updated_at, is_deleted) VALUES
(3, 'reception01', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'RECEPTIONIST', 'Chi', 'Le', '1994-03-12', 'Female', 'reception01@medsys.vn', '0901000003', '3 Hai Ba Trung, Q3, Ho Chi Minh', NOW(), NOW(), 0),
(4, 'reception02', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'RECEPTIONIST', 'Dung', 'Pham', '1995-04-20', 'Female', 'reception02@medsys.vn', '0901000004', '4 Vo Van Tan, Q3, Ho Chi Minh', NOW(), NOW(), 0)
ON DUPLICATE KEY UPDATE username = VALUES(username);

-- DOCTOR accounts
INSERT INTO Profiles (id, username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address, created_at, updated_at, is_deleted) VALUES
(5, 'doctor01', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'DOCTOR', 'Minh', 'Tran', '1985-07-25', 'Male', 'doctor01@medsys.vn', '0910000001', '10 Le Duan, Q1, Ho Chi Minh', NOW(), NOW(), 0),
(6, 'doctor02', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'DOCTOR', 'Ha', 'Pham', '1987-11-03', 'Female', 'doctor02@medsys.vn', '0910000002', '20 Dien Bien Phu, QBT, Ho Chi Minh', NOW(), NOW(), 0),
(7, 'doctor03', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'DOCTOR', 'Linh', 'Vu', '1988-03-15', 'Female', 'doctor03@medsys.vn', '0910000003', '30 Nguyen Hue, Q1, Ho Chi Minh', NOW(), NOW(), 0),
(8, 'doctor04', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'DOCTOR', 'Khoa', 'Nguyen', '1986-09-20', 'Male', 'doctor04@medsys.vn', '0910000004', '40 Pham Ngu Lao, Q1, Ho Chi Minh', NOW(), NOW(), 0)
ON DUPLICATE KEY UPDATE username = VALUES(username);

-- PATIENT accounts
INSERT INTO Profiles (id, username, password_hash, role, first_name, last_name, date_of_birth, gender, email, phone, address, created_at, updated_at, is_deleted) VALUES
(9, 'patient01', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'PATIENT', 'Mai', 'Nguyen', '2004-10-21', 'Female', 'patient01@medsys.vn', '0920000001', 'Quan 7, Ho Chi Minh', NOW(), NOW(), 0),
(10, 'patient02', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'PATIENT', 'Binh', 'Tran', '1999-03-14', 'Male', 'patient02@medsys.vn', '0920000002', 'Thu Duc, Ho Chi Minh', NOW(), NOW(), 0),
(11, 'patient03', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'PATIENT', 'Lan', 'Phan', '2001-06-30', 'Female', 'patient03@medsys.vn', '0920000003', 'Go Vap, Ho Chi Minh', NOW(), NOW(), 0),
(12, 'patient04', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'PATIENT', 'Hung', 'Le', '1995-12-25', 'Male', 'patient04@medsys.vn', '0920000004', 'Tan Binh, Ho Chi Minh', NOW(), NOW(), 0),
(13, 'patient05', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'PATIENT', 'Thao', 'Tran', '2003-08-18', 'Female', 'patient05@medsys.vn', '0920000005', 'Binh Thanh, Ho Chi Minh', NOW(), NOW(), 0),
(14, 'patient06', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'PATIENT', 'Nam', 'Hoang', '1988-01-05', 'Male', 'patient06@medsys.vn', '0920000006', 'Q2, Ho Chi Minh', NOW(), NOW(), 0),
(15, 'patient07', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'PATIENT', 'Hoa', 'Nguyen', '2000-04-12', 'Female', 'patient07@medsys.vn', '0920000007', 'Phu Nhuan, Ho Chi Minh', NOW(), NOW(), 0),
(16, 'patient08', '$2b$10$eMePmTdBV.itp5voCXGzTujaEBh1JSvDRtqtYyEnclIrtCO4poqGe', 'PATIENT', 'Viet', 'Pham', '1997-09-28', 'Male', 'patient08@medsys.vn', '0920000008', 'Q8, Ho Chi Minh', NOW(), NOW(), 0)
ON DUPLICATE KEY UPDATE username = VALUES(username);

-- ============================================================
-- BƯỚC 7: Bác sĩ (Doctors) - 4 bác sĩ
-- ============================================================
INSERT INTO Doctors (id, profile_id, specialty_id) VALUES
('D00001', 5, 2),
('D00002', 6, 1),
('D00003', 7, 3),
('D00004', 8, 4)
ON DUPLICATE KEY UPDATE specialty_id = VALUES(specialty_id);

-- ============================================================
-- BƯỚC 8: Bệnh nhân (Patients) - 8 bệnh nhân
-- ============================================================
INSERT INTO Patients (id, profile_id) VALUES
('P00001', 9),
('P00002', 10),
('P00003', 11),
('P00004', 12),
('P00005', 13),
('P00006', 14),
('P00007', 15),
('P00008', 16)
ON DUPLICATE KEY UPDATE profile_id = VALUES(profile_id);

-- ============================================================
-- BƯỚC 9: Lịch làm việc (Work Schedules) - 12 lịch
-- ============================================================
INSERT INTO Work_Schedules (id, doctor_id, clinic_id, shift_id, work_date, created_at, updated_at) VALUES
(1, 'D00001', 1, 1, CURDATE(), NOW(), NOW()),
(2, 'D00001', 1, 2, CURDATE(), NOW(), NOW()),
(3, 'D00002', 2, 1, CURDATE(), NOW(), NOW()),
(4, 'D00002', 2, 2, CURDATE(), NOW(), NOW()),
(5, 'D00003', 3, 3, CURDATE(), NOW(), NOW()),
(6, 'D00003', 3, 4, CURDATE(), NOW(), NOW()),
(7, 'D00004', 4, 3, CURDATE(), NOW(), NOW()),
(8, 'D00004', 4, 4, CURDATE(), NOW(), NOW()),
(9, 'D00001', 1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), NOW(), NOW()),
(10, 'D00002', 2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), NOW(), NOW()),
(11, 'D00003', 3, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), NOW(), NOW()),
(12, 'D00004', 4, 3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), NOW(), NOW())
ON DUPLICATE KEY UPDATE work_date = VALUES(work_date);

-- ============================================================
-- BƯỚC 10: Lịch hẹn (Appointments) - 10 lịch hẹn
-- ============================================================
INSERT INTO Appointments (id, patient_id, doctor_id, work_schedule_id, start_time, end_time, created_at, updated_at, status) VALUES
(1, 'P00001', 'D00001', 1, CONCAT(CURDATE(), ' 07:30:00'), CONCAT(CURDATE(), ' 08:00:00'), NOW(), NOW(), 'COMPLETED'),
(2, 'P00002', 'D00002', 3, CONCAT(CURDATE(), ' 08:00:00'), CONCAT(CURDATE(), ' 08:30:00'), NOW(), NOW(), 'COMPLETED'),
(3, 'P00003', 'D00003', 5, CONCAT(CURDATE(), ' 13:30:00'), CONCAT(CURDATE(), ' 14:00:00'), NOW(), NOW(), 'WAITING'),
(4, 'P00004', 'D00004', 7, CONCAT(CURDATE(), ' 14:00:00'), CONCAT(CURDATE(), ' 14:30:00'), NOW(), NOW(), 'SCHEDULED'),
(5, 'P00005', 'D00001', 2, CONCAT(CURDATE(), ' 10:00:00'), CONCAT(CURDATE(), ' 10:30:00'), NOW(), NOW(), 'INPROGRESS'),
(6, 'P00006', 'D00002', 4, CONCAT(CURDATE(), ' 10:30:00'), CONCAT(CURDATE(), ' 11:00:00'), NOW(), NOW(), 'SCHEDULED'),
(7, 'P00007', 'D00003', 6, CONCAT(CURDATE(), ' 16:00:00'), CONCAT(CURDATE(), ' 16:30:00'), NOW(), NOW(), 'CANCELLED'),
(8, 'P00008', 'D00004', 8, CONCAT(CURDATE(), ' 16:30:00'), CONCAT(CURDATE(), ' 17:00:00'), NOW(), NOW(), 'SCHEDULED'),
(9, 'P00001', 'D00001', 9, CONCAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), ' 07:00:00'), CONCAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), ' 07:30:00'), NOW(), NOW(), 'SCHEDULED'),
(10, 'P00002', 'D00002', 10, CONCAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), ' 13:00:00'), CONCAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), ' 13:30:00'), NOW(), NOW(), 'SCHEDULED')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================================
-- BƯỚC 11: Yêu cầu hẹn khám (Appointment Requests) - 6 yêu cầu
-- ============================================================
INSERT INTO Appointment_Request (id, apointment_id, patient_id, doctor_id, specialty_id, shift_id, created_at, action, request_by, response_by, response_at, status) VALUES
(1, 1, 'P00001', 'D00001', 2, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), 'CANCEL', 9, 5, DATE_SUB(NOW(), INTERVAL 3 DAY), 'APPROVED'),
(2, 2, 'P00002', 'D00002', 1, 1, DATE_SUB(NOW(), INTERVAL 4 DAY), 'RESCHEDULE', 10, 6, DATE_SUB(NOW(), INTERVAL 2 DAY), 'APPROVED'),
(3, 3, 'P00003', 'D00003', 3, 3, DATE_SUB(NOW(), INTERVAL 3 DAY), 'CANCEL', 11, NULL, NULL, 'PENDING'),
(4, 4, 'P00004', 'D00004', 4, 3, DATE_SUB(NOW(), INTERVAL 2 DAY), 'RESCHEDULE', 12, 8, DATE_SUB(NOW(), INTERVAL 1 DAY), 'REJECTED'),
(5, 5, 'P00005', 'D00001', 2, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), 'CANCEL', 13, NULL, NULL, 'PENDING'),
(6, 6, 'P00006', 'D00002', 1, 2, NOW(), 'RESCHEDULE', 14, NULL, NULL, 'PENDING')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================================
-- BƯỚC 12: Hồ sơ bệnh án (Medical Records) - 5 hồ sơ
-- ============================================================
INSERT INTO Medical_Records (id, patient_id, doctor_id, appointment_id, note, symptoms, diagnosis, result, prescription, created_at, updated_at, status) VALUES
(1, 'P00001', 'D00001', 1, 'Theo doi tai nha', 'Dau hong keo dai 3 ngay', 'Viem hong cap', 'O dinh sau 3 ngay', 'Amoxillin 500mg, 3 lan/ngay sau an 5 ngay', NOW(), NOW(), 'COMPLETED'),
(2, 'P00002', 'D00002', 2, 'Kham dinh ky', 'Suc khoe tot, can kiem tra', 'Khong co van de gi', 'Khoe manh', 'Bo sung vitamin C', NOW(), NOW(), 'COMPLETED'),
(3, 'P00003', 'D00003', 3, 'Dang theo doi', 'Sot nhe 37.5oC, ho khan', 'Cam cum', 'Dang theo doi', 'Paracetamol 500mg, 3 lan/ngay', NOW(), NOW(), 'INCOMPLETE'),
(4, 'P00004', 'D00004', 4, 'Dieu tri benh da', 'Noi me day, nut do o co tay', 'Viêm da co dia', 'Can theo doi', 'Thuoc boi Diprosone, uong antihistamine', NOW(), NOW(), 'INCOMPLETE'),
(5, 'P00005', 'D00001', 5, 'Dang kham', 'Dau dau, met moi', 'Cum nhe', 'O dinh', 'Paracetamol, nghi ngoi nhieu nuoc', NOW(), NOW(), 'INCOMPLETE')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================================
-- BƯỚC 13: Hóa đơn (Bills) - 5 hóa đơn
-- ============================================================
INSERT INTO Bills (id, medical_record_id, total_amount, created_at, updated_at, updated_by, payment_method, status) VALUES
(1, 1, 450000.00, NOW(), NOW(), 3, 'CASH', 'COMPLETED'),
(2, 2, 270000.00, NOW(), NOW(), 3, 'BANKING', 'COMPLETED'),
(3, 3, 350000.00, NOW(), NOW(), 4, 'VISA', 'PENDING'),
(4, 4, 520000.00, NOW(), NOW(), 4, 'CASH', 'PENDING'),
(5, 5, 180000.00, NOW(), NOW(), 3, 'BANKING', 'PENDING')
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================================
-- BƯỚC 14: Chi tiết hóa đơn (Bill Items) - 10 mục
-- ============================================================
INSERT INTO Bill_Items (id, bill_id, service_id, quantity, price) VALUES
(1, 1, 1, 1, 150000.00),
(2, 1, 2, 1, 280000.00),
(3, 2, 1, 1, 150000.00),
(4, 2, 3, 1, 120000.00),
(5, 3, 1, 1, 150000.00),
(6, 3, 4, 1, 180000.00),
(7, 3, 5, 1, 200000.00),
(8, 4, 1, 1, 150000.00),
(9, 4, 10, 1, 200000.00),
(10, 4, 4, 1, 180000.00),
(11, 5, 1, 1, 150000.00),
(12, 5, 3, 1, 120000.00)
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- ============================================================
-- BƯỚC 15: Nhật ký hệ thống (Audit Logs) - 10 log
-- ============================================================
INSERT INTO Audit_Logs (id, user_id, action_type, table_name, record_id, old_data, new_data, description, ip_address, user_agent, created_at) VALUES
(1, 1, 'LOGIN', 'Profiles', 1, NULL, NULL, 'Dang nhap he thong', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 2, 'LOGIN', 'Profiles', 2, NULL, NULL, 'Dang nhap he thong', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 3, 'LOGIN', 'Profiles', 3, NULL, NULL, 'Dang nhap he thong', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 3, 'CREATE', 'Appointments', 3, NULL, '{"status":"WAITING"}', 'Tao lich hen moi', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 4, 'UPDATE', 'Appointments', 4, '{"status":"SCHEDULED"}', '{"status":"WAITING"}', 'Cap nhat trang thai lich hen', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(6, 5, 'CREATE', 'Medical_Records', 3, NULL, '{"diagnosis":"Cam cum"}', 'Tao ho so benh an', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(7, 3, 'CREATE', 'Bills', 3, NULL, '{"total":350000}', 'Tao hoa don moi', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(8, 6, 'LOGIN', 'Profiles', 6, NULL, NULL, 'Dang nhap he thong', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(9, 7, 'UPDATE', 'Appointments', 7, '{"status":"SCHEDULED"}', '{"status":"CANCELLED"}', 'Huy lich hen', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(10, 9, 'LOGIN', 'Profiles', 9, NULL, NULL, 'Benh nhan dang nhap', '127.0.0.1', 'Mozilla/5.0', DATE_SUB(NOW(), INTERVAL 30 MINUTE))
ON DUPLICATE KEY UPDATE action_type = VALUES(action_type);

-- ============================================================
-- BƯỚC 16: Reset auto_increment để ID tiếp theo sạch sẽ
-- ============================================================
ALTER TABLE Specialties AUTO_INCREMENT = 100;
ALTER TABLE Clinics AUTO_INCREMENT = 100;
ALTER TABLE Shifts AUTO_INCREMENT = 100;
ALTER TABLE Services AUTO_INCREMENT = 100;
ALTER TABLE Profiles AUTO_INCREMENT = 100;
ALTER TABLE Work_Schedules AUTO_INCREMENT = 100;
ALTER TABLE Appointments AUTO_INCREMENT = 100;
ALTER TABLE Appointment_Request AUTO_INCREMENT = 100;
ALTER TABLE Medical_Records AUTO_INCREMENT = 100;
ALTER TABLE Bills AUTO_INCREMENT = 100;
ALTER TABLE Bill_Items AUTO_INCREMENT = 100;
ALTER TABLE Audit_Logs AUTO_INCREMENT = 100;

-- ============================================================
-- HOAN TAT!
-- ============================================================
SELECT '========================================' AS '';
SELECT '  Seed data da duoc import thanh cong!' AS message;
SELECT '  Database: MedSys' AS info;
SELECT '  Password mac dinh: 123456' AS info;
SELECT '========================================' AS '';

-- ============================================================
-- XAC NHAN SO LUONG DU LIEU
-- ============================================================
SELECT 'Specialties:' AS table_name, COUNT(*) AS row_count FROM Specialties;
SELECT 'Clinics:' AS table_name, COUNT(*) AS row_count FROM Clinics;
SELECT 'Shifts:' AS table_name, COUNT(*) AS row_count FROM Shifts;
SELECT 'Services:' AS table_name, COUNT(*) AS row_count FROM Services;
SELECT 'Profiles:' AS table_name, COUNT(*) AS row_count FROM Profiles;
SELECT 'Doctors:' AS table_name, COUNT(*) AS row_count FROM Doctors;
SELECT 'Patients:' AS table_name, COUNT(*) AS row_count FROM Patients;
SELECT 'Work Schedules:' AS table_name, COUNT(*) AS row_count FROM Work_Schedules;
SELECT 'Appointments:' AS table_name, COUNT(*) AS row_count FROM Appointments;
SELECT 'Appointment Requests:' AS table_name, COUNT(*) AS row_count FROM Appointment_Request;
SELECT 'Medical Records:' AS table_name, COUNT(*) AS row_count FROM Medical_Records;
SELECT 'Bills:' AS table_name, COUNT(*) AS row_count FROM Bills;
SELECT 'Bill Items:' AS table_name, COUNT(*) AS row_count FROM Bill_Items;
SELECT 'Audit Logs:' AS table_name, COUNT(*) AS row_count FROM Audit_Logs;
