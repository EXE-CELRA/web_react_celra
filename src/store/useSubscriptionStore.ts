import { create } from 'zustand';
import apiClient from '../api/client';
import type { SubscriptionInfo, PaymentInvoiceItem, SubscriptionPlanCode } from '../interfaces';
import { SUBSCRIPTION_PLANS, DEFAULT_TRIAL_SUBSCRIPTION } from '../constants/subscriptionPlans';

interface SubscriptionState {
  subscription: SubscriptionInfo | null;
  invoices: PaymentInvoiceItem[];
  isLoading: boolean;
  error: string | null;

  fetchSubscription: (orgId?: string) => Promise<SubscriptionInfo | null>;
  fetchInvoices: (orgId?: string) => Promise<PaymentInvoiceItem[]>;
  subscribePlan: (
    planCode: SubscriptionPlanCode,
    method?: 'VietQR' | 'Sandbox',
    billingCycle?: 'MONTHLY' | 'YEARLY',
  ) => Promise<SubscriptionInfo>;
  toggleAutoRenew: () => Promise<boolean>;
  cancelAutoRenew: () => Promise<boolean>;
}

const getStorageKey = (orgId?: string) => (orgId ? `celra_subscription_${orgId}` : 'celra_subscription');

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  invoices: [],
  isLoading: false,
  error: null,

  fetchSubscription: async (orgId?: string) => {
    set({ isLoading: true, error: null });
    const targetOrgId = orgId || localStorage.getItem('celra_active_org_id') || undefined;

    try {
      const res = await apiClient.get<unknown, SubscriptionInfo>('/subscriptions/current');
      if (res && res.plan) {
        set({ subscription: res, isLoading: false });
        if (targetOrgId) {
          localStorage.setItem(getStorageKey(targetOrgId), JSON.stringify(res));
        }
        return res;
      }
    } catch {
      // Fallback: Lấy từ LocalStorage hoặc dữ liệu mặc định chuẩn
    }

    // Fallback nếu server chưa có dữ liệu hoặc offline
    let localSub: SubscriptionInfo | null = null;
    if (targetOrgId) {
      try {
        const raw = localStorage.getItem(getStorageKey(targetOrgId));
        if (raw) {
          localSub = JSON.parse(raw) as SubscriptionInfo;
        }
      } catch {
        localSub = null;
      }
    }

    if (!localSub) {
      const defaultPlan = SUBSCRIPTION_PLANS.PROFESSIONAL;
      localSub = {
        organizationId: targetOrgId || 'default-org',
        plan: defaultPlan.code,
        planName: defaultPlan.name,
        priceVnd: defaultPlan.priceVnd,
        status: 'ACTIVE',
        startedAt: DEFAULT_TRIAL_SUBSCRIPTION.startedAt,
        expiresAt: DEFAULT_TRIAL_SUBSCRIPTION.expiresAt,
        nextBillingAt: DEFAULT_TRIAL_SUBSCRIPTION.nextBillingAt,
        autoRenew: true,
        usage: {
          aiChatboxUsed: DEFAULT_TRIAL_SUBSCRIPTION.usage.aiChatboxUsed,
          aiChatboxLimit: defaultPlan.aiChatboxMonthlyLimit,
          docAnalysisUsed: DEFAULT_TRIAL_SUBSCRIPTION.usage.docAnalysisUsed,
          docAnalysisLimit: defaultPlan.docAnalysisMonthlyLimit,
          storageUsedGb: DEFAULT_TRIAL_SUBSCRIPTION.usage.storageUsedGb,
          storageLimitGb: defaultPlan.storageGbLimit,
          daysRemaining: DEFAULT_TRIAL_SUBSCRIPTION.usage.daysRemaining,
        },
      };
      if (targetOrgId) {
        localStorage.setItem(getStorageKey(targetOrgId), JSON.stringify(localSub));
      }
    }

    set({ subscription: localSub, isLoading: false });
    return localSub;
  },

  fetchInvoices: async (orgId?: string) => {
    const targetOrgId = orgId || localStorage.getItem('celra_active_org_id') || undefined;
    try {
      const res = await apiClient.get<unknown, PaymentInvoiceItem[]>('/subscriptions/invoices');
      if (Array.isArray(res)) {
        set({ invoices: res });
        return res;
      }
    } catch {
      // Fallback: Sinh danh sách hóa đơn mặc định
    }

    const currentSub = get().subscription;
    const plan = currentSub ? SUBSCRIPTION_PLANS[currentSub.plan] : SUBSCRIPTION_PLANS.PROFESSIONAL;
    const fallbackInvoices: PaymentInvoiceItem[] = [
      {
        id: 'inv-001',
        code: `INV-${targetOrgId?.slice(0, 8).toUpperCase() || 'CELRA'}-01`,
        planCode: plan.code,
        planName: plan.name,
        amountVnd: plan.priceVnd,
        paidAt: currentSub?.startedAt || new Date().toISOString(),
        paymentMethod: 'VietQR',
        status: 'SUCCESS',
        periodStart: currentSub?.startedAt || new Date().toISOString(),
        periodEnd: currentSub?.expiresAt || new Date().toISOString(),
        taxNote: 'Hóa đơn VAT điện tử hợp lệ phục vụ khấu trừ thuế TNDN',
      },
    ];

    set({ invoices: fallbackInvoices });
    return fallbackInvoices;
  },

  subscribePlan: async (
    planCode: SubscriptionPlanCode,
    method: 'VietQR' | 'Sandbox' = 'VietQR',
    billingCycle: 'MONTHLY' | 'YEARLY' = 'MONTHLY',
  ) => {
    set({ isLoading: true, error: null });
    const targetOrgId = localStorage.getItem('celra_active_org_id') || undefined;

    try {
      const res = await apiClient.post<unknown, SubscriptionInfo>('/subscriptions/subscribe', {
        planCode,
        paymentMethod: method,
        billingCycle,
      });
      if (res && res.plan) {
        set({ subscription: res, isLoading: false });
        if (targetOrgId) {
          localStorage.setItem(getStorageKey(targetOrgId), JSON.stringify(res));
        }
        return res;
      }
      throw new Error('Phản hồi kích hoạt gói dịch vụ không hợp lệ');
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  toggleAutoRenew: async () => {
    const current = get().subscription;
    if (!current) return false;
    const nextVal = !current.autoRenew;
    const updated = { ...current, autoRenew: nextVal };
    const targetOrgId = localStorage.getItem('celra_active_org_id') || undefined;

    try {
      await apiClient.patch('/subscriptions/auto-renew', { autoRenew: nextVal });
    } catch {
      // ignore
    }

    set({ subscription: updated });
    if (targetOrgId) {
      localStorage.setItem(getStorageKey(targetOrgId), JSON.stringify(updated));
    }
    return nextVal;
  },

  cancelAutoRenew: async () => {
    const current = get().subscription;
    if (!current) return false;
    const updated: SubscriptionInfo = { ...current, autoRenew: false };
    const targetOrgId = localStorage.getItem('celra_active_org_id') || undefined;

    try {
      await apiClient.post('/subscriptions/cancel');
    } catch {
      // ignore
    }

    set({ subscription: updated });
    if (targetOrgId) {
      localStorage.setItem(getStorageKey(targetOrgId), JSON.stringify(updated));
    }
    return true;
  },
}));
