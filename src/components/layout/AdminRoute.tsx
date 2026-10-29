import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
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

  const role = user?.role || localStorage.getItem('celra_active_role');
  const isSuperAdmin = role === 'admin' || user?.isSuperAdmin;

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
