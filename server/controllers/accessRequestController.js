const AccessRequest = require('../models/AccessRequest');
const Resource = require('../models/Resource');
const User = require('../models/User');
const calculateRisk = require('../utils/calculateRisk');
const loggingService = require('../services/loggingService');
const logger = require('../utils/logger');

// Generate realistic Request ID
const generateRequestId = async () => {
  const count = await AccessRequest.countDocuments();
  return `REQ-2026-${String(count + 1).padStart(4, '0')}`;
};

/**
 * Create a new access request (Employee operation)
 */
const createRequest = async (req, res) => {
  try {
    const { resourceId, reason } = req.body;
    const accessType = req.body.accessType || req.body.requestType || 'Read Only';

    const resource = await Resource.findById(resourceId).populate('accessPolicy');
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const user = req.user;

    // Check if a pending request already exists
    const existing = await AccessRequest.findOne({
      user: user._id,
      resource: resourceId,
      status: 'Pending',
    });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending request for this resource.' });
    }

    // Evaluate risk context snapshot
    const deviceInfo = {
      deviceId: req.headers['x-device-id'] || 'device-default-key',
      deviceName: req.headers['x-device-name'] || req.headers['user-agent'] || 'Chrome on Windows 11',
      browser: req.headers['x-device-browser'] || 'Chrome',
      os: req.headers['x-device-os'] || 'Windows',
      ip: req.headers['x-simulated-ip'] || req.ip || '192.168.1.10',
    };
    const locationInfo = {
      country: req.headers['x-location-country'] || 'India',
      city: req.headers['x-location-city'] || 'Mumbai',
    };

    const { score } = calculateRisk({
      user,
      resource,
      deviceInfo,
      locationInfo,
      policy: resource.accessPolicy,
    });

    let riskLevel = 'Low';
    if (score >= 61) riskLevel = 'High';
    else if (score >= 31) riskLevel = 'Medium';

    const requestId = await generateRequestId();

    const request = new AccessRequest({
      requestId,
      user: user._id,
      resource: resourceId,
      accessType,
      reason,
      riskLevel,
      riskScore: score,
      status: 'Pending',
    });

    await request.save();

    // Log the request creation
    await loggingService.logEvent({
      user: user._id,
      resource: resourceId,
      eventType: 'API Call',
      category: 'Authorization',
      accessAction: 'Interactive',
      ipAddress: deviceInfo.ip,
      location: locationInfo,
      device: deviceInfo.deviceName,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      severity: 'Low',
      status: 'Success',
      riskScore: score,
      details: `Created access request: ${requestId} for ${resource.name}`,
    });

    res.status(201).json(request);
  } catch (error) {
    logger.error(`createRequest error: ${error.message}`);
    res.status(500).json({ message: 'Failed to create access request', error: error.message });
  }
};

/**
 * Get all requests submitted by the logged-in employee
 */
const getMyRequests = async (req, res) => {
  try {
    const requests = await AccessRequest.find({ user: req.user._id })
      .populate('resource')
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving your requests' });
  }
};

/**
 * Get all requests across the entire system (Admin operation)
 */
const getAllRequests = async (req, res) => {
  try {
    const requests = await AccessRequest.find()
      .populate('user')
      .populate('resource')
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving system requests' });
  }
};

/**
 * Review, Approve or Deny a request (Admin operation)
 */
const reviewRequest = async (req, res) => {
  try {
    const { status, reviewNotes, expiryHours = 24 } = req.body;
    
    if (!['Approved', 'Denied', 'Revoked'].includes(status)) {
      return res.status(400).json({ message: 'Review status must be Approved, Denied, or Revoked.' });
    }

    const request = await AccessRequest.findById(req.params.id)
      .populate('resource')
      .populate('user');
      
    if (!request) {
      return res.status(404).json({ message: 'Access request not found.' });
    }

    if (request.status === status) {
      return res.status(400).json({ message: `This request is already marked as ${status}.` });
    }

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewedOn = new Date();
    request.reviewNotes = reviewNotes || '';

    if (status === 'Approved') {
      request.accessExpiresOn = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    } else {
      request.accessExpiresOn = new Date();
    }

    await request.save();

    // Synchronize Resource permissions & purge active document OTPs
    const DocumentOtp = require('../models/DocumentOtp');
    if (status === 'Revoked') {
      if (request.resource) {
        const resourceDoc = await Resource.findById(request.resource._id);
        if (resourceDoc) {
          if (!resourceDoc.blockedUsers) resourceDoc.blockedUsers = [];
          const isBlocked = resourceDoc.blockedUsers.some(
            (uid) => (uid._id || uid).toString() === request.user._id.toString()
          );
          if (!isBlocked) {
            resourceDoc.blockedUsers.push(request.user._id);
          }
          if (resourceDoc.allowedUsers && resourceDoc.allowedUsers.length > 0) {
            resourceDoc.allowedUsers = resourceDoc.allowedUsers.filter(
              (uid) => (uid._id || uid).toString() !== request.user._id.toString()
            );
          }
          await resourceDoc.save();
        }
      }
      await DocumentOtp.deleteMany({ user: request.user._id, resource: request.resource._id });
    } else if (status === 'Approved') {
      if (request.resource) {
        const resourceDoc = await Resource.findById(request.resource._id);
        if (resourceDoc) {
          if (resourceDoc.blockedUsers && resourceDoc.blockedUsers.length > 0) {
            resourceDoc.blockedUsers = resourceDoc.blockedUsers.filter(
              (uid) => (uid._id || uid).toString() !== request.user._id.toString()
            );
          }
          if (resourceDoc.allowedUsers && resourceDoc.allowedUsers.length > 0) {
            const isAlreadyAllowed = resourceDoc.allowedUsers.some(
              (uid) => (uid._id || uid).toString() === request.user._id.toString()
            );
            if (!isAlreadyAllowed) {
              resourceDoc.allowedUsers.push(request.user._id);
            }
          }
          await resourceDoc.save();
        }
      }
    }

    // Log the review action
    const ip = req.headers['x-simulated-ip'] || req.ip || '192.168.1.10';
    await loggingService.logEvent({
      user: req.user._id,
      resource: request.resource._id,
      eventType: status === 'Revoked' ? 'Access Revoked' : 'Admin Action',
      category: 'Admin Actions',
      accessAction: 'Admin',
      ipAddress: ip,
      location: { country: 'India', city: 'Mumbai' },
      device: req.headers['user-agent'] || 'Browser',
      browser: 'Chrome',
      os: 'Windows',
      severity: status === 'Approved' ? 'Low' : 'High',
      status: 'Success',
      riskScore: request.riskScore,
      details: `Admin reviewed request ${request.requestId} for user ${request.user.fullName}: Decision set to ${status}. Notes: ${reviewNotes || 'N/A'}`,
    });

    res.status(200).json(request);
  } catch (error) {
    logger.error(`reviewRequest error: ${error.message}`);
    res.status(500).json({ message: 'Error reviewing request', error: error.message });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  reviewRequest,
};
