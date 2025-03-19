import express from 'express';

import { getCommentsByTaskId, addComment } from '../controllers/commentController';
import { protect, authorize } from '../middleware/auth';
import { assignTask, createTask, getTaskById, getTasks, updateTask, updateTaskStatus, updateTaskProgress } from '../controllers/taskController';

const router = express.Router();

// Tất cả các routes yêu cầu xác thực
router.use(protect);

// Routes cho task
router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask);

// Routes cho task status và assignment
router.put('/:id/status', updateTaskStatus);
router.put('/:id/assign', authorize('admin', 'teamLead'), assignTask);

// Routes cho comments của task
router.route('/:taskId/comments')
  .get(getCommentsByTaskId)
  .post(addComment);

router.put('/:taskId/progress', updateTaskProgress);

export default router; 