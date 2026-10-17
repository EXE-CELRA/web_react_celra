import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrgStore } from '../../store/useOrgStore';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loadUserProfile } = useAuthStore();
  const { fetchMyOrganizations } = useOrgStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadUserProfile();
      fetchMyOrganizations();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
