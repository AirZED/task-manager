import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  message: string;
  type: 'card' | 'comment' | 'board' | 'member' | 'system';
  relatedId?: mongoose.Types.ObjectId; // ID of related card, board, etc.
  relatedType?: 'card' | 'board' | 'list' | 'comment';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['card', 'comment', 'board', 'member', 'system'],
      required: true,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      refPath: 'relatedType',
    },
    relatedType: {
      type: String,
      enum: ['card', 'board', 'list', 'comment'],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);

