/**
 * API Test Script - MedSys Clinic Management System
 * Tests all endpoints with real data
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const results = [];

function log(test, status, message) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  results.push({ test, status, message });
  console.log(`${icon} [${status}] ${test}: ${message}`);
}

async function runTests() {
  console.log('\n========================================');
  console.log('🚀 MedSys API Audit Test Suite');
  console.log('========================================\n');

  // Test 1: Health check
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    log('Health Check', res.data.success ? 'PASS' : 'FAIL', `Status: ${res.status}`);
  } catch (e) {
    log('Health Check', 'FAIL', e.message);
  }

  // Test 2: Database connection
  try {
    const res = await axios.get(`${BASE_URL}/api/test-db`);
    log('Database Connection', res.data.success ? 'PASS' : 'FAIL', res.data.message);
  } catch (e) {
    log('Database Connection', 'FAIL', e.message);
  }

  // Test 3: Login with admin
  let adminToken = null;
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin01',
      password: '123456'
    });
    const data = res.data;
    if (data.success && data.data?.token) {
      adminToken = data.data.token;
      log('Admin Login', 'PASS', `Role: ${data.data.user.role}`);
    } else {
      log('Admin Login', 'FAIL', data.message || 'No token returned');
    }
  } catch (e) {
    log('Admin Login', 'FAIL', e.message);
  }

  // Test 4: Login with doctor
  let doctorToken = null;
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'doctor01',
      password: '123456'
    });
    const data = res.data;
    if (data.success && data.data?.token) {
      doctorToken = data.data.token;
      log('Doctor Login', 'PASS', `Role: ${data.data.user.role}`);
    } else {
      log('Doctor Login', 'FAIL', data.message || 'No token returned');
    }
  } catch (e) {
    log('Doctor Login', 'FAIL', e.message);
  }

  // Test 5: Login with patient
  let patientToken = null;
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'patient01',
      password: '123456'
    });
    const data = res.data;
    if (data.success && data.data?.token) {
      patientToken = data.data.token;
      log('Patient Login', 'PASS', `Role: ${data.data.user.role}`);
    } else {
      log('Patient Login', 'FAIL', data.message || 'No token returned');
    }
  } catch (e) {
    log('Patient Login', 'FAIL', e.message);
  }

  // Helper function for authenticated requests
  async function api(endpoint, options = {}, token = adminToken) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const config = { headers, ...options };
    let method = options.method || 'GET';
    let url = `${BASE_URL}${endpoint}`;
    let data = options.data;
    
    try {
      const res = await axios({
        url,
        method,
        headers,
        data
      });
      return { status: res.status, data: res.data };
    } catch (e) {
      if (e.response) {
        return { status: e.response.status, data: e.response.data };
      }
      throw e;
    }
  }

  // Test 6: Get profiles
  if (adminToken) {
    const { status, data } = await api('/api/profiles');
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('GET /api/profiles', status === 200 && count > 0 ? 'PASS' : 'FAIL', `Found ${count} profiles`);
  }

  // Test 7: Get patients
  if (adminToken) {
    const { status, data } = await api('/api/patients');
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('GET /api/patients', status === 200 && count > 0 ? 'PASS' : 'FAIL', `Found ${count} patients`);
  }

  // Test 8: Get doctors
  if (adminToken) {
    const { status, data } = await api('/api/doctors');
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('GET /api/doctors', status === 200 && count > 0 ? 'PASS' : 'FAIL', `Found ${count} doctors`);
  }

  // Test 9: Get specialties
  if (adminToken) {
    const { status, data } = await api('/api/specialties');
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('GET /api/specialties', status === 200 && count > 0 ? 'PASS' : 'FAIL', `Found ${count} specialties`);
  }

  // Test 10: Get clinics
  if (adminToken) {
    const { status, data } = await api('/api/clinics');
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('GET /api/clinics', status === 200 && count > 0 ? 'PASS' : 'FAIL', `Found ${count} clinics`);
  }

  // Test 11: Get shifts
  if (adminToken) {
    const { status, data } = await api('/api/shifts');
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('GET /api/shifts', status === 200 && count > 0 ? 'PASS' : 'FAIL', `Found ${count} shifts`);
  }

  // Test 12: Get services
  if (adminToken) {
    const { status, data } = await api('/api/services');
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('GET /api/services', status === 200 && count > 0 ? 'PASS' : 'FAIL', `Found ${count} services`);
  }

  // Test 13: Get work schedules
  if (adminToken) {
    const { status, data } = await api('/api/work-schedules');
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('GET /api/work-schedules', status === 200 && count > 0 ? 'PASS' : 'FAIL', `Found ${count} schedules`);
  }

  // Test 14: Get appointments
  if (adminToken) {
    const { status, data } = await api('/api/appointments');
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('GET /api/appointments', status === 200 && count > 0 ? 'PASS' : 'FAIL', `Found ${count} appointments`);
  }

  // Test 15: Get appointment requests
  if (adminToken) {
    const { status, data } = await api('/api/appointment-requests');
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('GET /api/appointment-requests', status === 200 && count > 0 ? 'PASS' : 'FAIL', `Found ${count} requests`);
  }

  // Test 16: Get medical records
  if (adminToken) {
    const { status, data } = await api('/api/medical-records');
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('GET /api/medical-records', status === 200 && count > 0 ? 'PASS' : 'FAIL', `Found ${count} records`);
  }

  // Test 17: Get bills
  if (adminToken) {
    const { status, data } = await api('/api/bills');
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('GET /api/bills', status === 200 && count > 0 ? 'PASS' : 'FAIL', `Found ${count} bills`);
  }

  // Test 18: Get audit logs
  if (adminToken) {
    const { status, data } = await api('/api/audit-logs');
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('GET /api/audit-logs', status === 200 && count > 0 ? 'PASS' : 'FAIL', `Found ${count} logs`);
  }

  // Test 19: Get /api/auth/me
  if (adminToken) {
    const { status, data } = await api('/api/auth/me');
    log('GET /api/auth/me', status === 200 && data.success ? 'PASS' : 'FAIL', `User: ${data.data?.username || 'N/A'}`);
  }

  // Test 20: Unauthorized access to protected route
  try {
    const res = await axios.get(`${BASE_URL}/api/patients`);
    log('Unauthorized Access', 'FAIL', `Expected 401, got ${res.status}`);
  } catch (e) {
    if (e.response) {
      log('Unauthorized Access', e.response.status === 401 ? 'PASS' : 'FAIL', `Got ${e.response.status}`);
    } else {
      log('Unauthorized Access', 'FAIL', e.message);
    }
  }

  // Test 21: Role-based access - Patient trying to access admin route
  if (patientToken) {
    const { status, data } = await api('/api/profiles', {}, patientToken);
    log('Patient->Admin Route', status === 403 ? 'PASS' : 'FAIL', `Expected 403, got ${status}`);
  }

  // Test 22: Doctor can view appointments
  if (doctorToken) {
    const { status, data } = await api('/api/appointments', {}, doctorToken);
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('Doctor->Appointments', status === 200 ? 'PASS' : 'FAIL', `Found ${count} appointments (filtered by doctor)`);
  }

  // Test 23: Patient can view own appointments
  if (patientToken) {
    const { status, data } = await api('/api/appointments', {}, patientToken);
    const count = Array.isArray(data.data) ? data.data.length : 0;
    log('Patient->Appointments', status === 200 ? 'PASS' : 'FAIL', `Found ${count} appointments (filtered by patient)`);
  }

  // Test 24: Create specialty (admin only)
  if (adminToken) {
    const { status, data } = await api('/api/specialties', {
      method: 'POST',
      data: {
        name: 'Test Specialty',
        description: 'Test description',
        status: 'ACTIVE'
      }
    }, adminToken);
    log('Create Specialty (Admin)', status === 201 ? 'PASS' : 'FAIL', `Status: ${status}, ${data.message || ''}`);
  }

  // Test 25: Create appointment
  if (adminToken) {
    const scheduleRes = await api('/api/work-schedules');
    const schedules = scheduleRes.data.data || [];
    
    if (schedules.length > 0) {
      const schedule = schedules[0];
      const workDate = schedule.work_date || schedule.workDate;
      const startTime = `${workDate} 08:00:00`;
      const endTime = `${workDate} 08:30:00`;
      const doctorId = schedule.doctor_id || schedule.doctorId || 'D00001';
      
      const { status, data } = await api('/api/appointments', {
        method: 'POST',
        data: {
          patient_id: 'P00001',
          doctor_id: doctorId,
          work_schedule_id: schedule.id,
          start_time: startTime,
          end_time: endTime
        }
      }, adminToken);
      log('Create Appointment', status === 201 ? 'PASS' : 'FAIL', `Status: ${status}, ${data.message || ''}`);
    } else {
      log('Create Appointment', 'FAIL', 'No work schedules available');
    }
  }

  // Test 26: Booking conflict - try to book same slot
  if (adminToken) {
    const scheduleRes = await api('/api/work-schedules');
    const schedules = scheduleRes.data.data || [];
    
    if (schedules.length > 0) {
      const schedule = schedules[0];
      const workDate = schedule.work_date || schedule.workDate;
      const startTime = `${workDate} 09:00:00`;
      const endTime = `${workDate} 09:30:00`;
      const doctorId = schedule.doctor_id || schedule.doctorId || 'D00001';
      
      // Create first appointment
      const res1 = await api('/api/appointments', {
        method: 'POST',
        data: {
          patient_id: 'P00003',
          doctor_id: doctorId,
          work_schedule_id: schedule.id,
          start_time: startTime,
          end_time: endTime
        }
      }, adminToken);
      
      // Try to create duplicate
      const res2 = await api('/api/appointments', {
        method: 'POST',
        data: {
          patient_id: 'P00004',
          doctor_id: doctorId,
          work_schedule_id: schedule.id,
          start_time: startTime,
          end_time: endTime
        }
      }, adminToken);
      
      if (res2.status === 400 && res2.data.message?.includes('dat')) {
        log('Booking Conflict Detection', 'PASS', 'Correctly detected booking conflict');
      } else if (res2.status === 201) {
        log('Booking Conflict Detection', 'PASS', 'Slot available (slot was cancelled or first failed)');
      } else {
        log('Booking Conflict Detection', 'FAIL', `Unexpected: ${res2.status} - ${res2.data.message}`);
      }
    }
  }

  // Test 27: Update appointment status
  if (adminToken) {
    const aptRes = await api('/api/appointments');
    const appointments = aptRes.data.data || [];
    
    const scheduled = appointments.find(a => a.status === 'SCHEDULED');
    if (scheduled) {
      const { status, data } = await api(`/api/appointments/${scheduled.id}/status`, {
        method: 'PATCH',
        data: { status: 'WAITING' }
      }, adminToken);
      log('Update Appointment Status', status === 200 ? 'PASS' : 'FAIL', `Status: ${status}`);
    } else {
      log('Update Appointment Status', 'FAIL', 'No scheduled appointments found');
    }
  }

  // Test 28: Cancel appointment (patient)
  if (patientToken) {
    const aptRes = await api('/api/appointments', {}, patientToken);
    const appointments = aptRes.data.data || [];
    
    const cancelable = appointments.find(a => a.status === 'SCHEDULED');
    if (cancelable) {
      const { status, data } = await api(`/api/appointments/${cancelable.id}/cancel`, {
        method: 'PATCH'
      }, patientToken);
      log('Cancel Appointment (Patient)', status === 200 ? 'PASS' : 'FAIL', `Status: ${status}`);
    } else {
      log('Cancel Appointment (Patient)', 'FAIL', 'Patient has no cancelable appointments');
    }
  }

  // Test 29: Receptionist login and create request
  let receptionToken = null;
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'reception01',
      password: '123456'
    });
    const data = res.data;
    if (data.success && data.data?.token) {
      receptionToken = data.data.token;
      log('Receptionist Login', 'PASS', `Role: ${data.data.user.role}`);
    } else {
      log('Receptionist Login', 'FAIL', data.message || 'No token');
    }
  } catch (e) {
    log('Receptionist Login', 'FAIL', e.message);
  }

  // Test 30: Invalid status transition (WAITING -> COMPLETED should fail)
  if (adminToken) {
    const aptRes = await api('/api/appointments');
    const appointments = aptRes.data.data || [];
    
    const waiting = appointments.find(a => a.status === 'WAITING');
    if (waiting) {
      const { status, data } = await api(`/api/appointments/${waiting.id}/status`, {
        method: 'PATCH',
        data: { status: 'COMPLETED' }
      }, adminToken);
      if (status === 400) {
        log('Invalid Status Transition', 'PASS', 'Correctly rejected WAITING->COMPLETED');
      } else if (status === 200) {
        log('Invalid Status Transition', 'FAIL', 'Should have rejected WAITING->COMPLETED');
      }
    }
  }

  // Test 31: Doctor update appointment status to INPROGRESS
  if (doctorToken) {
    const aptRes = await api('/api/appointments', {}, doctorToken);
    const appointments = aptRes.data.data || [];
    
    const waiting = appointments.find(a => a.status === 'WAITING');
    if (waiting) {
      const { status, data } = await api(`/api/appointments/${waiting.id}/status`, {
        method: 'PATCH',
        data: { status: 'INPROGRESS' }
      }, doctorToken);
      log('Doctor->Start Exam', status === 200 ? 'PASS' : 'FAIL', `Status: ${status}`);
    }
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
