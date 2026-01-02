import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

export const searchUsers = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    throw new AppError('Search query is required', 400);
  }

  const users = await User.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ],
  })
    .select('name email avatar')
    .limit(10);

  res.json({ users });
});

export const getUser = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await User.findById(id).select('name email avatar');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ user });
});

