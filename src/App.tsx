import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, Spin } from "antd";
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AdminRoute } from "./components/layout/AdminRoute";

// 🚀 TỐI ƯU HÓA ROUTE CODE-SPLITTING BẰNG REACT.LAZY (DYNAMIC IMPORTS)
const HomePage = React.lazy(() =>
  import("./pages/Home/HomePage").then((m) => ({ default: m.HomePage })),
);
const LoginPage = React.lazy(() =>
  import("./pages/Auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = React.lazy(() =>
  import("./pages/Auth/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);
const ForgotPasswordPage = React.lazy(() =>
  import("./pages/Auth/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const SurveyPage = React.lazy(() =>
  import("./pages/Survey/SurveyPage").then((m) => ({ default: m.SurveyPage })),
);
const DashboardPage = React.lazy(() =>
  import("./pages/Dashboard/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const ContextPage = React.lazy(() =>
  import("./pages/Context/ContextPage").then((m) => ({
    default: m.ContextPage,
  })),
);
const ContextAuditPage = React.lazy(() =>
  import("./pages/Context/ContextAuditPage").then((m) => ({
    default: m.ContextAuditPage,
  })),
);
const TasksPage = React.lazy(() =>
  import("./pages/Tasks/TasksPage").then((m) => ({ default: m.TasksPage })),
);
const ComplianceCalendarPage = React.lazy(() =>
  import("./pages/Tasks/ComplianceCalendarPage").then((m) => ({
    default: m.ComplianceCalendarPage,
  })),
);
const EvidencePage = React.lazy(() =>
  import("./pages/Evidence/EvidencePage").then((m) => ({
    default: m.EvidencePage,
  })),
);
const WalletPage = React.lazy(() =>
  import("./pages/Wallet/WalletPage").then((m) => ({ default: m.WalletPage })),
);
const MobileSandboxPaymentPage = React.lazy(() =>
  import("./pages/Payment/MobileSandboxPaymentPage").then((m) => ({
    default: m.MobileSandboxPaymentPage,
  })),
);
const AdminDashboardPage = React.lazy(() =>
  import("./pages/Admin/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const AdminEnterprisesPage = React.lazy(() =>
  import("./pages/Admin/AdminEnterprisesPage").then((m) => ({
    default: m.AdminEnterprisesPage,
  })),
);
const AdminDLPLQuotaPage = React.lazy(() =>
  import("./pages/Admin/AdminDLPLQuotaPage").then((m) => ({
    default: m.AdminDLPLQuotaPage,
  })),
);
const AdminAIQuotaPage = React.lazy(() =>
  import("./pages/Admin/AdminAIQuotaPage").then((m) => ({
    default: m.AdminAIQuotaPage,
  })),
);
const AdminFinancePage = React.lazy(() =>
  import("./pages/Admin/AdminFinancePage").then((m) => ({
    default: m.AdminFinancePage,
  })),
);
const AdminSettingsPage = React.lazy(() =>
  import("./pages/Admin/AdminSettingsPage").then((m) => ({
    default: m.AdminSettingsPage,
  })),
);

const PageLoadingFallback: React.FC = () => (
  <div
    style={{
      display: "flex",
      height: "100vh",
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8fafc",
    }}
  >
    <Spin size="large" />
  </div>
);
export const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 8,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        },
      }}
    >
      <BrowserRouter>
        <Suspense fallback={<PageLoadingFallback />}>
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
                <Route path="/context/audit" element={<ContextAuditPage />} />
                <Route path="/survey" element={<SurveyPage />} />
                <Route
                  path="/onboarding"
                  element={<Navigate to="/survey" replace />}
                />
                <Route path="/tasks" element={<TasksPage />} />
                <Route
                  path="/tasks/calendar"
                  element={<ComplianceCalendarPage />}
                />
                <Route
                  path="/checklists"
                  element={<Navigate to="/tasks" replace />}
                />
                <Route path="/evidence" element={<EvidencePage />} />
                <Route path="/wallet" element={<WalletPage />} />
              </Route>
            </Route>

            {/* Super Admin Protected Routes */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route
                  path="/admin"
                  element={<Navigate to="/admin/dashboard" replace />}
                />
                <Route
                  path="/admin/dashboard"
                  element={<AdminDashboardPage />}
                />
                <Route
                  path="/admin/enterprises"
                  element={<AdminEnterprisesPage />}
                />
                <Route
                  path="/admin/dlpl-quota"
                  element={<AdminDLPLQuotaPage />}
                />
                <Route
                  path="/admin/ai-quota"
                  element={<AdminAIQuotaPage />}
                />
                <Route path="/admin/finance" element={<AdminFinancePage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
              </Route>
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
