import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  updateUserStatus,
  deleteUser
} from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Tất cả các routes yêu cầu xác thực
router.use(protect);

// Routes chỉ dành cho Admin và Team Lead
router.route('/')
  .get(authorize('admin', 'teamLead'), getUsers)
  .post(authorize('admin'), createUser);

router.route('/:id')
  .get(authorize('admin', 'teamLead'), getUserById)
  .put(authorize('admin'), updateUser)
  .delete(authorize('admin'), deleteUser);

router.put('/:id/status', authorize('admin'), updateUserStatus);
router.delete('/:id', authorize('admin'), deleteUser);

export default router; 