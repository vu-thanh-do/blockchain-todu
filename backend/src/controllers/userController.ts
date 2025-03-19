import { Request, Response } from 'express';
import User from '../models/User';
import WalletService from '../services/WalletService';
import ContractService from '../services/ContractService';
import { roleToNumber } from '../utils/blockchain';

// @desc    Lấy danh sách người dùng
// @route   GET /api/users
// @access  Private/Admin, TeamLead
export const getUsers = async (req: Request, res: Response) :Promise<any> => {
  try {
    const users = await User.find().select('-privateKey');

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng',
      error: (error as Error).message
    });
  }
};

// @desc    Lấy thông tin người dùng theo ID
// @route   GET /api/users/:id
// @access  Private/Admin, TeamLead
export const getUserById = async (req: Request, res: Response) :Promise<any> => {
  try {
    const user = await User.findById(req.params.id).select('-privateKey');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng',
      error: (error as Error).message
    });
  }
};

// @desc    Tạo người dùng mới
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req: Request, res: Response) :Promise<any> => {
  try {
    const { username, role = 'employee' } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên người dùng'
      });
    }

    // Tạo ví mới
    const wallet = await WalletService.createWallet();

    // Tạo người dùng trong DB
    const user = new User({
      walletAddress: wallet.address,
      username,
      privateKey: wallet.privateKey,
      role
    });

    await user.save();

    // Tạo người dùng trên blockchain (nếu đã có smart contract)
    // Bỏ qua nếu chưa deploy contract
    /*
    try {
      // Sử dụng ví của Admin để tạo người dùng
      await ContractService.createUser(
        req.user.walletAddress, // Địa chỉ ví của admin
        req.user.privateKey, // Private key của admin (cần truyền từ client)
        wallet.address,
        username,
        roleToNumber(role)
      );
    } catch (contractError) {
      console.error('Error creating user on blockchain:', contractError);
      // Vẫn tiếp tục vì đã lưu vào DB
    }
    */

    return res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        walletAddress: wallet.address,
        privateKey: wallet.privateKey, // Trả về private key chỉ một lần
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo người dùng',
      error: (error as Error).message
    });
  }
};

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req: Request, res: Response) :Promise<any> => {
  try {
    const { username, role, status } = req.body;

    // Tìm người dùng
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Cập nhật thông tin
    if (username) user.username = username;
    if (role) user.role = role;
    if (status) user.status = status;

    // Lưu thay đổi
    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin người dùng',
      error: (error as Error).message
    });
  }
};

// @desc    Vô hiệu hóa tài khoản người dùng
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deactivateUser = async (req: Request, res: Response) :Promise<any> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Không xóa thực sự, chỉ đánh dấu là inactive
    user.status = 'inactive';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Tài khoản đã bị vô hiệu hóa'
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi vô hiệu hóa tài khoản',
      error: (error as Error).message
    });
  }
};

// Thêm 2 function mới
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.body;
        const userId = req.params.id;

        // Kiểm tra quyền (chỉ admin mới được thay đổi trạng thái)
        if (req.user.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Không có quyền thay đổi trạng thái người dùng'
            });
            return;
        }

        // Tìm và cập nhật user
        const user = await User.findById(userId);
        
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
            return;
        }

        // Không cho phép thay đổi trạng thái của admin
        if (user.role === 'admin') {
            res.status(403).json({
                success: false,
                message: 'Không thể thay đổi trạng thái của admin'
            });
            return;
        }

        user.status = status;
        await user.save();

        res.status(200).json({
            success: true,
            data: user,
            message: `Đã ${status === 'active' ? 'kích hoạt' : 'khóa'} người dùng thành công`
        });

    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái người dùng',
            error: (error as Error).message
        });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;

        // Kiểm tra quyền (chỉ admin mới được xóa)
        if (req.user.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Không có quyền xóa người dùng'
            });
            return;
        }

        // Tìm user cần xóa
        const user = await User.findByIdAndDelete(userId);
        
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
            return;
        }

        // Không cho phép xóa tài khoản admin
 

        // Thực hiện soft delete
        // Hoặc xóa hoàn toàn (hard delete)
        // await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: 'Xóa người dùng thành công'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa người dùng',
            error: (error as Error).message
        });
    }
}; 