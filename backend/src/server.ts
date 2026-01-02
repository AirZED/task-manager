import dotenv from 'dotenv';
dotenv.config();


import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database';
import { config } from './config/config';
import authRoutes from './routes/auth';
import boardRoutes from './routes/boards';
import listRoutes from './routes/lists';
import cardRoutes from './routes/cards';
import commentRoutes from './routes/comments';
import userRoutes from './routes/users';
import notificationRoutes from './routes/notifications';
import { setupSocket } from './socket';
import errorHandler from './middleware/errorHandler';
import { AppError } from './utils/appError';




const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
  },
});

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Setup Socket.io
setupSocket(io);

// 404 handler - must be after all routes
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  next(err);
});

// Global error handler - must be last
app.use(errorHandler.globalSendError);

const PORT = config.port;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

