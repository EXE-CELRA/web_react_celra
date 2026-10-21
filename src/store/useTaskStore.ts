import { create } from 'zustand';
import apiClient from '../api/client';
import type { TaskItem, TaskComment, TaskStatus, ComplianceNotification, Checklist, CalendarNote } from '../types';

interface TaskState {
  tasks: TaskItem[];
  selectedTask: TaskItem | null;
  comments: TaskComment[];
  notifications: ComplianceNotification[];
  unreadNotificationsCount: number;
  checklists: Checklist[];
  calendarNotes: CalendarNote[];
  isLoading: boolean;
  error: string | null;

  fetchTasks: (filters?: {
    status?: string;
    priority?: string;
    assigneeRole?: string;
    periodCycle?: string;
    checklistId?: string;
  }) => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus, note?: string) => Promise<void>;
  createTask: (data: Partial<TaskItem>) => Promise<TaskItem>;
  fetchComments: (taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  selfCertify: (taskId: string, reason: string) => Promise<void>;
  setSelectedTask: (task: TaskItem | null) => void;

  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  fetchChecklists: () => Promise<void>;

  fetchCalendarNotes: (month?: string) => Promise<void>;
  createCalendarNote: (data: { date: string; title: string; content?: string; category?: string }) => Promise<CalendarNote>;
  updateCalendarNote: (id: string, data: Partial<CalendarNote>) => Promise<void>;
  deleteCalendarNote: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  selectedTask: null,
  comments: [],
  notifications: [],
  unreadNotificationsCount: 0,
  checklists: [],
  calendarNotes: [],
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
      console.error('Fetch task by ID error:', err);
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

  selfCertify: async (taskId: string, reason: string) => {
    try {
      const res: any = await apiClient.post(`/tasks/${taskId}/self-certify`, { reason });
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status: res.status } : t)),
        selectedTask: state.selectedTask?.id === taskId ? { ...state.selectedTask, ...res } : state.selectedTask,
      }));
    } catch (err: any) {
      throw err;
    }
  },

  fetchComments: async (taskId: string) => {
    try {
      const res: any = await apiClient.get(`/tasks/${taskId}`);
      set({ comments: Array.isArray(res?.comments) ? res.comments : [] });
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

  fetchNotifications: async (unreadOnly = false) => {
    try {
      const res: any = await apiClient.get('/tasks/notifications', { params: { unreadOnly } });
      if (res && res.notifications) {
        set({
          notifications: res.notifications,
          unreadNotificationsCount: res.unreadCount ?? 0,
        });
      }
    } catch (err) {
      console.warn('Lỗi tải thông báo nhắc hạn:', err);
    }
  },

  markNotificationAsRead: async (id: string) => {
    try {
      await apiClient.patch(`/tasks/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        unreadNotificationsCount: Math.max(0, state.unreadNotificationsCount - 1),
      }));
    } catch (err) {
      console.error(err);
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      await apiClient.post('/tasks/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadNotificationsCount: 0,
      }));
    } catch (err) {
      console.error(err);
    }
  },

  fetchChecklists: async () => {
    try {
      const res: any = await apiClient.get('/tasks/checklists');
      set({ checklists: Array.isArray(res) ? res : [] });
    } catch (err) {
      console.warn('Lỗi tải checklists:', err);
    }
  },

  fetchCalendarNotes: async (month) => {
    try {
      const res: any = await apiClient.get('/tasks/calendar-notes', {
        params: month ? { month } : undefined,
      });
      set({ calendarNotes: Array.isArray(res) ? res : [] });
    } catch (err: any) {
      console.error('Fetch calendar notes error:', err);
    }
  },

  createCalendarNote: async (data) => {
    try {
      const res: any = await apiClient.post('/tasks/calendar-notes', data);
      set((state) => ({ calendarNotes: [...state.calendarNotes, res] }));
      return res;
    } catch (err: any) {
      throw err;
    }
  },

  updateCalendarNote: async (id, data) => {
    try {
      const res: any = await apiClient.patch(`/tasks/calendar-notes/${id}`, data);
      set((state) => ({
        calendarNotes: state.calendarNotes.map((n) => (n.id === id ? { ...n, ...res } : n)),
      }));
    } catch (err: any) {
      throw err;
    }
  },

  deleteCalendarNote: async (id) => {
    try {
      await apiClient.delete(`/tasks/calendar-notes/${id}`);
      set((state) => ({
        calendarNotes: state.calendarNotes.filter((n) => n.id !== id),
      }));
    } catch (err: any) {
      throw err;
    }
  },
}));
