import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILabel {
  id: string;
  name: string;
  color: string;
}

export interface IBoard extends Document {
  title: string;
  description?: string;
  ownerId: Types.ObjectId;
  members: Types.ObjectId[];
  lists: Types.ObjectId[];
  labels: ILabel[];
  createdAt: Date;
  updatedAt: Date;
}

const LabelSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
  },
  { _id: false }
);

const BoardSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lists: [
      {
        type: Schema.Types.ObjectId,
        ref: 'List',
      },
    ],
    labels: [LabelSchema],
  },
  {
    timestamps: true,
  }
);

BoardSchema.index({ ownerId: 1 });
BoardSchema.index({ members: 1 });

export default mongoose.model<IBoard>('Board', BoardSchema);

