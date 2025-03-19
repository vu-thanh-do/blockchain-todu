import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import User from '../models/User';

// Interface mở rộng Request để thêm thuộc tính user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: '7d' // Token hết hạn sau 7 ngày
  });
};

export const protect = async (req: Request, res: Response, next: NextFunction) :Promise<any> => {
  let token;

  // Lấy token từ header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không có token, xác thực thất bại'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as any;

    // Lấy thông tin user từ DB và gắn vào request
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy người dùng với token này'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn'
    });
  }
};

// Middleware để kiểm tra vai trò
export const authorize = (...roles: string[]) :any => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Xác thực người dùng thất bại'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Vai trò ${req.user.role} không có quyền thực hiện hành động này`
      });
    }

    next();
  };
}; 