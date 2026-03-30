const express = require('express');
const app = express();

const clinicRoutes = require('./modules/clinic/clinic.routes');

app.use('/api/clinics', clinicRoutes);

module.exports = app;