import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from 'antd';
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
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrgStore } from '../../store/useOrgStore';
import { useWalletStore } from '../../store/useWalletStore';
import { AIChatDrawer } from '../common/AIChatDrawer';
import { VietQRModal } from '../common/VietQRModal';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const { user, logout } = useAuthStore();
  const { organizations, activeOrg, fetchMyOrganizations, isLoading: orgLoading } = useOrgStore();
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
    { key: '/context', icon: <DatabaseOutlined />, label: 'Dữ Liệu Doanh Nghiệp' },
    { key: '/survey', icon: <FormOutlined />, label: 'Khảo Sát Tuân Thủ' },
    { key: '/tasks', icon: <CheckSquareOutlined />, label: 'Công Việc & Nghĩa Vụ' },
    { key: '/evidence', icon: <FolderOpenOutlined />, label: 'Kho Hồ Sơ Minh Chứng' },
  ];

  const getPageTitle = (pathname: string) => {
    if (pathname === '/wallet') return 'Ví & Thanh Toán';
    const item = menuItems.find((m) => m.key === pathname);
    return item ? item.label : 'Bảng Điều Khiển';
  };

  useEffect(() => {
    if (!orgLoading && organizations.length === 0 && location.pathname !== '/survey') {
      navigate('/survey');
    }
  }, [orgLoading, organizations.length, location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(val) => setCollapsed(val)}
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
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: '0 20px',
            backgroundColor: '#001529',
            borderBottom: '1px solid #1f1f1f',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 16,
              }}
            >
              C
            </div>
            {!collapsed && (
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>
                CELRA
              </span>
            )}
          </div>
        </div>

        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8 }}
        />
      </Sider>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              Hệ thống /
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              {getPageTitle(location.pathname)}
            </span>
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

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    label: user?.name || user?.fullName || 'Người dùng',
                    disabled: true,
                  },
                  {
                    key: 'email',
                    label: user?.email,
                    disabled: true,
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: 'Đăng xuất',
                    danger: true,
                    onClick: () => {
                      logout();
                      navigate('/login');
                    },
                  },
                ],
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <span style={{ fontWeight: 500 }}>{user?.name || user?.fullName || 'Tài khoản'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: '24px 24px 0', overflow: 'initial' }}>
          <Outlet />
        </Content>

        <footer style={{ textAlign: 'center', padding: '24px', color: '#8c8c8c', fontSize: 12 }}>
          CELRA Compliance & Multi-party Coordination Platform © {new Date().getFullYear()} - Nền Tảng Điều Phối & Giám Sát Tuân Thủ Doanh Nghiệp
        </footer>
      </Layout>

      <AIChatDrawer visible={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
      <VietQRModal visible={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </Layout>
  );
};
