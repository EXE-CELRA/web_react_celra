export type RoleType =
  | 'SUPER_ADMIN'
  | 'BUSINESS_OWNER'
  | 'INTERNAL_ACCOUNTANT'
  | 'HR_OFFICER'
  | 'OPS_LEAD'
  | 'OUTSOURCED_AGENT'
  | 'VERIFIER_EXPERT'
  | 'AUDITOR';

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
  | 'MODULE_ECOM_DATA_PRIVACY';

export type EmployeeScale = 'under_10' | '10_to_50' | 'over_50';

export interface BaseProfile {
  taxCode: string;
  companyName: string;
  employeeScale: EmployeeScale;
  requiresLaborRuleBook: boolean;
  companyTypeTag: CompanyTypeTag;
  industryTags: IndustryTag[];
}

export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'urgent' | (string & {});

export interface Checklist {
  id: string;
  code: string;
  title: string;
  category: string;
  priority: Priority;
  status: string;
  generatedFromRuleId: string;
  ruleCode: string;
  contextReason: string;
  legalBasis: string;
  assigneeRole?: any;
  createdAt?: string;
  items?: any[];
  tasks?: any[];
  [key: string]: any;
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
  documents?: any[];
  [key: string]: any;
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
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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
  phoneNumber?: string;
  phone?: string;
  avatarUrl?: string;
  avatar?: string;
  systemRole: string;
  role?: string;
  roleTitle?: string;
  twoFactorEnabled?: boolean;
  isTwoFactorEnabled?: boolean;
  createdAt: string;
}

export interface Organization {
  id: string;
  name?: string;
  legalName: string;
  taxCode: string;
  industry?: string;
  scale?: string;
  address?: string;
  city?: string;
  status: string;
  onboardingStep: number;
  complianceScore: number;
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
  factKey?: string;
  key?: string;
  label: string;
  valueType?: string;
  value?: string;
  currentValue?: string;
  source: string;
  providedBy?: string;
  providedAt?: string;
  affectedRules?: string[];
  status?: string;
  confidenceScore?: number;
  history?: any[];
  updatedAt?: string;
  conflictDetails?: string | null;
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
  organizationId: string;
  title: string;
  description?: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeRole: RoleType;
  waitingOnRole?: RoleType;
  dueDate?: string;
  legalCitation?: string;
  estimatedCost?: number;
  isEscalated: boolean;
  assignedUserId?: string;
  departmentId?: string;
  createdAt: string;
  updatedAt: string;
  evidenceCount?: number;
  commentsCount?: number;
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
