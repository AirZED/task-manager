import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Board, Task } from '../types';
import { FolderKanban, CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react';
import api from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

const Dashboard = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, todo: 0, inProgress: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [boardsResponse] = await Promise.all([
        api.getBoards(),
      ]);
      setBoards(boardsResponse.boards || []);

      // Calculate stats from all boards
      let allTasks: Task[] = [];
      for (const board of boardsResponse.boards || []) {
        try {
          const boardData = await api.getBoard(board._id);
          // Get all cards from all lists
          const boardTasks = (boardData.lists || []).flatMap((list: any) => list.cards || []);
          allTasks = [...allTasks, ...boardTasks];
        } catch (error) {
          console.error(`Failed to load board ${board._id}:`, error);
        }
      }

      setStats({
        total: allTasks.length,
        todo: allTasks.filter((t) => t.status === 'todo').length,
        inProgress: allTasks.filter((t) => t.status === 'in_progress' || t.status === 'review').length,
        done: allTasks.filter((t) => t.status === 'done').length,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      const response = await api.createBoard(newBoardTitle);
      addToast('Project created successfully', 'success');
      navigate(`/project/${response.board._id}`);
      setShowCreateModal(false);
      setNewBoardTitle('');
      loadData();
    } catch (error: any) {
      console.error('Failed to create board:', error);
      addToast(error.message || 'Failed to create project', 'error');
    }
  };

  const userName = user?.name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome back, {userName}!</h1>
          <p className="text-[#9fadbc] mt-1">
            Here's what's happening with your tasks today
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 bg-trello-blue flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-[#22272b] border border-[#38414a] rounded-lg p-4">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="text-sm font-medium text-[#9fadbc]">Total Tasks</div>
            <FolderKanban className="h-4 w-4 text-[#9fadbc]" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-[#22272b] border border-[#38414a] rounded-lg p-4">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="text-sm font-medium text-[#9fadbc]">To Do</div>
            <AlertCircle className="h-4 w-4 text-[#9fadbc]" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.todo}</div>
        </div>
        <div className="bg-[#22272b] border border-[#38414a] rounded-lg p-4">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="text-sm font-medium text-[#9fadbc]">In Progress</div>
            <Clock className="h-4 w-4 text-[#9fadbc]" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.inProgress}</div>
        </div>
        <div className="bg-[#22272b] border border-[#38414a] rounded-lg p-4">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="text-sm font-medium text-[#9fadbc]">Completed</div>
            <CheckCircle2 className="h-4 w-4 text-[#9fadbc]" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.done}</div>
        </div>
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-white">Your Projects</h2>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#22272b] border border-[#38414a] rounded-lg p-4 animate-pulse">
                <div className="h-5 bg-[#1d2125] rounded w-1/2 mb-2" />
                <div className="h-4 bg-[#1d2125] rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="bg-[#22272b] border border-[#38414a] border-dashed rounded-lg p-12 text-center">
            <FolderKanban className="h-12 w-12 text-[#9fadbc] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">No projects yet</h3>
            <p className="text-[#9fadbc] mb-4">
              Create your first project to start organizing your tasks
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 bg-trello-blue flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {boards.map((board, index) => {
              const colors = [
                '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
                '#eab308', '#22c55e', '#14b8a6', '#0ea5e9',
              ];
              const color = colors[index % colors.length];

              return (
                <div
                  key={board._id}
                  onClick={() => navigate(`/project/${board._id}`)}
                  className="bg-[#22272b] border border-[#38414a] rounded-lg p-4 cursor-pointer hover:border-trello-blue/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: color }}
                    >
                      {board.title[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{board.title}</h3>
                      {board.description && (
                        <p className="text-sm text-[#9fadbc] line-clamp-1">
                          {board.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={() => {
          setShowCreateModal(false);
          setNewBoardTitle('');
        }}>
          <div
            className="rounded-lg p-6 max-w-md w-full mx-4 bg-[#22272b]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4 text-white">Create New Project</h2>
            <form onSubmit={handleCreateBoard}>
              <input
                type="text"
                placeholder="Board title"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className="w-full px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 text-white placeholder-dark-text-secondary bg-[#1d2125] border border-[#38414a] text-[#b6c2cf]"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewBoardTitle('');
                  }}
                  className="px-4 py-2 rounded font-medium transition-colors text-[#b6c2cf] bg-transparent hover:bg-[#2c333a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded font-medium text-white transition-opacity hover:opacity-90 bg-trello-blue"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

