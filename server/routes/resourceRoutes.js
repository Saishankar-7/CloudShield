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
  revokeUserResourceAccess,
  unblockUserResourceAccess,
  getEmployeeDataRecords,
  getDocumentsRecords,
  getReportsRecords,
  getAnalyticsRecords,
  streamResource,
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { zeroTrustCheck } = require('../middleware/zeroTrustMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Get all resources evaluated dynamically
router.get('/', protect, getResources);

// Synthetic Records Viewers for Decrypted Vault Payloads
router.get('/employee-data/records', protect, getEmployeeDataRecords);
router.get('/documents/records', protect, getDocumentsRecords);
router.get('/reports/records', protect, getReportsRecords);
router.get('/analytics/records', protect, getAnalyticsRecords);

// Stream or Download Decrypted Document (PDF / Cloudinary / Local Vault)
router.get('/:id/stream', protect, streamResource);

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

// Admin-only Granular Access Management & Per-User Revocation
router.post('/:id/revoke-user', protect, authorizeRoles('admin'), revokeUserResourceAccess);
router.post('/:id/unblock-user', protect, authorizeRoles('admin'), unblockUserResourceAccess);
router.put('/:id/access', protect, authorizeRoles('admin'), updateResourceAccess);
router.post('/', protect, authorizeRoles('admin'), createResource);
router.put('/:id', protect, authorizeRoles('admin'), updateResource);
router.delete('/:id', protect, authorizeRoles('admin'), deleteResource);

module.exports = router;
