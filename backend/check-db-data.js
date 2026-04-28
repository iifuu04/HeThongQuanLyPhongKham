/**
 * Database Data Check Script
 * Verify what data actually exists in MySQL
 */

import mysql from 'mysql2/promise';

async function checkDb() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'MedSys'
  });

  console.log('========================================');
  console.log('📊 Database Data Check');
  console.log('========================================\n');

  // Check each table
  const tables = ['Profiles', 'Doctors', 'Patients', 'Specialties', 'Clinics', 'Shifts', 'Services', 'Work_Schedules', 'Appointments', 'Medical_Records', 'Bills', 'Appointment_Request', 'Audit_Logs'];
  
  for (const table of tables) {
    try {
      const [rows] = await connection.execute(`SELECT COUNT(*) as cnt FROM ${table}`);
      const count = rows[0].cnt;
      console.log(`${table}: ${count} rows`);
      
      // Show sample data for key tables
      if (count > 0 && ['Profiles', 'Doctors', 'Specialties', 'Clinics', 'Shifts', 'Services'].includes(table)) {
        const [sample] = await connection.execute(`SELECT * FROM ${table} LIMIT 2`);
        console.log('  Sample:', JSON.stringify(sample, (k, v) => {
          if (v instanceof Date) return v.toISOString();
          return v;
        }, 2).slice(0, 500));
      }
      console.log('');
    } catch (e) {
      console.log(`${table}: ERROR - ${e.message}\n`);
    }
  }

  // Check Profiles status
  console.log('--- Profiles Status Check ---');
  const [profiles] = await connection.execute(`SELECT id, username, role, is_deleted FROM Profiles LIMIT 10`);
  profiles.forEach(p => console.log(`  ${p.username}: role=${p.role}, is_deleted=${p.is_deleted}`));

  // Check Specialties status
  console.log('\n--- Specialties Status Check ---');
  const [specs] = await connection.execute(`SELECT id, name, status, is_deleted FROM Specialties`);
  specs.forEach(s => console.log(`  ${s.name}: status=${s.status}, is_deleted=${s.is_deleted}`));

  // Check Clinics
  console.log('\n--- Clinics Check ---');
  const [clinics] = await connection.execute(`SELECT * FROM Clinics`);
  clinics.forEach(c => console.log(`  ${c.name}: is_reserve=${c.is_reserve}`));

  // Check Shifts time format
  console.log('\n--- Shifts Time Check ---');
  const [shifts] = await connection.execute(`SELECT * FROM Shifts`);
  shifts.forEach(s => console.log(`  ${s.id}: start=${s.start_time}, end=${s.end_time}, type=${typeof s.start_time}`));

  // Check Services
  console.log('\n--- Services Check ---');
  const [services] = await connection.execute(`SELECT * FROM Services`);
  services.forEach(s => console.log(`  ${s.id}: ${s.name}, price=${s.price}`));

  // Check Audit Logs
  console.log('\n--- Audit Logs Check ---');
  const [logs] = await connection.execute(`SELECT * FROM Audit_Logs ORDER BY created_at DESC LIMIT 5`);
  console.log(`  Total: ${logs.length} logs`);
  logs.forEach(l => console.log(`  ${l.action_type} on ${l.table_name} at ${l.created_at}`));

  await connection.end();
  console.log('\n========================================');
}

checkDb().catch(console.error);
