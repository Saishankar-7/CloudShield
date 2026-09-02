const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  reviewRequest,
} = require('../controllers/accessRequestController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', protect, createRequest);
router.get('/my', protect, getMyRequests);
router.get('/all', protect, authorizeRoles('admin'), getAllRequests);
router.put('/:id/review', protect, authorizeRoles('admin'), reviewRequest);

module.exports = router;
