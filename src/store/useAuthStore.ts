import { create } from 'zustand';
import apiClient from '../api/client';
import type { User, Membership } from '../types';

interface AuthState {
  user: User | null;
  memberships: Membership[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  activeRole: string | null;

  login: (credentials: { email: string; password?: string; passwordHash?: string; twoFactorCode?: string }) => Promise<any>;
  register: (data: { email: string; password?: string; passwordHash?: string; fullName?: string; name?: string; phoneNumber?: string; phone?: string }) => Promise<any>;
  logout: () => void;
  loadUserProfile: () => Promise<void>;
  updateProfile: (data: { fullName?: string; name?: string; phoneNumber?: string; phone?: string; email?: string }) => Promise<any>;
  setActiveRole: (role: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('celra_user') || 'null'),
  memberships: [],
  isAuthenticated: !!localStorage.getItem('celra_access_token'),
  isLoading: false,
  error: null,
  activeRole: localStorage.getItem('celra_active_role') || null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        email: credentials.email,
        password: credentials.password || credentials.passwordHash,
        twoFactorCode: credentials.twoFactorCode,
      };

      const res: any = await apiClient.post('/auth/login', payload);
      if (res.twoFactorRequired || res.require2FA) {
        set({ isLoading: false });
        return { twoFactorRequired: true };
      }

      const { accessToken, user, memberships } = res;
      localStorage.setItem('celra_access_token', accessToken);
      localStorage.setItem('celra_user', JSON.stringify(user));
      
      const defaultRole = memberships && memberships.length > 0 ? memberships[0].role : user.systemRole || user.role;
      localStorage.setItem('celra_active_role', defaultRole);

      if (memberships && memberships.length > 0 && !localStorage.getItem('celra_active_org_id')) {
        localStorage.setItem('celra_active_org_id', memberships[0].organizationId);
      }

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
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        name: data.fullName || data.name,
        email: data.email,
        password: data.password || data.passwordHash,
        phone: data.phoneNumber || data.phone,
      };

      const res: any = await apiClient.post('/auth/register', payload);
      set({ isLoading: false });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đăng ký thất bại';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('celra_access_token');
    localStorage.removeItem('celra_user');
    localStorage.removeItem('celra_active_org_id');
    localStorage.removeItem('celra_active_role');
    set({
      user: null,
      memberships: [],
      isAuthenticated: false,
      activeRole: null,
    });
  },

  loadUserProfile: async () => {
    if (!localStorage.getItem('celra_access_token')) return;
    set({ isLoading: true });
    try {
      const userRes: any = await apiClient.get('/auth/profile');
      const membershipsRes: any = await apiClient.get('/organizations/my-workspaces');

      localStorage.setItem('celra_user', JSON.stringify(userRes));
      
      const mems = Array.isArray(membershipsRes) ? membershipsRes : [];
      let activeOrgId = localStorage.getItem('celra_active_org_id');
      if (!activeOrgId && mems.length > 0) {
        activeOrgId = mems[0].id || mems[0].organizationId;
        if (activeOrgId) {
          localStorage.setItem('celra_active_org_id', activeOrgId);
        }
      }

      set({
        user: userRes,
        memberships: mems,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        name: data.fullName || data.name,
        phone: data.phoneNumber || data.phone,
        email: data.email,
      };

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
      };

      localStorage.setItem('celra_user', JSON.stringify(mergedUser));
      set({ user: mergedUser, isLoading: false });
      return { success: true, user: mergedUser };
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Cập nhật thông tin thất bại' });
      throw err;
    }
  },

  setActiveRole: (role: string) => {
    localStorage.setItem('celra_active_role', role);
    set({ activeRole: role });
  },
}));
