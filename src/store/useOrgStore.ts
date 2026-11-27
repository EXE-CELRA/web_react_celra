import { create } from 'zustand';
import apiClient from '../api/client';
import type { Organization } from '../types';
import { useContextStore } from './useContextStore';
import { useTaskStore } from './useTaskStore';
import { useWalletStore } from './useWalletStore';

// 🛡️ Dọn dẹp sạch toàn bộ state và cache của doanh nghiệp cũ khi đổi workspace
export const resetTenantStores = () => {
  const keysToRemove = [
    'celra_survey_completed',
    'celra_survey_completed_profile',
    'celra_survey_draft_profile',
    'celra_survey_draft_answers',
    'celra_survey_completed_answers',
    'celra_survey_tax_completed',
    'celra_pending_law_alert_v2',
    'celra_cit_quarter',
    'celra_cit_year',
    'celra_tax_lookup_details',
  ];
  keysToRemove.forEach((k) => localStorage.removeItem(k));

  try {
    useContextStore.setState({
      facts: [],
      factHistories: [],
      isLoading: false,
      error: null,
    });

    useTaskStore.setState({
      tasks: [],
      selectedTask: null,
      comments: [],
      notifications: [],
      unreadNotificationsCount: 0,
      checklists: [],
      calendarNotes: [],
      isLoading: false,
      error: null,
    });

    useWalletStore.setState({
      wallet: null,
      ledgers: [],
      isLoading: false,
      error: null,
    });
  } catch (err) {
    console.warn('Lỗi khi dọn dẹp tenant stores:', err);
  }
};

interface OrgState {
  organizations: Organization[];
  activeOrg: Organization | null;
  isLoading: boolean;
  hasInitialized: boolean;
  error: string | null;

  fetchMyOrganizations: () => Promise<void>;
  setActiveOrg: (org: Organization) => void;
  submitOnboarding: (data: Record<string, unknown>) => Promise<Organization>;
  fetchOrgDetails: (id: string) => Promise<void>;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message;
  }
  return fallback;
}

function loadInitialActiveOrg(): Organization | null {
  if (typeof window === 'undefined') return null;
  try {
    const storedOrgId = localStorage.getItem('celra_active_org_id');
    const rawSnapshot = localStorage.getItem('celra_active_org_snapshot');
    if (!rawSnapshot) return null;
    const parsed = JSON.parse(rawSnapshot) as Organization | null;
    if (parsed && (!storedOrgId || parsed.id === storedOrgId)) {
      return parsed;
    }
  } catch {
    // Bỏ qua nếu snapshot bị lỗi định dạng
  }
  return null;
}

export const useOrgStore = create<OrgState>((set) => {
  const initialActiveOrg = loadInitialActiveOrg();

  const fetchMyOrgsFn = async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get<unknown, Organization[]>('/organizations/my-workspaces');
      const list = Array.isArray(res) ? res : [];

      const storedOrgId = localStorage.getItem('celra_active_org_id');
      const currentActive = list.find((o) => o.id === storedOrgId) || list[0] || null;

      if (currentActive) {
        localStorage.setItem('celra_active_org_id', currentActive.id);
        localStorage.setItem('celra_active_org_snapshot', JSON.stringify(currentActive));
      } else {
        localStorage.removeItem('celra_active_org_id');
        localStorage.removeItem('celra_active_org_snapshot');
        resetTenantStores();
      }

      set({
        organizations: list,
        activeOrg: currentActive,
        isLoading: false,
        hasInitialized: true,
      });
    } catch (err: unknown) {
      set({
        error: getErrorMessage(err, 'Không thể tải danh sách doanh nghiệp'),
        isLoading: false,
        hasInitialized: true,
      });
    }
  };

  const setActiveOrgFn = (org: Organization) => {
    localStorage.setItem('celra_active_org_id', org.id);
    localStorage.setItem('celra_active_org_snapshot', JSON.stringify(org));
    resetTenantStores();
    set({ activeOrg: org, hasInitialized: true });

    try {
      useContextStore.getState().fetchFacts();
      useTaskStore.getState().fetchTasks();
      useWalletStore.getState().fetchWallet();
    } catch (err) {
      console.warn('Lỗi khi fetch dữ liệu tenant mới:', err);
    }
  };

  const submitOnboardingFn = async (data: Record<string, unknown>) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post<unknown, Organization>('/organizations/onboarding', data);
      localStorage.setItem('celra_active_org_id', res.id);
      localStorage.setItem('celra_active_org_snapshot', JSON.stringify(res));
      resetTenantStores();
      set((state) => ({
        organizations: [res, ...state.organizations.filter((o) => o.id !== res.id)],
        activeOrg: res,
        isLoading: false,
        hasInitialized: true,
      }));
      return res;
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Không thể tạo tổ chức'), isLoading: false });
      throw err;
    }
  };

  const fetchOrgDetailsFn = async (id: string) => {
    try {
      const res = await apiClient.get<unknown, Organization>(`/organizations/${id}`);
      localStorage.setItem('celra_active_org_snapshot', JSON.stringify(res));
      set({ activeOrg: res, hasInitialized: true });
    } catch (err) {
      console.error(err);
    }
  };

  return {
    organizations: initialActiveOrg ? [initialActiveOrg] : [],
    activeOrg: initialActiveOrg,
    isLoading: false,
    hasInitialized: false,
    error: null,

    fetchMyOrganizations: fetchMyOrgsFn,
    setActiveOrg: setActiveOrgFn,
    submitOnboarding: submitOnboardingFn,
    fetchOrgDetails: fetchOrgDetailsFn,
  };
});
