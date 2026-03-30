CREATE DATABASE IF NOT EXISTS MedSys;
USE MedSys;


CREATE TABLE Profiles (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    username        VARCHAR(255)    UNIQUE,
    password_hash   VARCHAR(255),
    role            ENUM('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'),
    first_name      VARCHAR(255),
    last_name       VARCHAR(255),
    date_of_birth   DATE,
    gender          ENUM('Male', 'Female'),
    email           VARCHAR(255)    UNIQUE,
    phone           VARCHAR(11),
    address         VARCHAR(255),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Specialties (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(255),
    establish_at    DATE,
    description     TEXT,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN         DEFAULT FALSE,
    status          ENUM('ACTIVE', 'LOCKED')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Clinics (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    location        VARCHAR(255),
    name            VARCHAR(255),
    is_reserve      BOOLEAN         DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Shifts (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    start_time      TIME,
    end_time        TIME,
    max_patients    INT             CHECK (max_patients > 0),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Services (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(255),
    price           DECIMAL(15,2)   CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Doctors (
    id              VARCHAR(6)      PRIMARY KEY,
    profile_id      INT             UNIQUE,
    specialty_id    INT,

    CONSTRAINT fk_Doctors_profile_id      FOREIGN KEY (profile_id)    REFERENCES Profiles(id)       ON DELETE CASCADE,
    CONSTRAINT fk_Doctors_specialty_id    FOREIGN KEY (specialty_id)  REFERENCES Specialties(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Patients (
    id              VARCHAR(6)      PRIMARY KEY,
    profile_id      INT             UNIQUE,

    CONSTRAINT fk_Patients_profile_id     FOREIGN KEY (profile_id)    REFERENCES Profiles(id)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Work_Schedules (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    doctor_id       VARCHAR(6),
    clinic_id       INT,
    shift_id        INT,
    work_date       DATE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_WorkSchedules_doctor_shift_date UNIQUE (doctor_id, shift_id, work_date),

    CONSTRAINT fk_WorkSchedules_doctor_id   FOREIGN KEY (doctor_id) REFERENCES Doctors(id)        ON DELETE CASCADE,
    CONSTRAINT fk_WorkSchedules_clinic_id   FOREIGN KEY (clinic_id) REFERENCES Clinics(id)        ON DELETE SET NULL,
    CONSTRAINT fk_WorkSchedules_shift_id    FOREIGN KEY (shift_id)  REFERENCES Shifts(id)         ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Appointments (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    patient_id      VARCHAR(6),
    doctor_id       VARCHAR(6),
    work_schedule_id INT,
    start_time      DATETIME,
    end_time        DATETIME,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    status          ENUM('SCHEDULED', 'WAITING', 'INPROGRESS', 'CANCELLED', 'COMPLETED'),

    CONSTRAINT uq_Appointments_schedule_start   UNIQUE (work_schedule_id, start_time),

    CONSTRAINT fk_Appointments_patient_id       FOREIGN KEY (patient_id)        REFERENCES Patients(id)         ON DELETE SET NULL,
    CONSTRAINT fk_Appointments_doctor_id        FOREIGN KEY (doctor_id)         REFERENCES Doctors(id)          ON DELETE SET NULL,
    CONSTRAINT fk_Appointments_work_schedule_id FOREIGN KEY (work_schedule_id)  REFERENCES Work_Schedules(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Appointment_Request (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    apointment_id   INT,
    patient_id      VARCHAR(6),
    doctor_id       VARCHAR(6),
    specialty_id    INT,
    shift_id        INT,
    created_at      DATE,
    action          ENUM('RESCHEDULE', 'CANCEL'),
    request_by      INT,
    response_by     INT,
    response_at     DATETIME,
    status          ENUM('PENDING', 'REJECTED', 'APPROVED'),

    CONSTRAINT fk_AppointmentRequest_apointment_id  FOREIGN KEY (apointment_id) REFERENCES Appointments(id)     ON DELETE SET NULL,
    CONSTRAINT fk_AppointmentRequest_patient_id     FOREIGN KEY (patient_id)    REFERENCES Patients(id)         ON DELETE SET NULL,
    CONSTRAINT fk_AppointmentRequest_doctor_id      FOREIGN KEY (doctor_id)     REFERENCES Doctors(id)          ON DELETE SET NULL,
    CONSTRAINT fk_AppointmentRequest_specialty_id   FOREIGN KEY (specialty_id)  REFERENCES Specialties(id)      ON DELETE SET NULL,
    CONSTRAINT fk_AppointmentRequest_shift_id       FOREIGN KEY (shift_id)      REFERENCES Shifts(id)           ON DELETE SET NULL,
    CONSTRAINT fk_AppointmentRequest_request_by     FOREIGN KEY (request_by)    REFERENCES Profiles(id)         ON DELETE SET NULL,
    CONSTRAINT fk_AppointmentRequest_response_by    FOREIGN KEY (response_by)   REFERENCES Profiles(id)         ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Medical_Records (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    patient_id      VARCHAR(6),
    doctor_id       VARCHAR(6),
    appointment_id  INT UNIQUE,
    note            TEXT,
    symptoms        TEXT,
    diagnosis       TEXT,
    result          TEXT,
    prescription    TEXT,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    status          ENUM('INCOMPLETE', 'COMPLETED'),

    CONSTRAINT fk_MedicalRecords_patient_id     FOREIGN KEY (patient_id)        REFERENCES Patients(id),
    CONSTRAINT fk_MedicalRecords_doctor_id      FOREIGN KEY (doctor_id)         REFERENCES Doctors(id),
    CONSTRAINT fk_MedicalRecords_appointment_id FOREIGN KEY (appointment_id)    REFERENCES Appointments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Bills (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    medical_record_id INT UNIQUE,
    total_amount    DECIMAL(15,2)   CHECK (total_amount >= 0),
    created_at      DATE,
    updated_at      DATE,
    updated_by      INT,
    payment_method  ENUM('CASH', 'BANKING', 'VISA'),
    status          ENUM('PENDING', 'COMPLETED'),

    CONSTRAINT fk_Bills_medical_record_id   FOREIGN KEY (medical_record_id) REFERENCES Medical_Records(id),
    CONSTRAINT fk_Bills_updated_by          FOREIGN KEY (updated_by)        REFERENCES Profiles(id)             ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Bill_Items (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    bill_id         INT,
    service_id      INT,
    quantity        INT             CHECK (quantity > 0),
    price           DECIMAL(15,2)   CHECK (price > 0),

    CONSTRAINT fk_BillItems_bill_id     FOREIGN KEY (bill_id)       REFERENCES Bills(id),
    CONSTRAINT fk_BillItems_service_id  FOREIGN KEY (service_id)    REFERENCES Services(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Audit_Logs (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT,
    action_type     ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'),
    table_name      VARCHAR(255),
    record_id       INT,
    old_data        TEXT,
    new_data        TEXT,
    description     VARCHAR(255),
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      DATETIME,

    CONSTRAINT fk_AuditLogs_user_id     FOREIGN KEY (user_id) REFERENCES Profiles(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;