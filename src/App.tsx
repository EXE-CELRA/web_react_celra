import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { HomePage } from './pages/Home/HomePage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { ForgotPasswordPage } from './pages/Auth/ForgotPasswordPage';
import { SurveyPage } from './pages/Survey/SurveyPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ContextPage } from './pages/Context/ContextPage';
import { TasksPage } from './pages/Tasks/TasksPage';
import { ComplianceCalendarPage } from './pages/Tasks/ComplianceCalendarPage';
import { EvidencePage } from './pages/Evidence/EvidencePage';
import { WalletPage } from './pages/Wallet/WalletPage';
import { MobileSandboxPaymentPage } from './pages/Payment/MobileSandboxPaymentPage';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminRoute } from './components/layout/AdminRoute';
import { AdminDashboardPage } from './pages/Admin/AdminDashboardPage';
import { AdminEnterprisesPage } from './pages/Admin/AdminEnterprisesPage';
import { AdminDLPLQuotaPage } from './pages/Admin/AdminDLPLQuotaPage';
import { AdminFinancePage } from './pages/Admin/AdminFinancePage';
import { AdminSettingsPage } from './pages/Admin/AdminSettingsPage';

export const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif",
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          {/* Public Homepage Route - Anyone entering the site arrives here first */}
          <Route path="/" element={<HomePage />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Public Mobile Sandbox Payment Route - For scanning from smartphone */}
          <Route path="/sandbox-pay" element={<MobileSandboxPaymentPage />} />

          {/* Protected Routes (Require Login for Enterprises) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/context" element={<ContextPage />} />
              <Route path="/survey" element={<SurveyPage />} />
              <Route path="/onboarding" element={<Navigate to="/survey" replace />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/tasks/calendar" element={<ComplianceCalendarPage />} />
              <Route path="/checklists" element={<Navigate to="/tasks" replace />} />
              <Route path="/evidence" element={<EvidencePage />} />
              <Route path="/wallet" element={<WalletPage />} />
            </Route>
          </Route>

          {/* Super Admin Protected Routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/enterprises" element={<AdminEnterprisesPage />} />
              <Route path="/admin/dlpl-quota" element={<AdminDLPLQuotaPage />} />
              <Route path="/admin/finance" element={<AdminFinancePage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
