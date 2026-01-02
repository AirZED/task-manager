import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { Board, List, Card } from '../types';
import { useBoardStore } from '../store/boardStore';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToastStore } from '../store/toastStore';
import { DndBoard } from '../components/DndBoard';
import { SortableList } from '../components/SortableList';
import CardModal from '../components/CardModal';

const BoardView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBoard, lists, loading, setCurrentBoard, setLists, setLoading } = useBoardStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [showAddList, setShowAddList] = useState(false);
  const socket = useSocket(id);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    if (id) {
      loadBoard();
    }
    return () => {
      setCurrentBoard(null);
      setLists([]);
    };
  }, [id]);

  const loadBoard = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await api.getBoard(id);
      setCurrentBoard(response.board);
      setLists(response.lists);
    } catch (error) {
      console.error('Failed to load board:', error);
      addToast('Failed to load board', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListTitle.trim() || !id) return;

    try {
      await api.createList(id, newListTitle);
      addToast('List created successfully', 'success');
      setNewListTitle('');
      setShowAddList(false);
      loadBoard();
    } catch (error: any) {
      console.error('Failed to create list:', error);
      addToast(error.response?.data?.message || 'Failed to create list', 'error');
    }
  };

  const handleCreateCard = async (listId: string, title: string) => {
    if (!id) return;

    try {
      const response = await api.createCard(listId, id, title);
      socket.emitCardCreated(response.card);
      loadBoard();
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  };

  const handleCardUpdate = () => {
    loadBoard();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the card and its current list
    let card: Card | null = null;
    let sourceListId: string | null = null;

    for (const list of lists) {
      const foundCard = list.cards.find((c) => c._id === activeId);
      if (foundCard) {
        card = foundCard;
        sourceListId = list._id;
        break;
      }
    }

    if (!card || !sourceListId) return;

    // Check if dropped on a list or another card
    const targetList = lists.find((l) => l._id === overId);
    const targetCard = lists
      .flatMap((l) => l.cards)
      .find((c) => c._id === overId);

    let targetListId = sourceListId;
    let newOrder = card.order;

    if (targetList) {
      // Dropped on a list
      targetListId = targetList._id;
      newOrder = targetList.cards.length;
    } else if (targetCard) {
      // Dropped on another card
      targetListId = targetCard.listId;
      newOrder = targetCard.order;
    }

    // Optimistic update
    useBoardStore.getState().moveCard(activeId, targetListId, newOrder);

    // API call
    try {
      const response = await api.moveCard(activeId, targetListId, newOrder);
      // Emit socket event for real-time update
      socket.emitCardMoved(response.card);
    } catch (error) {
      console.error('Failed to move card:', error);
      loadBoard(); // Revert on error
    }
  };

  if (!currentBoard || loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-x-auto bg-[#1d2125]">
      <div className="px-6 py-4 border-b border-[#38414a]">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">{currentBoard.title}</h2>
          <div className="flex items-center gap-1 text-dark-text-secondary text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Private</span>
          </div>
        </div>
      </div>
      <DndBoard onDragEnd={handleDragEnd}>
        <div className="min-w-full inline-flex gap-4 px-6 py-6 h-full">
          {lists.map((list) => (
            <SortableList
              key={list._id}
              list={list}
              onCardClick={(card) => setSelectedCard(card)}
              onCreateCard={handleCreateCard}
            />
          ))}

        {showAddList ? (
          <div className="rounded p-4 min-w-[272px] max-w-[272px] h-fit bg-[#22272b]">
            <input
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateList();
                } else if (e.key === 'Escape') {
                  setShowAddList(false);
                  setNewListTitle('');
                }
              }}
              placeholder="Enter list title..."
              className="w-full px-3 py-2 rounded mb-2 text-sm focus:outline-none focus:ring-2 text-white placeholder-dark-text-secondary bg-[#1d2125] border border-[#38414a] text-[#b6c2cf]"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateList}
                className="px-3 py-1.5 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 bg-trello-blue"
              >
                Add List
              </button>
              <button
                onClick={() => {
                  setShowAddList(false);
                  setNewListTitle('');
                }}
                className="px-3 py-1.5 rounded text-sm font-medium transition-colors text-[#b6c2cf] bg-transparent hover:bg-[#2c333a]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddList(true)}
            className="rounded p-4 min-w-[272px] h-fit font-medium transition-colors text-left bg-[#22272b] text-[#b6c2cf] border border-transparent hover:bg-[#2c333a]"
          >
            + Add another list
          </button>
        )}
        </div>
      </DndBoard>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
        />
      )}
    </div>
  );
};

export default BoardView;

