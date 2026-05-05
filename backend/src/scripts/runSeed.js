import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'MedSys',
    multipleStatements: true
};

async function runSeed() {
    let connection;
    try {
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection(config);
        console.log('Connected successfully!');

        const sqlPath = path.join(__dirname, '../database/seed_complete.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running seed SQL...');
        await connection.query(sql);
        
        console.log('\n========================================');
        console.log('  Seed data imported successfully!');
        console.log('  Database: MedSys');
        console.log('  Default password: 123456');
        console.log('========================================\n');

    } catch (error) {
        console.error('Error running seed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runSeed();
