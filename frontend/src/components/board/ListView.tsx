import { Task } from '../../types';
import { format } from 'date-fns';

interface ListViewProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
}

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const priorityColors = {
  low: 'bg-[#6b7280] text-white',
  medium: 'bg-[#3b82f6] text-white',
  high: 'bg-[#f97316] text-white',
  urgent: 'bg-[#ef4444] text-white',
};

export function ListView({ tasks, onTaskUpdate, onTaskClick }: ListViewProps) {
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
    <div className="p-6">
      <div className="border border-[#38414a] rounded-lg bg-[#22272b] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1d2125] border-b border-[#38414a]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-white w-[40%]">Task</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-white">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-white">Priority</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-white">Assignee</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-white">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#9fadbc]">
                    No tasks yet. Create your first task to get started.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr
                    key={task._id}
                    className="cursor-pointer hover:bg-[#2c333a] border-b border-[#38414a] transition-colors"
                    onClick={() => onTaskClick(task)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-[#9fadbc] line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={task.status}
                        onChange={(e) =>
                          onTaskUpdate(task._id, { status: e.target.value as Task['status'] })
                        }
                        className="w-32 h-8 px-2 rounded text-sm bg-[#1d2125] border border-[#38414a] text-white focus:outline-none focus:ring-2 focus:ring-trello-blue"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded capitalize ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {task.assignees && task.assignees.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {task.assignees.slice(0, 2).map((assignee, index) => (
                            <div
                              key={assignee.id || index}
                              className="w-6 h-6 rounded-full bg-trello-blue flex items-center justify-center text-white font-semibold text-xs"
                              title={assignee.name}
                            >
                              {getInitials(assignee.name)}
                            </div>
                          ))}
                          {task.assignees.length > 2 && (
                            <span className="text-sm text-[#9fadbc]">+{task.assignees.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#9fadbc]">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {task.dueDate ? (
                        <span className="text-sm text-[#9fadbc]">
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="text-[#9fadbc]">No due date</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

