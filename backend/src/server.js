import app from './app.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 3000;

// Global process error handlers to prevent silent crashes
process.on('uncaughtException', (error, origin) => {
    console.error('========================================');
    console.error('🚨 UNCAUGHT EXCEPTION');
    console.error('========================================');
    console.error('Time:', new Date().toISOString());
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Origin:', origin);
    console.error('========================================');
    // Do not exit - try to keep server running
    console.log('⚠️ Server continuing despite uncaught exception...');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('========================================');
    console.error('🚨 UNHANDLED REJECTION');
    console.error('========================================');
    console.error('Time:', new Date().toISOString());
    console.error('Reason:', reason);
    if (reason instanceof Error) {
        console.error('Error Message:', reason.message);
        console.error('Stack:', reason.stack);
    }
    console.error('========================================');
    // Do not exit - try to keep server running
    console.log('⚠️ Server continuing despite unhandled rejection...');
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

const server = app.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 MedSys Backend Server');
    console.log('========================================');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📦 Database: ${process.env.DB_NAME || 'MedSys'}`);
    console.log('========================================');
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`✅ DB Test: http://localhost:${PORT}/api/test-db`);
    console.log('========================================');
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop the other process.`);
    } else {
        console.error('❌ Server error:', error.message);
    }
});
