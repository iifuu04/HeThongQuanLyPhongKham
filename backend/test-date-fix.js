/**
 * Date Format Fix - CRUD Test Script
 * Tests all CRUD operations with proper date formats
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const results = [];

// Admin token for testing
let adminToken = null;

function log(test, status, message) {
  const icon = status === 'PASS' ? '✅' : 'FAIL' ? '❌' : '⚠️';
  results.push({ test, status, message });
  console.log(`${icon} [${status}] ${test}: ${message}`);
}

// Helper function for authenticated requests
async function api(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
  
  try {
    const res = await axios({
      url: `${BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      headers: { ...headers, ...options.headers },
      data: options.data
    });
    return { status: res.status, data: res.data };
  } catch (e) {
    if (e.response) {
      return { status: e.response.status, data: e.response.data };
    }
    throw e;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('🗓️ Date Format Fix - CRUD Test Suite');
  console.log('========================================\n');

  // Step 1: Login as admin
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin01',
      password: '123456'
    });
    if (res.data.success && res.data.data?.token) {
      adminToken = res.data.data.token;
      log('Admin Login', 'PASS', 'Authenticated successfully');
    }
  } catch (e) {
    log('Admin Login', 'FAIL', e.message);
    return;
  }

  // Test 1: Create Profile with ISO date format
  try {
    const isoDate = '1997-09-27T17:00:00.000Z';
    const { status, data } = await api('/api/profiles', {
      method: 'POST',
      data: {
        username: 'testuser_' + Date.now(),
        password: '123456',
        role: 'PATIENT',
        first_name: 'Test',
        last_name: 'User',
        date_of_birth: isoDate,
        gender: 'Male',
        email: 'test@example.com',
        phone: '0909000000'
      }
    });
    if (status === 201 && data.success) {
      log('Create Profile (ISO Date)', 'PASS', `Created with date_of_birth: ${data.data.date_of_birth}`);
    } else {
      log('Create Profile (ISO Date)', 'FAIL', `${status} - ${data.message}`);
    }
  } catch (e) {
    log('Create Profile (ISO Date)', 'FAIL', e.message);
  }

  // Test 2: Create Profile with YYYY-MM-DD date format
  try {
    const { status, data } = await api('/api/profiles', {
      method: 'POST',
      data: {
        username: 'testuser2_' + Date.now(),
        password: '123456',
        role: 'PATIENT',
        first_name: 'Test2',
        last_name: 'User2',
        date_of_birth: '1995-05-15',
        gender: 'Female',
        email: 'test2@example.com',
        phone: '0909000001'
      }
    });
    if (status === 201 && data.success) {
      log('Create Profile (YYYY-MM-DD)', 'PASS', `Created with date_of_birth: ${data.data.date_of_birth}`);
    } else {
      log('Create Profile (YYYY-MM-DD)', 'FAIL', `${status} - ${data.message}`);
    }
  } catch (e) {
    log('Create Profile (YYYY-MM-DD)', 'FAIL', e.message);
  }

  // Test 3: Update Profile with ISO date format
  try {
    // First get an existing profile
    const profileRes = await api('/api/profiles');
    const profiles = profileRes.data.data || [];
    const profileToUpdate = profiles.find(p => p.role === 'PATIENT');
    
    if (profileToUpdate) {
      const isoDate = '2000-01-01T00:00:00.000Z';
      const { status, data } = await api(`/api/profiles/${profileToUpdate.id}`, {
        method: 'PUT',
        data: {
          date_of_birth: isoDate
        }
      });
      if (status === 200 && data.success) {
        log('Update Profile (ISO Date)', 'PASS', `Updated date_of_birth to: ${data.data.date_of_birth}`);
      } else {
        log('Update Profile (ISO Date)', 'FAIL', `${status} - ${data.message}`);
      }
    } else {
      log('Update Profile (ISO Date)', 'FAIL', 'No PATIENT profile found to update');
    }
  } catch (e) {
    log('Update Profile (ISO Date)', 'FAIL', e.message);
  }

  // Test 4: Create Patient with ISO date format
  try {
    const isoDate = '1990-08-20T00:00:00.000Z';
    const { status, data } = await api('/api/patients', {
      method: 'POST',
      data: {
        first_name: 'Patient',
        last_name: 'Test',
        date_of_birth: isoDate,
        gender: 'Male',
        phone: '0919000001',
        email: 'patient_test@example.com'
      }
    });
    if (status === 201 && data.success) {
      log('Create Patient (ISO Date)', 'PASS', `Created with date_of_birth: ${data.data.date_of_birth}`);
    } else {
      log('Create Patient (ISO Date)', 'FAIL', `${status} - ${data.message}`);
    }
  } catch (e) {
    log('Create Patient (ISO Date)', 'FAIL', e.message);
  }

  // Test 5: Update Patient with ISO date format
  try {
    // First get an existing patient
    const patientRes = await api('/api/patients');
    const patients = patientRes.data.data || [];
    const patientToUpdate = patients.find(p => p.id);
    
    if (patientToUpdate) {
      const isoDate = '1988-12-31T00:00:00.000Z';
      const { status, data } = await api(`/api/patients/${patientToUpdate.id}`, {
        method: 'PUT',
        data: {
          date_of_birth: isoDate
        }
      });
      if (status === 200 && data.success) {
        log('Update Patient (ISO Date)', 'PASS', `Updated date_of_birth to: ${data.data.date_of_birth}`);
      } else {
        log('Update Patient (ISO Date)', 'FAIL', `${status} - ${data.message}`);
      }
    } else {
      log('Update Patient (ISO Date)', 'FAIL', 'No patient found to update');
    }
  } catch (e) {
    log('Update Patient (ISO Date)', 'FAIL', e.message);
  }

  // Test 6: Create Work Schedule with ISO date format
  try {
    // Get first doctor
    const doctorRes = await api('/api/doctors');
    const doctors = doctorRes.data.data || [];
    const doctor = doctors[0];
    
    // Get first clinic
    const clinicRes = await api('/api/clinics');
    const clinics = clinicRes.data.data || [];
    const clinic = clinics[0];
    
    // Get first shift
    const shiftRes = await api('/api/shifts');
    const shifts = shiftRes.data.data || [];
    const shift = shifts[0];
    
    if (doctor && clinic && shift) {
      // Use future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const isoDate = futureDate.toISOString();
      
      const { status, data } = await api('/api/work-schedules', {
        method: 'POST',
        data: {
          doctor_id: doctor.id,
          clinic_id: clinic.id,
          shift_id: shift.id,
          work_date: isoDate
        }
      });
      if (status === 201 && data.success) {
        log('Create Work Schedule (ISO Date)', 'PASS', `Created with work_date: ${data.data.work_date}`);
      } else {
        log('Create Work Schedule (ISO Date)', 'FAIL', `${status} - ${data.message}`);
      }
    } else {
      log('Create Work Schedule (ISO Date)', 'FAIL', 'Missing doctor/clinic/shift data');
    }
  } catch (e) {
    log('Create Work Schedule (ISO Date)', 'FAIL', e.message);
  }

  // Test 7: Create Work Schedule with YYYY-MM-DD date format
  try {
    const doctorRes = await api('/api/doctors');
    const doctors = doctorRes.data.data || [];
    const doctor = doctors[0];
    
    const clinicRes = await api('/api/clinics');
    const clinics = clinicRes.data.data || [];
    const clinic = clinics[0];
    
    const shiftRes = await api('/api/shifts');
    const shifts = shiftRes.data.data || [];
    const shift = shifts[0];
    
    if (doctor && clinic && shift) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 8);
      const workDate = futureDate.toISOString().split('T')[0];
      
      const { status, data } = await api('/api/work-schedules', {
        method: 'POST',
        data: {
          doctor_id: doctor.id,
          clinic_id: clinic.id,
          shift_id: shift.id,
          work_date: workDate
        }
      });
      if (status === 201 && data.success) {
        log('Create Work Schedule (YYYY-MM-DD)', 'PASS', `Created with work_date: ${data.data.work_date}`);
      } else {
        log('Create Work Schedule (YYYY-MM-DD)', 'FAIL', `${status} - ${data.message}`);
      }
    } else {
      log('Create Work Schedule (YYYY-MM-DD)', 'FAIL', 'Missing doctor/clinic/shift data');
    }
  } catch (e) {
    log('Create Work Schedule (YYYY-MM-DD)', 'FAIL', e.message);
  }

  // Test 8: Create Appointment with datetime-local format
  try {
    const scheduleRes = await api('/api/work-schedules');
    const schedules = scheduleRes.data.data || [];
    const schedule = schedules.find(s => s.doctor_id);
    
    const patientRes = await api('/api/patients');
    const patients = patientRes.data.data || [];
    const patient = patients[0];
    
    if (schedule && patient) {
      const workDate = schedule.work_date;
      const startTime = `${workDate} 10:00:00`;
      const endTime = `${workDate} 10:30:00`;
      
      const { status, data } = await api('/api/appointments', {
        method: 'POST',
        data: {
          patient_id: patient.id,
          doctor_id: schedule.doctor_id,
          work_schedule_id: schedule.id,
          start_time: startTime,
          end_time: endTime
        }
      });
      if (status === 201 && data.success) {
        log('Create Appointment', 'PASS', `Created appointment successfully`);
      } else {
        log('Create Appointment', 'FAIL', `${status} - ${data.message}`);
      }
    } else {
      log('Create Appointment', 'FAIL', 'Missing schedule/patient data');
    }
  } catch (e) {
    log('Create Appointment', 'FAIL', e.message);
  }

  // Print summary
  console.log('\n========================================');
  console.log('📊 Test Summary');
  console.log('========================================');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  console.log(`Total: ${results.length} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('========================================');
  
  // List failures
  const failures = results.filter(r => r.status === 'FAIL');
  if (failures.length > 0) {
    console.log('\n❌ Failed Tests:');
    failures.forEach(f => console.log(`  - ${f.test}: ${f.message}`));
  }
  
  console.log('\n');
}

runTests().catch(console.error);
