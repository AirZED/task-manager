import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import List from '../models/List';
import Board from '../models/Board';
import Card from '../models/Card';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

export const createList = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { boardId, title } = req.body;

  if (!boardId || !title) {
    throw new AppError('Board ID and title are required', 400);
  }

  // Verify user has access to board
  const board = await Board.findOne({
    _id: boardId,
    $or: [
      { ownerId: userId },
      { members: userId },
    ],
  });

  if (!board) {
    throw new AppError('Board not found', 404);
  }

  // Get max order
  const maxOrderList = await List.findOne({ boardId }).sort({ order: -1 });
  const order = maxOrderList ? maxOrderList.order + 1 : 0;

  const list = await List.create({
    title,
    boardId,
    order,
    cards: [],
  });

  board.lists.push(list._id);
  await board.save();

  res.status(201).json({ list });
});

export const updateList = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;
  const { title, order } = req.body;

  const list = await List.findById(id);
  if (!list) {
    throw new AppError('List not found', 404);
  }

  // Verify user has access to board
  const board = await Board.findOne({
    _id: list.boardId,
    $or: [
      { ownerId: userId },
      { members: userId },
    ],
  });

  if (!board) {
    throw new AppError('Access denied', 403);
  }

  if (title) list.title = title;
  if (order !== undefined) list.order = order;

  await list.save();

  res.json({ list });
});

export const deleteList = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;

  const list = await List.findById(id);
  if (!list) {
    throw new AppError('List not found', 404);
  }

  // Verify user has access to board
  const board = await Board.findOne({
    _id: list.boardId,
    $or: [
      { ownerId: userId },
      { members: userId },
    ],
  });

  if (!board) {
    throw new AppError('Access denied', 403);
  }

  // Delete all cards in the list
  await Card.deleteMany({ listId: id });

  // Remove list from board
  board.lists = board.lists.filter((listId) => listId.toString() !== id);
  await board.save();

  await List.findByIdAndDelete(id);

  res.json({ message: 'List deleted successfully' });
});

export const reorderLists = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { boardId, listOrders } = req.body;

  if (!boardId || !listOrders || !Array.isArray(listOrders)) {
    throw new AppError('Board ID and list orders array are required', 400);
  }

  // Verify user has access to board
  const board = await Board.findOne({
    _id: boardId,
    $or: [
      { ownerId: userId },
      { members: userId },
    ],
  });

  if (!board) {
    throw new AppError('Board not found', 404);
  }

  // Update orders
  const updatePromises = listOrders.map(({ listId, order }: { listId: string; order: number }) =>
    List.findByIdAndUpdate(listId, { order })
  );

  await Promise.all(updatePromises);

  res.json({ message: 'Lists reordered successfully' });
});

