USE MedSys;


-- 1) Profiles (54 rows)
INSERT INTO Profiles (
	id, username, password_hash, role, first_name, last_name,
	date_of_birth, gender, email, phone, address,
	created_at, updated_at, is_deleted
) VALUES
	(1, 'admin01', '$2b$10$admindummyhash001', 'ADMIN', 'An', 'Nguyen', '1988-05-10', 'Male', 'admin01@medsys.vn', '0901000001', '1 Nguyen Trai, Q1, HCM', '2026-01-01 08:00:00', '2026-03-01 08:00:00', 0),
	(2, 'admin02', '$2b$10$admindummyhash002', 'ADMIN', 'Binh', 'Tran', '1986-09-11', 'Male', 'admin02@medsys.vn', '0901000002', '2 Le Loi, Q1, HCM', '2026-01-02 08:00:00', '2026-03-01 08:00:00', 0),
	(3, 'reception01', '$2b$10$recepdummyhash001', 'RECEPTIONIST', 'Chi', 'Le', '1994-03-12', 'Female', 'reception01@medsys.vn', '0901000003', '3 Hai Ba Trung, Q3, HCM', '2026-01-03 08:00:00', '2026-03-01 08:00:00', 0),
	(4, 'reception02', '$2b$10$recepdummyhash002', 'RECEPTIONIST', 'Dung', 'Pham', '1995-04-20', 'Female', 'reception02@medsys.vn', '0901000004', '4 Vo Van Tan, Q3, HCM', '2026-01-04 08:00:00', '2026-03-01 08:00:00', 0),
	(5, 'reception03', '$2b$10$recepdummyhash003', 'RECEPTIONIST', 'Huy', 'Vo', '1992-07-18', 'Male', 'reception03@medsys.vn', '0901000005', '5 Dien Bien Phu, Binh Thanh, HCM', '2026-01-05 08:00:00', '2026-03-01 08:00:00', 0),
	(6, 'admin03', '$2b$10$admindummyhash003', 'ADMIN', 'Khanh', 'Bui', '1984-11-01', 'Female', 'admin03@medsys.vn', '0901000006', '6 Phan Xich Long, Phu Nhuan, HCM', '2026-01-06 08:00:00', '2026-03-01 08:00:00', 0);

INSERT INTO Profiles (
	id, username, password_hash, role, first_name, last_name,
	date_of_birth, gender, email, phone, address,
	created_at, updated_at, is_deleted
)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	6 + n,
	CONCAT('doctor', LPAD(n, 2, '0')),
	CONCAT('$2b$10$doctordummyhash', LPAD(n, 3, '0')),
	'DOCTOR',
	CONCAT('DoctorFirst', LPAD(n, 2, '0')),
	CONCAT('DoctorLast', LPAD(n, 2, '0')),
	DATE_ADD('1978-01-01', INTERVAL n * 220 DAY),
	IF(MOD(n, 2) = 0, 'Female', 'Male'),
	CONCAT('doctor', LPAD(n, 2, '0'), '@medsys.vn'),
	CONCAT('091', LPAD(n, 8, '0')),
	CONCAT(n, ' Doctor Street, Ho Chi Minh'),
	DATE_ADD('2026-01-10 08:00:00', INTERVAL n DAY),
	DATE_ADD('2026-03-10 08:00:00', INTERVAL n DAY),
	0
FROM seq;

INSERT INTO Profiles (
	id, username, password_hash, role, first_name, last_name,
	date_of_birth, gender, email, phone, address,
	created_at, updated_at, is_deleted
)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	30 + n,
	CONCAT('patient', LPAD(n, 2, '0')),
	CONCAT('$2b$10$patientdummyhash', LPAD(n, 3, '0')),
	'PATIENT',
	CONCAT('PatientFirst', LPAD(n, 2, '0')),
	CONCAT('PatientLast', LPAD(n, 2, '0')),
	DATE_ADD('1990-01-01', INTERVAL n * 180 DAY),
	IF(MOD(n, 2) = 0, 'Male', 'Female'),
	CONCAT('patient', LPAD(n, 2, '0'), '@medsys.vn'),
	CONCAT('092', LPAD(n, 8, '0')),
	CONCAT(n, ' Patient Avenue, Ho Chi Minh'),
	DATE_ADD('2026-01-20 08:00:00', INTERVAL n DAY),
	DATE_ADD('2026-03-20 08:00:00', INTERVAL n DAY),
	0
FROM seq;

-- 2) Specialties (24 rows)
INSERT INTO Specialties (
	id, name, establish_at, description, updated_at, is_deleted, status
)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	n,
	CONCAT('Specialty ', LPAD(n, 2, '0')),
	DATE_ADD('2015-01-01', INTERVAL n * 30 DAY),
	CONCAT('Description for specialty ', LPAD(n, 2, '0')),
	DATE_ADD('2026-03-01 09:00:00', INTERVAL n HOUR),
	0,
	IF(MOD(n, 6) = 0, 'LOCKED', 'ACTIVE')
FROM seq;

-- 3) Clinics (24 rows)
INSERT INTO Clinics (id, location, name, is_reserve)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	n,
	CONCAT('Floor ', ((n - 1) DIV 4) + 1, ' - Zone ', CHAR(64 + ((n - 1) % 4) + 1)),
	CONCAT('Clinic ', LPAD(n, 2, '0')),
	IF(MOD(n, 5) = 0, 1, 0)
FROM seq;

-- 4) Shifts (24 rows)
INSERT INTO Shifts (
	id, start_time, end_time, max_patients, created_at, updated_at
)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	n,
	SEC_TO_TIME((6 * 3600) + (n - 1) * 1800),
	SEC_TO_TIME((10 * 3600) + (n - 1) * 1800),
	15 + MOD(n, 10),
	DATE_ADD('2026-01-01 07:00:00', INTERVAL n DAY),
	DATE_ADD('2026-03-01 07:00:00', INTERVAL n DAY)
FROM seq;

-- 5) Services (24 rows)
INSERT INTO Services (id, name, price)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	n,
	CONCAT('Service ', LPAD(n, 2, '0')),
	80000 + (n * 15000)
FROM seq;

-- 6) Doctors (24 rows)
INSERT INTO Doctors (id, profile_id, specialty_id)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	CONCAT('D', LPAD(n, 5, '0')),
	6 + n,
	n
FROM seq;

-- 7) Patients (24 rows)
INSERT INTO Patients (id, profile_id)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	CONCAT('P', LPAD(n, 5, '0')),
	30 + n
FROM seq;

-- 8) Work_Schedules (24 rows)
INSERT INTO Work_Schedules (
	id, doctor_id, clinic_id, shift_id, work_date, created_at, updated_at
)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	n,
	CONCAT('D', LPAD(n, 5, '0')),
	n,
	n,
	DATE_ADD('2026-04-01', INTERVAL (n - 1) DIV 3 DAY),
	DATE_ADD('2026-03-25 08:00:00', INTERVAL n HOUR),
	DATE_ADD('2026-03-25 09:00:00', INTERVAL n HOUR)
FROM seq;

-- 9) Appointments (24 rows)
INSERT INTO Appointments (
	id, patient_id, doctor_id, work_schedule_id, start_time, end_time,
	created_at, updated_at, status
)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	n,
	CONCAT('P', LPAD(n, 5, '0')),
	CONCAT('D', LPAD(n, 5, '0')),
	n,
	TIMESTAMP(
		DATE_ADD('2026-04-01', INTERVAL (n - 1) DIV 3 DAY),
		SEC_TO_TIME((6 * 3600) + (n - 1) * 1800)
	),
	TIMESTAMP(
		DATE_ADD('2026-04-01', INTERVAL (n - 1) DIV 3 DAY),
		SEC_TO_TIME((6 * 3600) + (n - 1) * 1800 + 1800)
	),
	DATE_ADD('2026-03-28 08:00:00', INTERVAL n HOUR),
	DATE_ADD('2026-03-28 09:00:00', INTERVAL n HOUR),
	CASE
		WHEN MOD(n, 4) = 0 THEN 'INPROGRESS'
		ELSE 'COMPLETED'
	END
FROM seq;

-- 10) Appointment_Request (24 rows)
INSERT INTO Appointment_Request (
	id, apointment_id, patient_id, doctor_id, specialty_id, shift_id,
	created_at, action, request_by, response_by, response_at, status
)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	n,
	n,
	CONCAT('P', LPAD(n, 5, '0')),
	CONCAT('D', LPAD(n, 5, '0')),
	n,
	n,
	DATE_ADD('2026-03-20', INTERVAL n DAY),
	IF(MOD(n, 2) = 0, 'RESCHEDULE', 'CANCEL'),
	30 + n,
	CASE
		WHEN MOD(n, 3) = 0 THEN NULL
		ELSE (MOD(n, 3) + 2)
	END,
	CASE
		WHEN MOD(n, 3) = 0 THEN NULL
		ELSE DATE_ADD('2026-03-25 10:00:00', INTERVAL n HOUR)
	END,
	CASE
		WHEN MOD(n, 3) = 0 THEN 'PENDING'
		WHEN MOD(n, 3) = 1 THEN 'APPROVED'
		ELSE 'REJECTED'
	END
FROM seq;

-- 11) Medical_Records (24 rows)
INSERT INTO Medical_Records (
	id, patient_id, doctor_id, appointment_id,
	note, symptoms, diagnosis, result, prescription,
	created_at, updated_at, status
)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	n,
	CONCAT('P', LPAD(n, 5, '0')),
	CONCAT('D', LPAD(n, 5, '0')),
	n,
	CONCAT('Clinical note for record ', LPAD(n, 2, '0')),
	CONCAT('Symptoms set ', LPAD(n, 2, '0')),
	CONCAT('Diagnosis set ', LPAD(n, 2, '0')),
	CONCAT('Result summary ', LPAD(n, 2, '0')),
	CONCAT('Prescription plan ', LPAD(n, 2, '0')),
	DATE_ADD('2026-04-01 10:00:00', INTERVAL n HOUR),
	DATE_ADD('2026-04-01 11:00:00', INTERVAL n HOUR),
	IF(MOD(n, 4) = 0, 'INCOMPLETE', 'COMPLETED')
FROM seq;

-- 12) Bills (24 rows)
INSERT INTO Bills (
	id, medical_record_id, total_amount, created_at, updated_at, updated_by, payment_method, status
)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	n,
	n,
	((MOD(n, 3) + 1) * (80000 + (n * 15000))),
	DATE_ADD('2026-04-02', INTERVAL n DAY),
	DATE_ADD('2026-04-02', INTERVAL n DAY),
	(MOD(n, 3) + 2),
	CASE
		WHEN MOD(n, 4) = 0 THEN NULL
		WHEN MOD(n, 3) = 0 THEN 'CASH'
		WHEN MOD(n, 3) = 1 THEN 'BANKING'
		ELSE 'VISA'
	END,
	IF(MOD(n, 4) = 0, 'PENDING', 'COMPLETED')
FROM seq;

-- 13) Bill_Items (24 rows)
INSERT INTO Bill_Items (
	id, bill_id, service_id, quantity, price
)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	n,
	n,
	n,
	MOD(n, 3) + 1,
	80000 + (n * 15000)
FROM seq;

-- 14) Audit_Logs (24 rows)
INSERT INTO Audit_Logs (
	id, user_id, action_type, table_name, record_id,
	old_data, new_data, description, ip_address, user_agent, created_at
)
WITH RECURSIVE seq AS (
	SELECT 1 AS n
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	n,
	MOD(n, 6) + 1,
	CASE MOD(n, 5)
		WHEN 0 THEN 'CREATE'
		WHEN 1 THEN 'UPDATE'
		WHEN 2 THEN 'DELETE'
		WHEN 3 THEN 'LOGIN'
		ELSE 'LOGOUT'
	END,
	CASE MOD(n, 6)
		WHEN 0 THEN 'Profiles'
		WHEN 1 THEN 'Appointments'
		WHEN 2 THEN 'Medical_Records'
		WHEN 3 THEN 'Bills'
		WHEN 4 THEN 'Appointment_Request'
		ELSE 'Work_Schedules'
	END,
	n,
	CONCAT('{"before":"value_', LPAD(n, 2, '0'), '"}'),
	CONCAT('{"after":"value_', LPAD(n, 2, '0'), '"}'),
	CONCAT('Audit event ', LPAD(n, 2, '0')),
	CONCAT('10.0.0.', n),
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
	DATE_ADD('2026-04-05 08:00:00', INTERVAL n HOUR)
FROM seq;
