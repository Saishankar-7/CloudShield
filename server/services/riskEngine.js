const User = require('../models/User');
const SecurityAlert = require('../models/SecurityAlert');
const calculateRisk = require('../utils/calculateRisk');
const logger = require('../utils/logger');

const riskEngine = {
  /**
   * Evaluates request parameters, computes risk score, saves user security alerts if necessary, and returns the result.
   */
  analyzeRequest: async ({ user, resource, deviceInfo, locationInfo, policy }) => {
    // Calculate risk
    const { score, riskLevel } = calculateRisk({ user, resource, deviceInfo, locationInfo, policy });

    // Update user snapshot risk score atomically
    user.riskScore = score;
    user.riskLevel = riskLevel;
    await User.findByIdAndUpdate(user._id, { $set: { riskScore: score, riskLevel } });

    // Create a security alert if the score is High or Critical
    if (score >= 61) {
      try {
        const alert = new SecurityAlert({
          title: `Suspicious access attempt: ${riskLevel} Risk`,
          description: `User ${user.fullName} attempted to access ${resource ? resource.name : 'System'} from IP ${deviceInfo.ip} in ${locationInfo.city || 'Unknown'}, ${locationInfo.country || 'Unknown'} using ${deviceInfo.browser} on ${deviceInfo.os}.`,
          type: score >= 81 ? 'access_anomaly' : 'policy_violation',
          user: user._id,
          resource: resource ? resource._id : null,
          riskLevel: riskLevel,
          riskScore: score,
          ipAddress: deviceInfo.ip,
          location: locationInfo.country ? `${locationInfo.city || 'Unknown'}, ${locationInfo.country}` : 'Unknown Location',
          status: 'Open',
        });
        await alert.save();
        logger.warn(`SecurityAlert created! Title: "${alert.title}" RiskScore: ${score}`);
      } catch (err) {
        logger.error(`Error saving SecurityAlert: ${err.message}`);
      }
    }

    return { score, riskLevel };
  }
};

module.exports = riskEngine;
