import Notification, { INotification } from '../models/Notification';
import mongoose from 'mongoose';
import { AppError } from '../utils/appError';

interface CreateNotificationParams {
    userId: mongoose.Types.ObjectId | string;
    message: string;
    type: 'card' | 'comment' | 'board' | 'member' | 'system';
    relatedId?: mongoose.Types.ObjectId | string;
    relatedType?: 'card' | 'board' | 'list' | 'comment';
}

export const createNotification = async (
    params: CreateNotificationParams
): Promise<INotification> => {
    if (!params.userId || !params.message || !params.type) {
        throw new AppError('User ID, message, and type are required', 400);
    }

    const notification = await Notification.create({
        userId: params.userId,
        message: params.message,
        type: params.type,
        relatedId: params.relatedId,
        relatedType: params.relatedType,
        isRead: false,
    });

    return notification;
};

export const getUnreadNotifications = async (
    userId: string
): Promise<INotification[]> => {
    if (!userId) {
        throw new AppError('User ID is required', 400);
    }

    return await Notification.find({ userId, isRead: false })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('relatedId')
        .lean();
};

export const getAllNotifications = async (
    userId: string,
    limit: number = 50,
    skip: number = 0
): Promise<{ notifications: INotification[]; total: number }> => {
    if (!userId) {
        throw new AppError('User ID is required', 400);
    }

    const [notifications, total] = await Promise.all([
        Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate('relatedId')
            .lean(),
        Notification.countDocuments({ userId }),
    ]);

    return { notifications, total };
};

export const markAsRead = async (
    notificationIds: string[],
    userId: string
): Promise<void> => {
    if (!notificationIds || notificationIds.length === 0) {
        throw new AppError('Notification IDs are required', 400);
    }

    if (!userId) {
        throw new AppError('User ID is required', 400);
    }

    // Ensure user can only mark their own notifications as read
    await Notification.updateMany(
        { _id: { $in: notificationIds }, userId },
        { isRead: true }
    );
};

export const markAllAsRead = async (
    userId: string
): Promise<void> => {
    if (!userId) {
        throw new AppError('User ID is required', 400);
    }

    await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
    );
};

export const deleteNotification = async (
    notificationId: string,
    userId: string
): Promise<void> => {
    if (!notificationId) {
        throw new AppError('Notification ID is required', 400);
    }

    if (!userId) {
        throw new AppError('User ID is required', 400);
    }

    const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        userId,
    });

    if (!notification) {
        throw new AppError('Notification not found or access denied', 404);
    }
};

// Helper function to create card-related notifications
export const notifyCardAssignment = async (
    userId: mongoose.Types.ObjectId | string,
    cardId: mongoose.Types.ObjectId | string,
    cardTitle: string,
    assignerName: string
): Promise<void> => {
    await createNotification({
        userId,
        message: `${assignerName} assigned you to "${cardTitle}"`,
        type: 'card',
        relatedId: cardId,
        relatedType: 'card',
    });
};

// Helper function to create comment notifications
export const notifyCommentMention = async (
    userId: mongoose.Types.ObjectId | string,
    commentId: mongoose.Types.ObjectId | string,
    cardId: mongoose.Types.ObjectId | string,
    commenterName: string,
    cardTitle: string
): Promise<void> => {
    await createNotification({
        userId,
        message: `${commenterName} mentioned you in a comment on "${cardTitle}"`,
        type: 'comment',
        relatedId: cardId,
        relatedType: 'card',
    });
};

// Helper function to create board member notifications
export const notifyBoardMemberAdded = async (
    userId: mongoose.Types.ObjectId | string,
    boardId: mongoose.Types.ObjectId | string,
    boardTitle: string,
    adderName: string
): Promise<void> => {
    await createNotification({
        userId,
        message: `${adderName} added you to board "${boardTitle}"`,
        type: 'board',
        relatedId: boardId,
        relatedType: 'board',
    });
};

