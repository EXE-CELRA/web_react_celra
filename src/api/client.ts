export const handleAuthKickout = () => {
  // Dọn sạch toàn bộ dữ liệu xác thực, cache và dữ liệu doanh nghiệp trong localStorage
  try {
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (key.startsWith('celra_') && !key.includes('virtual_bank')) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn('Lỗi khi xóa storage lúc kickout:', err);
  }

  if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
    window.location.replace('/login');
  }
};

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('celra_access_token');
    const activeOrgId = localStorage.getItem('celra_active_org_id');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (activeOrgId) {
      config.headers['x-organization-id'] = activeOrgId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const isProfileCheck = typeof error.config?.url === 'string' && error.config.url.includes('/auth/profile');

    // Nếu token hết hạn (401) hoặc tài khoản bị xóa trên DB (404 khi load profile): chặn và đá ra login ngay lập tức
    if (status === 401 || (status === 404 && isProfileCheck)) {
      handleAuthKickout();
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default apiClient;
