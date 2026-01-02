import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IList extends Document {
  title: string;
  boardId: Types.ObjectId;
  order: number;
  cards: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ListSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'List title is required'],
      trim: true,
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
    cards: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Card',
      },
    ],
  },
  {
    timestamps: true,
  }
);

ListSchema.index({ boardId: 1, order: 1 });

export default mongoose.model<IList>('List', ListSchema);

