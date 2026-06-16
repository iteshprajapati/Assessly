const express = require('express');
const {
  getAllUsers,
  getUser,
  updateUserStatus,
  deleteUser,
  getUserStats,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/:id', authenticate, getUser);
router.patch('/:id/status', authenticate, authorize('admin'), updateUserStatus);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);
router.get('/:id/stats', authenticate, getUserStats);

module.exports = router;
