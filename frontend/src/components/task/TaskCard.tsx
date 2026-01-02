import { Task } from '../../types';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

const priorityColors = {
  low: 'bg-[#6b7280] text-white',
  medium: 'bg-[#3b82f6] text-white',
  high: 'bg-[#f97316] text-white',
  urgent: 'bg-[#ef4444] text-white',
};

export function TaskCard({ task, onClick, onDragStart, onDragEnd, isDragging }: TaskCardProps) {
  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`
        cursor-pointer hover:border-trello-blue/50 transition-all
        bg-[#1d2125] border border-[#38414a] rounded-lg p-3 space-y-3
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
      `}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className="space-y-1">
        <p className="font-medium text-sm text-white line-clamp-2">{task.title}</p>
        {task.description && (
          <p className="text-xs text-[#9fadbc] line-clamp-2">
            {task.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-[#9fadbc]">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.dueDate), 'MMM d')}
          </div>
        )}
      </div>
      {task.assignees && task.assignees.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.assignees.slice(0, 3).map((assignee, index) => (
              <div
                key={assignee.id || index}
                className="w-6 h-6 rounded-full bg-trello-blue flex items-center justify-center text-white font-semibold text-xs"
                title={assignee.name}
              >
                {getInitials(assignee.name)}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <span className="text-xs text-[#9fadbc]">+{task.assignees.length - 3}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

