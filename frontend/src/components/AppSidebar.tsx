import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Plus,
  ChevronDown,
  CheckSquare,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Board } from '../types';

export function AppSidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBoards();
    }
  }, [user]);

  useEffect(() => {
    // Set current board based on route
    const projectId = location.pathname.split('/project/')[1];
    if (projectId && boards.length > 0) {
      const board = boards.find(b => b._id === projectId);
      if (board) {
        setCurrentBoard(board);
      }
    } else if (boards.length > 0 && !currentBoard) {
      setCurrentBoard(boards[0]);
    }
  }, [location.pathname, boards]);

  const fetchBoards = async () => {
    try {
      const response = await api.getBoards();
      setBoards(response.boards || []);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = user?.name || user?.email?.split('@')[0] || 'User';

  const colors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#0ea5e9', // Sky
  ];

  const getBoardColor = (index: number) => colors[index % colors.length];

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#22272b] border border-[#38414a] text-[#b6c2cf] hover:bg-[#2c333a]"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 bg-[#22272b] border-r border-[#38414a]
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-16' : 'md:w-64'}
        `}
      >
        {/* Header */}
        <div className="border-b border-[#38414a] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-trello-blue flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              {!isCollapsed && (
                <span className="font-semibold text-lg text-white">TaskFlow</span>
              )}
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:block p-1 rounded hover:bg-[#2c333a] text-[#b6c2cf]"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-90' : '-rotate-90'}`} />
            </button>
          </div>
        </div>

        {/* Workspace Selector */}
        {!isCollapsed && (
          <div className="px-3 py-2 border-b border-[#38414a]">
            <div className="flex items-center gap-2 px-2 py-2 rounded hover:bg-[#2c333a] cursor-pointer">
              <div className="h-6 w-6 rounded bg-trello-blue flex items-center justify-center text-white text-xs font-medium">
                {currentBoard?.title?.[0]?.toUpperCase() || 'W'}
              </div>
              <span className="font-medium truncate text-[#b6c2cf] flex-1">
                {currentBoard?.title || 'Select Workspace'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            <div className="px-2 py-1 text-xs font-semibold text-[#9fadbc] uppercase mb-2">
              Navigation
            </div>
            <button
              onClick={() => {
                navigate('/dashboard');
                setIsMobileOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors
                ${location.pathname === '/dashboard' 
                  ? 'bg-[#2c333a] text-white' 
                  : 'text-[#b6c2cf] hover:bg-[#2c333a]'
                }
              `}
            >
              <LayoutDashboard className="h-4 w-4" />
              {!isCollapsed && <span>Dashboard</span>}
            </button>
            <button
              onClick={() => {
                navigate('/team');
                setIsMobileOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors
                ${location.pathname === '/team' 
                  ? 'bg-[#2c333a] text-white' 
                  : 'text-[#b6c2cf] hover:bg-[#2c333a]'
                }
              `}
            >
              <Users className="h-4 w-4" />
              {!isCollapsed && <span>Team</span>}
            </button>
          </div>

          {/* Projects */}
          <div className="px-3 mt-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="px-2 py-1 text-xs font-semibold text-[#9fadbc] uppercase">
                {!isCollapsed && 'Projects'}
              </div>
              {!isCollapsed && (
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setIsMobileOpen(false);
                  }}
                  className="p-1 rounded hover:bg-[#2c333a] text-[#b6c2cf]"
                  title="Create Project"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {boards.map((board, index) => (
                <button
                  key={board._id}
                  onClick={() => {
                    navigate(`/project/${board._id}`);
                    setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors
                    ${location.pathname.includes(`/project/${board._id}`)
                      ? 'bg-[#2c333a] text-white'
                      : 'text-[#b6c2cf] hover:bg-[#2c333a]'
                    }
                  `}
                >
                  <div
                    className="h-3 w-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: getBoardColor(index) }}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{board.title}</span>
                  )}
                </button>
              ))}
              {boards.length === 0 && !isCollapsed && (
                <p className="px-3 py-2 text-sm text-[#9fadbc]">No projects yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#38414a] p-3">
          <div className="flex items-center gap-2 px-2 py-2 rounded hover:bg-[#2c333a] cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-trello-blue flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
              {getInitials(userName)}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{userName}</div>
                <div className="text-xs text-[#9fadbc] truncate">{user?.email}</div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="mt-2 space-y-1">
              <button
                onClick={() => {
                  navigate('/settings');
                  setIsMobileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-[#b6c2cf] hover:bg-[#2c333a]"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-[#b6c2cf] hover:bg-[#2c333a]"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

