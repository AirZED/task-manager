import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Board from '../models/Board';
import List from '../models/List';
import Card from '../models/Card';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

export const getBoards = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  
  const boards = await Board.find({
    $or: [
      { ownerId: userId },
      { members: userId },
    ],
  })
    .populate('ownerId', 'name email avatar')
    .populate('members', 'name email avatar')
    .sort({ updatedAt: -1 });

  res.json({ boards });
});

export const getBoard = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;

  const board = await Board.findOne({
    _id: id,
    $or: [
      { ownerId: userId },
      { members: userId },
    ],
  })
    .populate('ownerId', 'name email avatar')
    .populate('members', 'name email avatar');

  if (!board) {
    throw new AppError('Board not found', 404);
  }

  const lists = await List.find({ boardId: id })
    .populate({
      path: 'cards',
      populate: {
        path: 'assignees',
        select: 'name email avatar',
      },
    })
    .sort({ order: 1 });

  res.json({ board, lists });
});

export const createBoard = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { title, description } = req.body;

  if (!title) {
    throw new AppError('Board title is required', 400);
  }

  const board = await Board.create({
    title,
    description: description || '',
    ownerId: userId,
    members: [userId],
    labels: [],
  });

  await board.populate('ownerId', 'name email avatar');
  await board.populate('members', 'name email avatar');

  res.status(201).json({ board });
});

export const updateBoard = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;
  const { title, description, labels } = req.body;

  const board = await Board.findOneAndUpdate(
    {
      _id: id,
      $or: [
        { ownerId: userId },
        { members: userId },
      ],
    },
    {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(labels && { labels }),
    },
    { new: true }
  )
    .populate('ownerId', 'name email avatar')
    .populate('members', 'name email avatar');

  if (!board) {
    throw new AppError('Board not found', 404);
  }

  res.json({ board });
});

export const deleteBoard = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;

  const board = await Board.findOne({
    _id: id,
    ownerId: userId,
  });

  if (!board) {
    throw new AppError('Board not found or you are not the owner', 404);
  }

  // Delete associated lists and cards
  await Card.deleteMany({ boardId: id });
  await List.deleteMany({ boardId: id });
  await Board.findByIdAndDelete(id);

  res.json({ message: 'Board deleted successfully' });
});

export const addMember = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;
  const { memberId } = req.body;

  if (!memberId) {
    throw new AppError('Member ID is required', 400);
  }

  const board = await Board.findOneAndUpdate(
    {
      _id: id,
      $or: [
        { ownerId: userId },
        { members: userId },
      ],
      members: { $ne: memberId },
    },
    { $addToSet: { members: memberId } },
    { new: true }
  )
    .populate('ownerId', 'name email avatar')
    .populate('members', 'name email avatar');

  if (!board) {
    throw new AppError('Board not found or member already added', 404);
  }

  res.json({ board });
});

export const removeMember = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id, memberId } = req.params;

  const board = await Board.findOne({
    _id: id,
    ownerId: userId,
  });

  if (!board) {
    throw new AppError('Board not found or you are not the owner', 404);
  }

  board.members = board.members.filter(
    (member) => member.toString() !== memberId && member.toString() !== userId
  );

  await board.save();
  await board.populate('ownerId', 'name email avatar');
  await board.populate('members', 'name email avatar');

  res.json({ board });
});

