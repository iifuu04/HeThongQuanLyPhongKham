/**
 * API Quick Test Script
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
let token = null;

async function api(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await axios({
      url: `${BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      headers: { ...headers, ...options.headers },
      data: options.data
    });
    return { ok: true, status: res.status, data: res.data };
  } catch (e) {
    return { ok: false, status: e.response?.status, data: e.response?.data, error: e.message };
  }
}

async function test() {
  console.log('🧪 API Quick Test\n');

  // Login
  const loginRes = await api('/api/auth/login', { method: 'POST', data: { username: 'admin01', password: '123456' } });
  if (loginRes.ok && loginRes.data.success) {
    token = loginRes.data.data.token;
    console.log('✅ Login OK');
  } else {
    console.log('❌ Login failed:', loginRes.data?.message || loginRes.error);
    return;
  }

  // Test each API
  const apis = [
    ['/api/profiles', 'Profiles'],
    ['/api/patients', 'Patients'],
    ['/api/doctors', 'Doctors'],
    ['/api/specialties', 'Specialties'],
    ['/api/clinics', 'Clinics'],
    ['/api/shifts', 'Shifts'],
    ['/api/services', 'Services'],
    ['/api/work-schedules', 'WorkSchedules'],
    ['/api/appointments', 'Appointments'],
    ['/api/appointment-requests', 'AppointmentRequests'],
    ['/api/medical-records', 'MedicalRecords'],
    ['/api/bills', 'Bills'],
    ['/api/audit-logs', 'AuditLogs'],
  ];

  for (const [endpoint, name] of apis) {
    const res = await api(endpoint);
    if (res.ok && res.data) {
      const count = Array.isArray(res.data.data) ? res.data.data.length : (res.data.data ? 1 : 0);
      console.log(`✅ ${name}: ${count} records`);
      if (res.data.data?.length > 0) {
        const sample = res.data.data[0];
        const keys = Object.keys(sample).slice(0, 5).join(', ');
        console.log(`   Fields: ${keys}...`);
      }
    } else {
      console.log(`❌ ${name}: ${res.data?.message || res.error}`);
    }
  }

  console.log('\n✅ Test complete!');
}

test().catch(console.error);
