import { create } from 'zustand';
import apiClient from '../api/client';
import type { User, Membership } from '../types';

interface AuthState {
  user: User | null;
  nguoiDung: User | null;
  memberships: Membership[];
  thanhVien: Membership[];
  isAuthenticated: boolean;
  daXacThuc: boolean;
  isLoading: boolean;
  dangTai: boolean;
  error: string | null;
  loi: string | null;
  activeRole: string | null;
  vaiTroHienTai: string | null;

  login: (credentials: { email: string; password?: string; passwordHash?: string; matKhau?: string }) => Promise<any>;
  dangNhap: (credentials: { email: string; password?: string; passwordHash?: string; matKhau?: string }) => Promise<any>;
  register: (data: { email: string; password?: string; passwordHash?: string; matKhau?: string; fullName?: string; name?: string; hoVaTen?: string; phoneNumber?: string; phone?: string; soDienThoai?: string }) => Promise<any>;
  dangKy: (data: { email: string; password?: string; passwordHash?: string; matKhau?: string; fullName?: string; name?: string; hoVaTen?: string; phoneNumber?: string; phone?: string; soDienThoai?: string }) => Promise<any>;
  logout: () => void;
  dangXuat: () => void;
  loadUserProfile: () => Promise<void>;
  taiThongTinNguoiDung: () => Promise<void>;
  updateProfile: (data: { fullName?: string; name?: string; hoVaTen?: string; phoneNumber?: string; phone?: string; soDienThoai?: string; email?: string }) => Promise<any>;
  capNhatThongTin: (data: { fullName?: string; name?: string; hoVaTen?: string; phoneNumber?: string; phone?: string; soDienThoai?: string; email?: string }) => Promise<any>;
  setActiveRole: (role: string) => void;
  datVaiTroHienTai: (role: string) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const initialUser = JSON.parse(localStorage.getItem('celra_user') || 'null');
  const initialAuth = !!localStorage.getItem('celra_access_token');
  const initialRole = localStorage.getItem('celra_active_role') || null;

  const loginFn = async (credentials: any) => {
    set({ isLoading: true, dangTai: true, error: null, loi: null });
    try {
      const payload = {
        email: credentials.email,
        password: credentials.matKhau || credentials.password || credentials.passwordHash,
      };

      const res: any = await apiClient.post('/auth/login', payload);

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
        nguoiDung: user,
        memberships: memberships || [],
        thanhVien: memberships || [],
        isAuthenticated: true,
        daXacThuc: true,
        isLoading: false,
        dangTai: false,
        activeRole: defaultRole,
        vaiTroHienTai: defaultRole,
      });

      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      set({ error: msg, loi: msg, isLoading: false, dangTai: false });
      throw new Error(msg);
    }
  };

  const registerFn = async (data: any) => {
    set({ isLoading: true, dangTai: true, error: null, loi: null });
    try {
      const payload = {
        name: data.hoVaTen || data.fullName || data.name,
        email: data.email,
        password: data.matKhau || data.password || data.passwordHash,
        phone: data.soDienThoai || data.phoneNumber || data.phone,
      };

      const res: any = await apiClient.post('/auth/register', payload);
      set({ isLoading: false, dangTai: false });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đăng ký thất bại';
      set({ error: msg, loi: msg, isLoading: false, dangTai: false });
      throw new Error(msg);
    }
  };

  const logoutFn = () => {
    localStorage.removeItem('celra_access_token');
    localStorage.removeItem('celra_user');
    localStorage.removeItem('celra_active_org_id');
    localStorage.removeItem('celra_active_role');
    localStorage.removeItem('celra_survey_draft_profile');
    localStorage.removeItem('celra_survey_draft_answers');
    localStorage.removeItem('celra_survey_completed');
    set({
      user: null,
      nguoiDung: null,
      memberships: [],
      thanhVien: [],
      isAuthenticated: false,
      daXacThuc: false,
      activeRole: null,
      vaiTroHienTai: null,
    });
  };

  const loadProfileFn = async () => {
    if (!localStorage.getItem('celra_access_token')) return;
    set({ isLoading: true, dangTai: true });
    try {
      const userRes: any = await apiClient.get('/auth/profile');
      localStorage.setItem('celra_user', JSON.stringify(userRes));

      if (userRes.role === 'admin' || userRes.isSuperAdmin) {
        localStorage.setItem('celra_active_role', 'admin');
        set({
          user: userRes,
          nguoiDung: userRes,
          memberships: [],
          thanhVien: [],
          isAuthenticated: true,
          daXacThuc: true,
          isLoading: false,
          dangTai: false,
          activeRole: 'admin',
          vaiTroHienTai: 'admin',
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
        nguoiDung: userRes,
        memberships: mems,
        thanhVien: mems,
        isAuthenticated: true,
        daXacThuc: true,
        isLoading: false,
        dangTai: false,
      });
    } catch (err) {
      set({ isLoading: false, dangTai: false });
    }
  };

  const updateProfileFn = async (data: any) => {
    set({ isLoading: true, dangTai: true, error: null, loi: null });
    try {
      const payload = {
        name: data.hoVaTen || data.fullName || data.name,
        phone: data.soDienThoai || data.phoneNumber || data.phone,
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
      set({ user: mergedUser, nguoiDung: mergedUser, isLoading: false, dangTai: false });
      return { success: true, user: mergedUser };
    } catch (err: any) {
      set({ isLoading: false, dangTai: false, error: err.message || 'Cập nhật thông tin thất bại', loi: err.message || 'Cập nhật thông tin thất bại' });
      throw err;
    }
  };

  const setActiveRoleFn = (role: string) => {
    localStorage.setItem('celra_active_role', role);
    set({ activeRole: role, vaiTroHienTai: role });
  };

  return {
    user: initialUser,
    nguoiDung: initialUser,
    memberships: [],
    thanhVien: [],
    isAuthenticated: initialAuth,
    daXacThuc: initialAuth,
    isLoading: false,
    dangTai: false,
    error: null,
    loi: null,
    activeRole: initialRole,
    vaiTroHienTai: initialRole,

    login: loginFn,
    dangNhap: loginFn,
    register: registerFn,
    dangKy: registerFn,
    logout: logoutFn,
    dangXuat: logoutFn,
    loadUserProfile: loadProfileFn,
    taiThongTinNguoiDung: loadProfileFn,
    updateProfile: updateProfileFn,
    capNhatThongTin: updateProfileFn,
    setActiveRole: setActiveRoleFn,
    datVaiTroHienTai: setActiveRoleFn,
  };
});
