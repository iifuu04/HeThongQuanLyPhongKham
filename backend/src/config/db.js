import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    namedPlaceholders: true
}).promise();

export default db;