import express from 'express';
import {
  createWallet,
  login,
  loginWithMetaMask,
  getMe,
  getNonce,
  verifySignature
} from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Đăng ký tài khoản và tạo ví mới
router.post('/register', createWallet);

// Đăng nhập bằng private key
router.post('/login', login);

// Đăng nhập bằng địa chỉ MetaMask
router.post('/login-metamask', loginWithMetaMask);

// Lấy nonce để ký message
router.get('/nonce/:address', getNonce);

// Verify chữ ký MetaMask
router.post('/verify-signature', verifySignature);

// Lấy thông tin người dùng hiện tại (cần xác thực)
router.get('/me', protect, getMe);

export default router; 