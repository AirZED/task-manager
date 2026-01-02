import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import Board from '../models/Board';

interface SocketUser {
  userId: string;
  socketId: string;
}

const boardUsers = new Map<string, Set<string>>(); // boardId -> Set of socketIds

export const setupSocket = (io: Server): void => {
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      (socket as any).userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;

    console.log(`User ${userId} connected: ${socket.id}`);

    // Join board room
    socket.on('join-board', async (boardId: string) => {
      try {
        // Verify user has access to board
        const board = await Board.findOne({
          _id: boardId,
          $or: [
            { ownerId: userId },
            { members: userId },
          ],
        });

        if (!board) {
          socket.emit('error', { message: 'Access denied to board' });
          return;
        }

        socket.join(`board:${boardId}`);

        // Track user in board
        if (!boardUsers.has(boardId)) {
          boardUsers.set(boardId, new Set());
        }
        boardUsers.get(boardId)!.add(socket.id);

        // Notify others
        socket.to(`board:${boardId}`).emit('user-joined', { userId, socketId: socket.id });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    // Leave board room
    socket.on('leave-board', (boardId: string) => {
      socket.leave(`board:${boardId}`);

      const users = boardUsers.get(boardId);
      if (users) {
        users.delete(socket.id);
        if (users.size === 0) {
          boardUsers.delete(boardId);
        }
      }

      socket.to(`board:${boardId}`).emit('user-left', { userId, socketId: socket.id });
    });

    // Card events
    socket.on('card-moved', (data: { boardId: string; card: any }) => {
      socket.to(`board:${data.boardId}`).emit('card-moved', data);
    });

    socket.on('card-created', (data: { boardId: string; card: any }) => {
      socket.to(`board:${data.boardId}`).emit('card-created', data);
    });

    socket.on('card-updated', (data: { boardId: string; card: any }) => {
      socket.to(`board:${data.boardId}`).emit('card-updated', data);
    });

    socket.on('card-deleted', (data: { boardId: string; cardId: string }) => {
      socket.to(`board:${data.boardId}`).emit('card-deleted', data);
    });

    // Comment events
    socket.on('comment-added', (data: { boardId: string; comment: any }) => {
      socket.to(`board:${data.boardId}`).emit('comment-added', data);
    });

    socket.on('comment-updated', (data: { boardId: string; comment: any }) => {
      socket.to(`board:${data.boardId}`).emit('comment-updated', data);
    });

    socket.on('comment-deleted', (data: { boardId: string; commentId: string }) => {
      socket.to(`board:${data.boardId}`).emit('comment-deleted', data);
    });

    // List events
    socket.on('list-created', (data: { boardId: string; list: any }) => {
      socket.to(`board:${data.boardId}`).emit('list-created', data);
    });

    socket.on('list-updated', (data: { boardId: string; list: any }) => {
      socket.to(`board:${data.boardId}`).emit('list-updated', data);
    });

    socket.on('list-deleted', (data: { boardId: string; listId: string }) => {
      socket.to(`board:${data.boardId}`).emit('list-deleted', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected: ${socket.id}`);

      // Remove from all boards
      boardUsers.forEach((users, boardId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          if (users.size === 0) {
            boardUsers.delete(boardId);
          }
          socket.to(`board:${boardId}`).emit('user-left', { userId, socketId: socket.id });
        }
      });
    });
  });
};

