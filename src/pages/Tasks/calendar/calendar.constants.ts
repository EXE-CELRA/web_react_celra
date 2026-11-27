import type { TaskStatus } from '../../../types';

export const NOTE_CATEGORIES = [
  { value: 'tax', label: 'Thuế TNDN & Tạm nộp', color: 'blue' },
  { value: 'b4_expense', label: 'Chi phí & Mục B4', color: 'green' },
  { value: 'legal', label: 'Quyết toán 03/TNDN', color: 'purple' },
  { value: 'reminder', label: 'Nhắc hạn nộp thuế', color: 'orange' },
  { value: 'general', label: 'Ghi chú chung', color: 'default' },
] as const;

export function isTaskCompleted(status?: TaskStatus | string): boolean {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return s === 'completed' || s === 'done' || s === 'verified';
}
