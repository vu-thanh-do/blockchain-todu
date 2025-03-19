import { Request, Response } from 'express';
import Task from '../models/Task';
import User from '../models/User';
import Transaction from '../models/Transaction';

// @desc    Lấy danh sách task
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req: Request, res: Response) :Promise<any> => {
  try {
    // Lọc theo status, priority, createdBy, assignee
    const filter: any = {};
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.createdBy) filter.createdBy = req.query.createdBy;
    if (req.query.assignee) filter.assignee = req.query.assignee;

    // Người dùng không phải admin hoặc teamLead chỉ được xem task của họ
    if (req.user.role === 'employee') {
      filter.$or = [
        { createdBy: req.user.walletAddress },
        { assignee: req.user.walletAddress }
      ];
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách task',
      error: (error as Error).message
    });
  }
};

// @desc    Lấy thông tin task theo ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req: Request, res: Response) :Promise<any> => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy task'
      });
    }

    // Người dùng không phải admin hoặc teamLead chỉ được xem task của họ
    if (req.user.role === 'employee' && 
        task.createdBy !== req.user.walletAddress && 
        task.assignee !== req.user.walletAddress) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem task này'
      });
    }

    return res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error getting task by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin task',
      error: (error as Error).message
    });
  }
};

// @desc    Tạo task mới
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { 
            title, 
            description, 
            priority, 
            dueDate, 
            ipfsHash,
            txHash,
            metadata 
        } = req.body;

        // Tạo task mới
        const task = new Task({
            title,
            description,
            priority,
            dueDate,
            ipfsHash,
            createdBy: req.user.id,
            status: 'created'
        });

        // Lưu task
        await task.save();

        // Nếu có transaction hash, lưu thông tin transaction
        if (txHash) {
            const transaction = new Transaction({
                txHash,
                taskId: task._id,
                action: 'create_task',
                status: 'success',
                metadata: metadata,
                from: req.user.walletAddress,
                to: process.env.CONTRACT_ADDRESS || '', // Thêm địa chỉ contract
                value: '0',
                type: 'create_task', // Thêm type
                timestamp: new Date()
            });

            await transaction.save();
        }

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo task',
            error: (error as Error).message
        });
    }
};

// @desc    Gán task cho người dùng
// @route   PUT /api/tasks/:id/assign
// @access  Private/Admin, TeamLead
export const assignTask = async (req: Request, res: Response) :Promise<any> => {
  try {
    const { assignee } = req.body;

    if (!assignee) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ ví người được gán'
      });
    }

    // Kiểm tra task
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy task'
      });
    }

    // Kiểm tra người được gán
    const assigneeUser = await User.findOne({ walletAddress: assignee });

    if (!assigneeUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng với địa chỉ ví này'
      });
    }

    // Cập nhật task
    task.assignee = assignee;
    task.status = 'assigned';
    await task.save();

    // Cập nhật trên blockchain (nếu đã có smart contract)
    /*
    try {
      await ContractService.assignTask(
        req.user.walletAddress,
        req.user.privateKey, // Cần client truyền lên
        parseInt(task.taskId),
        assignee
      );
    } catch (contractError) {
      console.error('Error assigning task on blockchain:', contractError);
    }
    */

    return res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi gán task',
      error: (error as Error).message
    });
  }
};

// @desc    Cập nhật trạng thái task
// @route   PUT /api/tasks/:id/status
// @access  Private
export const updateTaskStatus = async (req: Request, res: Response) :Promise<any> => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái'
      });
    }

    // Kiểm tra task
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy task'
      });
    }

    // Kiểm tra quyền: chỉ người được gán, người tạo, admin và teamLead mới có thể cập nhật
    if (req.user.role === 'employee' && 
        task.assignee !== req.user.walletAddress && 
        task.createdBy !== req.user.walletAddress) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật task này'
      });
    }

    // Cập nhật trạng thái
    task.status = status;
    
    // Nếu hoàn thành, ghi nhận thời gian
    if (status === 'completed') {
      task.completedAt = new Date();
    }
    
    await task.save();

    // Cập nhật trên blockchain (nếu đã có smart contract)
    /*
    try {
      await ContractService.updateTaskStatus(
        req.user.walletAddress,
        req.user.privateKey, // Cần client truyền lên
        parseInt(task.taskId),
        statusToNumber(status)
      );
    } catch (contractError) {
      console.error('Error updating task status on blockchain:', contractError);
    }
    */

    return res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái task',
      error: (error as Error).message
    });
  }
};

// @desc    Cập nhật thông tin task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req: Request, res: Response) :Promise<any> => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      ipfsHash
    } = req.body;

    // Kiểm tra task
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy task'
      });
    }

    // Kiểm tra quyền: chỉ người tạo, admin và teamLead mới có thể cập nhật thông tin
    if (req.user.role === 'employee' && task.createdBy !== req.user.walletAddress) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật task này'
      });
    }

    // Cập nhật thông tin
    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (ipfsHash) task.ipfsHash = ipfsHash;

    await task.save();

    return res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin task',
      error: (error as Error).message
    });
  }
};
