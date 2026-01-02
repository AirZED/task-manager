import { useState } from 'react';
import { X } from 'lucide-react';
import { Task } from '../../types';
import api from '../../services/api';
import { useToastStore } from '../../store/toastStore';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

export function CreateTaskDialog({ open, onOpenChange, projectId, onSuccess }: CreateTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const addToast = useToastStore((state) => state.addToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Title is required', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await api.createTask(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
      });
      addToast('Task created successfully', 'success');
      // Reset form
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setDueDate('');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating task:', error);
      addToast(error.message || 'Failed to create task', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => onOpenChange(false)}>
      <div
        className="rounded-lg max-w-lg w-full bg-[#22272b] border border-[#38414a]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Create Task</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="text-[#b6c2cf] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-white mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
                className="w-full px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-trello-blue text-white placeholder-[#9fadbc] bg-[#1d2125] border border-[#38414a]"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                rows={3}
                className="w-full px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-trello-blue text-white placeholder-[#9fadbc] bg-[#1d2125] border border-[#38414a] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-white mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Task['status'])}
                  className="w-full px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-trello-blue text-white bg-[#1d2125] border border-[#38414a]"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-white mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Task['priority'])}
                  className="w-full px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-trello-blue text-white bg-[#1d2125] border border-[#38414a]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-white mb-1">
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-trello-blue text-white bg-[#1d2125] border border-[#38414a]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded text-sm font-medium transition-colors text-[#b6c2cf] bg-transparent hover:bg-[#2c333a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 bg-trello-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

