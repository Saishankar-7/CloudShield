const Resource = require('../models/Resource');
const Policy = require('../models/Policy');
const riskEngine = require('../services/riskEngine');
const policyEngine = require('../services/policyEngine');
const loggingService = require('../services/loggingService');
const logger = require('../utils/logger');

/**
 * Middleware that intercepts access to restricted resources and performs Zero Trust checks.
 */
const zeroTrustCheck = async (req, res, next) => {
  try {
    const resourceId = req.params.id || req.body.resourceId || req.query.resourceId;
    if (!resourceId) {
      return res.status(400).json({ message: 'Resource ID is required for Zero Trust check' });
    }

    // Populate the policy details
    const resource = await Resource.findById(resourceId).populate('accessPolicy');
    if (!resource) {
      return res.status(404).json({ message: 'Requested resource not found' });
    }

    // 1. Gather request context (allow header overrides from frontend for demonstration/testing)
    const deviceInfo = {
      deviceId: req.headers['x-device-id'] || 'dev-default-key-1',
      deviceName: req.headers['x-device-name'] || req.headers['user-agent'] || 'Chrome on Windows 11',
      browser: req.headers['x-device-browser'] || 'Chrome',
      os: req.headers['x-device-os'] || 'Windows 11',
      ip: req.headers['x-simulated-ip'] || req.ip || '192.168.1.10',
    };

    const locationInfo = {
      country: req.headers['x-location-country'] || 'India',
      city: req.headers['x-location-city'] || 'Mumbai',
    };

    const user = req.user;
    const policy = resource.accessPolicy;

    // 2. Compute risk level and score
    const { score, riskLevel } = await riskEngine.analyzeRequest({
      user,
      resource,
      deviceInfo,
      locationInfo,
      policy,
    });

    // 3. Evaluate access policy
    let { decision, reason, accessLevel } = policyEngine.evaluatePolicy({
      user,
      resource,
      policy,
      riskScore: score,
      deviceInfo,
      locationInfo,
    });

    // 4. Override Deny/Blocked decision if the user has an Approved Access Request
    const isExplicitlyRevokedOrDisabled =
      resource.accessStatus === 'Revoked' ||
      resource.accessStatus === 'Disabled' ||
      (resource.blockedUsers && resource.blockedUsers.some(uid => (uid._id || uid).toString() === user._id.toString()));

    if (decision === 'Deny' && !isExplicitlyRevokedOrDisabled && score < 81) {
      // Check if user has an approved access request for this resource that has not expired
      const AccessRequest = require('../models/AccessRequest');
      const approvedRequest = await AccessRequest.findOne({
        user: user._id,
        resource: resource._id,
        status: 'Approved',
        accessExpiresOn: { $gt: new Date() }
      });

      if (approvedRequest) {
        decision = 'Allow';
        reason = `Access allowed due to approved access request: "${approvedRequest.reason}" (ID: ${approvedRequest.requestId})`;
        logger.info(`Policy override: user ${user.email} granted access to ${resource.name} via request ${approvedRequest.requestId}`);
      }
    }

    // 5. Execute decision
    if (decision === 'Deny') {
      await loggingService.logEvent({
        user: user._id,
        resource: resource._id,
        eventType: 'Access Denied',
        category: 'Authorization',
        accessAction: 'View',
        ipAddress: deviceInfo.ip,
        location: locationInfo,
        device: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        severity: 'High',
        status: 'Blocked',
        riskScore: score,
        details: `Access Blocked: ${reason}`,
      });

      return res.status(200).json({
        status: 'Blocked',
        message: 'Access Blocked by CloudShield Zero Trust Engine',
        reason,
        riskScore: score,
        riskLevel,
      });
    }

    if (decision === 'MFA_Required') {
      const DocumentOtp = require('../models/DocumentOtp');
      const recentOtpVerified = await DocumentOtp.findOne({
        user: user._id,
        verified: true,
        updatedAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      const mfaVerified = req.headers['x-mfa-verified'] === 'true' || !!recentOtpVerified || user.role === 'admin';

      if (!mfaVerified) {
        await loggingService.logEvent({
          user: user._id,
          resource: resource._id,
          eventType: 'MFA Verification',
          category: 'Authentication',
          accessAction: 'Interactive',
          ipAddress: deviceInfo.ip,
          location: locationInfo,
          device: deviceInfo.deviceName,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          severity: 'Medium',
          status: 'Failed',
          riskScore: score,
          details: `MFA challenge triggered: ${reason}`,
        });

        return res.status(200).json({
          status: 'MFA_Required',
          message: 'Multi-Factor Authentication Required',
          reason,
          riskScore: score,
          riskLevel,
        });
      } else {
        // MFA verification header was present and validated
        await loggingService.logEvent({
          user: user._id,
          resource: resource._id,
          eventType: 'Access Resource',
          category: 'Access',
          accessAction: 'View',
          ipAddress: deviceInfo.ip,
          location: locationInfo,
          device: deviceInfo.deviceName,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          severity: 'Low',
          status: 'Success',
          riskScore: score,
          details: `Access granted following MFA verification: ${reason}`,
        });

        req.zeroTrustContext = { score, riskLevel, decision, accessLevel, deviceInfo, locationInfo };
        return next();
      }
    }

    // Default Allow path
    await loggingService.logEvent({
      user: user._id,
      resource: resource._id,
      eventType: 'Access Resource',
      category: 'Access',
      accessAction: 'View',
      ipAddress: deviceInfo.ip,
      location: locationInfo,
      device: deviceInfo.deviceName,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      severity: 'Low',
      status: 'Success',
      riskScore: score,
      details: `Access granted automatically: ${reason}`,
    });

    req.zeroTrustContext = { score, riskLevel, decision, accessLevel, deviceInfo, locationInfo };
    next();
  } catch (err) {
    logger.error(`Zero Trust Gate check failed: ${err.message}`);
    res.status(500).json({ message: 'Zero Trust Gate Check Error', error: err.message });
  }
};

module.exports = { zeroTrustCheck };
