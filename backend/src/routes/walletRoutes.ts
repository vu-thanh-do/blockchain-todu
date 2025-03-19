import express from 'express';
import {
  getWalletBalance,
  sendTransaction,
  getTransactionHistory
} from '../controllers/walletController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Tất cả các routes yêu cầu xác thực
router.use(protect);

// Routes cho wallet
router.get('/balance', getWalletBalance);
router.post('/send', sendTransaction);
router.get('/transactions', getTransactionHistory);

export default router; 