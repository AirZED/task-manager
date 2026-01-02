import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getUnreadNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../services/notificationService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

export const getNotifications = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = parseInt(req.query.skip as string) || 0;

  const result = await getAllNotifications(userId, limit, skip);

  res.json({
    notifications: result.notifications,
    total: result.total,
    limit,
    skip,
  });
});

export const getUnread = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  const notifications = await getUnreadNotifications(userId);

  res.json({ notifications });
});

export const markNotificationsAsRead = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds)) {
    throw new AppError('Notification IDs array is required', 400);
  }

  await markAsRead(notificationIds, userId);

  res.json({ message: 'Notifications marked as read' });
});

export const markAllNotificationsAsRead = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  await markAllAsRead(userId);

  res.json({ message: 'All notifications marked as read' });
});

export const deleteNotificationById = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;

  await deleteNotification(id, userId);

  res.json({ message: 'Notification deleted successfully' });
});

