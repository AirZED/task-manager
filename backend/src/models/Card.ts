import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICard extends Document {
  title: string;
  description?: string;
  listId: Types.ObjectId;
  boardId: Types.ObjectId;
  order: number;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignees: Types.ObjectId[];
  labels: string[];
  comments: Types.ObjectId[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Card title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    listId: {
      type: Schema.Types.ObjectId,
      ref: 'List',
      required: true,
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'done'],
      default: 'todo',
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      required: true,
    },
    assignees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    labels: [
      {
        type: String,
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

CardSchema.index({ listId: 1, order: 1 });
CardSchema.index({ boardId: 1 });
CardSchema.index({ boardId: 1, status: 1 });
CardSchema.index({ status: 1 });

export default mongoose.model<ICard>('Card', CardSchema);

