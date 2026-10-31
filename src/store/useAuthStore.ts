import { create } from 'zustand';
import apiClient from '../api/client';
import type { User, Membership } from '../types';
import { useOrgStore } from './useOrgStore';
import { useTaskStore } from './useTaskStore';
import { useContextStore } from './useContextStore';
import { useWalletStore } from './useWalletStore';

interface AuthState {
  user: User | null;
  memberships: Membership[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  activeRole: string | null;

  login: (credentials: { email: string; password?: string }) => Promise<any>;
  register: (data: { email: string; password?: string; name?: string; phone?: string; otp?: string }) => Promise<any>;
  logout: () => void;
  loadUserProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; email?: string; avatar?: string }) => Promise<any>;
  setActiveRole: (role: string) => void;
}


// 🛡️ HÀM RESET TOÀN BỘ 5 ZUSTAND STORES VÀ DỌN SẠCH STORAGE
export const resetAllAppStores = () => {
  // 1. Dọn sạch toàn bộ localStorage rác (tất cả các key tiền tố celra_)
  try {
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (key.startsWith('celra_') && !key.includes('virtual_bank')) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn('Lỗi khi dọn dẹp localStorage:', err);
  }
  // 2. Reset In-Memory Zustand Stores về trạng thái rỗng ban đầu
  try {
    useOrgStore.setState({
      organizations: [],
      activeOrg: null,
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

    useContextStore.setState({
      facts: [],
      factHistories: [],
      isLoading: false,
      error: null,
    });

    useWalletStore.setState({
      wallet: null,
      ledgers: [],
      isLoading: false,
      error: null,
    });
  } catch (e) {
    console.warn('Lỗi khi reset stores:', e);
  }
};

export const useAuthStore = create<AuthState>((set) => {
  const initialUser = JSON.parse(localStorage.getItem('celra_user') || 'null');
  const initialAuth = !!localStorage.getItem('celra_access_token');
  const initialRole = localStorage.getItem('celra_active_role') || null;

  const loginFn = async (credentials: any) => {
    // 🛡️ Xóa sạch bộ nhớ store của phiên trước đó
    resetAllAppStores();
    set({ isLoading: true, error: null });
    try {
      const payload = {
        email: credentials.email,
        password: credentials.password || credentials.matKhau || credentials.passwordHash,
      };

      const res: any = await apiClient.post('/auth/login', payload);

      const { accessToken, user, memberships } = res;
      localStorage.setItem('celra_access_token', accessToken);
      localStorage.setItem('celra_user', JSON.stringify(user));

      const defaultRole = memberships && memberships.length > 0 ? memberships[0].role : user.systemRole || user.role;
      localStorage.setItem('celra_active_role', defaultRole);

      if (memberships && memberships.length > 0) {
        localStorage.setItem('celra_active_org_id', memberships[0].organizationId);
      } else {
        localStorage.removeItem('celra_active_org_id');
      }
      // Dọn sạch cache khảo sát của phiên đăng nhập trước đó
      localStorage.removeItem('celra_survey_completed_profile');
      localStorage.removeItem('celra_survey_draft_profile');
      localStorage.removeItem('celra_survey_completed');

      set({
        user,
        memberships: memberships || [],
        isAuthenticated: true,
        isLoading: false,
        activeRole: defaultRole,
      });

      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  };

  const registerFn = async (data: any) => {
    // 🛡️ Xóa sạch toàn bộ store trước khi đăng ký tài khoản mới
    resetAllAppStores();
    set({ isLoading: true, error: null });
    try {
      const payload = {
        name: data.hoVaTen || data.fullName || data.name,
        email: data.email,
        password: data.matKhau || data.password || data.passwordHash,
        phone: data.soDienThoai || data.phoneNumber || data.phone,
        otp: data.otp,
      };

      localStorage.removeItem('celra_active_org_id');
      localStorage.removeItem('celra_active_role');
      localStorage.removeItem('celra_survey_completed');
      localStorage.removeItem('celra_survey_draft_answers');
      localStorage.removeItem('celra_survey_draft_profile');
      localStorage.removeItem('celra_survey_completed_profile');
      const res: any = await apiClient.post('/auth/register', payload);
      set({ isLoading: false });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đăng ký thất bại';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  };

  const logoutFn = () => {
    // 🛡️ Reset toàn bộ 5 Zustand stores và localStorage khi đăng xuất
    resetAllAppStores();
    set({
      user: null,
      memberships: [],
      isAuthenticated: false,
      activeRole: null,
    });
  };

  const loadProfileFn = async () => {
    if (!localStorage.getItem('celra_access_token')) return;
    set({ isLoading: true });
    try {
      const userRes: any = await apiClient.get('/auth/profile');
      localStorage.setItem('celra_user', JSON.stringify(userRes));

      if (userRes.role === 'admin' || userRes.isSuperAdmin) {
        localStorage.setItem('celra_active_role', 'admin');
        set({
          user: userRes,
          memberships: [],
          isAuthenticated: true,
          isLoading: false,
          activeRole: 'admin',
        });
        return;
      }

      const membershipsRes: any = await apiClient.get('/organizations/my-workspaces');

      const mems = Array.isArray(membershipsRes) ? membershipsRes : [];
      let activeOrgId = localStorage.getItem('celra_active_org_id');
      const orgIsValid = activeOrgId !== null && mems.some((m: any) => (m.organizationId || m.organization?.id || m.id) === activeOrgId);
      if (!orgIsValid) {
        activeOrgId = mems.length > 0 ? (mems[0].organizationId || mems[0].organization?.id) : null;
        if (activeOrgId) localStorage.setItem('celra_active_org_id', activeOrgId);
        else localStorage.removeItem('celra_active_org_id');
      }

      set({
        user: userRes,
        memberships: mems,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ isLoading: false });
      // Nếu tải profile thất bại (token hết hạn hoặc tài khoản bị xóa trong DB) -> đá ra login ngay lập tức
      logoutFn();
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.replace('/login');
      }
    }
  };

  const updateProfileFn = async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const payload: any = {
        name: data.hoVaTen || data.fullName || data.name,
        phone: data.soDienThoai || data.phoneNumber || data.phone,
        email: data.email,
      };
      if (data.avatar !== undefined) {
        payload.avatar = data.avatar;
      }

      let updatedUser: any = null;
      try {
        const res: any = await apiClient.patch('/auth/profile', payload);
        updatedUser = res?.user || res;
      } catch (apiErr) {
        console.warn('API /auth/profile update fallback to local state:', apiErr);
      }

      const currentUser = JSON.parse(localStorage.getItem('celra_user') || '{}');
      const mergedUser = {
        ...currentUser,
        ...(updatedUser || {}),
        name: payload.name || currentUser.name || currentUser.fullName,
        fullName: payload.name || currentUser.fullName || currentUser.name,
        phone: payload.phone !== undefined ? payload.phone : (currentUser.phone || currentUser.phoneNumber),
        phoneNumber: payload.phone !== undefined ? payload.phone : (currentUser.phoneNumber || currentUser.phone),
        email: payload.email || currentUser.email,
        avatar: (updatedUser && updatedUser.avatar) || (payload.avatar !== undefined ? payload.avatar : currentUser.avatar),
      };

      localStorage.setItem('celra_user', JSON.stringify(mergedUser));
      set({ user: mergedUser, isLoading: false });
      return { success: true, user: mergedUser };
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Cập nhật thông tin thất bại' });
      throw err;
    }
  };

  const setActiveRoleFn = (role: string) => {
    localStorage.setItem('celra_active_role', role);
    set({ activeRole: role });
  };

  return {
    user: initialUser,
    memberships: [],
    isAuthenticated: initialAuth,
    isLoading: false,
    error: null,
    activeRole: initialRole,

    login: loginFn,
    register: registerFn,
    logout: logoutFn,
    loadUserProfile: loadProfileFn,
    updateProfile: updateProfileFn,
    setActiveRole: setActiveRoleFn,
  };
});
