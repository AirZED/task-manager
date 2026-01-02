import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { Board, Task } from '../types';
import api from '../services/api';
import { KanbanBoard } from '../components/board/KanbanBoard';
import { ListView } from '../components/board/ListView';
import { CreateTaskDialog } from '../components/task/CreateTaskDialog';
import { TaskDetailSheet } from '../components/task/TaskDetailSheet';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToastStore } from '../store/toastStore';

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchTasks();
    }
  }, [projectId]);

  const fetchProject = async () => {
    if (!projectId) return;
    try {
      const response = await api.getBoard(projectId);
      setProject(response.board);
    } catch (error) {
      console.error('Failed to fetch project:', error);
      addToast('Failed to load project', 'error');
    }
  };

  const fetchTasks = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const response = await api.getBoard(projectId);
      // Get all cards from all lists
      const allTasks = (response.lists || []).flatMap((list: any) => list.cards || []);
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      addToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      await api.updateTask(taskId, updates);
      // Update local state
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, ...updates } : task
      ));
      fetchTasks(); // Refresh to get latest data
    } catch (error) {
      console.error('Failed to update task:', error);
      addToast('Failed to update task', 'error');
    }
  };

  const handleTaskCreated = () => {
    setShowCreateTask(false);
    fetchTasks();
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  if (loading || !project) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#0ea5e9',
  ];
  const projectColor = colors[0];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[#38414a] px-6 py-4 bg-[#22272b]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: projectColor }}
            >
              {project.title[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">{project.title}</h1>
              {project.description && (
                <p className="text-sm text-[#9fadbc]">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#1d2125] border border-[#38414a] rounded">
              <button
                onClick={() => setView('kanban')}
                className={`
                  px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1
                  ${view === 'kanban' 
                    ? 'bg-trello-blue text-white' 
                    : 'text-[#b6c2cf] hover:bg-[#2c333a]'
                  }
                `}
              >
                <LayoutGrid className="h-4 w-4" />
                Board
              </button>
              <button
                onClick={() => setView('list')}
                className={`
                  px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1
                  ${view === 'list' 
                    ? 'bg-trello-blue text-white' 
                    : 'text-[#b6c2cf] hover:bg-[#2c333a]'
                  }
                `}
              >
                <List className="h-4 w-4" />
                List
              </button>
            </div>
            <button
              onClick={() => setShowCreateTask(true)}
              className="px-4 py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 bg-trello-blue flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskClick={handleTaskClick}
          />
        ) : (
          <ListView
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskClick={handleTaskClick}
          />
        )}
      </div>

      <CreateTaskDialog
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        projectId={projectId!}
        onSuccess={handleTaskCreated}
      />

      <TaskDetailSheet
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdate}
        projectId={projectId!}
      />
    </div>
  );
}

