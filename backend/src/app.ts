import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import commentRoutes from './routes/commentRoutes';
import transactionRoutes from './routes/transactionRoutes';
import { errorHandler } from './middleware/error';
import { connectDB } from './config/db';
import User from './models/User';

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/transactions', transactionRoutes);
app.post('api/user/update/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = await User.findByIdAndUpdate(id, { status }, { new: true });
  res.json(user);
});
// Error Handler
app.use(errorHandler);

export default app; 