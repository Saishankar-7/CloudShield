const express = require('express');
const router = express.Router();
const {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  uploadCloudDocument,
  requestDocumentOtp,
  verifyDocumentOtp,
  updateResourceAccess,
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { zeroTrustCheck } = require('../middleware/zeroTrustMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Get all resources evaluated dynamically
router.get('/', protect, getResources);

// MFA Challenge for Document Access (sends OTP to user's registered email)
router.post('/:id/request-otp', protect, requestDocumentOtp);

// Verify MFA OTP for Document Access (verifies OTP and unlocks document)
router.post('/:id/verify-otp', protect, verifyDocumentOtp);

// Access a specific resource details (secured by Zero Trust Middleware)
router.get('/:id', protect, zeroTrustCheck, getResourceById);

// Cloud Document Upload from laptop (Admin operation)
router.post('/upload', protect, authorizeRoles('admin'), (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    next();
  });
}, uploadCloudDocument);

// Admin-only Access Management & CRUD operations
router.put('/:id/access', protect, authorizeRoles('admin'), updateResourceAccess);
router.post('/', protect, authorizeRoles('admin'), createResource);
router.put('/:id', protect, authorizeRoles('admin'), updateResource);
router.delete('/:id', protect, authorizeRoles('admin'), deleteResource);

module.exports = router;
