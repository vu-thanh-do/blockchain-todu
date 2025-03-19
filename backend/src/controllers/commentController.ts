import { Request, Response } from 'express';
import Comment from '../models/Comment';
import Task from '../models/Task';

// @desc    Lấy danh sách comment của task
// @route   GET /api/tasks/:taskId/comments
// @access  Private
export const getCommentsByTaskId = async (req: Request, res: Response) :Promise<any> => {
  try {
    const { taskId } = req.params;
    console.log(taskId,'taskId');
    // Kiểm tra task có tồn tại không
    const task = await Task.findOne({ _id: taskId });
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
        message: 'Không có quyền xem bình luận của task này'
      });
    }

    // Lấy danh sách comment
    const comments = await Comment.find({ taskId }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bình luận',
      error: (error as Error).message
    });
  }
};

// @desc    Thêm comment mới
// @route   POST /api/tasks/:taskId/comments
// @access  Private
export const addComment = async (req: Request, res: Response) :Promise<any> => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp nội dung bình luận'
      });
    }

    // Kiểm tra task có tồn tại không
    const task = await Task.findOne({ _id: taskId });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy task'
      });
    }

    // Người dùng không phải admin hoặc teamLead chỉ được comment task của họ
    if (req.user.role === 'employee' && 
        task.createdBy !== req.user.walletAddress && 
        task.assignee !== req.user.walletAddress) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền bình luận task này'
      });
    }

    // Tạo comment mới
    const comment = new Comment({
      taskId,
      content,
      author: req.user.walletAddress
    });

    await comment.save();

    // TODO: Thêm bình luận vào blockchain nếu có

    return res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm bình luận',
      error: (error as Error).message
    });
  }
};

// @desc    Xóa comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req: Request, res: Response) :Promise<any> => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }

    // Kiểm tra quyền: chỉ tác giả, admin, hoặc teamLead mới có thể xóa
    if (req.user.role === 'employee' && comment.author !== req.user.walletAddress) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa bình luận này'
      });
    }

    await comment.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Đã xóa bình luận'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bình luận',
      error: (error as Error).message
    });
  }
}; 