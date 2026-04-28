/**
 * Verify Database Storage - Check raw data in MySQL
 */

import mysql from 'mysql2/promise';

async function checkDb() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'MedSys'
  });

  console.log('\n📊 Raw data from MySQL Database:');
  console.log('================================\n');

  // Check profiles table
  const [profiles] = await connection.execute(
    'SELECT id, username, date_of_birth FROM Profiles ORDER BY id DESC LIMIT 5'
  );
  console.log('Profiles table (raw DATE values):');
  profiles.forEach(p => {
    console.log(`  ${p.username}: date_of_birth = "${p.date_of_birth}" (${typeof p.date_of_birth})`);
  });

  // Check Work_Schedules table
  const [schedules] = await connection.execute(
    'SELECT id, doctor_id, work_date FROM Work_Schedules ORDER BY id DESC LIMIT 3'
  );
  console.log('\nWork_Schedules table (raw DATE values):');
  schedules.forEach(s => {
    console.log(`  ${s.id}: work_date = "${s.work_date}" (${typeof s.work_date})`);
  });

  await connection.end();
  console.log('\n✅ Database storage verified!');
}

checkDb().catch(console.error);
