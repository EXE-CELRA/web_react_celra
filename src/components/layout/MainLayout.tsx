import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Tooltip, Space, Typography, ConfigProvider } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  DatabaseOutlined,
  FormOutlined,
  CheckSquareOutlined,
  FolderOpenOutlined,
  WalletOutlined,
  RobotOutlined,
  UserOutlined,
  LogoutOutlined,
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrgStore } from '../../store/useOrgStore';
import { useWalletStore } from '../../store/useWalletStore';
import { AIChatDrawer } from '../common/AIChatDrawer';
import { VietQRModal } from '../common/VietQRModal';
import { ProfileModal } from '../common/ProfileModal';
import celraLogo from '../../assets/logo_celra_tachnen.png';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const { user, logout } = useAuthStore();
  const { activeOrg, fetchMyOrganizations } = useOrgStore();
  const { wallet, fetchWallet } = useWalletStore();

  useEffect(() => {
    fetchMyOrganizations();
  }, []);

  useEffect(() => {
    if (activeOrg) {
      fetchWallet();
    }
  }, [activeOrg]);

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Bảng Điều Khiển' },
    { key: '/context', icon: <DatabaseOutlined />, label: 'Context Doanh Nghiệp' },
    { key: '/survey', icon: <FormOutlined />, label: 'Câu Hỏi Tình Huống' },
    { key: '/tasks', icon: <CheckSquareOutlined />, label: 'Check-list & Task' },
    { key: '/evidence', icon: <FolderOpenOutlined />, label: 'Hồ Sơ & Bằng Chứng' },
    { key: '/wallet', icon: <WalletOutlined />, label: 'Ví & Thanh Toán' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <ConfigProvider
        theme={{
          components: {
            Layout: {
              siderBg: '#0d2b59',
            },
            Menu: {
              darkItemBg: 'transparent',
              darkSubMenuItemBg: 'transparent',
              darkItemSelectedBg: '#1677ff',
              darkItemSelectedColor: '#ffffff',
              darkItemColor: 'rgba(255, 255, 255, 0.85)',
              darkItemHoverBg: 'rgba(255, 255, 255, 0.08)',
              darkItemHoverColor: '#ffffff',
            },
          },
        }}
      >
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          theme="dark"
          width={250}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            background: '#0d2b59',
            boxShadow: '2px 0 10px rgba(13, 43, 89, 0.15)',
          }}
        >
          <div
            style={{
              height: 68,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: collapsed ? 0 : '0 16px',
              backgroundColor: '#0d2b59',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? 0 : 10,
                cursor: 'pointer',
                overflow: 'hidden',
                width: '100%',
              }}
              onClick={() => navigate('/')}
            >
              <img
                src={celraLogo}
                alt="CELRA Logo"
                style={{
                  width: 38,
                  height: 38,
                  objectFit: 'contain',
                  flexShrink: 0,
                  display: 'block',
                }}
              />
              {!collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span
                    style={{
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: 18,
                      letterSpacing: 1.2,
                      lineHeight: 1.1,
                    }}
                  >
                    CELRA
                  </span>
                  <span
                    style={{
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: 8,
                      fontWeight: 500,
                      marginTop: 2,
                      lineHeight: 1.15,
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    Compliance Evaluation, Legal Recovery & Assistance
                  </span>
                </div>
              )}
            </div>
          </div>

          <Menu
            theme="dark"
            selectedKeys={[location.pathname]}
            mode="inline"
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{
              marginTop: 8,
              background: 'transparent',
              borderRight: 0,
              fontWeight: 500,
            }}
          />

          {/* Nút Đăng Xuất ở đáy Sidebar */}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 0,
              right: 0,
              padding: '0 16px',
            }}
          >
            <Button
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                height: 40,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.12)',
                fontWeight: 500,
                fontSize: 13.5,
              }}
            >
              {!collapsed && 'Đăng Xuất'}
            </Button>
          </div>
        </Sider>
      </ConfigProvider>

      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              type="text"
              icon={
                collapsed ? (
                  <MenuUnfoldOutlined style={{ fontSize: 16 }} />
                ) : (
                  <MenuFoldOutlined style={{ fontSize: 16 }} />
                )
              }
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
              }}
            />
          </div>

          <Space size="middle">
            <div
              onClick={() => navigate('/wallet')}
              title="Nhấn để xem Ví & Thanh toán"
              style={{
                cursor: 'pointer',
                background: location.pathname === '/wallet' ? '#e6f7ff' : '#f6ffed',
                border: location.pathname === '/wallet' ? '1px solid #91caff' : '1px solid #b7eb8f',
                padding: '4px 12px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <WalletOutlined style={{ color: location.pathname === '/wallet' ? '#1677ff' : '#0d9488', fontSize: 14 }} />
              <Text strong style={{ color: location.pathname === '/wallet' ? '#0958d9' : '#0f766e', fontSize: 13 }}>
                {wallet ? `${wallet.balance.toLocaleString()} Credit` : '0 Credit'}
              </Text>
              <PlusOutlined style={{ fontSize: 11, color: location.pathname === '/wallet' ? '#1677ff' : '#0d9488' }} />
            </div>

            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={() => setAiDrawerOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                border: 'none',
              }}
            >
              AI Copilot
            </Button>

            {/* Thẻ Hồ Sơ Doanh Nghiệp (User Profile Card) */}
            <Tooltip title="Xem & chỉnh sửa hồ sơ cá nhân">
              <div
                onClick={() => setProfileModalOpen(true)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 12px 4px 6px',
                  borderRadius: 10,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  height: 40,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(22, 119, 255, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Avatar
                  size={30}
                  icon={<UserOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)',
                    boxShadow: '0 2px 4px rgba(22, 119, 255, 0.25)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
                    {user?.name || user?.fullName || 'Người dùng'}
                  </span>
                  <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 500 }}>
                    {user?.roleTitle || 'Chủ doanh nghiệp'}
                  </span>
                </div>
                <RightOutlined style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }} />
              </div>
            </Tooltip>
          </Space>
        </Header>

        <Content style={{ margin: '24px 24px 0', overflow: 'initial', flex: 1 }}>
          <Outlet />
        </Content>

        {/* Dòng bản quyền CELRA EXE101 */}
        <footer
          style={{
            textAlign: 'center',
            padding: '16px 24px 24px',
            color: '#64748b',
            fontSize: 12,
            background: 'transparent',
          }}
        >
          © {new Date().getFullYear()} <strong>CELRA</strong> - Compliance Evaluation, Legal Recovery & Assistance. Bản quyền thuộc về dự án liên ngành <strong>EXE101</strong>.
        </footer>
      </Layout>

      <AIChatDrawer visible={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
      <VietQRModal visible={qrModalOpen} onClose={() => setQrModalOpen(false)} />
      <ProfileModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </Layout>
  );
};
