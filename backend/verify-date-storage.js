/**
 * Verify Date Storage - Check if dates are stored correctly in DB
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function verify() {
  // Login
  const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
    username: 'admin01',
    password: '123456'
  });
  const token = loginRes.data.data.token;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Get profiles
  const profilesRes = await axios.get(`${BASE_URL}/api/profiles`, { headers });
  const profiles = profilesRes.data.data || [];
  
  console.log('\n📊 Profile dates from API:');
  console.log('========================');
  profiles.slice(0, 5).forEach(p => {
    console.log(`  ${p.username}: date_of_birth = "${p.date_of_birth}" (type: ${typeof p.date_of_birth})`);
  });

  // Get patients
  const patientsRes = await axios.get(`${BASE_URL}/api/patients`, { headers });
  const patients = patientsRes.data.data || [];
  
  console.log('\n📊 Patient dates from API:');
  console.log('========================');
  patients.slice(0, 5).forEach(p => {
    console.log(`  ${p.id}: date_of_birth = "${p.date_of_birth}" (type: ${typeof p.date_of_birth})`);
  });

  // Create a test profile and verify
  console.log('\n📊 Creating test profile with ISO date...');
  const testUsername = 'verify_test_' + Date.now();
  const createRes = await axios.post(`${BASE_URL}/api/profiles`, {
    username: testUsername,
    password: '123456',
    role: 'PATIENT',
    first_name: 'Verify',
    last_name: 'Test',
    date_of_birth: '1997-09-27T17:00:00.000Z',
    gender: 'Male',
    email: testUsername + '@test.com',
    phone: '0909999999'
  }, { headers });

  if (createRes.data.success) {
    console.log(`  Created: date_of_birth = "${createRes.data.data.date_of_birth}"`);
    
    // Fetch again to verify storage
    const verifyRes = await axios.get(`${BASE_URL}/api/profiles`, { headers });
    const freshProfiles = verifyRes.data.data || [];
    const freshProfile = freshProfiles.find(p => p.username === testUsername);
    
    if (freshProfile) {
      console.log(`  From DB: date_of_birth = "${freshProfile.date_of_birth}"`);
      
      // Check format
      const isCorrectFormat = /^\d{4}-\d{2}-\d{2}$/.test(freshProfile.date_of_birth);
      console.log(`\n  ✅ Date Format Check: ${isCorrectFormat ? 'CORRECT (YYYY-MM-DD)' : 'INCORRECT (needs fixing)'}`);
    }
  }

  console.log('\n');
}

verify().catch(console.error);
