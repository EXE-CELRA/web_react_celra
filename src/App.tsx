import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { HomePage } from './pages/Home/HomePage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { OnboardingPage } from './pages/Onboarding/OnboardingPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ContextPage } from './pages/Context/ContextPage';
import { SurveyPage } from './pages/Survey/SurveyPage';
import { TasksPage } from './pages/Tasks/TasksPage';
import { EvidencePage } from './pages/Evidence/EvidencePage';
import { FindingsPage } from './pages/Findings/FindingsPage';
import { ExpertsPage } from './pages/Experts/ExpertsPage';
import { EngagementsPage } from './pages/Engagements/EngagementsPage';
import { WalletPage } from './pages/Wallet/WalletPage';
import { AuditLogPage } from './pages/AuditLog/AuditLogPage';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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

          {/* Protected Routes (Require Login) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />

            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/context" element={<ContextPage />} />
              <Route path="/survey" element={<SurveyPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/evidence" element={<EvidencePage />} />
              <Route path="/findings" element={<FindingsPage />} />
              <Route path="/experts" element={<ExpertsPage />} />
              <Route path="/engagements" element={<EngagementsPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/audit-log" element={<AuditLogPage />} />
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
