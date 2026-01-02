import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Card from '../models/Card';
import List from '../models/List';
import Board from '../models/Board';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

export const createCard = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { listId, title, description, boardId, status, priority } = req.body;

  if (!title || !boardId) {
    throw new AppError('Title and board ID are required', 400);
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

  // If listId is provided, use it; otherwise, find or create a default list for the status
  let finalListId = listId;
  if (!finalListId && status) {
    // Try to find a list with a title matching the status
    const statusList = await List.findOne({ 
      boardId, 
      title: { $regex: new RegExp(status, 'i') } 
    });
    if (statusList) {
      finalListId = statusList._id.toString();
    }
  }

  // Get max order in list or by status
  let order = 0;
  if (finalListId) {
    const maxOrderCard = await Card.findOne({ listId: finalListId }).sort({ order: -1 });
    order = maxOrderCard ? maxOrderCard.order + 1 : 0;
  } else {
    const maxOrderCard = await Card.findOne({ 
      boardId, 
      status: status || 'todo' 
    }).sort({ order: -1 });
    order = maxOrderCard ? maxOrderCard.order + 1 : 0;
  }

  const card = await Card.create({
    title,
    description: description || '',
    listId: finalListId || board.lists[0] || undefined,
    boardId,
    order,
    status: status || 'todo',
    priority: priority || 'medium',
    assignees: [],
    labels: [],
    comments: [],
  });

  // Update list if listId was provided
  if (finalListId) {
    const list = await List.findById(finalListId);
    if (list) {
      list.cards.push(card._id);
      await list.save();
    }
  }

  await card.populate('assignees', 'name email avatar');

  res.status(201).json({ card });
});

export const getCard = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;

  const card = await Card.findById(id)
    .populate('assignees', 'name email avatar')
    .populate({
      path: 'comments',
      populate: {
        path: 'userId',
        select: 'name email avatar',
      },
      options: { sort: { createdAt: -1 } },
    });

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

  res.json({ card });
});

export const updateCard = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;
  const { title, description, assignees, labels, dueDate, listId, order, status, priority } = req.body;

  const card = await Card.findById(id);
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

  if (title !== undefined) card.title = title;
  if (description !== undefined) card.description = description;
  if (assignees !== undefined) card.assignees = assignees;
  if (labels !== undefined) card.labels = labels;
  if (dueDate !== undefined) card.dueDate = dueDate;
  if (order !== undefined) card.order = order;
  if (status !== undefined) card.status = status;
  if (priority !== undefined) card.priority = priority;

  // If status changed, try to update listId for backward compatibility
  if (status && status !== card.status) {
    const statusList = await List.findOne({ 
      boardId: card.boardId, 
      title: { $regex: new RegExp(status, 'i') } 
    });
    if (statusList) {
      const oldListId = card.listId?.toString();
      if (oldListId !== statusList._id.toString()) {
        // Remove from old list if it exists
        if (oldListId) {
          const oldList = await List.findById(oldListId);
          if (oldList) {
            oldList.cards = oldList.cards.filter((c) => c.toString() !== id);
            await oldList.save();
          }
        }
        // Add to new list
        card.listId = statusList._id as any;
        statusList.cards.push(card._id);
        await statusList.save();
      }
    }
  }

  // If listId changed, update both lists
  if (listId !== undefined && listId !== card.listId?.toString()) {
    const oldListId = card.listId?.toString();
    if (oldListId) {
      const oldList = await List.findById(oldListId);
      if (oldList) {
        oldList.cards = oldList.cards.filter((c) => c.toString() !== id);
        await oldList.save();
      }
    }

    if (listId) {
      const newList = await List.findById(listId);
      if (newList) {
        newList.cards.push(card._id);
        await newList.save();
      }
      card.listId = listId as any;
    }
  }

  await card.save();

  await card.populate('assignees', 'name email avatar');

  res.json({ card });
});

export const deleteCard = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;

  const card = await Card.findById(id);
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

  // Remove card from list
  const list = await List.findById(card.listId);
  if (list) {
    list.cards = list.cards.filter((c) => c.toString() !== id);
    await list.save();
  }

  await Card.findByIdAndDelete(id);

  res.json({ message: 'Card deleted successfully' });
});

export const moveCard = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { cardId, newListId, newOrder, status } = req.body;

  if (!cardId || newOrder === undefined) {
    throw new AppError('Card ID and new order are required', 400);
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

  // Handle status change (when moving between status columns)
  if (status && status !== card.status) {
    card.status = status;
    
    // Try to find a list matching the new status for backward compatibility
    if (newListId) {
      const newList = await List.findById(newListId);
      if (newList) {
        const oldListId = card.listId?.toString();
        if (oldListId && oldListId !== newListId) {
          const oldList = await List.findById(oldListId);
          if (oldList) {
            oldList.cards = oldList.cards.filter((c) => c.toString() !== cardId);
            await oldList.save();
          }
        }
        if (!newList.cards.includes(card._id)) {
          newList.cards.push(card._id);
          await newList.save();
        }
        card.listId = newListId as any;
      }
    } else {
      // Try to find a list with title matching status
      const statusList = await List.findOne({ 
        boardId: card.boardId, 
        title: { $regex: new RegExp(status, 'i') } 
      });
      if (statusList) {
        const oldListId = card.listId?.toString();
        if (oldListId && oldListId !== statusList._id.toString()) {
          const oldList = await List.findById(oldListId);
          if (oldList) {
            oldList.cards = oldList.cards.filter((c) => c.toString() !== cardId);
            await oldList.save();
          }
        }
        if (!statusList.cards.includes(card._id)) {
          statusList.cards.push(card._id);
          await statusList.save();
        }
        card.listId = statusList._id as any;
      }
    }
  } else if (newListId) {
    // Handle list change without status change
    const oldListId = card.listId?.toString();
    const isMovingToList = newListId !== oldListId;

    if (isMovingToList) {
      // Remove from old list
      if (oldListId) {
        const oldList = await List.findById(oldListId);
        if (oldList) {
          oldList.cards = oldList.cards.filter((c) => c.toString() !== cardId);
          await oldList.save();
        }
      }

      // Add to new list
      const newList = await List.findById(newListId);
      if (newList) {
        newList.cards.push(card._id);
        await newList.save();
      }

      card.listId = newListId as any;
    }
  }

  card.order = newOrder;
  await card.save();

  await card.populate('assignees', 'name email avatar');

  res.json({ card });
});

export const getTasksByStatus = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { boardId, status } = req.params;

  if (!boardId || !status) {
    throw new AppError('Board ID and status are required', 400);
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
    throw new AppError('Board not found or access denied', 404);
  }

  // Validate status
  const validStatuses = ['todo', 'in_progress', 'review', 'done'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const tasks = await Card.find({ boardId, status })
    .populate('assignees', 'name email avatar')
    .sort({ order: 1 });

  res.json({ tasks });
});

