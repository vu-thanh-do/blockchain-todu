import { Request, Response } from 'express';
import WalletService from '../services/WalletService';
import Transaction from '../models/Transaction';

// @desc    Lấy số dư ví
// @route   GET /api/wallet/balance
// @access  Private
export const getWalletBalance = async (req: Request, res: Response) :Promise<any> => {
  try {
    const { walletAddress } = req.user;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy địa chỉ ví trong thông tin người dùng'
      });
    }

    const balance = await WalletService.getBalance(walletAddress);

    return res.status(200).json({
      success: true,
      data: {
        address: walletAddress,
        balance
      }
    });
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy số dư ví',
      error: (error as Error).message
    });
  }
};

// @desc    Gửi transaction
// @route   POST /api/wallet/send
// @access  Private
export const sendTransaction = async (req: Request, res: Response) :Promise<any> => {
  try {
    const { toAddress, amount, privateKey } = req.body;

    if (!toAddress || !amount || !privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ ví nhận, số lượng và private key'
      });
    }

    // Xác thực private key
    if (!WalletService.validatePrivateKey(privateKey)) {
      return res.status(400).json({
        success: false,
        message: 'Private key không hợp lệ'
      });
    }

    // Kiểm tra địa chỉ ví của private key có khớp với user không
    const addressFromPrivateKey = WalletService.getAddressFromPrivateKey(privateKey);
    if (addressFromPrivateKey !== req.user.walletAddress) {
      return res.status(403).json({
        success: false,
        message: 'Private key không thuộc về ví của bạn'
      });
    }

    // Gửi transaction
    const result = await WalletService.sendTransaction(privateKey, toAddress, amount);

    // Lưu thông tin transaction vào DB
    const transaction = new Transaction({
      txHash: result.signature,
      from: result.fromAddress,
      to: result.toAddress,
      value: result.amount.toString(),
      status: 'success',
      type: 'other',
      timestamp: new Date()
    });

    await transaction.save();

    return res.status(200).json({
      success: true,
      data: {
        txHash: result.signature,
        from: result.fromAddress,
        to: result.toAddress,
        amount: result.amount
      }
    });
  } catch (error) {
    console.error('Error sending transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi transaction',
      error: (error as Error).message
    });
  }
};

// @desc    Lấy lịch sử transaction
// @route   GET /api/wallet/transactions
// @access  Private
export const getTransactionHistory = async (req: Request, res: Response) :Promise<any> => {
  try {
    const { walletAddress } = req.user;
    console.log(walletAddress);
    const { limit = 10, page = 1 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Lấy transactions liên quan đến ví của user
    const transactions = await Transaction.find({
      $or: [
        { from: { $regex: `^${walletAddress}$`, $options: 'i' } },
        { to: { $regex: `^${walletAddress}$`, $options: 'i' } }
      ]
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments({
      $or: [
        { from: { $regex: `^${walletAddress}$`, $options: 'i' } },
        { to: { $regex: `^${walletAddress}$`, $options: 'i' } }
      ]
    });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: transactions
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử giao dịch',
      error: (error as Error).message
    });
  }
}; 