import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComment extends Document {
  text: string;
  cardId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
  {
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
    },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

CommentSchema.index({ cardId: 1 });
CommentSchema.index({ userId: 1 });

export default mongoose.model<IComment>('Comment', CommentSchema);

