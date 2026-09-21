require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, isConnected } = require('./config/db');

const wasteRoutes = require('./routes/wasteRoutes');
const pickupRoutes = require('./routes/pickupRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const authRoutes = require('./routes/authRoutes');
const hardwareRoutes = require('./routes/hardwareRoutes');

const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'MED_WASTE - Medical Waste Management System',
    mongoConnected: isConnected(),
    storageEngine: isConnected() ? 'MongoDB (Mongoose)' : 'Local Resilient Storage Engine',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hardware', hardwareRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/incidents', incidentRoutes);

// Static files & SPA Routing (Production / Cloud Hosting Mode)
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
}

// 404 Handler for unhandled routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` MED_WASTE System running on port ${PORT}`);
    console.log(` Web App:     http://localhost:${PORT}`);
    console.log(` Health API:  http://localhost:${PORT}/api/health`);
    console.log(` Frontend:    ${fs.existsSync(frontendDist) ? 'Production bundle active (Serving UI)' : 'Dev mode (Vite proxy required)'}`);
    console.log(` Mode:        ${process.env.NODE_ENV || 'production'}`);
    console.log(` Storage:     ${isConnected() ? 'MongoDB Cloud/Cluster' : 'Resilient High-Speed Store'}`);
    console.log(`====================================================`);
  });
};

startServer();

module.exports = app;
