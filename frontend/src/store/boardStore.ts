import { create } from 'zustand';
import { Board, List, Card, Task } from '../types';

interface BoardState {
  currentBoard: Board | null;
  lists: List[];
  loading: boolean;
  setCurrentBoard: (board: Board | null) => void;
  setLists: (lists: List[]) => void;
  addList: (list: List) => void;
  updateList: (listId: string, updates: Partial<List>) => void;
  removeList: (listId: string) => void;
  addCard: (listId: string, card: Card) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  removeCard: (cardId: string) => void;
  moveCard: (cardId: string, newListId: string, newOrder: number) => void;
  setLoading: (loading: boolean) => void;
  // Task management methods
  getTasksByStatus: (boardId: string, status: Task['status']) => Task[];
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  updateTaskPriority: (taskId: string, priority: Task['priority']) => void;
  getTaskStatistics: (boardId: string) => {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
}

export const useBoardStore = create<BoardState>((set) => ({
  currentBoard: null,
  lists: [],
  loading: false,
  setCurrentBoard: (board) => set({ currentBoard: board }),
  setLists: (lists) => set({ lists }),
  addList: (list) =>
    set((state) => ({
      lists: [...state.lists, list].sort((a, b) => a.order - b.order),
    })),
  updateList: (listId, updates) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list._id === listId ? { ...list, ...updates } : list
      ),
    })),
  removeList: (listId) =>
    set((state) => ({
      lists: state.lists.filter((list) => list._id !== listId),
    })),
  addCard: (listId, card) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list._id === listId
          ? { ...list, cards: [...list.cards, card].sort((a, b) => a.order - b.order) }
          : list
      ),
    })),
  updateCard: (cardId, updates) =>
    set((state) => ({
      lists: state.lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card._id === cardId ? { ...card, ...updates } : card
        ),
      })),
    })),
  removeCard: (cardId) =>
    set((state) => ({
      lists: state.lists.map((list) => ({
        ...list,
        cards: list.cards.filter((card) => card._id !== cardId),
      })),
    })),
  moveCard: (cardId, newListId, newOrder) =>
    set((state) => {
      let cardToMove: Card | null = null;
      let oldListId: string | null = null;

      // Find and remove card from old list
      const updatedLists = state.lists.map((list) => {
        const cardIndex = list.cards.findIndex((c) => c._id === cardId);
        if (cardIndex !== -1) {
          cardToMove = list.cards[cardIndex];
          oldListId = list._id;
          return {
            ...list,
            cards: list.cards.filter((c) => c._id !== cardId),
          };
        }
        return list;
      });

      // Add card to new list
      if (cardToMove && oldListId) {
        return {
          lists: updatedLists.map((list) => {
            if (list._id === newListId) {
              const updatedCard = { ...cardToMove!, listId: newListId, order: newOrder };
              return {
                ...list,
                cards: [...list.cards, updatedCard].sort((a, b) => a.order - b.order),
              };
            }
            return list;
          }),
        };
      }

      return { lists: updatedLists };
    }),
  setLoading: (loading) => set({ loading }),
  // Task management methods
  getTasksByStatus: (boardId, status) => {
    const state = useBoardStore.getState();
    return state.lists
      .flatMap((list) => list.cards)
      .filter((card) => card.boardId === boardId && card.status === status);
  },
  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      lists: state.lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card._id === taskId ? { ...card, status } : card
        ),
      })),
    })),
  updateTaskPriority: (taskId, priority) =>
    set((state) => ({
      lists: state.lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card._id === taskId ? { ...card, priority } : card
        ),
      })),
    })),
  getTaskStatistics: (boardId) => {
    const state = useBoardStore.getState();
    const allTasks = state.lists.flatMap((list) => list.cards).filter(
      (card) => card.boardId === boardId
    );
    return {
      total: allTasks.length,
      todo: allTasks.filter((t) => t.status === 'todo').length,
      inProgress: allTasks.filter(
        (t) => t.status === 'in_progress' || t.status === 'review'
      ).length,
      done: allTasks.filter((t) => t.status === 'done').length,
    };
  },
}));

