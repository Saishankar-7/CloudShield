const AccessLog = require('../models/AccessLog');
const logger = require('../utils/logger');

const loggingService = {
  /**
   * Write an audit log entry to MongoDB.
   */
  logEvent: async ({
    user,
    resource = null,
    eventType,
    category,
    accessAction = 'Interactive',
    ipAddress,
    location = { country: 'Unknown', city: 'Unknown' },
    device = 'Unknown Device',
    browser = 'Unknown Browser',
    os = 'Unknown OS',
    severity = 'Low',
    status,
    riskScore = 0,
    details = '',
  }) => {
    try {
      const log = new AccessLog({
        user,
        resource,
        eventType,
        category,
        accessAction,
        ipAddress,
        location,
        device,
        browser,
        os,
        severity,
        status,
        riskScore,
        details,
      });

      await log.save();
      logger.info(`AccessLog saved: [${eventType}] - User: ${user} - Status: ${status} - Risk: ${riskScore}`);
      return log;
    } catch (err) {
      logger.error(`Error saving AccessLog: ${err.message}`);
    }
  },
};

module.exports = loggingService;
