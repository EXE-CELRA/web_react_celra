import type { Priority } from './common.interface';
import type { RoleType } from './user.interface';

export type StatutoryCycleType =
  | 'MONTHLY'          // 1. Hàng tháng (Hạn ngày 20)
  | 'QUARTERLY'        // 2. Hàng quý (30/04, 31/07, 31/10, 31/01)
  | 'BIANNUAL_6M'      // 3. 6 Tháng / Bán niên (Đối soát giữa năm)
  | 'ANNUAL'           // 4. Cả năm (31/03 quyết toán thuế TNDN & BCTC)
  | 'EVENT_10D'        // 5. Từng lần phát sinh 10 ngày (Thuế nhà thầu FCT bảo vệ chi phí TNDN)
  | 'EVENT_20D'        // 6. Đợt 20 ngày (Chuyển kỳ kê khai theo NĐ 126/2020)
  | 'EVENT_45D'        // 7. Đợt 45 ngày (Quyết toán giải thể, chia tách)
  | 'EVENT_3D'         // 8. Đợt 03 ngày làm việc (Tạm ngừng / HĐĐT sai sót)
  | 'EVENT_10D_BIZ'    // 9. Đợt 10 ngày làm việc (Đổi ĐKKD & Thông tin thuế)
  | 'EVENT_90D'        // 10. Đợt 90 ngày (Hạn góp đủ vốn điều lệ ban đầu)
  | 'EVENT_30D_CAPITAL'; // 11. Đợt 30 ngày (Đăng ký giảm vốn điều lệ sau 90 ngày)

export interface StatutoryPeriodMeta {
  code: StatutoryCycleType;
  label: string;
  badge: string;
  color: string;
  legalBasis: string;
  description: string;
}

export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'WAITING_DOCUMENT'
  | 'WAITING_VERIFICATION'
  | 'VERIFIED'
  | 'OVERDUE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'need_info'
  | 'pending_assignee'
  | 'in_progress'
  | 'waiting_verification'
  | 'completed'
  | 'cancelled';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'urgent' | 'high' | 'medium' | 'low';

export interface Checklist {
  id: string;
  code: string;
  title: string;
  category: string;
  priority?: Priority;
  status: string;
  itemCount?: number;
  totalTasks?: number;
  completedTasks?: number;
  progressPercent?: number;
  createdAt?: string;
  items?: any[];
  tasks?: any[];
  [key: string]: any;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  findingId?: string;
  ruleCode: string;
  title: string;
  cycleType: StatutoryCycleType;
  departmentId?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeRole?: string;
  defaultPriority?: Priority;
  legalBasis: string;
  legalDocUrl?: string;
  evidenceRequirement?: string;
  eventDate?: string | null;
  isActive: boolean;
  lastGeneratedPeriod?: string;
  nextDueDate?: string | null;
  createdAt?: string;
}

export interface Task {
  id: string;
  code: string;
  title: string;
  checklistId?: string;
  category: string;
  priority: Priority;
  assigneeRole?: any;
  waitingOnRole?: any;
  waitingOnName?: string;
  departmentId?: string;
  departmentName?: string;
  assigneeId?: string;
  assigneeName?: string;
  status: any;
  dueDate?: string;
  description?: string;
  contextTrigger?: string;
  ruleCode?: string;
  legalBasis?: string;
  periodCycle?: StatutoryCycleType;
  periodKey?: string;
  documents?: any[];
  [key: string]: any;
}

export interface TaskItem {
  id: string;
  code?: string;
  organizationId: string;
  checklistId?: string;
  checklistItemId?: string;
  title: string;
  description?: string;
  category: string;
  periodCycle?: StatutoryCycleType | string;
  periodKey?: string;
  periodLabel?: string;
  priority: TaskPriority;
  customPriority?: TaskPriority | string | null;
  statutoryPriority?: TaskPriority | string;
  legalRisk?: TaskPriority | string;
  customPriorityReason?: string | null;
  customPriorityUpdatedAt?: string | null;
  customPriorityUpdatedBy?: string | null;
  status: TaskStatus;
  assigneeRole: RoleType | string;
  assigneeName?: string;
  waitingOnRole?: RoleType | string;
  waitingOnName?: string;
  dueDate?: string;
  eventDate?: string;
  legalCitation?: string;
  legalBasis?: string;
  ruleCode?: string;
  estimatedCost?: number;
  isEscalated?: boolean;
  assignedUserId?: string;
  departmentId?: string;
  departmentName?: string;
  createdAt: string;
  updatedAt: string;
  evidenceCount?: number;
  commentsCount?: number;
  documents?: any[];
  comments?: any[];
  timeline?: any[];
  calculationBasisJson?: any;
  [key: string]: any;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: { id: string; fullName: string; email: string };
}
