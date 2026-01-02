import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { List as ListType } from '../types';
import List from './List';
import { Card as CardType } from '../types';

interface SortableListProps {
  list: ListType;
  onCardClick: (card: CardType) => void;
  onCreateCard?: (listId: string, title: string) => void;
}

export const SortableList = ({ list, onCardClick, onCreateCard }: SortableListProps) => {
  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id: list._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <List list={list} onCardClick={onCardClick} onCreateCard={onCreateCard} />
    </div>
  );
};

