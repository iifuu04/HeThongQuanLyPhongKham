import express from 'express';
import cors from 'cors';
import db from './config/db.js';
import { errorHandler, notFoundHandler, requestLogger } from './middlewares/error.middleware.js';

const app = express();

// Global CORS settings
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3001', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'MedSys Backend is running',
        timestamp: new Date().toISOString()
    });
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 as test');
        res.json({
            success: true,
            message: 'Database connection successful',
            timestamp: new Date().toISOString(),
            data: rows
        });
    } catch (error) {
        console.error('Database test error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Route mapping configuration
const routeConfig = [
    { module: 'Profile', prefix: '/api/profiles' },
    { module: 'Patient', prefix: '/api/patients' },
    { module: 'Doctor', prefix: '/api/doctors' },
    { module: 'Specialty', prefix: '/api/specialties' },
    { module: 'Clinic', prefix: '/api/clinics' },
    { module: 'Shift', prefix: '/api/shifts' },
    { module: 'MedicalService', prefix: '/api/services' },
    { module: 'WorkSchedule', prefix: '/api/work-schedules' },
    { module: 'Appointment', prefix: '/api/appointments' },
    { module: 'AppointmentRequest', prefix: '/api/appointment-requests' },
    { module: 'MedicalRecord', prefix: '/api/medical-records' },
    { module: 'Bill', prefix: '/api/bills' },
    { module: 'AuditLog', prefix: '/api/audit-logs' },
    { module: 'Report', prefix: '/api/reports' }
];

// Mount routes dynamically
for (const { module, prefix } of routeConfig) {
    try {
        const routePath = `./modules/${module}/${module}.routes.js`;
        const routeModule = await import(routePath);
        
        let routeHandler = routeModule.default || null;
        
        if (routeHandler) {
            app.use(prefix, routeHandler);
            console.log(`Mounted route: ${prefix}`);
        } else {
            console.log(`Skipped ${prefix}: no default export`);
        }
    } catch (error) {
        console.log(`Failed to mount ${prefix}: ${error.message}`);
    }
}

// Auth routes
try {
    const authRoutes = await import('./routes/auth.routes.js');
    if (authRoutes.default) {
        app.use('/api/auth', authRoutes.default);
        console.log('Mounted route: /api/auth');
    }
} catch (error) {
    console.log(`Failed to mount /api/auth: ${error.message}`);
}

// IMPORTANT: Global error handler for unhandled errors
// This catches any error that slips through async handlers
app.use((err, req, res, next) => {
    console.error('Unhandled error in request:', {
        path: req.path,
        method: req.method,
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    // Handle specific MySQL errors
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        return res.status(500).json({
            success: false,
            message: 'Database authentication failed'
        });
    }
    
    if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
            success: false,
            message: 'Database connection refused'
        });
    }
    
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        return res.status(503).json({
            success: false,
            message: 'Database connection lost'
        });
    }

    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
