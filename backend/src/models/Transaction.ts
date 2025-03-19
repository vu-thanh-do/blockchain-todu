import mongoose, { Document, Schema } from 'mongoose';

// Interface cho Transaction document
export interface ITransaction extends Document {
  txHash: string; // Hash của transaction
  blockNumber?: number;
  from: string; // Địa chỉ ví gửi
  to: string; // Địa chỉ ví nhận hoặc contract
  value: string; // Giá trị
  timestamp: Date;
  status: 'success' | 'pending' | 'failed';
  type: 'create_user' | 'create_task' | 'assign_task' | 'update_task' | 'archive_task' | 'comment' | 'other' | 'metamask_login' | 'metamask_connect';
  metadata?: any; // Thông tin thêm
  gasUsed?: number;
  gasPrice?: string;
  taskId: mongoose.Types.ObjectId;
  action: string;
}

// Schema cho Transaction
const TransactionSchema = new Schema<ITransaction>({
  txHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  blockNumber: {
    type: Number
  },
  from: {
    type: String,
    index: true
  },
  to: {
    type: String,
  },
  value: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['success', 'pending', 'failed'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['create_user', 'create_task', 'assign_task', 'update_task', 'archive_task', 'comment', 'other', 'metamask_login', 'metamask_connect'],
  },
  metadata: {
    userId: String,
    username: String,
    walletAddress: String,
    loginTime: Date,
    connectTime: Date
  },
  gasUsed: {
    type: Number
  },
  gasPrice: {
    type: String
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  action: {
    type: String,
    enum: ['create_task', 'assign_task', 'update_status','metamask_login']
  }
}, {
  timestamps: true
});

// Index cho tìm kiếm theo thời gian
TransactionSchema.index({ timestamp: -1 });

// Index cho tìm kiếm theo type và status
TransactionSchema.index({ type: 1, status: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema); 