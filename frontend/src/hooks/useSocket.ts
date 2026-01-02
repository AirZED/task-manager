import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useBoardStore } from '../store/boardStore';
import { Card, Comment } from '../types';

const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

export const useSocket = (boardId: string | undefined) => {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuthStore();
  const {
    addCard,
    updateCard,
    removeCard,
    moveCard: moveCardInStore,
    addList,
    updateList,
    removeList,
  } = useBoardStore();

  useEffect(() => {
    if (!boardId || !token) return;

    // Connect to socket
    const socket = io(API_URL, {
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    // Join board room
    socket.emit('join-board', boardId);

    // Card events
    socket.on('card-moved', (data: { card: Card }) => {
      // Only update if it's not from current user (to avoid double updates)
      moveCardInStore(data.card._id, data.card.listId, data.card.order);
    });

    socket.on('card-created', (data: { card: Card }) => {
      addCard(data.card.listId, data.card);
    });

    socket.on('card-updated', (data: { card: Card }) => {
      updateCard(data.card._id, data.card);
    });

    socket.on('card-deleted', (data: { cardId: string }) => {
      removeCard(data.cardId);
    });

    // List events
    socket.on('list-created', (data: { list: any }) => {
      addList(data.list);
    });

    socket.on('list-updated', (data: { list: any }) => {
      updateList(data.list._id, data.list);
    });

    socket.on('list-deleted', (data: { listId: string }) => {
      removeList(data.listId);
    });

    // Comment events
    socket.on('comment-added', (data: { comment: Comment }) => {
      // Update card to include new comment
      // This will be handled by refreshing the card modal
    });

    socket.on('comment-updated', (data: { comment: Comment }) => {
      // Update comment in card
    });

    socket.on('comment-deleted', (data: { commentId: string }) => {
      // Remove comment from card
    });

    // Error handling
    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
    });

    // Cleanup on unmount
    return () => {
      if (boardId) {
        socket.emit('leave-board', boardId);
      }
      socket.disconnect();
    };
  }, [boardId, token]);

  const emitCardMoved = (card: Card) => {
    if (socketRef.current && boardId) {
      socketRef.current.emit('card-moved', { boardId, card });
    }
  };

  const emitCardCreated = (card: Card) => {
    if (socketRef.current && boardId) {
      socketRef.current.emit('card-created', { boardId, card });
    }
  };

  const emitCardUpdated = (card: Card) => {
    if (socketRef.current && boardId) {
      socketRef.current.emit('card-updated', { boardId, card });
    }
  };

  const emitCardDeleted = (cardId: string) => {
    if (socketRef.current && boardId) {
      socketRef.current.emit('card-deleted', { boardId, cardId });
    }
  };

  const emitCommentAdded = (comment: Comment) => {
    if (socketRef.current && boardId) {
      socketRef.current.emit('comment-added', { boardId, comment });
    }
  };

  const emitCommentUpdated = (comment: Comment) => {
    if (socketRef.current && boardId) {
      socketRef.current.emit('comment-updated', { boardId, comment });
    }
  };

  const emitCommentDeleted = (commentId: string) => {
    if (socketRef.current && boardId) {
      socketRef.current.emit('comment-deleted', { boardId, commentId });
    }
  };

  return {
    emitCardMoved,
    emitCardCreated,
    emitCardUpdated,
    emitCardDeleted,
    emitCommentAdded,
    emitCommentUpdated,
    emitCommentDeleted,
  };
};

