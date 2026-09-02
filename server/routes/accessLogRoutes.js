const express = require('express');
const router = express.Router();
const { getMyLogs, getAllLogs } = require('../controllers/accessLogController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/my', protect, getMyLogs);
router.get('/all', protect, authorizeRoles('admin'), getAllLogs);

module.exports = router;
