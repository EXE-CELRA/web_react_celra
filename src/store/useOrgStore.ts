import { create } from 'zustand';
import apiClient from '../api/client';
import type { Organization } from '../types';
import { useContextStore } from './useContextStore';
import { useTaskStore } from './useTaskStore';
import { useWalletStore } from './useWalletStore';

// 🛡️ Dọn dẹp sạch toàn bộ state và cache của doanh nghiệp cũ khi đổi workspace
export const resetTenantStores = () => {
  // 1. Xóa toàn diện các cache khảo sát, thuế và cảnh báo cũ tránh rò rỉ chéo sang doanh nghiệp khác
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

  // 2. Reset các Zustand Store chứa dữ liệu của Tenant về mảng rỗng ban đầu
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
  error: string | null;

  fetchMyOrganizations: () => Promise<void>;
  setActiveOrg: (org: Organization) => void;
  submitOnboarding: (data: any) => Promise<Organization>;
  fetchOrgDetails: (id: string) => Promise<void>;
}

export const useOrgStore = create<OrgState>((set) => {
  const fetchMyOrgsFn = async () => {
    set({ isLoading: true });
    try {
      const res: any = await apiClient.get('/organizations/my-workspaces');
      const list = Array.isArray(res) ? res : [];
      
      const storedOrgId = localStorage.getItem('celra_active_org_id');
      let currentActive = list.find((o) => o.id === storedOrgId) || list[0] || null;

      if (currentActive) {
        localStorage.setItem('celra_active_org_id', currentActive.id);
      } else {
        localStorage.removeItem('celra_active_org_id');
        resetTenantStores();
      }

      set({
        organizations: list,
        activeOrg: currentActive,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  };

  const setActiveOrgFn = (org: Organization) => {
    localStorage.setItem('celra_active_org_id', org.id);
    resetTenantStores();
    set({ activeOrg: org });

    // Kích hoạt nạp mới ngay lập tức các phân hệ cho doanh nghiệp mới
    try {
      useContextStore.getState().fetchFacts();
      useTaskStore.getState().fetchTasks();
      useWalletStore.getState().fetchWallet();
    } catch (err) {
      console.warn('Lỗi khi fetch dữ liệu tenant mới:', err);
    }
  };

  const submitOnboardingFn = async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await apiClient.post('/organizations/onboarding', data);
      localStorage.setItem('celra_active_org_id', res.id);
      resetTenantStores();
      set((state) => {
        const updatedList = [res, ...state.organizations.filter((o) => o.id !== res.id)];
        return {
          organizations: updatedList,
          activeOrg: res,
          isLoading: false,
        };
      });
      return res;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  };

  const fetchOrgDetailsFn = async (id: string) => {
    try {
      const res: any = await apiClient.get(`/organizations/${id}`);
      set({ activeOrg: res });
    } catch (err) {
      console.error(err);
    }
  };

  return {
    organizations: [],
    activeOrg: null,
    isLoading: false,
    error: null,

    fetchMyOrganizations: fetchMyOrgsFn,
    setActiveOrg: setActiveOrgFn,
    submitOnboarding: submitOnboardingFn,
    fetchOrgDetails: fetchOrgDetailsFn,
  };
});
