export type RoleType =
  | 'SUPER_ADMIN'
  | 'BUSINESS_OWNER'
  | 'INTERNAL_ACCOUNTANT'
  | 'HR_OFFICER'
  | 'OPS_LEAD'
  | 'OUTSOURCED_AGENT'
  | 'VERIFIER_EXPERT'
  | 'AUDITOR';

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

export type CompanyTypeTag = 'TAG_HKD' | 'TAG_TNHH_1TV' | 'TAG_TNHH_2TV' | 'TAG_JSC';

export type IndustryTag = 
  | 'TAG_FNB' 
  | 'TAG_ECOMMERCE' 
  | 'TAG_B2B_SERVICE'
  | 'TAG_MANUFACTURING' 
  | 'TAG_IT_SOFTWARE' 
  | 'TAG_EDUCATION' 
  | 'TAG_LOGISTICS';

export type ComplianceModuleId = 
  | 'MODULE_TAX_CORE'
  | 'MODULE_INVOICE_CASHFLOW'
  | 'MODULE_LABOR_HR'
  | 'MODULE_LICENSING_ATTP'
  | 'MODULE_ECOM_DATA_PRIVACY'
  | 'MODULE_PREMISES_PCCC'
  | 'MODULE_CONTRACTS'
  | 'MODULE_DATA_IP'
  | 'MODULE_LICENSING_CON'
  | 'MODULE_LEGAL_CORP';

export type EmployeeScale = 'under_10' | '10_to_50' | 'over_50';

export interface BaseProfile {
  taxCode: string;
  companyName: string;
  employeeScale: EmployeeScale;
  employeeCount?: number;
  annualRevenue?: number;
  charterCapital?: number;
  isNewlyEstablished?: boolean;
  requiresLaborRuleBook: boolean;
  companyTypeTag: CompanyTypeTag;
  industryTags: IndustryTag[];
}

export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'urgent' | (string & {});

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

export interface ComplianceNotification {
  id: string;
  organizationId: string;
  userId: string;
  taskId?: string | null;
  milestone: 'BEFORE_7D' | 'BEFORE_3D' | 'BEFORE_1D' | 'DUE_TODAY' | 'OVERDUE';
  title: string;
  message: string;
  linkUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  dueDateVersion?: string | null;
  createdAt: string;
}

export interface DynamicSituationQuestion {
  id: string;
  moduleId?: ComplianceModuleId;
  branchType: 'company_type' | 'industry' | 'labor_scale' | 'module';
  branchCode: string;
  branchLabel: string;
  title: string;
  legalBasis: string;
  options: string[];
  selectedOption?: string;
  warningNotice?: string;
  severity?: string;
  verificationEvidence?: string;
  verificationUrl?: string;
  legalReference?: {
    lawName: string;
    article?: string;
    penaltyRange?: string;
  };
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

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FindingStatus = 'OPEN' | 'IN_REMEDIATION' | 'RESOLVED' | 'ACCEPTED_RISK';

export type ExpertCaseStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'PROPOSALS_RECEIVED'
  | 'ESCROW_FUNDED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export type WalletTransactionType = 'DEPOSIT' | 'ESCROW_HOLD' | 'ESCROW_CAPTURE' | 'REFUND' | 'WITHDRAW';

export type WalletTransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  name?: string;
  hoVaTen?: string;
  phoneNumber?: string;
  phone?: string;
  soDienThoai?: string;
  avatarUrl?: string;
  avatar?: string;
  anhDaiDien?: string;
  systemRole: string;
  role?: string;
  vaiTro?: string;
  roleTitle?: string;
  chucDanh?: string;
  twoFactorEnabled?: boolean;
  isTwoFactorEnabled?: boolean;
  isSuperAdmin?: boolean;
  createdAt: string;
  taoLuc?: string;
  [key: string]: any;
}

export interface Organization {
  id: string;
  name?: string;
  tenDoanhNghiep?: string;
  legalName: string;
  taxCode: string;
  maSoThue?: string;
  legalType?: string;
  loaiHinhPhapLy?: string;
  industry?: string;
  nganhNghe?: string;
  businessModel?: string;
  moHinhKinhDoanh?: string;
  operatingYears?: string;
  soNamHoatDong?: string;
  revenueStatus?: string;
  tinhTrangDoanhThu?: string;
  scale?: string;
  employeeCount?: number;
  soLuongNhanSu?: number;
  locations?: string;
  diaDiemKinhDoanh?: string;
  hasOnlineSales?: boolean;
  coBanHangOnline?: boolean;
  address?: string;
  diaChi?: string;
  city?: string;
  thanhPho?: string;
  representativeName?: string;
  tenNguoiDaiDien?: string;
  status: string;
  trangThai?: string;
  onboardingStep: number;
  complianceScore: number;
  createdAt?: string;
  taoLuc?: string;
  updatedAt?: string;
  capNhatLuc?: string;
  [key: string]: any;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: RoleType;
  departmentId?: string;
  status: string;
  organization?: Organization;
  department?: { id: string; name: string; code: string };
  user?: User;
}

export interface ContextFact {
  id: string;
  organizationId?: string;
  category?: string;
  group?: string;
  nhom?: string;
  factKey?: string;
  key?: string;
  khoa?: string;
  label: string;
  nhan?: string;
  valueType?: string;
  value?: string;
  currentValue?: string;
  giaTriHienTai?: string;
  source: string;
  nguon?: string;
  providedBy?: string;
  providedAt?: string;
  affectedRules?: string[];
  cacQuyTacLienQuan?: string[];
  status?: string;
  trangThai?: string;
  confidenceScore?: number;
  history?: any[];
  updatedAt?: string;
  conflictDetails?: string | null;
  chiTietXungDot?: string | null;
  taoLuc?: string;
  capNhatLuc?: string;
  [key: string]: any;
}

export interface ContextFactHistory {
  id: string;
  factId: string;
  oldValue: string;
  newValue: string;
  reason?: string;
  actorId?: string;
  actorName?: string;
  createdAt: string;
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

export interface EvidenceDocument {
  id: string;
  organizationId: string;
  taskId?: string;
  documentType: string;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  confidenceScore?: number;
  createdAt: string;
}

export interface ComplianceFinding {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  status: FindingStatus;
  legalBasis?: string;
  impactScore?: number;
  remediationTaskId?: string;
  createdAt: string;
}

export interface ExpertCase {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  category: string;
  budgetEstimate: number;
  escrowAmount: number;
  status: ExpertCaseStatus;
  deliverables?: string;
  conclusions?: string;
  selectedExpertId?: string;
  createdAt: string;
  quotes?: ExpertQuote[];
}

export interface ExpertQuote {
  id: string;
  caseId: string;
  expertId: string;
  expertName: string;
  expertAvatar?: string;
  proposedPrice: number;
  deliveryTimeline: string;
  proposalNote: string;
  isAccepted: boolean;
  createdAt: string;
}

export interface WalletLedger {
  id: string;
  organizationId: string;
  transactionType: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: WalletTransactionStatus;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceVnd: number;
  badge: string;
  bonusText: string;
  popular?: boolean;
}

export interface WalletInfo {
  id: string;
  organizationId: string;
  balance: number;
  heldAmount?: number;
  escrowHold?: number;
  availableBalance?: number;
  currency: string;
}

export interface AuditEvent {
  id: string;
  organizationId?: string;
  userId?: string;
  actorName?: string;
  actorRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface SurveyQuestion {
  id: string;
  code: string;
  title: string;
  description?: string;
  category: string;
  inputType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'NUMBER' | 'BOOLEAN' | 'TEXT';
  options?: Array<{ label: string; value: any }>;
  currentAnswer?: any;
}


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
