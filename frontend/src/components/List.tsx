import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card as CardType } from '../types';
import { SortableCard } from './SortableCard';

interface ListProps {
  list: {
    _id: string;
    title: string;
    cards: CardType[];
  };
  onCardClick: (card: CardType) => void;
  onCreateCard?: (listId: string, title: string) => void;
}

export const List = ({ list, onCardClick, onCreateCard }: ListProps) => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const { setNodeRef } = useDroppable({
    id: list._id,
  });

  const handleCreateCard = () => {
    if (newCardTitle.trim() && onCreateCard) {
      onCreateCard(list._id, newCardTitle);
      setNewCardTitle('');
      setShowAddCard(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className="rounded p-4 min-w-[272px] max-w-[272px] flex flex-col bg-[#22272b]"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-sm px-1">{list.title}</h3>
        <button className="text-dark-text-secondary hover:text-white">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>
      <SortableContext items={list.cards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5 flex-1 min-h-0">
          {list.cards.map((card) => (
            <SortableCard key={card._id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </div>
      </SortableContext>
      {showAddCard ? (
        <div className="mt-2">
          <input
            type="text"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateCard();
              } else if (e.key === 'Escape') {
                setShowAddCard(false);
                setNewCardTitle('');
              }
            }}
            placeholder="Enter card title..."
            className="w-full px-3 py-2 rounded mb-2 text-sm focus:outline-none focus:ring-2 text-white placeholder-dark-text-secondary bg-[#1d2125] border border-[#38414a] text-[#b6c2cf]"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateCard}
              className="px-3 py-1.5 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 bg-trello-blue"
            >
              Add Card
            </button>
            <button
              onClick={() => {
                setShowAddCard(false);
                setNewCardTitle('');
              }}
              className="px-3 py-1.5 rounded text-sm font-medium transition-colors text-[#b6c2cf] bg-transparent hover:bg-[#2c333a]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddCard(true)}
          className="mt-2 w-full text-left px-3 py-2 text-sm rounded transition-colors text-[#b6c2cf] bg-transparent hover:bg-[#2c333a]"
        >
          + Add a card
        </button>
      )}
    </div>
  );
};

export default List;

