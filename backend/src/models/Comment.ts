import mongoose, { Document, Schema } from 'mongoose';

// Interface cho Comment document
export interface IComment extends Document {
  taskId: string; // ID của task
  content: string;
  author: string; // Wallet address của người bình luận
  blockchainTxHash?: string; // Hash của transaction trên blockchain
  createdAt: Date;
  updatedAt: Date;
}

// Schema cho Comment
const CommentSchema: Schema = new Schema(
  {
    taskId: {
      type: String,
      required: true,
      ref: 'Task'
    },
    content: {
      type: String,
      required: true
    },
    author: {
      type: String,
      required: true,
      ref: 'User'
    },
    blockchainTxHash: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Index để tối ưu query comments theo taskId
CommentSchema.index({ taskId: 1 });

export default mongoose.model<IComment>('Comment', CommentSchema); 