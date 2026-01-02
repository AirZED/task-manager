import { useState, useEffect } from 'react';
import { X, Send, Loader2, Calendar, User, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { Task, Comment, User as UserType } from '../../types';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';

interface TaskDetailSheetProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  projectId: string;
}

const priorityColors = {
  low: 'bg-[#6b7280] text-white',
  medium: 'bg-[#3b82f6] text-white',
  high: 'bg-[#f97316] text-white',
  urgent: 'bg-[#ef4444] text-white',
};

export function TaskDetailSheet({ task, onClose, onUpdate, projectId }: TaskDetailSheetProps) {
  const { user } = useAuthStore();
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<UserType[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [showAssigneeSearch, setShowAssigneeSearch] = useState(false);
  const socket = useSocket(projectId);

  useEffect(() => {
    if (task) {
      setCurrentTask(task);
      setTitle(task.title);
      setDescription(task.description || '');
      fetchComments();
      fetchTeamMembers();
    }
  }, [task?._id]);

  const fetchComments = async () => {
    if (!task) return;

    try {
      const response = await api.getCard(task._id);
      setComments(response.card.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // Get board members
      const response = await api.getBoard(projectId);
      const members = response.board.members || [];
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!task || !user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.createComment(task._id, newComment.trim());
      setComments([response.comment, ...comments]);
      socket.emitCommentAdded(response.comment);
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!task || !title.trim() || title === task.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const response = await api.updateCard(task._id, { title });
      setCurrentTask({ ...currentTask!, title });
      socket.emitCardUpdated(response.card);
      onUpdate(task._id, { title });
    } catch (error) {
      console.error('Failed to update title:', error);
    }
    setIsEditingTitle(false);
  };

  const handleUpdateDescription = async () => {
    if (!task) return;

    try {
      const response = await api.updateCard(task._id, { description });
      setCurrentTask({ ...currentTask!, description });
      socket.emitCardUpdated(response.card);
      onUpdate(task._id, { description });
    } catch (error) {
      console.error('Failed to update description:', error);
    }
    setIsEditingDescription(false);
  };

  const handleStatusChange = async (status: Task['status']) => {
    if (!task) return;

    try {
      const response = await api.updateCard(task._id, { status });
      setCurrentTask({ ...currentTask!, status });
      socket.emitCardUpdated(response.card);
      onUpdate(task._id, { status });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handlePriorityChange = async (priority: Task['priority']) => {
    if (!task) return;

    try {
      const response = await api.updateCard(task._id, { priority });
      setCurrentTask({ ...currentTask!, priority });
      socket.emitCardUpdated(response.card);
      onUpdate(task._id, { priority });
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  };

  const handleSearchAssignees = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.searchUsers(query);
      setSearchResults(response.users.filter((u) => u.id !== user?.id));
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const handleAddAssignee = async (userId: string) => {
    if (!task || currentTask?.assignees.some((a) => a.id === userId)) return;

    try {
      const newAssignees = [...(currentTask?.assignees.map((a) => a.id) || []), userId];
      const response = await api.updateCard(task._id, { assignees: newAssignees });
      socket.emitCardUpdated(response.card);
      const updatedResponse = await api.getCard(task._id);
      setCurrentTask(updatedResponse.card);
      onUpdate(task._id, { assignees: updatedResponse.card.assignees });
    } catch (error) {
      console.error('Failed to add assignee:', error);
    }
    setShowAssigneeSearch(false);
    setAssigneeSearch('');
  };

  const handleRemoveAssignee = async (userId: string) => {
    if (!task) return;

    try {
      const newAssignees = currentTask?.assignees
        .filter((a) => a.id !== userId)
        .map((a) => a.id) || [];
      const response = await api.updateCard(task._id, { assignees: newAssignees });
      socket.emitCardUpdated(response.card);
      const updatedResponse = await api.getCard(task._id);
      setCurrentTask(updatedResponse.card);
      onUpdate(task._id, { assignees: updatedResponse.card.assignees });
    } catch (error) {
      console.error('Failed to remove assignee:', error);
    }
  };

  const handleUpdateDueDate = async (date: string) => {
    if (!task) return;

    try {
      const response = await api.updateCard(task._id, { dueDate: date || undefined });
      socket.emitCardUpdated(response.card);
      const updatedResponse = await api.getCard(task._id);
      setCurrentTask(updatedResponse.card);
      onUpdate(task._id, { dueDate: updatedResponse.card.dueDate });
    } catch (error) {
      console.error('Failed to update due date:', error);
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

  if (!task || !currentTask) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:max-w-xl bg-[#22272b] z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#38414a] flex items-start justify-between">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
              className="text-lg font-semibold flex-1 border-none outline-none focus:ring-2 rounded px-2 text-white bg-[#1d2125]"
              autoFocus
            />
          ) : (
            <h2
              className="text-lg font-semibold text-white cursor-pointer rounded px-2 py-1 transition-colors bg-transparent hover:bg-[#2c333a] flex-1 pr-8"
              onClick={() => setIsEditingTitle(true)}
            >
              {currentTask.title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="text-[#b6c2cf] hover:text-white transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Task Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-white">
                  <Flag className="h-4 w-4" /> Status
                </label>
                <select
                  value={currentTask.status}
                  onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
                  className="w-full px-3 py-2 rounded text-sm bg-[#1d2125] border border-[#38414a] text-white focus:outline-none focus:ring-2 focus:ring-trello-blue"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Priority</label>
                <select
                  value={currentTask.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as Task['priority'])}
                  className="w-full px-3 py-2 rounded text-sm bg-[#1d2125] border border-[#38414a] text-white focus:outline-none focus:ring-2 focus:ring-trello-blue"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-white">
                <User className="h-4 w-4" /> Assignee
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {currentTask.assignees.map((assignee) => (
                  <div
                    key={assignee.id}
                    className="flex items-center gap-2 rounded-full px-3 py-1 bg-[#2c333a]"
                  >
                    <div className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-semibold bg-trello-blue">
                      {getInitials(assignee.name)}
                    </div>
                    <span className="text-sm text-white">{assignee.name}</span>
                    <button
                      onClick={() => handleRemoveAssignee(assignee.id)}
                      className="text-[#9fadbc] hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {showAssigneeSearch ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={assigneeSearch}
                      onChange={(e) => {
                        setAssigneeSearch(e.target.value);
                        handleSearchAssignees(e.target.value);
                      }}
                      placeholder="Search users..."
                      className="px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 text-white placeholder-[#9fadbc] bg-[#1d2125] border-[#38414a]"
                      autoFocus
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 border rounded shadow-lg z-10 w-64 bg-[#22272b] border-[#38414a]">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleAddAssignee(user.id)}
                            className="w-full text-left px-3 py-2 flex items-center gap-2 transition-colors text-white bg-transparent hover:bg-[#2c333a]"
                          >
                            <div className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-semibold bg-trello-blue">
                              {getInitials(user.name)}
                            </div>
                            <span className="text-sm">{user.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setShowAssigneeSearch(false);
                        setAssigneeSearch('');
                      }}
                      className="ml-2 text-[#9fadbc] hover:text-white transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAssigneeSearch(true)}
                    className="px-3 py-1 border rounded text-sm transition-colors border-[#38414a] text-[#b6c2cf] bg-transparent hover:bg-[#2c333a]"
                  >
                    + Add assignee
                  </button>
                )}
              </div>
            </div>

            {currentTask.dueDate && (
              <div className="flex items-center gap-2 text-sm text-[#9fadbc]">
                <Calendar className="h-4 w-4" />
                Due: {format(new Date(currentTask.dueDate), 'MMMM d, yyyy')}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Description</label>
            {isEditingDescription ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleUpdateDescription}
                className="w-full min-h-[100px] p-2 border rounded focus:outline-none focus:ring-2 text-white placeholder-[#9fadbc] bg-[#1d2125] border-[#38414a]"
                placeholder="Add a description..."
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditingDescription(true)}
                className="min-h-[60px] p-2 cursor-pointer rounded transition-colors bg-transparent hover:bg-[#2c333a]"
              >
                {currentTask.description ? (
                  <p className="text-sm text-[#b6c2cf] whitespace-pre-wrap">
                    {currentTask.description}
                  </p>
                ) : (
                  <p className="text-[#9fadbc] italic">Add a description...</p>
                )}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-white">Comments</h3>
            {comments.length === 0 ? (
              <p className="text-sm text-[#9fadbc]">No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-trello-blue flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                      {getInitials(comment.userId.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {comment.userId.name}
                        </span>
                        <span className="text-xs text-[#9fadbc]">
                          {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-[#b6c2cf] mt-1 whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment Input */}
        <div className="border-t border-[#38414a] p-4">
          <div className="flex gap-2">
            <input
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 text-white placeholder-[#9fadbc] bg-[#1d2125] border-[#38414a]"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="px-4 py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 bg-trello-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

