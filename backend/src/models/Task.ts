import mongoose, { Document, Schema } from 'mongoose';

// Interface cho Task document
export interface ITask extends Document {
  taskId: string; // ID của task trên blockchain
  title: string;
  description: string;
  status: 'created' | 'assigned' | 'in_progress' | 'completed' | 'rejected';
  createdBy: string; // Wallet address của người tạo
  assignee?: string; // Wallet address của người được gán
  ipfsHash?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  completedAt?: Date;
  blockchainTxHash?: string; // Hash của transaction trên blockchain
  createdAt: Date;
  updatedAt: Date;
  progress: number;
}

// Schema cho Task
const TaskSchema: Schema = new Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['created', 'assigned', 'in_progress', 'completed', 'rejected'],
      default: 'created'
    },
    createdBy: {
      type: String,
      required: true,
      ref: 'User'
    },
    assignee: {
      type: String,
      ref: 'User'
    },
    ipfsHash: {
      type: String
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    dueDate: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    blockchainTxHash: {
      type: String
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ITask>('Task', TaskSchema); 