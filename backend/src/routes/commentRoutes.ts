import express from 'express';
import { deleteComment } from '../controllers/commentController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Tất cả các routes yêu cầu xác thực
router.use(protect);

// Route xóa comment
router.delete('/:id', deleteComment);

export default router; 