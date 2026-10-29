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
      danhSachDuKien: [],
      factHistories: [],
      lichSuDuKien: [],
      isLoading: false,
      dangTai: false,
      error: null,
      loi: null,
    });

    useTaskStore.setState({
      tasks: [],
      danhSachNhiemVu: [],
      selectedTask: null,
      nhiemVuChon: null,
      comments: [],
      binhLuan: [],
      notifications: [],
      thongBao: [],
      unreadNotificationsCount: 0,
      soThongBaoChuaDoc: 0,
      checklists: [],
      danhMucKiemTra: [],
      calendarNotes: [],
      ghiChuLich: [],
      isLoading: false,
      dangTai: false,
      error: null,
      loi: null,
    });

    useWalletStore.setState({
      wallet: null,
      thongTinVi: null,
      ledgers: [],
      danhSachGiaoDich: [],
      isLoading: false,
      dangTai: false,
      error: null,
      loi: null,
    });
  } catch (err) {
    console.warn('Lỗi khi dọn dẹp tenant stores:', err);
  }
};

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
      } else {
        localStorage.removeItem('celra_active_org_id');
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
    resetTenantStores();
    set({ activeOrg: org, doanhNghiepHienTai: org });

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
    set({ isLoading: true, dangTai: true, error: null, loi: null });
    try {
      const res: any = await apiClient.post('/organizations/onboarding', data);
      localStorage.setItem('celra_active_org_id', res.id);
      resetTenantStores();
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
