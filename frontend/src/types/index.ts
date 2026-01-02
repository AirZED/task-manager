export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Board {
  _id: string;
  title: string;
  description?: string;
  ownerId: User;
  members: User[];
  lists: string[];
  labels: Label[];
  createdAt: string;
  updatedAt: string;
}

export interface List {
  _id: string;
  title: string;
  boardId: string;
  order: number;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  _id: string;
  title: string;
  description?: string;
  listId: string;
  boardId: string;
  order: number;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignees: User[];
  labels: string[];
  comments: Comment[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Type aliases for semantic clarity
export type Task = Card;
export type Project = Board;

export interface Comment {
  _id: string;
  text: string;
  cardId: string;
  userId: User;
  createdAt: string;
  updatedAt: string;
}

