import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Space } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  ShopOutlined,
  BookOutlined,
  DollarCircleOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import celraLogo from '../../assets/logo_celra_tachnen.png';

const { Header, Sider, Content } = Layout;

const ADMIN_PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Tổng Quan Hệ Thống',
  '/admin/enterprises': 'Quản Lý Doanh Nghiệp',
  '/admin/dlpl-quota': 'Tri Thức Luật & Quota AI',
  '/admin/finance': 'Doanh Thu & Sổ Cái Sàn',
  '/admin/settings': 'Cấu Hình Nền Tảng',
};
export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const { user, logout } = useAuthStore();

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined style={{ fontSize: 16 }} />,
      label: 'Tổng Quan Hệ Thống',
    },
    {
      key: '/admin/enterprises',
      icon: <ShopOutlined style={{ fontSize: 16 }} />,
      label: 'Quản Lý Doanh Nghiệp',
    },
    {
      key: '/admin/dlpl-quota',
      icon: <BookOutlined style={{ fontSize: 16 }} />,
      label: 'Tri Thức Luật & Quota AI',
    },
    {
      key: '/admin/finance',
      icon: <DollarCircleOutlined style={{ fontSize: 16 }} />,
      label: 'Doanh Thu & Sổ Cái Sàn',
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined style={{ fontSize: 16 }} />,
      label: 'Cấu Hình Nền Tảng',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentAdminPageTitle = ADMIN_PAGE_TITLES[location.pathname] || 'Quản Trị Hệ Thống';

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {isMobile && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 999,
            backdropFilter: 'blur(2px)',
            transition: 'opacity 0.2s',
          }}
        />
      )}
      <Sider
        collapsible
        collapsed={isMobile ? false : collapsed}
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
          zIndex: 1000,
          transform: isMobile && collapsed ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.25s ease-in-out, width 0.2s',
          background: '#0d2b59',
          boxShadow: '2px 0 10px rgba(13, 43, 89, 0.15)',
        }}
      >
        {/* Logo & Brand Header - Y chang bên chủ doanh nghiệp */}
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
            onClick={() => {
              navigate('/');
              if (isMobile) setCollapsed(true);
            }}
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

        {/* Tree Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            navigate(key);
            if (isMobile) setCollapsed(true);
          }}
          style={{
            background: 'transparent',
            marginTop: 12,
            borderRight: 'none',
            fontSize: 14,
            fontWeight: 500,
          }}
        />

        {/* Bottom Sider Info */}
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
            onClick={handleLogout}
            style={{
              width: '100%',
              textAlign: 'left',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              height: 40,
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.1)',
            }}
          >
            {!collapsed && 'Đăng Xuất Admin'}
          </Button>
        </div>
      </Sider>

      {/* Main Content Layout */}
      <Layout
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 80 : 250), minWidth: 0,
          transition: 'all 0.2s',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#f8fafc',
        }}
      >
        {/* Top Navbar */}
        <Header
          style={{
            background: '#ffffff',
            padding: isMobile ? '0 12px' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 64,
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined style={{ fontSize: 16 }} /> : <MenuFoldOutlined style={{ fontSize: 16 }} />}
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                flexShrink: 0,
              }}
            />

            <div style={{ width: 1, height: 20, backgroundColor: '#e2e8f0', flexShrink: 0 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                {currentAdminPageTitle}
              </span>
            </div>
          </div>

          {/* Right Header: Admin profile card */}
          <Space size={16}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '4px 12px 4px 6px',
                borderRadius: 10,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                height: 40,
              }}
            >
              <Avatar
                style={{
                  backgroundColor: '#7c3aed',
                  verticalAlign: 'middle',
                }}
                icon={<CrownOutlined />}
                size="small"
              />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                  {user?.name || 'Quản Trị Viên'}
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {user?.email || 'admin@gmail.com'}
                </span>
              </div>
            </div>
          </Space>
        </Header>

        {/* Sub-view Content */}
        <Content
          style={{
            margin: isMobile ? '12px 12px 0' : '24px 24px 0',
            minHeight: 'calc(100vh - 180px)',
            background: 'transparent',
            flex: 1,
          }}
        >
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
          © {new Date().getFullYear()} <strong>CELRA Portal</strong>. Bản quyền thuộc về dự án liên ngành <strong>EXE101</strong>.
        </footer>
      </Layout>
    </Layout>
  );
};
