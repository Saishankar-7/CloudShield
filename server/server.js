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

// Base & Health Check routes (for Render liveness checks)
app.get('/', (req, res) => {
  res.send('Zero Trust Cloud Security (CloudShield) API is running.');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'CloudShield API', timestamp: new Date().toISOString() });
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
});
