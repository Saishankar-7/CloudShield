const SecurityAlert = require('../models/SecurityAlert');
const loggingService = require('../services/loggingService');
const logger = require('../utils/logger');

/**
 * Get all security alerts (Admin only)
 */
const getAlerts = async (req, res) => {
  try {
    const alerts = await SecurityAlert.find()
      .populate('user')
      .populate('resource')
      .sort({ createdAt: -1 });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving security alerts' });
  }
};

/**
 * Resolve or update the status of a Security Alert
 */
const updateAlertStatus = async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    if (!['Open', 'Investigating', 'Resolved', 'Dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid alert status value.' });
    }

    const alert = await SecurityAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Security alert not found.' });
    }

    alert.status = status;
    alert.resolutionNotes = resolutionNotes || alert.resolutionNotes;
    
    if (status === 'Resolved' || status === 'Dismissed') {
      alert.resolvedBy = req.user._id;
      alert.resolvedAt = new Date();
    }

    await alert.save();

    // Log the resolution action
    const ip = req.headers['x-simulated-ip'] || req.ip || '192.168.1.10';
    await loggingService.logEvent({
      user: req.user._id,
      eventType: 'Admin Action',
      category: 'Admin Actions',
      accessAction: 'Admin',
      ipAddress: ip,
      location: { country: 'India', city: 'Mumbai' },
      device: req.headers['user-agent'] || 'Browser',
      browser: 'Chrome',
      os: 'Windows',
      severity: 'Low',
      status: 'Success',
      riskScore: alert.riskScore || 0,
      details: `Admin marked security alert "${alert.title}" (ID: ${alert._id}) as ${status}.`,
    });

    res.status(200).json(alert);
  } catch (error) {
    logger.error(`updateAlertStatus error: ${error.message}`);
    res.status(500).json({ message: 'Error resolving threat alert' });
  }
};

module.exports = {
  getAlerts,
  updateAlertStatus,
};
