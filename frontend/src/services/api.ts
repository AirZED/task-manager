import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        // Extract error message from backend response
        const errorMessage = 
          (error.response?.data as any)?.message || 
          (error.response?.data as any)?.errorMessage ||
          error.message ||
          'An error occurred';
        return Promise.reject({ ...error, message: errorMessage });
      }
    );
  }

  // Auth
  async register(email: string, password: string, name: string) {
    const { data } = await this.client.post('/auth/register', { email, password, name });
    return data;
  }

  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', { email, password });
    return data;
  }

  async getMe() {
    const { data } = await this.client.get('/auth/me');
    return data;
  }

  // Boards
  async getBoards() {
    const { data } = await this.client.get('/boards');
    return data;
  }

  async getBoard(id: string) {
    const { data } = await this.client.get(`/boards/${id}`);
    return data;
  }

  async createBoard(title: string, description?: string) {
    const { data } = await this.client.post('/boards', { title, description });
    return data;
  }

  async updateBoard(id: string, updates: any) {
    const { data } = await this.client.put(`/boards/${id}`, updates);
    return data;
  }

  async deleteBoard(id: string) {
    const { data } = await this.client.delete(`/boards/${id}`);
    return data;
  }

  async addBoardMember(boardId: string, memberId: string) {
    const { data } = await this.client.post(`/boards/${boardId}/members`, { memberId });
    return data;
  }

  // Lists
  async createList(boardId: string, title: string) {
    const { data } = await this.client.post('/lists', { boardId, title });
    return data;
  }

  async updateList(id: string, updates: any) {
    const { data } = await this.client.put(`/lists/${id}`, updates);
    return data;
  }

  async deleteList(id: string) {
    const { data } = await this.client.delete(`/lists/${id}`);
    return data;
  }

  async reorderLists(boardId: string, listOrders: { listId: string; order: number }[]) {
    const { data } = await this.client.post('/lists/reorder', { boardId, listOrders });
    return data;
  }

  // Cards / Tasks
  async createCard(listId: string, boardId: string, title: string, description?: string) {
    const { data } = await this.client.post('/cards', { listId, boardId, title, description });
    return data;
  }

  async createTask(boardId: string, taskData: {
    title: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'review' | 'done';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
  }) {
    const { data } = await this.client.post('/cards', {
      boardId,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate,
    });
    return data;
  }

  async getCard(id: string) {
    const { data } = await this.client.get(`/cards/${id}`);
    return data;
  }

  async updateCard(id: string, updates: any) {
    const { data } = await this.client.put(`/cards/${id}`, updates);
    return data;
  }

  async updateTask(taskId: string, updates: Partial<{
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignees: string[];
    dueDate: string;
  }>) {
    const { data } = await this.client.put(`/cards/${taskId}`, updates);
    return data;
  }

  async deleteCard(id: string) {
    const { data } = await this.client.delete(`/cards/${id}`);
    return data;
  }

  async moveCard(cardId: string, newListId: string, newOrder: number, status?: 'todo' | 'in_progress' | 'review' | 'done') {
    const { data } = await this.client.post('/cards/move', { cardId, newListId, newOrder, status });
    return data;
  }

  async getTasksByStatus(boardId: string, status: 'todo' | 'in_progress' | 'review' | 'done') {
    const { data } = await this.client.get(`/cards/board/${boardId}/status/${status}`);
    return data;
  }

  // Comments
  async createComment(cardId: string, text: string) {
    const { data } = await this.client.post('/comments', { cardId, text });
    return data;
  }

  async updateComment(id: string, text: string) {
    const { data } = await this.client.put(`/comments/${id}`, { text });
    return data;
  }

  async deleteComment(id: string) {
    const { data } = await this.client.delete(`/comments/${id}`);
    return data;
  }

  // Users
  async searchUsers(query: string) {
    const { data } = await this.client.get(`/users/search?q=${encodeURIComponent(query)}`);
    return data;
  }

  async getUser(id: string) {
    const { data } = await this.client.get(`/users/${id}`);
    return data;
  }
}

export default new ApiClient();

