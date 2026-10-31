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
  updateTaskPriority: (id: string, priority: string, reason?: string) => Promise<TaskItem>;
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

export const useTaskStore = create<TaskState>((set) => {
  const fetchTasksFn = async (filters?: any) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await apiClient.get('/tasks', { params: filters });
      const list = Array.isArray(res) ? res : [];
      set({ tasks: list, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  };

  const fetchTaskByIdFn = async (id: string) => {
    try {
      const res: any = await apiClient.get(`/tasks/${id}`);
      set({ selectedTask: res });
    } catch (err) {
      console.error('Fetch task by ID error:', err);
    }
  };

  const updateTaskStatusFn = async (id: string, status: TaskStatus, note?: string) => {
    try {
      const res: any = await apiClient.patch(`/tasks/${id}/status`, { status, note });
      set((state) => {
        const updatedTasks = state.tasks.map((t) => (t.id === id ? { ...t, status: res.status, trangThai: res.status } : t));
        const updatedSelected = state.selectedTask?.id === id ? { ...state.selectedTask, status: res.status, trangThai: res.status } : state.selectedTask;
        return {
          tasks: updatedTasks,
          selectedTask: updatedSelected,
        };
      });
    } catch (err: any) {
      throw err;
    }
  };

  const updateTaskPriorityFn = async (id: string, priority: string, reason?: string) => {
    try {
      const res: any = await apiClient.patch(`/tasks/${id}/priority`, { priority, reason });
      set((state) => {
        const updatedTasks = state.tasks.map((t) => (t.id === id ? { ...t, ...res } : t));
        const updatedSelected = state.selectedTask?.id === id ? { ...state.selectedTask, ...res } : state.selectedTask;
        return {
          tasks: updatedTasks,
          selectedTask: updatedSelected,
        };
      });
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  const createTaskFn = async (data: any) => {
    try {
      const res: any = await apiClient.post('/tasks', data);
      set((state) => {
        const updatedTasks = [res, ...state.tasks];
        return {
          tasks: updatedTasks,
        };
      });
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  const selfCertifyFn = async (taskId: string, reason: string) => {
    try {
      const res: any = await apiClient.post(`/tasks/${taskId}/self-certify`, { reason });
      set((state) => {
        const updatedTasks = state.tasks.map((t) => (t.id === taskId ? { ...t, status: res.status, trangThai: res.status } : t));
        const updatedSelected = state.selectedTask?.id === taskId ? { ...state.selectedTask, ...res } : state.selectedTask;
        return {
          tasks: updatedTasks,
          selectedTask: updatedSelected,
        };
      });
    } catch (err: any) {
      throw err;
    }
  };

  const fetchCommentsFn = async (taskId: string) => {
    try {
      const res: any = await apiClient.get(`/tasks/${taskId}`);
      const list = Array.isArray(res?.comments) ? res.comments : [];
      set({ comments: list });
    } catch (err) {
      console.error(err);
    }
  };

  const addCommentFn = async (taskId: string, content: string) => {
    try {
      const res: any = await apiClient.post(`/tasks/${taskId}/comments`, { content });
      set((state) => {
        const updatedComments = [...state.comments, res];
        return {
          comments: updatedComments,
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  const setSelectedTaskFn = (task: TaskItem | null) => set({ selectedTask: task });

  const fetchNotificationsFn = async (unreadOnly = false) => {
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
  };

  const markNotificationAsReadFn = async (id: string) => {
    try {
      await apiClient.patch(`/tasks/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
        const count = Math.max(0, state.unreadNotificationsCount - 1);
        return {
          notifications: updated,
          unreadNotificationsCount: count,
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsAsReadFn = async () => {
    try {
      await apiClient.post('/tasks/notifications/read-all');
      set((state) => {
        const updated = state.notifications.map((n) => ({ ...n, isRead: true }));
        return {
          notifications: updated,
          unreadNotificationsCount: 0,
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChecklistsFn = async () => {
    try {
      const res: any = await apiClient.get('/tasks/checklists');
      const list = Array.isArray(res) ? res : [];
      set({ checklists: list });
    } catch (err) {
      console.warn('Lỗi tải checklists:', err);
    }
  };

  const fetchCalendarNotesFn = async (month?: string) => {
    try {
      const res: any = await apiClient.get('/tasks/calendar-notes', {
        params: month ? { month } : undefined,
      });
      const list = Array.isArray(res) ? res : [];
      set({ calendarNotes: list });
    } catch (err: any) {
      console.error('Fetch calendar notes error:', err);
    }
  };

  const createCalendarNoteFn = async (data: any) => {
    try {
      const res: any = await apiClient.post('/tasks/calendar-notes', data);
      set((state) => {
        const updated = [...state.calendarNotes, res];
        return {
          calendarNotes: updated,
        };
      });
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  const updateCalendarNoteFn = async (id: string, data: any) => {
    try {
      const res: any = await apiClient.patch(`/tasks/calendar-notes/${id}`, data);
      set((state) => {
        const updated = state.calendarNotes.map((n) => (n.id === id ? { ...n, ...res } : n));
        return {
          calendarNotes: updated,
        };
      });
    } catch (err: any) {
      throw err;
    }
  };

  const deleteCalendarNoteFn = async (id: string) => {
    try {
      await apiClient.delete(`/tasks/calendar-notes/${id}`);
      set((state) => {
        const updated = state.calendarNotes.filter((n) => n.id !== id);
        return {
          calendarNotes: updated,
        };
      });
    } catch (err: any) {
      throw err;
    }
  };

  return {
    tasks: [],
    selectedTask: null,
    comments: [],
    notifications: [],
    unreadNotificationsCount: 0,
    checklists: [],
    calendarNotes: [],
    isLoading: false,
    error: null,

    fetchTasks: fetchTasksFn,
    fetchTaskById: fetchTaskByIdFn,
    updateTaskStatus: updateTaskStatusFn,
    updateTaskPriority: updateTaskPriorityFn,
    createTask: createTaskFn,
    fetchComments: fetchCommentsFn,
    addComment: addCommentFn,
    selfCertify: selfCertifyFn,
    setSelectedTask: setSelectedTaskFn,
    fetchNotifications: fetchNotificationsFn,
    markNotificationAsRead: markNotificationAsReadFn,
    markAllNotificationsAsRead: markAllNotificationsAsReadFn,
    fetchChecklists: fetchChecklistsFn,
    fetchCalendarNotes: fetchCalendarNotesFn,
    createCalendarNote: createCalendarNoteFn,
    updateCalendarNote: updateCalendarNoteFn,
    deleteCalendarNote: deleteCalendarNoteFn,
  };
});
