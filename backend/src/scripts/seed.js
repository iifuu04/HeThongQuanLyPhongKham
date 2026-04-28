/**
 * Seed Data Script
 * Run this to create test users in the database
 * Usage: node src/scripts/seed.js
 */

import db from '../config/db.js';
import bcrypt from 'bcrypt';

async function seed() {
    console.log('Starting database seed...');
    
    try {
        // Hash password for test users
        const passwordHash = await bcrypt.hash('123456', 10);
        
        // Delete in correct order to handle foreign key constraints
        await db.query(`DELETE FROM Audit_Logs`);
        await db.query(`DELETE FROM Bill_Items`);
        await db.query(`DELETE FROM Bills`);
        await db.query(`DELETE FROM Medical_Records`);
        await db.query(`DELETE FROM Appointments`);
        await db.query(`DELETE FROM Appointment_Request`);
        await db.query(`DELETE FROM Work_Schedules`);
        
        // Delete doctors first (they reference Profiles)
        await db.query(`DELETE FROM Doctors`);
        
        // Delete patients (they reference Profiles)
        await db.query(`DELETE FROM Patients`);
        
        // Delete profiles
        await db.query(`DELETE FROM Profiles WHERE username IN ('admin01', 'reception01', 'doctor01', 'patient01')`);
        
        console.log('Cleaned up existing data');
        
        // Insert sample specialties first (needed by Doctors)
        await db.query(`DELETE FROM Specialties`);
        await db.query(`
            INSERT INTO Specialties (name, establish_at, description, status) VALUES 
                ('Noi tong quat', '2016-01-01', 'Kham va theo doi benh ly noi khoa tong quat', 'ACTIVE'),
                ('Tai Mu Hong', '2017-05-12', 'Kham chuyen khoa tai mui hong', 'ACTIVE'),
                ('Nhi khoa', '2018-03-20', 'Kham va theo doi suc khoe tre em', 'ACTIVE')
        `);
        
        console.log('Specialties created');
        
        // Insert sample clinics
        await db.query(`DELETE FROM Clinics`);
        await db.query(`
            INSERT INTO Clinics (name, location, is_reserve) VALUES 
                ('Clinic 01', 'Tang 1 - Khu A', 0),
                ('Clinic 02', 'Tang 1 - Khu B', 0),
                ('Clinic 03', 'Tang 2 - Khu A', 1)
        `);
        
        console.log('Clinics created');
        
        // Create test admin user
        await db.query(`
            INSERT INTO Profiles (username, password_hash, role, first_name, last_name, email, phone, address, is_deleted)
            VALUES ('admin01', ?, 'ADMIN', 'Admin', 'User', 'admin01@medsys.vn', '0901000001', 'Admin Address', 0)
        `, [passwordHash]);
        
        console.log('Admin user created');
        
        // Create test receptionist
        await db.query(`
            INSERT INTO Profiles (username, password_hash, role, first_name, last_name, email, phone, address, is_deleted)
            VALUES ('reception01', ?, 'RECEPTIONIST', 'Chi', 'Le', 'reception01@medsys.vn', '0901000003', 'Reception Address', 0)
        `, [passwordHash]);
        
        console.log('Receptionist user created');
        
        // Create test doctor
        await db.query(`
            INSERT INTO Profiles (username, password_hash, role, first_name, last_name, email, phone, address, is_deleted)
            VALUES ('doctor01', ?, 'DOCTOR', 'Minh', 'Tran', 'doctor01@medsys.vn', '0910000001', 'Doctor Address', 0)
        `, [passwordHash]);
        
        console.log('Doctor user created');
        
        // Get doctor profile id and specialty id
        const [doctorProfile] = await db.query(`SELECT id FROM Profiles WHERE username = 'doctor01'`);
        const doctorProfileId = doctorProfile[0].id;
        
        const [specs] = await db.query(`SELECT id FROM Specialties LIMIT 1`);
        const specialtyId = specs[0].id;
        
        // Create doctor record
        await db.query(`
            INSERT INTO Doctors (id, profile_id, specialty_id)
            VALUES ('D00001', ?, ?)
        `, [doctorProfileId, specialtyId]);
        
        console.log('Doctor record created');
        
        // Create test patient
        await db.query(`
            INSERT INTO Profiles (username, password_hash, role, first_name, last_name, email, phone, address, is_deleted)
            VALUES ('patient01', ?, 'PATIENT', 'Mai', 'Nguyen', 'patient01@medsys.vn', '0920000001', 'Patient Address', 0)
        `, [passwordHash]);
        
        console.log('Patient user created');
        
        // Get patient profile id
        const [patientProfile] = await db.query(`SELECT id FROM Profiles WHERE username = 'patient01'`);
        const patientProfileId = patientProfile[0].id;
        
        // Create patient record
        await db.query(`
            INSERT INTO Patients (id, profile_id)
            VALUES ('P00001', ?)
        `, [patientProfileId]);
        
        console.log('Patient record created');
        
        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();
