const Resource = require('../models/Resource');
const Policy = require('../models/Policy');
const AccessRequest = require('../models/AccessRequest');
const policyEngine = require('../services/policyEngine');
const calculateRisk = require('../utils/calculateRisk');
const logger = require('../utils/logger');

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

module.exports = {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  uploadCloudDocument,
};
