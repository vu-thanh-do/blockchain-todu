import express from 'express';
import {
  saveTransaction,
  getTransactionByHash,
  getTransactionsByAddress,
  getTransactionsByType,
  verifyTransaction
} from '../controllers/transactionController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Tất cả các routes yêu cầu xác thực
router.use(protect);

// Lưu transaction mới
router.post('/', saveTransaction);

// Lấy transaction theo hash
router.get('/:txHash', getTransactionByHash);

// Lấy danh sách transaction theo địa chỉ ví
router.get('/address/:address', getTransactionsByAddress);

// Lấy danh sách transaction theo loại
router.get('/type/:type', getTransactionsByType);

// Verify transaction trên blockchain
router.post('/verify/:txHash', verifyTransaction);

export default router; 