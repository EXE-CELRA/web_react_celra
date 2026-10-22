import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // Tăng timeout lên 120s để các mô hình AI suy luận có đủ thời gian phản hồi
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token & Active Organization ID
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

// Response Interceptor: Unwrap data & handle 401
apiClient.interceptors.response.use(
  (response) => {
    // If backend uses TransformResponseInterceptor with { success: true, data: ... }
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if not already there
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('celra_access_token');
        localStorage.removeItem('celra_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default apiClient;
