import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Comment from '../models/Comment';
import Card from '../models/Card';
import Board from '../models/Board';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

export const createComment = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { cardId, text } = req.body;

  if (!cardId || !text) {
    throw new AppError('Card ID and text are required', 400);
  }

  const card = await Card.findById(cardId);
  if (!card) {
    throw new AppError('Card not found', 404);
  }

  // Verify user has access to board
  const board = await Board.findOne({
    _id: card.boardId,
    $or: [
      { ownerId: userId },
      { members: userId },
    ],
  });

  if (!board) {
    throw new AppError('Access denied', 403);
  }

  const comment = await Comment.create({
    text,
    cardId,
    userId,
  });

  card.comments.push(comment._id);
  await card.save();

  await comment.populate('userId', 'name email avatar');

  res.status(201).json({ comment });
});

export const updateComment = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    throw new AppError('Comment text is required', 400);
  }

  const comment = await Comment.findById(id);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  // Verify user owns the comment
  if (comment.userId.toString() !== userId) {
    throw new AppError('Access denied', 403);
  }

  comment.text = text;
  await comment.save();

  await comment.populate('userId', 'name email avatar');

  res.json({ comment });
});

export const deleteComment = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;

  const comment = await Comment.findById(id);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  // Verify user owns the comment
  if (comment.userId.toString() !== userId) {
    throw new AppError('Access denied', 403);
  }

  // Remove comment from card
  const card = await Card.findById(comment.cardId);
  if (card) {
    card.comments = card.comments.filter((c) => c.toString() !== id);
    await card.save();
  }

  await Comment.findByIdAndDelete(id);

  res.json({ message: 'Comment deleted successfully' });
});

