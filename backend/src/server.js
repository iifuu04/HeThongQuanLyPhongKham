import app from './app.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 MedSys Backend Server`);
    console.log(`========================================`);
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📦 Database: ${process.env.DB_NAME || 'MedSys'}`);
    console.log(`========================================`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`✅ DB Test: http://localhost:${PORT}/api/test-db`);
    console.log(`========================================`);
});
