import { create } from 'zustand';
import apiClient from '../api/client';
import type {
  TaskItem,
  TaskComment,
  TaskStatus,
  ComplianceNotification,
  Checklist,
  CalendarNote,
} from '../types';

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigneeRole?: string;
  periodCycle?: string;
  checklistId?: string;
}

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

  fetchTasks: (filters?: TaskFilters) => Promise<void>;
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
  createCalendarNote: (data: {
    date: string;
    title: string;
    content?: string;
    category?: string;
  }) => Promise<CalendarNote>;
  updateCalendarNote: (id: string, data: Partial<CalendarNote>) => Promise<void>;
  deleteCalendarNote: (id: string) => Promise<void>;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message;
  }
  return fallback;
}

export const useTaskStore = create<TaskState>((set) => {
  const fetchTasksFn = async (filters?: TaskFilters) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get<unknown, TaskItem[]>('/tasks', { params: filters });
      const list = Array.isArray(res) ? res : [];
      set({ tasks: list, isLoading: false });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Không thể tải danh sách tác vụ'), isLoading: false });
    }
  };

  const fetchTaskByIdFn = async (id: string) => {
    try {
      const res = await apiClient.get<unknown, TaskItem>(`/tasks/${id}`);
      set({ selectedTask: res });
    } catch (err) {
      console.error('Fetch task by ID error:', err);
    }
  };

  const updateTaskStatusFn = async (id: string, status: TaskStatus, note?: string) => {
    const res = await apiClient.patch<unknown, TaskItem>(`/tasks/${id}/status`, { status, note });
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: res.status } : t,
      ),
      selectedTask:
        state.selectedTask?.id === id
          ? { ...state.selectedTask, status: res.status }
          : state.selectedTask,
    }));
  };

  const updateTaskPriorityFn = async (id: string, priority: string, reason?: string) => {
    const res = await apiClient.patch<unknown, TaskItem>(`/tasks/${id}/priority`, {
      priority,
      reason,
    });
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...res } : t)),
      selectedTask:
        state.selectedTask?.id === id ? { ...state.selectedTask, ...res } : state.selectedTask,
    }));
    return res;
  };

  const createTaskFn = async (data: Partial<TaskItem>) => {
    const res = await apiClient.post<unknown, TaskItem>('/tasks', data);
    set((state) => ({ tasks: [res, ...state.tasks] }));
    return res;
  };

  const selfCertifyFn = async (taskId: string, reason: string) => {
    const res = await apiClient.post<unknown, TaskItem>(`/tasks/${taskId}/self-certify`, {
      reason,
    });
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: res.status } : t,
      ),
      selectedTask:
        state.selectedTask?.id === taskId ? { ...state.selectedTask, ...res } : state.selectedTask,
    }));
  };

  const fetchCommentsFn = async (taskId: string) => {
    try {
      const res = await apiClient.get<unknown, { comments?: TaskComment[] }>(`/tasks/${taskId}`);
      const list = Array.isArray(res?.comments) ? res.comments : [];
      set({ comments: list });
    } catch (err) {
      console.error(err);
    }
  };

  const addCommentFn = async (taskId: string, content: string) => {
    try {
      const res = await apiClient.post<unknown, TaskComment>(`/tasks/${taskId}/comments`, {
        content,
      });
      set((state) => ({ comments: [...state.comments, res] }));
    } catch (err) {
      console.error(err);
    }
  };

  const setSelectedTaskFn = (task: TaskItem | null) => set({ selectedTask: task });

  const fetchNotificationsFn = async (unreadOnly = false) => {
    try {
      const res = await apiClient.get<
        unknown,
        { notifications?: ComplianceNotification[]; unreadCount?: number }
      >('/tasks/notifications', { params: { unreadOnly } });
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
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        unreadNotificationsCount: Math.max(0, state.unreadNotificationsCount - 1),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsAsReadFn = async () => {
    try {
      await apiClient.post('/tasks/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadNotificationsCount: 0,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChecklistsFn = async () => {
    try {
      const res = await apiClient.get<unknown, Checklist[]>('/tasks/checklists');
      const list = Array.isArray(res) ? res : [];
      set({ checklists: list });
    } catch (err) {
      console.warn('Lỗi tải checklists:', err);
    }
  };

  const fetchCalendarNotesFn = async (month?: string) => {
    try {
      const res = await apiClient.get<unknown, CalendarNote[]>('/tasks/calendar-notes', {
        params: month ? { month } : undefined,
      });
      const list = Array.isArray(res) ? res : [];
      set({ calendarNotes: list });
    } catch (err) {
      console.error('Fetch calendar notes error:', err);
    }
  };

  const createCalendarNoteFn = async (data: {
    date: string;
    title: string;
    content?: string;
    category?: string;
  }) => {
    const res = await apiClient.post<unknown, CalendarNote>('/tasks/calendar-notes', data);
    set((state) => ({ calendarNotes: [...state.calendarNotes, res] }));
    return res;
  };

  const updateCalendarNoteFn = async (id: string, data: Partial<CalendarNote>) => {
    const res = await apiClient.patch<unknown, CalendarNote>(`/tasks/calendar-notes/${id}`, data);
    set((state) => ({
      calendarNotes: state.calendarNotes.map((n) => (n.id === id ? { ...n, ...res } : n)),
    }));
  };

  const deleteCalendarNoteFn = async (id: string) => {
    await apiClient.delete(`/tasks/calendar-notes/${id}`);
    set((state) => ({
      calendarNotes: state.calendarNotes.filter((n) => n.id !== id),
    }));
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
