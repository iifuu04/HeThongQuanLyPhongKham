# MedSys Demo Data Seed

## Tai Khoan Demo

| Role | Username | Password |
|------|----------|----------|
| ADMIN | admin01 | 123456 |
| RECEPTIONIST | reception01 | 123456 |
| DOCTOR | doctor01 | 123456 |
| DOCTOR | doctor02 | 123456 |
| PATIENT | patient01 | 123456 |
| PATIENT | patient02 | 123456 |

## Huong Dan Su Dung

### Cach 1: Import truc tiep bang MySQL CLI

```bash
cd HeThongQuanLyPhongKham/backend

# Login MySQL
mysql -u root -p

# Chay seed script
SOURCE src/database/seed_demo.sql;
```

### Cach 2: Import bang MySQL Command Line

```bash
cd HeThongQuanLyPhongKham/backend
mysql -u root -p MedSys < src/database/seed_demo.sql
```

### Cach 3: Import bang MySQL Workbench

1. Mo MySQL Workbench
2. Ket noi den database MedSys
3. Chon File > Run SQL Script
4. Chon file `src/database/seed_demo.sql`
5. Click Run

## Noi Dung Seed Data

### Profiles (6 tai khoan)
- 1 ADMIN: admin01
- 1 RECEPTIONIST: reception01
- 2 DOCTOR: doctor01, doctor02
- 2 PATIENT: patient01, patient02

### Specialties (6 chuyen khoa)
- Noi Tong Quat
- Tai Mui Hong
- Nhi Khoa
- Da Lieu
- Mat
- Xet Nghiem

### Clinics (4 phong kham)
- Tang 1 Khu A, Tang 1 Khu B
- Tang 2 Khu A, Tang 2 Khu B

### Shifts (4 ca lam viec)
- 07:00 - 09:30
- 09:30 - 12:00
- 13:00 - 15:30
- 15:30 - 18:00

### Services (8 dich vu)
- Kham Chuyen Khoa: 150,000 VND
- Noi Soi: 280,000 VND
- Tu Van: 120,000 VND
- Thuoc Ke Don: 180,000 VND
- Xet Nghiem Mau: 200,000 VND
- X-Quang: 350,000 VND
- Dien Tim: 250,000 VND
- Sieu Am: 300,000 VND

### Work Schedules
- doctor01: 2 ngay x 2 ca
- doctor02: 2 ngay x 2 ca

### Appointments (3 lich hen)
- 1 SCHEDULED (cho check-in)
- 1 WAITING (cho kham)
- 1 COMPLETED (da co medical record)

### Medical Records (1 ban ghi)
- Da hoan tat cho P00002

### Bills (1 hoa don)
- Chua thanh toan (PENDING)

### Luong Demo Hoan Chinh

1. Login ADMIN > Xem dashboard
2. Login RECEPTIONIST > Check-in patient > Check-in appointment
3. Login DOCTOR > Xem lich > Cap nhat trang thai INPROGRESS > Tao medical record > Finalize
4. Login RECEPTIONIST > Tao bill > Them dich vu > Xac nhan thanh toan
5. Login PATIENT > Xem lich hen > Xem medical record > Xem bill

## Tao Bcrypt Hash Cho Password

Neu can tao bcrypt hash moi:

```bash
cd HeThongQuanLyPhongKham/backend

# Chay script generate hash
node generate_hash.js
```

Script se xuat hash moi cho password '123456'.

## Xoa Du Lieu Demo

Neu can xoa du lieu demo:

```sql
DELETE FROM Audit_Logs;
DELETE FROM Bill_Items;
DELETE FROM Bills;
DELETE FROM Medical_Records;
DELETE FROM Appointment_Request;
DELETE FROM Appointments;
DELETE FROM Work_Schedules;
DELETE FROM Patients;
DELETE FROM Doctors;
DELETE FROM Profiles WHERE id > 50;
DELETE FROM Services WHERE id > 10;
```

## Chu Y

- Password hash cho '123456': `$2b$10$rQZ9Xj0F3vY3xH5J7zL8aO`
- ID Specialties bat dau tu 1
- ID Clinics bat dau tu 1
- ID Shifts bat dau tu 1
- Profile IDs: 1 (admin), 2 (reception), 7,8 (doctors), 31,32 (patients)
- Doctor IDs: D00001, D00002
- Patient IDs: P00001, P00002
