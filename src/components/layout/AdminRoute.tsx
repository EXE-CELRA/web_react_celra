import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, user, loadUserProfile } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadUserProfile();
    }
  }, [isAuthenticated, loadUserProfile]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('celra_access_token') : null;
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }
  // CHẶN BẢO MẬT: Chỉ cấp quyền khi tài khoản thực tế từ Backend trả về role === 'admin'
  // Tuyệt đối KHÔNG tin cậy vào chuỗi localStorage.getItem('celra_active_role')
  const isSuperAdmin = user?.role === 'admin' || Boolean(user && 'isSuperAdmin' in user && user.isSuperAdmin);
  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};
