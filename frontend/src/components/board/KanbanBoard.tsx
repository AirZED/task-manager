import { useState } from 'react';
import { Task } from '../../types';
import { TaskCard } from '../task/TaskCard';

interface Column {
  id: Task['status'];
  title: string;
}

const columns: Column[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
}

export function KanbanBoard({ tasks, onTaskUpdate, onTaskClick }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDrop = async (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (draggingId) {
      // Find the task to get its current order
      const task = tasks.find(t => t._id === draggingId);
      if (task) {
        // Update status and maintain order
        onTaskUpdate(draggingId, { status, order: task.order });
      } else {
        onTaskUpdate(draggingId, { status });
      }
    }
    setDraggingId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="h-full overflow-x-auto p-6">
      <div className="flex gap-4 h-full min-w-max">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div
              key={column.id}
              className={`
                flex flex-col w-72 bg-[#22272b]/50 rounded-lg border border-[#38414a]
                ${dragOverColumn === column.id ? 'ring-2 ring-trello-blue ring-offset-2' : ''}
              `}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="px-3 py-2 border-b border-[#38414a]">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm text-white">{column.title}</h3>
                  <span className="text-xs text-[#9fadbc] bg-[#1d2125] px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingId === task._id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

