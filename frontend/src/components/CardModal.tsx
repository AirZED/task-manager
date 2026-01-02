import { useState, useEffect } from 'react';
import { Card as CardType, Comment, User, Label } from '../types';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';

interface CardModalProps {
  card: CardType;
  onClose: () => void;
  onUpdate: () => void;
}

const CardModal = ({ card: initialCard, onClose, onUpdate }: CardModalProps) => {
  const [card, setCard] = useState(initialCard);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(card.comments || []);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showAssigneeSearch, setShowAssigneeSearch] = useState(false);
  const { currentBoard } = useBoardStore();
  const { user } = useAuthStore();
  const socket = useSocket(initialCard.boardId);

  useEffect(() => {
    loadCardDetails();
  }, [initialCard._id]);

  const loadCardDetails = async () => {
    try {
      const response = await api.getCard(initialCard._id);
      setCard(response.card);
      setComments(response.card.comments || []);
      setTitle(response.card.title);
      setDescription(response.card.description || '');
    } catch (error) {
      console.error('Failed to load card details:', error);
    }
  };

  const handleUpdateTitle = async () => {
    if (title.trim() && title !== card.title) {
      try {
        const response = await api.updateCard(card._id, { title });
        setCard({ ...card, title });
        socket.emitCardUpdated(response.card);
        onUpdate();
      } catch (error) {
        console.error('Failed to update title:', error);
      }
    }
    setIsEditingTitle(false);
  };

  const handleUpdateDescription = async () => {
    try {
      const response = await api.updateCard(card._id, { description });
      setCard({ ...card, description });
      socket.emitCardUpdated(response.card);
      onUpdate();
    } catch (error) {
      console.error('Failed to update description:', error);
    }
    setIsEditingDescription(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await api.createComment(card._id, newComment);
      setComments([response.comment, ...comments]);
      socket.emitCommentAdded(response.comment);
      setNewComment('');
      onUpdate();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.deleteComment(commentId);
      setComments(comments.filter((c) => c._id !== commentId));
      socket.emitCommentDeleted(commentId);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleSearchAssignees = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.searchUsers(query);
      setSearchResults(response.users.filter((u: User) => u.id !== user?.id));
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const handleAddAssignee = async (userId: string) => {
    if (card.assignees.some((a) => a.id === userId)) return;

    try {
      const newAssignees = [...card.assignees.map((a) => a.id), userId];
      const response = await api.updateCard(card._id, { assignees: newAssignees });
      socket.emitCardUpdated(response.card);
      await loadCardDetails();
      onUpdate();
    } catch (error) {
      console.error('Failed to add assignee:', error);
    }
    setShowAssigneeSearch(false);
    setAssigneeSearch('');
  };

  const handleRemoveAssignee = async (userId: string) => {
    try {
      const newAssignees = card.assignees
        .filter((a) => a.id !== userId)
        .map((a) => a.id);
      const response = await api.updateCard(card._id, { assignees: newAssignees });
      socket.emitCardUpdated(response.card);
      await loadCardDetails();
      onUpdate();
    } catch (error) {
      console.error('Failed to remove assignee:', error);
    }
  };

  const handleAddLabel = async (labelId: string) => {
    if (card.labels.includes(labelId)) return;

    try {
      const newLabels = [...card.labels, labelId];
      const response = await api.updateCard(card._id, { labels: newLabels });
      socket.emitCardUpdated(response.card);
      await loadCardDetails();
      onUpdate();
    } catch (error) {
      console.error('Failed to add label:', error);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      const newLabels = card.labels.filter((l) => l !== labelId);
      const response = await api.updateCard(card._id, { labels: newLabels });
      socket.emitCardUpdated(response.card);
      await loadCardDetails();
      onUpdate();
    } catch (error) {
      console.error('Failed to remove label:', error);
    }
  };

  const handleUpdateDueDate = async (date: string) => {
    try {
      const response = await api.updateCard(card._id, { dueDate: date || undefined });
      socket.emitCardUpdated(response.card);
      await loadCardDetails();
      onUpdate();
    } catch (error) {
      console.error('Failed to update due date:', error);
    }
  };

  const availableLabels = currentBoard?.labels || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-[#22272b]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleUpdateTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                className="text-2xl font-bold flex-1 border-none outline-none focus:ring-2 rounded px-2 text-white bg-[#1d2125] text-[#b6c2cf]"
                autoFocus
              />
            ) : (
              <h2
                className="text-2xl font-bold text-white cursor-pointer rounded px-2 py-1 transition-colors bg-transparent hover:bg-[#2c333a]"
                onClick={() => setIsEditingTitle(true)}
              >
                {card.title}
              </h2>
            )}
            <button
              onClick={onClose}
              className="text-dark-text-secondary hover:text-white text-2xl transition-colors"
            >
              ×
            </button>
          </div>

          {/* Description */}
          <div className="mb-6">
            {isEditingDescription ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleUpdateDescription}
                className="w-full min-h-[100px] p-2 border rounded focus:outline-none focus:ring-2 text-white placeholder-dark-text-secondary bg-[#1d2125] border-[#38414a] text-[#b6c2cf]"
                placeholder="Add a description..."
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditingDescription(true)}
                className="min-h-[60px] p-2 cursor-pointer rounded transition-colors bg-transparent hover:bg-[#2c333a]"
              >
                {card.description ? (
                  <div className="prose prose-sm max-w-none text-[#b6c2cf]">
                    <ReactMarkdown>{card.description}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-dark-text-secondary italic">Add a description...</p>
                )}
              </div>
            )}
          </div>

          {/* Labels */}
          {availableLabels.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 text-[#b6c2cf]">Labels</h3>
              <div className="flex gap-2 flex-wrap">
                {availableLabels.map((label) => {
                  const isSelected = card.labels.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() =>
                        isSelected ? handleRemoveLabel(label.id) : handleAddLabel(label.id)
                      }
                      className={`px-3 py-1 rounded text-sm font-medium transition-opacity hover:opacity-80 ${
                        isSelected ? 'text-white' : 'bg-[#2c333a] text-[#b6c2cf]'
                      }`}
                      style={isSelected ? { backgroundColor: label.color } : undefined}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assignees */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-[#b6c2cf]">Assignees</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {card.assignees.map((assignee) => (
                <div
                  key={assignee.id}
                  className="flex items-center gap-2 rounded-full px-3 py-1 bg-[#2c333a]"
                >
                  <div className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-semibold bg-trello-blue">
                    {assignee.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-white">{assignee.name}</span>
                  <button
                    onClick={() => handleRemoveAssignee(assignee.id)}
                    className="text-dark-text-secondary hover:text-red-500 transition-colors"
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
                    className="px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 text-white placeholder-dark-text-secondary bg-[#1d2125] border-[#38414a] text-[#b6c2cf]"
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
                            {user.name.charAt(0).toUpperCase()}
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
                    className="ml-2 text-dark-text-secondary hover:text-white transition-colors"
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

          {/* Due Date */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2 text-[#b6c2cf]">Due Date</h3>
            <input
              type="date"
              value={card.dueDate ? card.dueDate.split('T')[0] : ''}
              onChange={(e) => handleUpdateDueDate(e.target.value)}
              className="px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 text-white bg-[#1d2125] border-[#38414a] text-[#b6c2cf]"
            />
            {card.dueDate && (
              <span className="ml-2 text-sm text-[#b6c2cf]">
                {format(new Date(card.dueDate), 'MMM d, yyyy')}
              </span>
            )}
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-[#b6c2cf]">Comments</h3>
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment._id} className="rounded p-3 bg-[#1d2125]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-semibold bg-trello-blue">
                      {comment.userId.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-white">{comment.userId.name}</span>
                    <span className="text-xs text-[#9fadbc]">
                      {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                    </span>
                    {comment.userId.id === user?.id && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="ml-auto text-red-500 hover:text-red-400 text-xs transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-white">{comment.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 text-white placeholder-dark-text-secondary bg-[#1d2125] border-[#38414a] text-[#b6c2cf]"
              />
              <button
                onClick={handleAddComment}
                className="px-4 py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 bg-trello-blue"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;

