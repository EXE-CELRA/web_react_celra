import { create } from 'zustand';
import apiClient from '../api/client';
import type { TaskItem, TaskComment, TaskStatus } from '../types';

interface TaskState {
  tasks: TaskItem[];
  selectedTask: TaskItem | null;
  comments: TaskComment[];
  isLoading: boolean;
  error: string | null;

  fetchTasks: (filters?: { status?: string; priority?: string; assigneeRole?: string }) => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus, note?: string) => Promise<void>;
  createTask: (data: Partial<TaskItem>) => Promise<TaskItem>;
  fetchComments: (taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  setSelectedTask: (task: TaskItem | null) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  selectedTask: null,
  comments: [],
  isLoading: false,
  error: null,

  fetchTasks: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await apiClient.get('/tasks', { params: filters });
      set({ tasks: Array.isArray(res) ? res : [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchTaskById: async (id: string) => {
    try {
      const res: any = await apiClient.get(`/tasks/${id}`);
      set({ selectedTask: res });
    } catch (err) {
      console.error(err);
    }
  },

  updateTaskStatus: async (id: string, status: TaskStatus, note?: string) => {
    try {
      const res: any = await apiClient.patch(`/tasks/${id}/status`, { status, note });
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, status: res.status } : t)),
        selectedTask: state.selectedTask?.id === id ? { ...state.selectedTask, status: res.status } : state.selectedTask,
      }));
    } catch (err: any) {
      throw err;
    }
  },

  createTask: async (data) => {
    try {
      const res: any = await apiClient.post('/tasks', data);
      set((state) => ({ tasks: [res, ...state.tasks] }));
      return res;
    } catch (err: any) {
      throw err;
    }
  },

  fetchComments: async (taskId: string) => {
    try {
      const res: any = await apiClient.get(`/tasks/${taskId}/comments`);
      set({ comments: Array.isArray(res) ? res : [] });
    } catch (err) {
      console.error(err);
    }
  },

  addComment: async (taskId: string, content: string) => {
    try {
      const res: any = await apiClient.post(`/tasks/${taskId}/comments`, { content });
      set((state) => ({ comments: [...state.comments, res] }));
    } catch (err) {
      console.error(err);
    }
  },

  setSelectedTask: (task) => set({ selectedTask: task }),
}));
