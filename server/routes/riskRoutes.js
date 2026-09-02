const express = require('express');
const router = express.Router();
const { getAlerts, updateAlertStatus } = require('../controllers/riskController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/alerts', getAlerts);
router.put('/alerts/:id', updateAlertStatus);

module.exports = router;
