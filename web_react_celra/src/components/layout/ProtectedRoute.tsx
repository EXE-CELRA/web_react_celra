import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrgStore } from '../../store/useOrgStore';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, user, loadUserProfile } = useAuthStore();
  const { fetchMyOrganizations } = useOrgStore();

  const role = user?.role || localStorage.getItem('celra_active_role');
  const isSuperAdmin = role === 'admin' || user?.isSuperAdmin;

  useEffect(() => {
    if (isAuthenticated) {
      loadUserProfile();
      if (!isSuperAdmin) {
        fetchMyOrganizations();
      }
    }
  }, [isAuthenticated, isSuperAdmin, loadUserProfile, fetchMyOrganizations]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

