import { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen px-[4rem] bg-[#1d2125]">
      <header className="border-b bg-[#22272b] border-[#38414a]">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-trello-blue flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <h1 className="text-xl font-semibold text-white">Task Manager</h1>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <button
                  className="px-3 py-1.5 text-sm font-medium text-white rounded hover:opacity-80 transition-opacity bg-trello-blue"
                >
                  Create
                </button>
                <div className="w-8 h-8 rounded-full bg-trello-blue flex items-center justify-center text-white font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium rounded transition-colors text-[#b6c2cf] bg-transparent hover:bg-[#2c333a]"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
    </div>
  );
};

