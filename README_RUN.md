# MedSys Clinic Management System - Quick Start Guide

## Muc Luc

1. [Yeu cau he thong](#1-yeu-cau-he-thong)
2. [Cai dat Node.js va MySQL](#2-cai-dat-nodejs-va-mysql)
3. [Cai dat Backend](#3-cai-dat-backend)
4. [Cai dat Database](#4-cai-dat-database)
5. [Cai dat Frontend](#5-cai-dat-frontend)
6. [Tai khoan Demo](#6-tai-khoan-demo)
7. [Lenh Chay](#7-lenh-chay)
8. [Flow Demo Day Du](#8-flow-demo-day-du)
9. [Huong Dan Khac Phuc Loi](#9-huong-dan-khac-phuc-loi)

---

## 1. Yeu Cau He Thong

- Node.js 18+
- MySQL 8.0+
- npm hoac yarn
- Trinh duyet: Chrome, Firefox, Edge

---

## 2. Cai Dat NodeJS va MySQL

### 2.1 Cai Dat Node.js

**Windows:**
1. Tai Node.js tu https://nodejs.org/
2. Chon phien ban LTS (Recommended)
3. Chay file cai dat va lam theo huong dan
4. Kiem tra: `node --version`

**Linux (Ubuntu):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

### 2.2 Cai Dat MySQL

**Windows:**
1. Tai MySQL Installer tu https://dev.mysql.com/downloads/installer/
2. Chay va lam theo huong dan
3. Dat mat khau cho root (mac dinh: 123456)
4. Kiem tra: `mysql --version`

**Ubuntu:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**MacOS:**
```bash
brew install mysql
brew services start mysql
```

---

## 3. Cai Dat Backend

### 3.1 Di chuyen vao thu muc backend

```bash
cd HeThongQuanLyPhongKham/backend
```

### 3.2 Cai dat dependencies

```bash
npm install
```

### 3.3 Copy va cau hinh .env

```bash
# Copy .env.example thanh .env
copy .env.example .env    # Windows
# Hoac
cp .env.example .env     # Linux/Mac

# Chinh sua .env neu can
# DB_PASSWORD=123456 (mat khau MySQL cua ban)
```

### 3.4 Kiem tra cau hinh .env

```bash
# Noi dung .env can co:
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=MedSys
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1d
```

---

## 4. Cai Dat Database

### 4.1 Tao Database

```bash
# Login MySQL
mysql -u root -p
```

```sql
-- Tao database
CREATE DATABASE IF NOT EXISTS MedSys;
EXIT;
```

### 4.2 Import Schema

```bash
mysql -u root -p MedSys < src/database/MedSys.sql
```

### 4.3 Import Demo Data (Khuyen nghi)

```bash
# Chon mot trong hai:

# Cach 1: Dummy data (nhieu du lieu)
mysql -u root -p MedSys < src/database/dummy_data.sql

# Cach 2: Seed demo (du lieu nho, day du chuc nang)
mysql -u root -p MedSys < src/database/seed_demo.sql
```

### 4.4 Kiem tra database

```bash
mysql -u root -p MedSys -e "SHOW TABLES;"
```

Ket qua nen hien thi cac bang:
- Audit_Logs
- Bill_Items
- Bills
- Clinics
- Doctors
- Medical_Records
- Patients
- Profiles
- Services
- Shifts
- Specialties
- Work_Schedules
- Appointments
- Appointment_Request

---

## 5. Cai Dat Frontend

### 5.1 Di chuyen vao thu muc frontend

```bash
cd HeThongQuanLyPhongKham/frontend/frontend
```

### 5.2 Cai dat dependencies

```bash
npm install
```

### 5.3 Kiem tra .env

Dam bao file `.env` co noi dung:
```
VITE_API_URL=/api
```

---

## 6. Tai Khoan Demo

### 6.1 Neu dung dummy_data.sql

| Role | Username | Password |
|------|----------|----------|
| ADMIN | admin01 | 123456 |
| RECEPTIONIST | reception01 | 123456 |
| DOCTOR | doctor01 | 123456 |
| PATIENT | patient01 | 123456 |

### 6.2 Neu dung seed_demo.sql

| Role | Username | Password | ID |
|------|----------|----------|-----|
| ADMIN | admin01 | 123456 | 1 |
| RECEPTIONIST | reception01 | 123456 | 2 |
| DOCTOR | doctor01 | 123456 | 7 |
| DOCTOR | doctor02 | 123456 | 8 |
| PATIENT | patient01 | 123456 | 31 |
| PATIENT | patient02 | 123456 | 32 |

---

## 7. Lenh Chay

### 7.1 Chay Backend

Terminal 1:
```bash
cd HeThongQuanLyPhongKham/backend
npm run dev
```

Backend se chay tai: **http://localhost:3000**

Kiem tra:
- Health check: http://localhost:3000/health
- DB test: http://localhost:3000/api/test-db

### 7.2 Chay Frontend

Terminal 2:
```bash
cd HeThongQuanLyPhongKham/frontend/frontend
npm run dev
```

Frontend se chay tai: **http://localhost:5173**

### 7.3 Mo trinh duyet

Mo trinh duyet va truy cap: http://localhost:5173

Dang nhap voi tai khoan demo.

---

## 8. Flow Demo Day Du

### 8.1 Login va Dashboard (UC20)

1. Mo trinh duyet http://localhost:5173
2. Dang nhap voi `admin01` / `123456`
3. Xem dashboard tong quan he thong

### 8.2 Quan Ly Bệnh Nhân (UC1-UC4)

1. Vao menu "Benh nhan"
2. Xem danh sach benh nhan
3. Tim kiem benh nhan theo ten/SDT
4. Xem chi tiet ho so benh nhan

### 8.3 Quan Ly Bac Si (UC5)

1. Vao menu "Bac si"
2. Xem danh sach bac si
3. Xem chi tiet bac si (chuyen khoa, lich lam viec)

### 8.4 Quan Ly Chuyen Khoa (UC6)

1. Vao menu "Chuyen khoa"
2. Xem danh sach chuyen khoa
3. Xem trang thai (ACTIVE/LOCKED)

### 8.5 Quan Ly Phong Kham va Ca Kham

1. Vao menu "Phong kham" - Xem danh sach phong
2. Vao menu "Ca kham" - Xem danh sach ca lam viec

### 8.6 Thiet Lap Lich Lam Viec (UC7)

1. Vao menu "Lich lam viec"
2. Xem danh sach lich
3. Loc theo bac si, ngay, phong kham

### 8.7 Dat Lich Kham (UC8)

1. Vao menu "Lich hen"
2. Nhan "Tao lich hen"
3. Chon benh nhan, bac si, lich lam viec
4. Nhap ly do kham
5. Xac nhan dat lich

**Kiem tra chong trung:**
- Thu dat 2 lich cung mot khung gio -> bi tu choi

### 8.8 Tiep Nhan Benh Nhan (UC12)

1. Vao menu "Lich hen"
2. Tim lich hen co trang thai "Da dat lich"
3. Nhan "Check-in" de tiep nhan

### 8.9 Cap Nhat Trang Thai Kham (UC13)

1. Vao menu "Lich hen" voi quyen Bac si
2. Tim lich co trang thai "Cho kham"
3. Nhan "Bat dau kham" -> INPROGRESS
4. Nhan "Hoan tat" -> COMPLETED

### 8.10 Cap Nhat Ho So Benh An (UC14)

1. Vao menu "Benh an" voi quyen Bac si
2. Chon lich hen da hoan tat
3. Nhap: Trieu chung, Chan doan, Don thuoc
4. Nhan "Luu" va "Hoan tat benh an"

### 8.11 Xem Lich Su Kham (UC15)

1. Vao menu "Benh an"
2. Xem lich su kham cua benh nhan
3. Loc theo ngay, bac si

### 8.12 Tao Hoa Don (UC16)

1. Vao menu "Hoa don" voi quyen Le tan
2. Chon ho so benh an da hoan tat
3. Nhan "Tao hoa don"
4. Them dich vu: Kham chuyen khoa, Xet nghiem...
5. Xem tong tien tu dong tinh

### 8.13 Xac Nhan Thanh Toan (UC17)

1. Vao menu "Hoa don"
2. Tim hoa don PENDING
3. Chon phuong thuc: Tien mat / Chuyen khoan
4. Nhan "Xac nhan thanh toan"

**Kiem tra:**
- Thu xac nhan lan 2 -> bi tu choi "Bill da duoc thanh toan"

### 8.14 Duyet Yeu Cau (UC11)

1. Vao menu "Yeu cau lich hen" voi quyen Quan tri
2. Xem danh sach yeu cau PENDING
3. Duyet hoac tu choi yeu cau
4. Kiem tra trang thai lich hen tu dong cap nhat

### 8.15 RBAC - Phan Quyen

- **Le tan**: Khong the tao tai khoan, khong the xem audit logs
- **Bac si**: Khong the tao hoa don, chi xem lich cua minh
- **Benh nhan**: Chi xem lich hen va benh an cua minh

---

## 9. Huong Dan Khac Phuc Loi

### 9.1 Loi "Connection refused"

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Giai phap:**
1. Kiem tra MySQL dang chay: `sudo systemctl status mysql`
2. Khoi dong lai: `sudo systemctl restart mysql`

### 9.2 Loi "Access denied"

```
Error: ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'
```

**Giai phap:**
1. Kiem tra mat khau trong .env
2. Su dung: `mysql -u root -p` de kiem tra mat khau
3. Cap nhat DB_PASSWORD trong .env

### 9.3 Loi "Database 'MedSys' doesn't exist"

**Giai phap:**
```bash
mysql -u root -p
```
```sql
CREATE DATABASE IF NOT EXISTS MedSys;
EXIT;
```
Sau do import lai schema.

### 9.4 Loi CORS khi goi API tu Postman

Them header:
```
Origin: http://localhost:5173
```

### 9.5 Khong dang nhap duoc

1. Kiem tra backend dang chay: http://localhost:3000/health
2. Kiem tra token: Mo DevTools -> Application -> LocalStorage -> medsys_auth
3. Kiem tra mat khau: dam bao la `123456`

### 9.6 Frontend hien thi trang trang

1. Kiem tra Console co loi khong
2. Kiem tra Network tab co request nao that bai khong
3. Restart frontend: Ctrl+C -> npm run dev

---

## Cau Truc Du An

```
HeThongQuanLyPhongKham/
├── backend/
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── database/       # SQL scripts
│   │   │   ├── MedSys.sql      # Schema
│   │   │   ├── dummy_data.sql  # Nhieu du lieu
│   │   │   └── seed_demo.sql   # Du lieu demo nho
│   │   ├── docs/           # Tai lieu
│   │   ├── middlewares/     # Auth, RBAC, Error
│   │   ├── modules/         # Feature modules
│   │   │   ├── Profile/
│   │   │   ├── Patient/
│   │   │   ├── Doctor/
│   │   │   ├── ...
│   │   ├── routes/          # Auth routes
│   │   └── utils/           # Helpers
│   ├── .env                 # Cau hinh
│   ├── .env.example         # Mau cau hinh
│   └── package.json
│
├── frontend/
│   └── frontend/
│       ├── src/
│       │   ├── api/         # API client
│       │   ├── components/  # Components
│       │   ├── contexts/    # Auth, Clinic context
│       │   ├── layouts/     # Layouts
│       │   ├── pages/       # Pages
│       │   └── utils/       # Helpers
│       ├── .env             # VITE_API_URL=/api
│       └── package.json
│
└── README_RUN.md             # File nay
```

---

## Lien He Ho Tro

Neu gap loi hoac can ho tro, vui long kiem tra:
1. Backend logs trong terminal
2. Console errors trong trinh duyet
3. Network tab trong DevTools
4. Database connection

---

**Version:** 1.0.0
**Last Updated:** 2026-04-29
