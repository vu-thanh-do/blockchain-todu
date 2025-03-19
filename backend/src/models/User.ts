import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// Interface cho User document
export interface IUser extends Document {
  walletAddress: string;
  username: string;
  role: 'admin' | 'teamLead' | 'employee';
  status: 'active' | 'inactive';
  privateKey?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePrivateKey: (privateKey: string) => Promise<boolean>;
}

// Schema cho User
const UserSchema: Schema = new Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    privateKey: {
      type: String,
      required: true,
      select: false // Không trả về trong các query mặc định
    },
    // 
    role: {
      type: String,
      enum: ['admin', 'teamLead', 'employee'],
      default: 'employee'
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Mã hóa private key trước khi lưu vào DB
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('privateKey')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.privateKey = await bcrypt.hash(this.privateKey as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method để so sánh private key
UserSchema.methods.comparePrivateKey = async function (privateKey: string): Promise<boolean> {
  try {
    return await bcrypt.compare(privateKey, this.privateKey);
  } catch (error) {
    return false;
  }
};

export default mongoose.model<IUser>('User', UserSchema); 