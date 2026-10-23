export interface CalendarNote {
  id: string;
  organizationId: string;
  date: string; // YYYY-MM-DD
  title: string;
  content?: string;
  category: 'general' | 'tax' | 'labor' | 'legal' | 'reminder';
  authorId?: string;
  authorName?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
}
