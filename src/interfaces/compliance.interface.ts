import type { Priority } from './common.interface';
import type { StatutoryCycleType } from './task.interface';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FindingStatus = 'OPEN' | 'IN_REMEDIATION' | 'RESOLVED' | 'ACCEPTED_RISK';

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

export interface AuditFindingItem {
  id: string;
  auditId: string;
  factId?: string | null;
  ruleCode: string;
  obligationTitle: string;
  category: string;
  applicableStatus: 'applicable' | 'not_applicable' | 'missing_info' | 'verification_required';
  actionRequired: string;
  evidenceRequired: string;
  legalBasis: string;
  legalDocNumber?: string | null;
  legalArticle?: string | null;
  legalDocUrl?: string | null;
  legalValidity: 'in_force' | 'expired' | 'unverified';
  verifiedAt?: string | null;
  resultSource: 'rule_based' | 'ai_assisted' | 'unverified_fallback';
  cycleType: StatutoryCycleType;
  calculationMethod?: string | null;
  missingDataNotice?: string | null;
  suggestedPriority: Priority;
  penaltyRisk?: string;
}
