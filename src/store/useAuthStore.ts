import { create } from 'zustand';
import apiClient from '../api/client';
import type { User, Membership } from '../types';
import { useOrgStore } from './useOrgStore';
import { useTaskStore } from './useTaskStore';
import { useContextStore } from './useContextStore';
import { useWalletStore } from './useWalletStore';
import { useAIChatStore } from './useAIChatStore';

interface LoginCredentials {
  email: string;
  password?: string;
  passwordHash?: string;
}

interface RegisterPayload {
  email: string;
  password?: string;
  passwordHash?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  phoneNumber?: string;
  otp?: string;
}

interface UpdateProfilePayload {
  name?: string;
  fullName?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string;
}

interface LoginResponse {
  accessToken: string;
  user: User & { systemRole?: string };
  memberships?: Membership[];
}

interface AuthState {
  user: User | null;
  memberships: Membership[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  activeRole: string | null;

  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  register: (data: RegisterPayload) => Promise<unknown>;
  logout: (skipServerRevoke?: boolean) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ message: string }>;
  loadUserProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfilePayload) => Promise<{ success: boolean; user: User }>;
  setActiveRole: (role: string) => void;
}

function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return e.response?.data?.message || e.message || fallback;
  }
  return fallback;
}

// 🛡️ HÀM RESET TOÀN BỘ 5 ZUSTAND STORES VÀ DỌN SẠCH STORAGE
export const resetAllAppStores = () => {
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

  try {
    useOrgStore.setState({
      organizations: [],
      activeOrg: null,
      isLoading: false,
      hasInitialized: false,
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

    useAIChatStore.setState({ isOpen: false });
  } catch (e) {
    console.warn('Lỗi khi reset stores:', e);
  }
};

export const useAuthStore = create<AuthState>((set) => {
  const initialUser = JSON.parse(localStorage.getItem('celra_user') || 'null') as User | null;
  const initialAuth = !!localStorage.getItem('celra_access_token');
  const initialRole = localStorage.getItem('celra_active_role') || null;

  const loginFn = async (credentials: LoginCredentials) => {
    resetAllAppStores();
    set({ isLoading: true, error: null });
    try {
      const payload = {
        email: credentials.email,
        password: credentials.password || credentials.passwordHash,
      };

      const res = await apiClient.post<unknown, LoginResponse>('/auth/login', payload);

      const { accessToken, user, memberships } = res;
      localStorage.setItem('celra_access_token', accessToken);
      localStorage.setItem('celra_user', JSON.stringify(user));

      const defaultRole =
        memberships && memberships.length > 0
          ? memberships[0].role
          : user.systemRole || user.role || 'owner';
      localStorage.setItem('celra_active_role', defaultRole);

      if (memberships && memberships.length > 0) {
        localStorage.setItem('celra_active_org_id', memberships[0].organizationId);
      } else {
        localStorage.removeItem('celra_active_org_id');
      }

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
    } catch (err: unknown) {
      const msg = extractApiError(err, 'Đăng nhập thất bại');
      set({ error: msg, isLoading: false });
      throw new Error(msg, { cause: err });
    }
  };

  const registerFn = async (data: RegisterPayload) => {
    resetAllAppStores();
    set({ isLoading: true, error: null });
    try {
      const payload = {
        name: data.fullName || data.name,
        email: data.email,
        password: data.password || data.passwordHash,
        phone: data.phoneNumber || data.phone,
        otp: data.otp,
      };

      localStorage.removeItem('celra_active_org_id');
      localStorage.removeItem('celra_active_role');
      localStorage.removeItem('celra_survey_completed');
      localStorage.removeItem('celra_survey_draft_answers');
      localStorage.removeItem('celra_survey_draft_profile');
      localStorage.removeItem('celra_survey_completed_profile');

      const res = await apiClient.post('/auth/register', payload);
      set({ isLoading: false });
      return res;
    } catch (err: unknown) {
      const msg = extractApiError(err, 'Đăng ký thất bại');
      set({ error: msg, isLoading: false });
      throw new Error(msg, { cause: err });
    }
  };

  const logoutFn = (skipServerRevoke = false) => {
    const tokenToRevoke = localStorage.getItem('celra_access_token');
    resetAllAppStores();
    set({
      user: null,
      memberships: [],
      isAuthenticated: false,
      activeRole: null,
    });
    if (!skipServerRevoke && tokenToRevoke) {
      void apiClient
        .post(
          '/auth/logout',
          {},
          {
            headers: {
              Authorization: `Bearer ${tokenToRevoke}`,
            },
          },
        )
        .catch(() => {});
    }
  };

  const changePasswordFn = async (oldPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.patch<unknown, { message: string; accessToken?: string }>(
        '/auth/change-password',
        { oldPassword, newPassword },
      );
      if (res?.accessToken) {
        localStorage.setItem('celra_access_token', res.accessToken);
      }
      set({ isLoading: false });
      return { message: res?.message || 'Đổi mật khẩu thành công' };
    } catch (err: unknown) {
      const msg = extractApiError(err, 'Đổi mật khẩu thất bại');
      set({ error: msg, isLoading: false });
      throw new Error(msg, { cause: err });
    }
  };

  const loadProfileFn = async () => {
    if (!localStorage.getItem('celra_access_token')) return;
    set({ isLoading: true });
    try {
      const userRes = await apiClient.get<unknown, User & { isSuperAdmin?: boolean }>(
        '/auth/profile',
      );
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

      const membershipsRes = await apiClient.get<
        unknown,
        Array<Membership & { organization?: { id?: string } }>
      >('/organizations/my-workspaces');

      const mems = Array.isArray(membershipsRes) ? membershipsRes : [];
      let activeOrgId = localStorage.getItem('celra_active_org_id');
      const orgIsValid =
        activeOrgId !== null &&
        mems.some((m) => (m.organizationId || m.organization?.id || m.id) === activeOrgId);
      if (!orgIsValid) {
        activeOrgId = mems.length > 0 ? mems[0].organizationId || mems[0].organization?.id || null : null;
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
      const statusCode =
        err && typeof err === 'object' && 'statusCode' in err
          ? Number((err as { statusCode?: number }).statusCode)
          : undefined;

      // Chỉ đăng xuất khi token thực sự hết hạn/không hợp lệ (401) hoặc tài khoản không còn tồn tại (404).
      // Không xóa phiên đăng nhập khi gặp lỗi mạng tạm thời hoặc lỗi DB quá tải (500/502/503).
      if (statusCode === 401 || statusCode === 404) {
        logoutFn(true);
        if (
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')
        ) {
          window.location.replace('/login');
        }
      }
    }
  };

  const updateProfileFn = async (data: UpdateProfilePayload) => {
    set({ isLoading: true, error: null });
    try {
      const payload: Record<string, string | undefined> = {
        name: data.fullName || data.name,
        phone: data.phoneNumber || data.phone,
        email: data.email,
      };
      if (data.avatar !== undefined) {
        payload.avatar = data.avatar;
      }

      let updatedUser: Partial<User> | null = null;
      try {
        const res = await apiClient.patch<unknown, { user?: Partial<User> } & Partial<User>>(
          '/auth/profile',
          payload,
        );
        updatedUser = res?.user || res;
      } catch (apiErr) {
        console.warn('API /auth/profile update fallback to local state:', apiErr);
      }

      const currentUser = JSON.parse(localStorage.getItem('celra_user') || '{}') as User & {
        fullName?: string;
        phoneNumber?: string;
      };
      const mergedUser = {
        ...currentUser,
        ...(updatedUser || {}),
        name: payload.name || currentUser.name || currentUser.fullName || '',
        fullName: payload.name || currentUser.fullName || currentUser.name,
        phone:
          payload.phone !== undefined ? payload.phone : currentUser.phone || currentUser.phoneNumber,
        phoneNumber:
          payload.phone !== undefined ? payload.phone : currentUser.phoneNumber || currentUser.phone,
        email: payload.email || currentUser.email,
        avatar:
          (updatedUser && updatedUser.avatar) ||
          (payload.avatar !== undefined ? payload.avatar : currentUser.avatar),
      } as User;

      localStorage.setItem('celra_user', JSON.stringify(mergedUser));
      set({ user: mergedUser, isLoading: false });
      return { success: true, user: mergedUser };
    } catch (err: unknown) {
      set({ isLoading: false, error: extractApiError(err, 'Cập nhật thông tin thất bại') });
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
    changePassword: changePasswordFn,
    loadUserProfile: loadProfileFn,
    updateProfile: updateProfileFn,
    setActiveRole: setActiveRoleFn,
  };
});
