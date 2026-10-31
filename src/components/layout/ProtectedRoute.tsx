import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrgStore } from '../../store/useOrgStore';

export const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user, loadUserProfile } = useAuthStore();
  const { fetchMyOrganizations, activeOrg, isLoading: isOrgLoading } = useOrgStore();
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

  // 🔒 BẮT BUỘC HOÀN THÀNH BÀI KHẢO SÁT BAN ĐẦU (ONBOARDING SURVEY GATE)
  // Nếu người dùng chưa có doanh nghiệp hoặc doanh nghiệp chưa hoàn thành khảo sát (chưa có taxCode hoặc name):
  // Bắt buộc giữ ở trang /survey, chặn chuyển sang bất kỳ trang nào khác (dashboard, context, tasks, wallet...)
  const isCurrentOnSurvey = location.pathname === '/survey' || location.pathname === '/onboarding';
  
  // Chỉ kiểm tra khi đã load xong danh sách organizations
  if (!isOrgLoading && !isSuperAdmin) {
    const hasCompletedSurvey = Boolean(
      (activeOrg?.id && localStorage.getItem(`celra_survey_completed_${activeOrg.id}`) === 'true') ||
      (activeOrg?.taxCode && activeOrg?.name && activeOrg.taxCode !== 'MST-temp')
    );

    if (!hasCompletedSurvey && !isCurrentOnSurvey) {
      return <Navigate to="/survey" replace />;
    }
  }

  return <Outlet />;
};

