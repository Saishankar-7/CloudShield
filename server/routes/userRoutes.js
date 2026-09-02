const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUserStatus,
  updateUserRole,
  updateUserRiskScore,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/', getAllUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id/status', updateUserStatus);
router.put('/:id/role', updateUserRole);
router.put('/:id/risk', updateUserRiskScore);
router.delete('/:id', deleteUser);

module.exports = router;
