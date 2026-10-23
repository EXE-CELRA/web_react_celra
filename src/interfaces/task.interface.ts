import type { Priority } from './common.interface';
import type { RoleType } from './user.interface';

export type StatutoryCycleType =
  | 'MONTHLY'          // 1. Hàng tháng (Hạn ngày 20)
  | 'QUARTERLY'        // 2. Hàng quý (30/04, 31/07, 31/10, 31/01)
  | 'BIANNUAL_6M'      // 3. 6 Tháng / Bán niên (05/06, 05/12)
  | 'ANNUAL'           // 4. Cả năm (30/01 môn bài, 31/03 quyết toán BCTC)
  | 'EVENT_10D'        // 5. Từng lần phát sinh 10 ngày (Thuế nhà thầu FCT, ĐK NQLĐ)
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
  | 'need_expert'
  | 'completed'
  | 'cancelled';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'urgent' | 'high' | 'medium' | 'low';

export interface Checklist {
  id: string;
  code: string;
  maChecklist?: string;
  title: string;
  tieuDe?: string;
  category: string;
  danhMuc?: string;
  priority?: Priority;
  doUuTien?: Priority;
  status: string;
  trangThai?: string;
  itemCount?: number;
  soLuongMuc?: number;
  totalTasks?: number;
  tongSoNhiemVu?: number;
  completedTasks?: number;
  nhiemVuHoanThanh?: number;
  progressPercent?: number;
  tiLeTienDo?: number;
  createdAt?: string;
  taoLuc?: string;
  items?: any[];
  tasks?: any[];
  [key: string]: any;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  findingId?: string;
  ruleCode: string;
  maQuyTac?: string;
  title: string;
  tieuDe?: string;
  cycleType: StatutoryCycleType;
  loaiChuKy?: StatutoryCycleType;
  departmentId?: string;
  assigneeId?: string;
  assigneeName?: string;
  tenNguoiXuLy?: string;
  assigneeRole?: string;
  vaiTroNguoiXuLy?: string;
  defaultPriority?: Priority;
  legalBasis: string;
  canCuPhapLy?: string;
  legalDocUrl?: string;
  evidenceRequirement?: string;
  yeuCauChungTu?: string;
  eventDate?: string | null;
  isActive: boolean;
  kichHoat?: boolean;
  lastGeneratedPeriod?: string;
  nextDueDate?: string | null;
  createdAt?: string;
  taoLuc?: string;
}

export interface Task {
  id: string;
  code: string;
  maNhiemVu?: string;
  title: string;
  tieuDe?: string;
  checklistId?: string;
  category: string;
  danhMuc?: string;
  priority: Priority;
  doUuTien?: Priority;
  assigneeRole?: any;
  vaiTroNguoiXuLy?: any;
  waitingOnRole?: any;
  vaiTroChoDoi?: any;
  waitingOnName?: string;
  tenNguoiChoDoi?: string;
  departmentId?: string;
  departmentName?: string;
  assigneeId?: string;
  assigneeName?: string;
  tenNguoiXuLy?: string;
  status: any;
  trangThai?: any;
  dueDate?: string;
  hanChot?: string;
  description?: string;
  moTa?: string;
  contextTrigger?: string;
  ruleCode?: string;
  maQuyTac?: string;
  legalBasis?: string;
  canCuPhapLy?: string;
  periodCycle?: StatutoryCycleType;
  periodKey?: string;
  documents?: any[];
  [key: string]: any;
}

export interface TaskItem {
  id: string;
  code?: string;
  maNhiemVu?: string;
  organizationId: string;
  checklistId?: string;
  checklistItemId?: string;
  title: string;
  tieuDe?: string;
  description?: string;
  moTa?: string;
  category: string;
  danhMuc?: string;
  periodCycle?: StatutoryCycleType | string;
  periodKey?: string;
  periodLabel?: string;
  priority: TaskPriority;
  doUuTien?: TaskPriority;
  status: TaskStatus;
  trangThai?: TaskStatus;
  assigneeRole: RoleType | string;
  vaiTroNguoiXuLy?: RoleType | string;
  assigneeName?: string;
  tenNguoiXuLy?: string;
  waitingOnRole?: RoleType | string;
  vaiTroChoDoi?: RoleType | string;
  waitingOnName?: string;
  tenNguoiChoDoi?: string;
  dueDate?: string;
  hanChot?: string;
  eventDate?: string;
  legalCitation?: string;
  legalBasis?: string;
  canCuPhapLy?: string;
  ruleCode?: string;
  maQuyTac?: string;
  estimatedCost?: number;
  isEscalated?: boolean;
  assignedUserId?: string;
  departmentId?: string;
  departmentName?: string;
  createdAt: string;
  taoLuc?: string;
  updatedAt: string;
  capNhatLuc?: string;
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
