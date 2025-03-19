import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import { connectDB } from './config/database';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import commentRoutes from './routes/commentRoutes';
import walletRoutes from './routes/walletRoutes';

// Khởi tạo Express app
const app = express();

// Kết nối database
connectDB();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/wallet', walletRoutes);

// Route mặc định
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to TodoList Blockchain API'
  });
});

// Xử lý route không tồn tại
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint không tồn tại'
  });
});

// Khởi động server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT} trong chế độ ${config.nodeEnv}`);
}); 