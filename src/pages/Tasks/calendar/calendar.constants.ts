import type { TaskStatus } from '../../../types';

export const NOTE_CATEGORIES = [
  { value: 'tax', label: 'Thuế & Hóa đơn', color: 'blue' },
  { value: 'labor', label: 'Lao động & BHXH', color: 'green' },
  { value: 'legal', label: 'Pháp lý doanh nghiệp', color: 'purple' },
  { value: 'reminder', label: 'Nhắc nhở nội bộ', color: 'orange' },
  { value: 'general', label: 'Ghi chú chung', color: 'default' },
] as const;

export function isTaskCompleted(status?: TaskStatus | string): boolean {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return s === 'completed' || s === 'done' || s === 'verified';
}
