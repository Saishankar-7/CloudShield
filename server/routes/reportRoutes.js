const express = require('express');
const router = express.Router();
const { getEmployeeStats, getAdminStats } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/employee', protect, getEmployeeStats);
router.get('/admin', protect, authorizeRoles('admin'), getAdminStats);

module.exports = router;
