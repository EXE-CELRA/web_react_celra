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
import { EvidencePage } from './pages/Evidence/EvidencePage';
import { WalletPage } from './pages/Wallet/WalletPage';
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Routes (Require Login) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/context" element={<ContextPage />} />
              <Route path="/survey" element={<SurveyPage />} />
              <Route path="/onboarding" element={<Navigate to="/survey" replace />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/evidence" element={<EvidencePage />} />
              <Route path="/wallet" element={<WalletPage />} />
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
