import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrgStore } from '../../store/useOrgStore';

export const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user, loadUserProfile } = useAuthStore();
  const {
    fetchMyOrganizations,
    activeOrg,
    isLoading: isOrgLoading,
    hasInitialized: hasOrgInitialized,
  } = useOrgStore();
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

  const hasCompletedSurvey = Boolean(
    (activeOrg?.id && localStorage.getItem(`celra_survey_completed_${activeOrg.id}`) === 'true') ||
    (activeOrg?.taxCode && activeOrg?.name && activeOrg.taxCode !== 'MST-temp')
  );

  // Khi F5 reload trang lần đầu: nếu chưa có sẵn snapshot hợp lệ và API /organizations/my-workspaces
  // chưa tải xong (!hasOrgInitialized || isOrgLoading), hiển thị màn hình chờ thay vì đẩy nhầm sang /survey.
  if (!isSuperAdmin && !hasCompletedSurvey && (!hasOrgInitialized || isOrgLoading)) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // Chỉ kiểm tra khi đã load xong danh sách organizations từ Backend
  if (hasOrgInitialized && !isOrgLoading && !isSuperAdmin) {
    if (!hasCompletedSurvey && !isCurrentOnSurvey) {
      return <Navigate to="/survey" replace />;
    }
  }

  return <Outlet />;
};

