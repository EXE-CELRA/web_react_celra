import { create } from 'zustand';
import apiClient from '../api/client';
import type { Organization } from '../types';

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

export const useOrgStore = create<OrgState>((set) => ({
  organizations: [],
  activeOrg: null,
  isLoading: false,
  error: null,

  fetchMyOrganizations: async () => {
    set({ isLoading: true });
    try {
      const res: any = await apiClient.get('/organizations/my-workspaces');
      const list = Array.isArray(res) ? res : [];
      
      const storedOrgId = localStorage.getItem('celra_active_org_id');
      let currentActive = list.find((o) => o.id === storedOrgId) || list[0] || null;

      if (currentActive) {
        localStorage.setItem('celra_active_org_id', currentActive.id);
      }

      set({ organizations: list, activeOrg: currentActive, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setActiveOrg: (org: Organization) => {
    localStorage.setItem('celra_active_org_id', org.id);
    set({ activeOrg: org });
  },

  submitOnboarding: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await apiClient.post('/organizations/onboarding', data);
      localStorage.setItem('celra_active_org_id', res.id);
      set((state) => ({
        organizations: [res, ...state.organizations.filter((o) => o.id !== res.id)],
        activeOrg: res,
        isLoading: false,
      }));
      return res;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  fetchOrgDetails: async (id: string) => {
    try {
      const res: any = await apiClient.get(`/organizations/${id}`);
      set({ activeOrg: res });
    } catch (err) {
      console.error(err);
    }
  },
}));
