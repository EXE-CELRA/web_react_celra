export type SubscriptionPlanCode = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'TRIAL' | 'CANCELLED';

export interface PlanFeatureDefinition {
  code: SubscriptionPlanCode;
  name: string;
  priceVnd: number;
  periodLabel: string;
  badge?: string;
  popular?: boolean;
  description: string;
  targetAudience: string;
  aiChatboxMonthlyLimit: number;
  docAnalysisMonthlyLimit: number;
  storageGbLimit: number;
  maxOrganizations: number;
  expertConsultingSessionsPerMonth?: number;
  sessionDurationMinutes?: string;
  features: string[];
  highlightFeatures: string[];
}

export interface SubscriptionUsageStats {
  aiChatboxUsed: number;
  aiChatboxLimit: number;
  docAnalysisUsed: number;
  docAnalysisLimit: number;
  storageUsedGb: number;
  storageLimitGb: number;
  daysRemaining: number;
}

export interface SubscriptionInfo {
  organizationId: string;
  plan: SubscriptionPlanCode;
  planName: string;
  priceVnd: number;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
  nextBillingAt: string;
  autoRenew: boolean;
  usage: SubscriptionUsageStats;
}

export interface PaymentInvoiceItem {
  id: string;
  code: string;
  planCode: SubscriptionPlanCode;
  planName: string;
  amountVnd: number;
  paidAt: string;
  paymentMethod: 'VietQR' | 'Sandbox' | 'BankTransfer';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  periodStart: string;
  periodEnd: string;
  invoiceUrl?: string;
  taxNote?: string;
}
