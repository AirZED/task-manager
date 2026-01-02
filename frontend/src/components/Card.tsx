import { Card as CardType } from '../types';
import { format } from 'date-fns';

interface CardProps {
  card: CardType;
  onClick: () => void;
}

const Card = ({ card, onClick }: CardProps) => {
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <div
      onClick={onClick}
      className="rounded p-3.5 cursor-pointer transition-all mb-2 bg-[#22272b] border border-transparent hover:bg-[#2c333a] hover:border-[#38414a]"
    >
      <h4 className="font-medium text-white mb-2.5 text-sm leading-snug">{card.title}</h4>
      {card.description && (
        <p className="text-xs text-dark-text-secondary mb-2.5 line-clamp-2">{card.description}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap mt-3">
        {card.labels.length > 0 && (
          <div className="flex gap-1">
            {card.labels.slice(0, 3).map((_, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs rounded font-medium bg-[#4c9aff] text-white"
              >
                Label
              </span>
            ))}
          </div>
        )}
        {card.dueDate && (
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium text-white ${isOverdue ? 'bg-[#eb5a46]' : 'bg-[#6b778c]'}`}
          >
            {format(new Date(card.dueDate), 'MMM d')}
          </span>
        )}
        {card.assignees.length > 0 && (
          <div className="flex -space-x-1 ml-auto">
            {card.assignees.slice(0, 3).map((assignee) => (
              <div
                key={assignee.id}
                className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center border-2 font-semibold bg-trello-blue border-[#22272b]"
                title={assignee.name}
              >
                {assignee.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {card.assignees.length > 3 && (
              <div className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center border-2 font-semibold bg-[#6b778c] border-[#22272b]">
                +{card.assignees.length - 3}
              </div>
            )}
          </div>
        )}
        {card.comments.length > 0 && (
          <span className="text-xs text-dark-text-secondary flex items-center gap-1 ml-auto">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            {card.comments.length}
          </span>
        )}
      </div>
    </div>
  );
};

export default Card;

