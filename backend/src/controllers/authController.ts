import { Request, Response } from 'express';
import WalletService from '../services/WalletService';
import ContractService from '../services/ContractService';
import User, { IUser } from '../models/User';
import { generateToken } from '../middleware/auth';
import { ethers } from 'ethers';
import crypto from 'crypto';
import Transaction from '../models/Transaction';

// Lưu trữ nonce tạm thời cho mỗi địa chỉ
const nonceStore: { [address: string]: string } = {};

// @desc    Tạo ví mới và đăng ký người dùng
// @route   POST /api/auth/register
// @access  Public
export const createWallet = async (req: Request, res: Response) :Promise<any>=> {
  try {
    const { username, role = 'employee' } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp username'
      });
    }

    // Tạo ví mới với Shyft API
    const wallet = await WalletService.createWallet();

    // Lưu thông tin người dùng vào DB
    const user = new User({
      walletAddress: wallet.address,
      username,
      privateKey: wallet.privateKey, // Sẽ được mã hóa trước khi lưu
      role
    });

    await user.save();

    // Tạo người dùng trên blockchain (chỉ khi đã có smart contract)
    // Bỏ qua bước này nếu chưa deploy contract
    /*
    try {
      await ContractService.createUser(
        wallet.address,
        wallet.privateKey,
        wallet.address,
        username,
        roleToNumber(role)
      );
    } catch (contractError) {
      console.error('Error creating user on blockchain:', contractError);
      // Vẫn tiếp tục vì đã lưu vào DB
    }
    */

    // Tạo token
    const token = generateToken(String(user._id));

    // Trả về thông tin ví và token
    return res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        walletAddress: wallet.address,
        privateKey: wallet.privateKey, // QUAN TRỌNG: Chỉ trả về private key một lần duy nhất khi tạo ví
        username: user.username,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo ví',
      error: (error as Error).message
    });
  }
};

// @desc    Đăng nhập bằng private key
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) :Promise<any> => {
  try {
    const { privateKey } = req.body;

    if (!privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp private key'
      });
    }

    // Validate private key và lấy địa chỉ ví
    if (!WalletService.validatePrivateKey(privateKey)) {
      return res.status(400).json({
        success: false,
        message: 'Private key không hợp lệ'
      });
    }

    const walletAddress = WalletService.getAddressFromPrivateKey(privateKey);

    // Tìm user trong DB
    const user = await User.findOne({ walletAddress }).select('+privateKey');
    
    if (!user) {
      // Tạo user mới nếu chưa tồn tại (optional, có thể bỏ qua)
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy tài khoản cho ví này'
      });
    }

    // Verify private key
    const isMatch = await user.comparePrivateKey(privateKey);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Private key không khớp'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Tạo token
    const token = generateToken(String(user._id));

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng nhập',
      error: (error as Error).message
    });
  }
};

// @desc    Đăng nhập bằng địa chỉ MetaMask
// @route   POST /api/auth/login-metamask
// @access  Public
export const loginWithMetaMask = async (req: Request, res: Response): Promise<any> => {
  try {
    const { address, signature } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ ví'
      });
    }

    // Tìm user trong DB bằng địa chỉ ví
    const user = await User.findOne({ walletAddress: address });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy tài khoản cho địa chỉ ví này'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Tạo transaction mới với các trường bắt buộc
    const transaction = new Transaction({
      txHash: `metamask_login_${Date.now()}_${user._id}`, // Tạo một hash duy nhất
      from: address,
      to: 'system', // Hoặc process.env.CONTRACT_ADDRESS nếu có
      type: 'metamask_login',
      value: '0',
      metadata: {
        userId: user._id,
        username: user.username,
        walletAddress: address,
        loginTime: new Date(),
        signature: signature // Lưu signature vào metadata
      },
      action: 'metamask_login',
      taskId: null,
     
    });

    await transaction.save();

    // Tạo token
    const token = generateToken(String(user._id));

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error('MetaMask login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng nhập với MetaMask',
      error: (error as Error).message
    });
  }
};

// @desc    Lấy thông tin user từ token
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response) :Promise<any> => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng',
      error: (error as Error).message
    });
  }
};

// @desc    Lấy nonce cho việc ký message
// @route   GET /api/auth/nonce/:address
// @access  Public
export const getNonce = async (req: Request, res: Response): Promise<any> => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ ví'
      });
    }

    // Tạo nonce ngẫu nhiên
    const nonce = crypto.randomBytes(32).toString('hex');
    nonceStore[address.toLowerCase()] = nonce;

    return res.status(200).json({
      success: true,
      data: { nonce }
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo nonce',
      error: (error as Error).message
    });
  }
};

// @desc    Verify chữ ký MetaMask
// @route   POST /api/auth/verify-signature
// @access  Public
export const verifySignature = async (req: Request, res: Response): Promise<any> => {
  try {
    const { address, message, signature } = req.body;
    const test = await User.find();
    console.log(test,'test');
    const user = await User.findOne({
      walletAddress: address.toLowerCase() // Chuyển thành chữ thường để khớp với dữ liệu trong DB
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy tài khoản cho địa chỉ ví này'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Tạo token
    const token = generateToken(String(user._id));

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xác thực chữ ký',
      error: (error as Error).message
    });
  }
}; 