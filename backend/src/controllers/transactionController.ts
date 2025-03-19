import { Request, Response } from 'express';
import Transaction, { ITransaction } from '../models/Transaction';
import ContractService from '../services/ContractService';

// @desc    Lưu transaction mới
// @route   POST /api/transactions
// @access  Private
export const saveTransaction = async (req: Request, res: Response): Promise<any> => {
  try {
    const transactionData: ITransaction = req.body;

    // Validate dữ liệu đầu vào
    if (!transactionData.txHash || !transactionData.from || !transactionData.to || !transactionData.type) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin transaction'
      });
    }

    // Kiểm tra transaction đã tồn tại chưa
    const existingTransaction = await Transaction.findOne({ txHash: transactionData.txHash });
    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Transaction đã tồn tại'
      });
    }

    // Lưu transaction
    const transaction = new Transaction(transactionData);
    await transaction.save();

    return res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error saving transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu transaction',
      error: (error as Error).message
    });
  }
};

// @desc    Lấy transaction theo hash
// @route   GET /api/transactions/:txHash
// @access  Private
export const getTransactionByHash = async (req: Request, res: Response): Promise<any> => {
  try {
    const { txHash } = req.params;

    const transaction = await Transaction.findOne({ txHash });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy transaction'
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error getting transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin transaction',
      error: (error as Error).message
    });
  }
};

// @desc    Lấy danh sách transaction theo địa chỉ ví
// @route   GET /api/transactions/address/:address
// @access  Private
export const getTransactionsByAddress = async (req: Request, res: Response): Promise<any> => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 10, type, status } = req.query;

    const query: any = {
      $or: [{ from: address }, { to: address }]
    };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    const options = {
      page: Number(page),
      limit: Number(limit),
      sort: { timestamp: -1 }
    };

    const transactions = await Transaction.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ timestamp: -1 });

    const total = await Transaction.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách transaction',
      error: (error as Error).message
    });
  }
};

// @desc    Lấy danh sách transaction theo loại
// @route   GET /api/transactions/type/:type
// @access  Private
export const getTransactionsByType = async (req: Request, res: Response): Promise<any> => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query: any = { type };

    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ timestamp: -1 });

    const total = await Transaction.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách transaction',
      error: (error as Error).message
    });
  }
};

// @desc    Verify transaction trên blockchain
// @route   POST /api/transactions/verify/:txHash
// @access  Private
export const verifyTransaction = async (req: Request, res: Response): Promise<any> => {
  try {
    const { txHash } = req.params;

    // Kiểm tra transaction trong DB
    const transaction = await Transaction.findOne({ txHash });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy transaction'
      });
    }

    // Verify trên blockchain
    const receipt = await ContractService.getTransactionReceipt(txHash);
    
    if (!receipt) {
      transaction.status = 'failed';
      await transaction.save();
      
      return res.status(400).json({
        success: false,
        message: 'Transaction không tồn tại trên blockchain'
      });
    }

    // Cập nhật thông tin từ blockchain
    transaction.status = receipt.status ? 'success' : 'failed';
    transaction.blockNumber = receipt.blockNumber;
    transaction.gasUsed = receipt.gasUsed;
    transaction.gasPrice = receipt.effectiveGasPrice.toString();
    
    await transaction.save();

    return res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi verify transaction',
      error: (error as Error).message
    });
  }
}; 