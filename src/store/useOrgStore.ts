import { create } from 'zustand';
import apiClient from '../api/client';
import type { Organization } from '../types';

interface OrgState {
  organizations: Organization[];
  danhSachDoanhNghiep: Organization[];
  activeOrg: Organization | null;
  doanhNghiepHienTai: Organization | null;
  isLoading: boolean;
  dangTai: boolean;
  error: string | null;
  loi: string | null;

  fetchMyOrganizations: () => Promise<void>;
  layDanhSachDoanhNghiep: () => Promise<void>;
  setActiveOrg: (org: Organization) => void;
  datDoanhNghiepHienTai: (org: Organization) => void;
  submitOnboarding: (data: any) => Promise<Organization>;
  nopHoSoKhoiTao: (data: any) => Promise<Organization>;
  fetchOrgDetails: (id: string) => Promise<void>;
  layChiTietDoanhNghiep: (id: string) => Promise<void>;
}

export const useOrgStore = create<OrgState>((set) => {
  const fetchMyOrgsFn = async () => {
    set({ isLoading: true, dangTai: true });
    try {
      const res: any = await apiClient.get('/organizations/my-workspaces');
      const list = Array.isArray(res) ? res : [];
      
      const storedOrgId = localStorage.getItem('celra_active_org_id');
      let currentActive = list.find((o) => o.id === storedOrgId) || list[0] || null;

      if (currentActive) {
        localStorage.setItem('celra_active_org_id', currentActive.id);
      }

      set({
        organizations: list,
        danhSachDoanhNghiep: list,
        activeOrg: currentActive,
        doanhNghiepHienTai: currentActive,
        isLoading: false,
        dangTai: false,
      });
    } catch (err: any) {
      set({ error: err.message, loi: err.message, isLoading: false, dangTai: false });
    }
  };

  const setActiveOrgFn = (org: Organization) => {
    localStorage.setItem('celra_active_org_id', org.id);
    set({ activeOrg: org, doanhNghiepHienTai: org });
  };

  const submitOnboardingFn = async (data: any) => {
    set({ isLoading: true, dangTai: true, error: null, loi: null });
    try {
      const res: any = await apiClient.post('/organizations/onboarding', data);
      localStorage.setItem('celra_active_org_id', res.id);
      set((state) => {
        const updatedList = [res, ...state.organizations.filter((o) => o.id !== res.id)];
        return {
          organizations: updatedList,
          danhSachDoanhNghiep: updatedList,
          activeOrg: res,
          doanhNghiepHienTai: res,
          isLoading: false,
          dangTai: false,
        };
      });
      return res;
    } catch (err: any) {
      set({ error: err.message, loi: err.message, isLoading: false, dangTai: false });
      throw err;
    }
  };

  const fetchOrgDetailsFn = async (id: string) => {
    try {
      const res: any = await apiClient.get(`/organizations/${id}`);
      set({ activeOrg: res, doanhNghiepHienTai: res });
    } catch (err) {
      console.error(err);
    }
  };

  return {
    organizations: [],
    danhSachDoanhNghiep: [],
    activeOrg: null,
    doanhNghiepHienTai: null,
    isLoading: false,
    dangTai: false,
    error: null,
    loi: null,

    fetchMyOrganizations: fetchMyOrgsFn,
    layDanhSachDoanhNghiep: fetchMyOrgsFn,
    setActiveOrg: setActiveOrgFn,
    datDoanhNghiepHienTai: setActiveOrgFn,
    submitOnboarding: submitOnboardingFn,
    nopHoSoKhoiTao: submitOnboardingFn,
    fetchOrgDetails: fetchOrgDetailsFn,
    layChiTietDoanhNghiep: fetchOrgDetailsFn,
  };
});
