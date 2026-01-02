import { useState, useEffect } from 'react';
import { Mail, Users } from 'lucide-react';
import { Board, User } from '../types';
import api from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToastStore } from '../store/toastStore';

export default function Team() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoards();
  }, []);

  useEffect(() => {
    if (selectedBoard) {
      fetchMembers();
    }
  }, [selectedBoard]);

  const fetchBoards = async () => {
    try {
      const response = await api.getBoards();
      setBoards(response.boards || []);
      if (response.boards && response.boards.length > 0) {
        setSelectedBoard(response.boards[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!selectedBoard) return;
    try {
      const response = await api.getBoard(selectedBoard);
      const boardMembers = response.board.members || [];
      setMembers(boardMembers);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-[#22272b] border border-[#38414a] border-dashed rounded-lg p-12 text-center">
          <Users className="h-12 w-12 text-[#9fadbc] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-white">No workspaces yet</h3>
          <p className="text-[#9fadbc]">
            Create a workspace first to manage your team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-[#9fadbc]">Manage your workspace members</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="px-3 py-2 rounded text-sm bg-[#1d2125] border border-[#38414a] text-white focus:outline-none focus:ring-2 focus:ring-trello-blue w-48"
          >
            {boards.map((board) => (
              <option key={board._id} value={board._id}>
                {board.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[#22272b] border border-[#38414a] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#38414a]">
          <h2 className="text-base font-semibold text-white">Members ({members.length})</h2>
        </div>
        <div className="p-4 space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border border-[#38414a] bg-[#1d2125]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-trello-blue flex items-center justify-center text-white font-semibold">
                  {getInitials(member.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">
                      {member.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-[#9fadbc]">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-center py-8 text-[#9fadbc]">No members in this workspace</p>
          )}
        </div>
      </div>
    </div>
  );
}

