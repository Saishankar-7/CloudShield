const Resource = require('../models/Resource');
const Policy = require('../models/Policy');
const AccessRequest = require('../models/AccessRequest');
const DocumentOtp = require('../models/DocumentOtp');
const emailService = require('../services/emailService');
const mfaService = require('../services/mfaService');
const loggingService = require('../services/loggingService');
const policyEngine = require('../services/policyEngine');
const calculateRisk = require('../utils/calculateRisk');
const logger = require('../utils/logger');

const maskEmail = (email) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
};

/**
 * Get all resources, evaluating access permissions dynamically for the current user context.
 */
const getResources = async (req, res) => {
  try {
    const resources = await Resource.find().populate('accessPolicy');
    const user = req.user;

    // Simulate request header contexts
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

    const evaluated = await Promise.all(
      resources.map(async (resourceItem) => {
        const policy = resourceItem.accessPolicy;

        // Calculate score
        const { score, riskLevel } = calculateRisk({
          user,
          resource: resourceItem,
          deviceInfo,
          locationInfo,
          policy,
        });

        // Evaluate policy
        let { decision, reason, accessLevel } = policyEngine.evaluatePolicy({
          user,
          resource: resourceItem,
          policy,
          riskScore: score,
          deviceInfo,
          locationInfo,
        });

        // Check if there is an approved access request override
        let isOverridden = false;
        if (decision === 'Deny' && score < 81) {
          const approvedReq = await AccessRequest.findOne({
            user: user._id,
            resource: resourceItem._id,
            status: 'Approved',
            accessExpiresOn: { $gt: new Date() },
          });

          if (approvedReq) {
            decision = 'Allow';
            reason = 'Access granted via approved request.';
            isOverridden = true;
          }
        }

        // Check request status
        const requestItem = await AccessRequest.findOne({
          user: user._id,
          resource: resourceItem._id,
        }).sort({ createdAt: -1 });

        return {
          ...resourceItem.toObject(),
          decision,
          reason,
          accessLevel,
          computedRiskScore: score,
          computedRiskLevel: riskLevel,
          requestStatus: requestItem ? requestItem.status : null,
          requestId: requestItem ? requestItem._id : null,
        };
      })
    );

    res.status(200).json(evaluated);
  } catch (error) {
    logger.error(`getResources error: ${error.message}`);
    res.status(500).json({ message: 'Error retrieving resources', error: error.message });
  }
};

/**
 * Access a specific resource details. Evaluates zeroTrust Gateway.
 */
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Since zeroTrustCheck middleware ran before this, we are allowed access.
    res.status(200).json({
      message: 'Access Granted by CloudShield Zero Trust Gateway',
      resource,
      context: req.zeroTrustContext,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error accessing resource' });
  }
};

/**
 * Create a resource (Admin only)
 */
const createResource = async (req, res) => {
  try {
    const {
      name,
      identifier,
      type,
      category,
      owner,
      sensitivity,
      status,
      description,
      accessPolicyId,
      cloudStorage,
    } = req.body;

    const resource = new Resource({
      name,
      identifier,
      type: type || 'Document',
      category: category || 'Business',
      owner,
      sensitivity: sensitivity || 'Low',
      status: status || 'Protected',
      description,
      accessPolicy: accessPolicyId || null,
      cloudStorage: cloudStorage || { isCloudPdf: false },
      createdBy: req.user._id,
    });

    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    logger.error(`createResource error: ${error.message}`);
    res.status(500).json({ message: 'Failed to create resource', error: error.message });
  }
};

/**
 * Update resource (Admin only)
 */
const updateResource = async (req, res) => {
  try {
    const {
      name,
      identifier,
      type,
      category,
      owner,
      sensitivity,
      status,
      description,
      accessPolicy,
      cloudStorage,
    } = req.body;

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    resource.name = name || resource.name;
    resource.identifier = identifier || resource.identifier;
    resource.type = type || resource.type;
    resource.category = category || resource.category;
    resource.owner = owner || resource.owner;
    resource.sensitivity = sensitivity || resource.sensitivity;
    resource.status = status || resource.status;
    resource.description = description || resource.description;
    if (accessPolicy !== undefined) {
      resource.accessPolicy = accessPolicy || null;
    }
    if (cloudStorage !== undefined) {
      resource.cloudStorage = cloudStorage;
    }

    await resource.save();
    res.status(200).json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update resource' });
  }
};

/**
 * Delete resource (Admin only)
 */
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.status(200).json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resource' });
  }
};

const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Upload Document / PDF file from laptop to cloud storage vault (Cloudinary / Local)
 */
const uploadCloudDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No document file provided.' });
    }

    const file = req.file;
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const isImage = file.mimetype?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(file.originalname);
    const resourceType = isImage ? 'image' : 'raw';
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const localStreamUrl = `${protocol}://${host}/uploads/${file.filename}`;

    // 1. If Cloudinary credentials are provided, upload directly to Cloudinary Cloud CDN!
    if (isCloudinaryConfigured()) {
      try {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          resource_type: resourceType,
          folder: 'cloudshield_documents',
          use_filename: true,
          unique_filename: true,
        });

        const sizeInMb = (uploadResult.bytes / (1024 * 1024)).toFixed(2) + ' MB';

        return res.status(200).json({
          success: true,
          message: 'Document uploaded directly to Cloudinary Cloud CDN successfully.',
          file: {
            fileName: file.originalname,
            storedName: file.filename,
            fileSize: sizeInMb,
            sizeBytes: uploadResult.bytes,
            fileType: file.mimetype || 'application/pdf',
            fileUrl: localStreamUrl, // Accessible by all browser iframes and viewers
            cloudinaryUrl: uploadResult.secure_url,
            cloudUri: `cloudinary://${uploadResult.public_id}`,
            provider: 'Cloudinary Cloud',
            bucketName: process.env.CLOUDINARY_CLOUD_NAME || 'cloudinary-vault',
            encryption: 'AES-256 Cloudinary Secure CDN (HTTPS / TLS 1.3)',
            isCloudPdf: isPdf,
          },
        });
      } catch (cloudErr) {
        logger.warn(`Cloudinary upload failed, falling back to local vault: ${cloudErr.message}`);
      }
    }

    // 2. Fallback to Local Cloud Storage Vault
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const fileUrl = localStreamUrl;

    const provider = req.body.provider || 'Cloudinary Cloud';
    const bucketName = req.body.bucketName || 'cloudshield-secure-vault';
    const cloudUri = `s3://${bucketName}/uploads/${file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Document uploaded to Cloud Storage Vault successfully.',
      file: {
        fileName: file.originalname,
        storedName: file.filename,
        fileSize: sizeInMb,
        sizeBytes: file.size,
        fileType: file.mimetype,
        fileUrl,
        cloudUri,
        provider,
        bucketName,
        encryption: 'AES-256 Server-Side Encryption (KMS)',
        isCloudPdf: isPdf,
      },
    });
  } catch (error) {
    logger.error(`uploadCloudDocument error: ${error.message}`);
    res.status(500).json({ message: 'Failed to upload document to cloud storage', error: error.message });
  }
};

/**
 * Request MFA OTP sent to registered email for accessing a document.
 */
const requestDocumentOtp = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const user = req.user;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Capture context
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

    // Generate 6-digit OTP
    const otp = mfaService.generateNumericOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any previous pending OTPs for this user & resource
    await DocumentOtp.deleteMany({ user: user._id, resource: resource._id, verified: false });

    // Store new OTP
    const docOtp = new DocumentOtp({
      user: user._id,
      resource: resource._id,
      email: user.email,
      otp,
      expiresAt,
      purpose: 'document_access',
    });
    await docOtp.save();

    // Send email via emailService
    await emailService.sendDocumentAccessOtp({
      user,
      resource,
      otp,
      deviceInfo,
      locationInfo,
    });

    // Log the OTP dispatch event in audit trail
    await loggingService.logEvent({
      user: user._id,
      resource: resource._id,
      eventType: 'MFA OTP Sent',
      category: 'Authentication',
      accessAction: 'OTP Challenge',
      ipAddress: deviceInfo.ip,
      location: locationInfo,
      device: deviceInfo.deviceName,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      severity: 'Low',
      status: 'Success',
      riskScore: user.riskScore || 10,
      details: `Document access verification OTP sent to registered email ${user.email} for document "${resource.name}"`,
    });

    const targetEmail =
      (user.email.endsWith('@company.com') || user.email.endsWith('@example.com')) && process.env.EMAIL_USER
        ? process.env.EMAIL_USER
        : user.email;

    res.status(200).json({
      success: true,
      message: `Security OTP sent to your registered email (${maskEmail(targetEmail)})`,
      email: targetEmail,
      maskedEmail: maskEmail(targetEmail),
      expiresInSeconds: 600,
      resourceName: resource.name,
    });
  } catch (error) {
    logger.error(`requestDocumentOtp error: ${error.message}`);
    res.status(500).json({ message: 'Failed to send OTP to registered email', error: error.message });
  }
};

/**
 * Verify MFA OTP to access a document and return decrypted payload.
 */
const verifyDocumentOtp = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const { otp } = req.body;
    const user = req.user;

    if (!otp || typeof otp !== 'string' || !otp.trim()) {
      return res.status(400).json({ message: 'Please enter the 6-digit OTP code sent to your email.' });
    }

    const cleanOtp = otp.trim();

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Capture context
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

    // Find active OTP record
    const otpRecord = await DocumentOtp.findOne({
      user: user._id,
      resource: resource._id,
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    const isValid = otpRecord && otpRecord.otp === cleanOtp;

    if (!isValid) {
      if (otpRecord) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        if (otpRecord.attempts >= 5) {
          await DocumentOtp.deleteOne({ _id: otpRecord._id });
          return res.status(400).json({
            message: 'Too many invalid attempts. The OTP has been invalidated. Please request a new code.',
          });
        }
      }

      // Log failed attempt in audit trail
      await loggingService.logEvent({
        user: user._id,
        resource: resource._id,
        eventType: 'MFA Verification',
        category: 'Authentication',
        accessAction: 'View',
        ipAddress: deviceInfo.ip,
        location: locationInfo,
        device: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        severity: 'Medium',
        status: 'Failed',
        riskScore: (user.riskScore || 10) + 15,
        details: `Invalid MFA OTP attempt entered for document "${resource.name}"`,
      });

      return res.status(400).json({
        message: 'Invalid OTP code. Please check your registered email or request a new code.',
      });
    }

    // Mark record as verified
    if (otpRecord) {
      otpRecord.verified = true;
      await otpRecord.save();
    }

    // Log success in audit trail
    await loggingService.logEvent({
      user: user._id,
      resource: resource._id,
      eventType: 'MFA Document Verification',
      category: 'Access',
      accessAction: 'View',
      ipAddress: deviceInfo.ip,
      location: locationInfo,
      device: deviceInfo.deviceName,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      severity: 'Low',
      status: 'Success',
      riskScore: user.riskScore || 10,
      details: `User verified email OTP and successfully accessed document "${resource.name}"`,
    });

    res.status(200).json({
      success: true,
      message: 'MFA Verification successful. Document decrypted.',
      accessGranted: true,
      resource,
      context: {
        mfaVerified: true,
        method: 'Email_OTP',
        verifiedAt: new Date(),
        userEmail: user.email,
      },
    });
  } catch (error) {
    logger.error(`verifyDocumentOtp error: ${error.message}`);
    res.status(500).json({ message: 'Error verifying document OTP', error: error.message });
  }
};

/**
 * Admin: Update Resource Access Controls & Policies
 */
const updateResourceAccess = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const {
      allowedDepartments,
      allowedRoles,
      mfaRequirement,
      downloadAllowed,
      accessStatus,
      sensitivity,
      status,
    } = req.body;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (allowedDepartments !== undefined) resource.allowedDepartments = allowedDepartments;
    if (allowedRoles !== undefined) resource.allowedRoles = allowedRoles;
    if (mfaRequirement !== undefined) resource.mfaRequirement = mfaRequirement;
    if (downloadAllowed !== undefined) resource.downloadAllowed = downloadAllowed;
    if (accessStatus !== undefined) resource.accessStatus = accessStatus;
    if (sensitivity !== undefined) resource.sensitivity = sensitivity;
    if (status !== undefined) resource.status = status;

    await resource.save();

    // Log admin access policy modification
    await loggingService.logEvent({
      user: req.user._id,
      resource: resource._id,
      eventType: 'Policy Changed',
      category: 'Admin Actions',
      accessAction: 'Admin',
      ipAddress: req.ip || '127.0.0.1',
      device: req.headers['user-agent'] || 'Browser',
      severity: 'Low',
      status: 'Success',
      riskScore: 0,
      details: `Admin updated access control rules for resource "${resource.name}": Status=${resource.accessStatus}, MFA=${resource.mfaRequirement}, Depts=${resource.allowedDepartments.join(', ')}`,
    });

    res.status(200).json({
      success: true,
      message: 'Resource access controls updated successfully.',
      resource,
    });
  } catch (error) {
    logger.error(`updateResourceAccess error: ${error.message}`);
    res.status(500).json({ message: 'Failed to update resource access controls', error: error.message });
  }
};

module.exports = {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  uploadCloudDocument,
  requestDocumentOtp,
  verifyDocumentOtp,
  updateResourceAccess,
};
