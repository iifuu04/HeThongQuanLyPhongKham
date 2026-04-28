import express from 'express';
import cors from 'cors';
import db from './config/db.js';
import { errorHandler, notFoundHandler, requestLogger } from './middlewares/error.middleware.js';

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
        console.log(`Skipped ${prefix}: ${error.message}`);
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
    console.log(`Skipped /api/auth: ${error.message}`);
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
