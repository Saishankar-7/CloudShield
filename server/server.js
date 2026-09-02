const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

const User = require('./models/User');
const { seedDatabase } = require('./seed');

// Connect to MongoDB and auto-seed if empty
connectDB().then(async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      logger.info('Connected database has 0 users. Auto-seeding initial users, security policies and resources...');
      await seedDatabase(false);
    } else {
      logger.info(`Database loaded with ${count} active user records.`);
    }
  } catch (err) {
    logger.warn(`Database check/seed warning: ${err.message}`);
  }
});

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');
const mongoose = require('mongoose');
const { startKeepAlive } = require('./services/keepAliveService');

// Format uptime into human-readable string
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d > 0 ? d + 'd ' : ''}${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
};

const getHealthStatus = () => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  const isHealthy = dbState === 1 || dbState === 2;

  return {
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    service: 'CloudShield Zero-Trust Security Gateway API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    uptimeFormatted: formatUptime(process.uptime()),
    database: {
      status: dbStatusMap[dbState] || 'Unknown',
      connected: dbState === 1
    },
    gateway: {
      zeroTrustEngine: 'ACTIVE',
      policyEngine: 'ACTIVE',
      riskEngine: 'ACTIVE',
      mfaService: 'NODEMAILER_ENABLED'
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    renderKeepAlive: {
      enabled: !!(process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || process.env.RENDER_URL),
      targetUrl: process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || process.env.RENDER_URL || 'Ready for UptimeRobot / external cron'
    }
  };
};

// Enable CORS and JSON parsing (with support for PDF attachments)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded cloud documents & PDFs statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routers
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const accessRequestRoutes = require('./routes/accessRequestRoutes');
const accessLogRoutes = require('./routes/accessLogRoutes');
const userRoutes = require('./routes/userRoutes');
const riskRoutes = require('./routes/riskRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/requests', accessRequestRoutes);
app.use('/api/logs', accessLogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/reports', reportRoutes);

// Health Check & Uptime Monitoring Routes (for Render, UptimeRobot, and Cron jobs)
app.get('/health', (req, res) => {
  res.status(200).json(getHealthStatus());
});

app.get('/api/health', (req, res) => {
  res.status(200).json(getHealthStatus());
});

app.get('/api/status', (req, res) => {
  res.status(200).json(getHealthStatus());
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Base Route
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'CloudShield Zero-Trust Cloud Access Security Architecture',
    status: 'ONLINE',
    version: '2.0.0',
    healthCheck: '/health',
    timestamp: new Date().toISOString()
  });
});

// Central Error Handler Middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled Exception: ${err.message}`);
  res.status(500).json({
    message: 'An unexpected server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.listen(PORT, () => {
  logger.info(`CloudShield backend listening on port ${PORT}`);
  // Start the background keep-alive heartbeat engine for Render
  startKeepAlive();
});
