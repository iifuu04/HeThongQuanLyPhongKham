/**
 * MedSys API Test Suite
 * Tests all endpoints with real data from seed_complete.sql
 * 
 * Usage: node test-api.js
 * 
 * Required accounts (password: 123456):
 * - admin01 (ADMIN)
 * - reception01 (RECEPTIONIST)
 * - doctor01 (DOCTOR)
 * - patient01 (PATIENT)
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const results = [];
const tokens = {};

function log(test, status, message) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  results.push({ test, status, message });
  console.log(`${icon} [${status}] ${test}: ${message}`);
}

async function api(endpoint, options = {}, tokenKey = 'admin') {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokens[tokenKey];
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    const res = await axios({
      url: `${BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      headers,
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

async function login(username, tokenKey) {
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      username,
      password: '123456'
    });
    if (res.data.success && res.data.data?.token) {
      tokens[tokenKey] = res.data.data.token;
      return { success: true, role: res.data.data.user.role };
    }
    return { success: false, message: res.data.message };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('🚀 MedSys API Comprehensive Test Suite');
  console.log('========================================\n');

  // ===== PHASE 1: Health & Auth Tests =====
  console.log('📋 Phase 1: Health & Authentication\n');

  try {
    const res = await axios.get(`${BASE_URL}/health`);
    log('Health Check', res.data.success ? 'PASS' : 'FAIL', `Status: ${res.status}`);
  } catch (e) {
    log('Health Check', 'FAIL', e.message);
  }

  try {
    const res = await axios.get(`${BASE_URL}/api/test-db`);
    log('Database Connection', res.data.success ? 'PASS' : 'FAIL', res.data.message);
  } catch (e) {
    log('Database Connection', 'FAIL', e.message);
  }

  // Login tests
  const loginResults = await Promise.all([
    login('admin01', 'admin'),
    login('reception01', 'reception'),
    login('doctor01', 'doctor'),
    login('patient01', 'patient')
  ]);

  log('Admin Login', loginResults[0].success ? 'PASS' : 'FAIL', `Role: ${loginResults[0].role || 'N/A'}`);
  log('Receptionist Login', loginResults[1].success ? 'PASS' : 'FAIL', `Role: ${loginResults[1].role || 'N/A'}`);
  log('Doctor Login', loginResults[2].success ? 'PASS' : 'FAIL', `Role: ${loginResults[2].role || 'N/A'}`);
  log('Patient Login', loginResults[3].success ? 'PASS' : 'FAIL', `Role: ${loginResults[3].role || 'N/A'}`);

  // ===== PHASE 2: Unauthorized Access Tests =====
  console.log('\n📋 Phase 2: Authorization Tests\n');

  // Test: No token should return 401
  try {
    await axios.get(`${BASE_URL}/api/patients`);
    log('Unauthorized Access', 'FAIL', 'Expected 401, got success');
  } catch (e) {
    log('Unauthorized Access', e.response?.status === 401 ? 'PASS' : 'FAIL', `Got ${e.response?.status || 'error'}`);
  }

  // Test: Patient cannot access admin routes
  if (tokens.patient) {
    const { status } = await api('/api/profiles', {}, 'patient');
    log('Patient->Admin Route (403)', status === 403 ? 'PASS' : 'FAIL', `Expected 403, got ${status}`);
  }

  // Test: Patient cannot create patients
  if (tokens.patient) {
    const { status } = await api('/api/patients', { method: 'POST', data: {} }, 'patient');
    log('Patient->Create Patient (403)', status === 403 ? 'PASS' : 'FAIL', `Got ${status}`);
  }

  // Test: Doctor cannot access audit logs
  if (tokens.doctor) {
    const { status } = await api('/api/audit-logs', {}, 'doctor');
    log('Doctor->Audit Logs (403)', status === 403 ? 'PASS' : 'FAIL', `Got ${status}`);
  }

  // ===== PHASE 3: Admin Full Access Tests =====
  console.log('\n📋 Phase 3: Admin Full Access Tests\n');

  if (tokens.admin) {
    const endpoints = [
      '/api/profiles',
      '/api/patients',
      '/api/doctors',
      '/api/specialties',
      '/api/clinics',
      '/api/shifts',
      '/api/services',
      '/api/work-schedules',
      '/api/appointments',
      '/api/medical-records',
      '/api/bills',
      '/api/audit-logs'
    ];

    for (const ep of endpoints) {
      const { status, data } = await api(ep, {}, 'admin');
      const count = Array.isArray(data.data) ? data.data.length : 'N/A';
      log(`Admin->${ep} (200)`, status === 200 ? 'PASS' : 'FAIL', `Status: ${status}, Count: ${count}`);
    }
  }

  // ===== PHASE 4: Receptionist Access Tests =====
  console.log('\n📋 Phase 4: Receptionist Access Tests\n');

  if (tokens.reception) {
    // Can view
    const { status: s1 } = await api('/api/patients', {}, 'reception');
    log('Reception->Patients (200)', s1 === 200 ? 'PASS' : 'FAIL', `Status: ${s1}`);

    const { status: s2 } = await api('/api/appointments', {}, 'reception');
    log('Reception->Appointments (200)', s2 === 200 ? 'PASS' : 'FAIL', `Status: ${s2}`);

    const { status: s3 } = await api('/api/bills', {}, 'reception');
    log('Reception->Bills (200)', s3 === 200 ? 'PASS' : 'FAIL', `Status: ${s3}`);

    // Cannot view audit logs
    const { status: s4 } = await api('/api/audit-logs', {}, 'reception');
    log('Reception->Audit Logs (403)', s4 === 403 ? 'PASS' : 'FAIL', `Status: ${s4}`);

    // Cannot create doctors
    const { status: s5 } = await api('/api/doctors', { method: 'POST', data: {} }, 'reception');
    log('Reception->Create Doctor (403)', s5 === 403 ? 'PASS' : 'FAIL', `Status: ${s5}`);
  }

  // ===== PHASE 5: Doctor Access Tests =====
  console.log('\n📋 Phase 5: Doctor Access Tests\n');

  if (tokens.doctor) {
    // Can view
    const { status: s1 } = await api('/api/appointments', {}, 'doctor');
    log('Doctor->Appointments (200)', s1 === 200 ? 'PASS' : 'FAIL', `Status: ${s1}`);

    const { status: s2 } = await api('/api/medical-records', {}, 'doctor');
    log('Doctor->Medical Records (200)', s2 === 200 ? 'PASS' : 'FAIL', `Status: ${s2}`);

    const { status: s3 } = await api('/api/patients', {}, 'doctor');
    log('Doctor->Patients (200)', s3 === 200 ? 'PASS' : 'FAIL', `Status: ${s3}`);

    // Cannot create patients
    const { status: s4 } = await api('/api/patients', { method: 'POST', data: {} }, 'doctor');
    log('Doctor->Create Patient (403)', s4 === 403 ? 'PASS' : 'FAIL', `Status: ${s4}`);

    // Cannot create bills
    const { status: s5 } = await api('/api/bills', { method: 'POST', data: {} }, 'doctor');
    log('Doctor->Create Bill (403)', s5 === 403 ? 'PASS' : 'FAIL', `Status: ${s5}`);
  }

  // ===== PHASE 6: Patient Access Tests =====
  console.log('\n📋 Phase 6: Patient Access Tests\n');

  if (tokens.patient) {
    // Can view own data
    const { status: s1, data: d1 } = await api('/api/appointments', {}, 'patient');
    log('Patient->Appointments (200)', s1 === 200 ? 'PASS' : 'FAIL', `Status: ${s1}`);

    const { status: s2 } = await api('/api/medical-records', {}, 'patient');
    log('Patient->Medical Records (200)', s2 === 200 ? 'PASS' : 'FAIL', `Status: ${s2}`);

    const { status: s3 } = await api('/api/bills', {}, 'patient');
    log('Patient->Bills (200)', s3 === 200 ? 'PASS' : 'FAIL', `Status: ${s3}`);

    // Cannot create
    const { status: s4 } = await api('/api/patients', { method: 'POST', data: {} }, 'patient');
    log('Patient->Create Patient (403)', s4 === 403 ? 'PASS' : 'FAIL', `Status: ${s4}`);
  }

  // ===== PHASE 7: CRUD Operations Tests =====
  console.log('\n📋 Phase 7: CRUD Operations Tests\n');

  if (tokens.admin) {
    // Create specialty
    const { status: s1, data: d1 } = await api('/api/specialties', {
      method: 'POST',
      data: { name: 'Test Specialty ' + Date.now(), status: 'ACTIVE' }
    }, 'admin');
    log('Create Specialty', s1 === 201 ? 'PASS' : 'FAIL', `Status: ${s1}`);

    // Create service
    const { status: s2 } = await api('/api/services', {
      method: 'POST',
      data: { name: 'Test Service ' + Date.now(), price: 100000 }
    }, 'admin');
    log('Create Service', s2 === 201 ? 'PASS' : 'FAIL', `Status: ${s2}`);

    // Create clinic
    const { status: s3 } = await api('/api/clinics', {
      method: 'POST',
      data: { name: 'Test Clinic', location: 'Test Location', is_reserve: 0 }
    }, 'admin');
    log('Create Clinic', s3 === 201 ? 'PASS' : 'FAIL', `Status: ${s3}`);

    // Create shift
    const { status: s4 } = await api('/api/shifts', {
      method: 'POST',
      data: { name: 'Ca test', start_time: '18:00', end_time: '20:00', max_patients: 10 }
    }, 'admin');
    log('Create Shift', s4 === 201 ? 'PASS' : 'FAIL', `Status: ${s4}`);
  }

  // ===== PHASE 8: Appointment Flow Tests =====
  console.log('\n📋 Phase 8: Appointment Flow Tests\n');

  if (tokens.admin) {
    // Get work schedules
    const { data: schedData } = await api('/api/work-schedules', {}, 'admin');
    const schedules = schedData.data || [];
    
    if (schedules.length > 0) {
      const sched = schedules[0];
      const workDate = sched.work_date;
      const startTime = `${workDate} 08:00:00`;
      const endTime = `${workDate} 08:30:00`;

      // Create appointment
      const { status: apt1, data: aptData } = await api('/api/appointments', {
        method: 'POST',
        data: {
          patient_id: 'P00001',
          doctor_id: 'D00001',
          work_schedule_id: sched.id,
          start_time: startTime,
          end_time: endTime,
          reason: 'Test appointment'
        }
      }, 'admin');
      log('Create Appointment', apt1 === 201 ? 'PASS' : 'FAIL', `Status: ${apt1}`);
    }

    // Get appointments
    const { data: aptRes } = await api('/api/appointments', {}, 'admin');
    const appointments = aptRes.data || [];

    // Find SCHEDULED appointment
    const scheduled = appointments.find(a => a.status === 'SCHEDULED');
    if (scheduled) {
      // Check-in
      const { status: ci } = await api(`/api/appointments/${scheduled.id}/check-in`, {
        method: 'PATCH'
      }, 'admin');
      log('Check-in Appointment', ci === 200 ? 'PASS' : 'FAIL', `Status: ${ci}`);
    }

    // Find WAITING appointment
    const waiting = appointments.find(a => a.status === 'WAITING');
    if (waiting) {
      // Start examination
      const { status: start } = await api(`/api/appointments/${waiting.id}/start`, {
        method: 'PATCH'
      }, 'admin');
      log('Start Examination', start === 200 ? 'PASS' : 'FAIL', `Status: ${start}`);
    }

    // Find INPROGRESS appointment
    const inprogress = appointments.find(a => a.status === 'INPROGRESS');
    if (inprogress) {
      // Complete examination
      const { status: comp } = await api(`/api/appointments/${inprogress.id}/complete`, {
        method: 'PATCH'
      }, 'admin');
      log('Complete Examination', comp === 200 ? 'PASS' : 'FAIL', `Status: ${comp}`);
    }
  }

  // ===== PHASE 9: Medical Record Tests =====
  console.log('\n📋 Phase 9: Medical Record Tests\n');

  if (tokens.doctor) {
    // Get appointments for doctor
    const { data: aptRes } = await api('/api/appointments', {}, 'doctor');
    const appointments = aptRes.data || [];

    // Find WAITING or INPROGRESS appointment
    const examApt = appointments.find(a => a.status === 'WAITING' || a.status === 'INPROGRESS');
    if (examApt) {
      // Create medical record
      const { status: mr1 } = await api('/api/medical-records', {
        method: 'POST',
        data: {
          appointment_id: examApt.id,
          symptoms: 'Trieu chung test',
          diagnosis: 'Chan doan test',
          result: 'Ket qua test',
          prescription: 'Chi dinh test'
        }
      }, 'doctor');
      log('Create Medical Record', mr1 === 201 ? 'PASS' : 'FAIL', `Status: ${mr1}`);
    }
  }

  // ===== PHASE 10: Billing Tests =====
  console.log('\n📋 Phase 10: Billing Tests\n');

  if (tokens.reception) {
    // Get medical records with COMPLETED status
    const { data: mrRes } = await api('/api/medical-records', {}, 'reception');
    const records = mrRes.data || [];

    // Find COMPLETED record without bill
    const completedRecord = records.find(r => r.status === 'COMPLETED');
    if (completedRecord) {
      // Create bill
      const { status: bill1, data: billData } = await api('/api/bills', {
        method: 'POST',
        data: { medical_record_id: completedRecord.id }
      }, 'reception');
      log('Create Bill', bill1 === 201 ? 'PASS' : 'FAIL', `Status: ${bill1}`);

      if (bill1 === 201 && billData.data?.id) {
        const billId = billData.data.id;

        // Add bill item
        const { status: item1 } = await api(`/api/bills/${billId}/items`, {
          method: 'POST',
          data: { service_id: 1, quantity: 1 }
        }, 'reception');
        log('Add Bill Item', item1 === 201 ? 'PASS' : 'FAIL', `Status: ${item1}`);

        // Confirm payment
        const { status: pay1 } = await api(`/api/bills/${billId}/pay`, {
          method: 'PATCH',
          data: { paymentMethod: 'CASH' }
        }, 'reception');
        log('Confirm Payment', pay1 === 200 ? 'PASS' : 'FAIL', `Status: ${pay1}`);
      }
    }
  }

  // ===== Print Summary =====
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

  // Exit with error code if tests failed
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Test suite error:', e.message);
  process.exit(1);
});
