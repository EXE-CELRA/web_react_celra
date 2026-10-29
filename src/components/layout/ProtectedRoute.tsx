import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrgStore } from '../../store/useOrgStore';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, user, loadUserProfile } = useAuthStore();
  const { fetchMyOrganizations } = useOrgStore();
  // CHẶN BẢO MẬT: Chỉ cấp quyền admin khi đối tượng user thực tế có role === 'admin'
  const isSuperAdmin = user?.role === 'admin' || Boolean(user && 'isSuperAdmin' in user && user.isSuperAdmin);
  useEffect(() => {
    if (isAuthenticated) {
      loadUserProfile();
      if (!isSuperAdmin) {
        fetchMyOrganizations();
      }
    }
  }, [isAuthenticated, isSuperAdmin, loadUserProfile, fetchMyOrganizations]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('celra_access_token') : null;
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  if (isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

