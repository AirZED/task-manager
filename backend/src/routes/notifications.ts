import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  getUnread,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotificationById,
} from '../controllers/notificationController';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread', getUnread);
router.post('/mark-read', markNotificationsAsRead);
router.post('/mark-all-read', markAllNotificationsAsRead);
router.delete('/:id', deleteNotificationById);

export default router;

