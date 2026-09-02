const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyMfa,
  getUserProfile,
  setupMfa,
  confirmMfa,
  updatePreferences,
  disableMfa,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-mfa', protect, verifyMfa);
router.get('/profile', protect, getUserProfile);
router.post('/mfa/setup', protect, setupMfa);
router.post('/mfa/confirm', protect, confirmMfa);
router.post('/mfa/disable', protect, disableMfa);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
