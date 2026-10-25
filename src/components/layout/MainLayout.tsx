import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Tooltip, Space, Typography, ConfigProvider, Dropdown } from 'antd';
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
  BankOutlined,
  DownOutlined,
  CalendarOutlined,
  OrderedListOutlined,
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

const ROUTE_PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Bảng Điều Khiển',
  '/context': 'Context Doanh Nghiệp',
  '/context/audit': 'Rà Soát Tuân Thủ & Thuế TNDN',
  '/survey': 'Hồ Sơ Doanh Nghiệp',
  '/onboarding': 'Hồ Sơ Doanh Nghiệp',
  '/tasks': 'Danh Sách Tác Vụ Tuân Thủ',
  '/tasks/calendar': 'Lịch Tuân Thủ & Ghi Chú',
  '/checklists': 'Danh Sách Tác Vụ Tuân Thủ',
  '/evidence': 'Hồ Sơ & Bằng Chứng',
  '/wallet': 'Ví & Thanh Toán',
};

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { user, logout } = useAuthStore();
  const { activeOrg, organizations, setActiveOrg, fetchMyOrganizations } = useOrgStore();
  const { wallet, fetchWallet } = useWalletStore();

  const [draftName, setDraftName] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('celra_survey_draft_profile');
      return raw ? JSON.parse(raw)?.companyName || '' : '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    fetchMyOrganizations();
  }, []);

  useEffect(() => {
    if (activeOrg) {
      fetchWallet();
    }
  }, [activeOrg]);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const raw = localStorage.getItem('celra_survey_draft_profile');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.companyName) {
            setDraftName(parsed.companyName);
          }
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('celra_profile_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('celra_profile_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Bảng Điều Khiển' },
    { key: '/context', icon: <DatabaseOutlined />, label: 'Context Doanh Nghiệp' },
    { key: '/survey', icon: <FormOutlined />, label: 'Hồ Sơ Doanh Nghiệp' },
    {
      key: '/tasks-parent',
      icon: <CheckSquareOutlined />,
      label: 'Check-list & Task',
      children: [
        { key: '/tasks', icon: <OrderedListOutlined />, label: 'Danh sách tác vụ' },
        { key: '/tasks/calendar', icon: <CalendarOutlined />, label: 'Lịch tuân thủ & Note' },
      ],
    },
    { key: '/evidence', icon: <FolderOpenOutlined />, label: 'Hồ Sơ & Bằng Chứng' },
    { key: '/wallet', icon: <WalletOutlined />, label: 'Ví & Thanh Toán' },
  ];

  const currentOrgName =
    activeOrg?.legalName ||
    activeOrg?.name ||
    draftName ||
    'Doanh nghiệp của bạn';

  const currentPageTitle =
    ROUTE_PAGE_TITLES[location.pathname] ||
    menuItems.find((item) => location.pathname.startsWith(item.key))?.label ||
    'Tổng Quan';

  const orgDropdownItems = organizations.map((org) => {
    const isSelected = org.id === activeOrg?.id;
    const name = org.legalName || org.name || 'Doanh nghiệp';
    return {
      key: org.id,
      label: (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? '#1677ff' : '#0f172a',
                fontSize: 13,
              }}
            >
              {name}
            </span>
            {isSelected && (
              <span
                style={{
                  fontSize: 10,
                  background: '#e6f4ff',
                  color: '#1677ff',
                  padding: '1px 6px',
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                Đang chọn
              </span>
            )}
          </div>
          {org.taxCode && (
            <span style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>MST: {org.taxCode}</span>
          )}
        </div>
      ),
      onClick: () => {
        setActiveOrg(org);
      },
    };
  });

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
            background: '#0d2b59',
            boxShadow: '2px 0 10px rgba(13, 43, 89, 0.15)',
            transform: isMobile && collapsed ? 'translateX(-100%)' : 'translateX(0)',
            transition: 'transform 0.25s ease-in-out, width 0.2s',
          }}
        >
          <div
            style={{
              height: 68,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: (!isMobile && collapsed) ? 0 : '0 16px',
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
                justifyContent: (!isMobile && collapsed) ? 'center' : 'flex-start',
                gap: (!isMobile && collapsed) ? 0 : 10,
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
              {(isMobile || !collapsed) && (
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
            defaultOpenKeys={location.pathname.startsWith('/tasks') ? ['/tasks-parent'] : ['/tasks-parent']}
            mode="inline"
            items={menuItems}
            onClick={({ key }) => {
              if (key !== '/tasks-parent') {
                navigate(key);
                if (isMobile) {
                  setCollapsed(true);
                }
              }
            }}
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
                window.location.href = '/login';
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: (!isMobile && collapsed) ? 'center' : 'flex-start',
                height: 40,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.12)',
                fontWeight: 500,
                fontSize: 13.5,
              }}
            >
              {(isMobile || !collapsed) && 'Đăng Xuất'}
            </Button>
          </div>
        </Sider>
      </ConfigProvider>

      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 250), transition: 'all 0.2s', minWidth: 0 }}>
        <Header
          style={{
            background: '#fff',
            padding: isMobile ? '0 12px' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, minWidth: 0, flex: 1, marginRight: isMobile ? 8 : 16 }}>
            <Button
              type="text"
              icon={
                (isMobile ? !collapsed : collapsed) ? (
                  <MenuUnfoldOutlined style={{ fontSize: 16 }} />
                ) : (
                  <MenuFoldOutlined style={{ fontSize: 16 }} />
                )
              }
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
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

            {/* Vạch ngăn cách dọc tinh tế */}
            <div style={{ width: 1, height: 20, backgroundColor: '#e2e8f0', flexShrink: 0 }} />

            {/* Cụm phẳng Breadcrumb: [Tên Doanh Nghiệp] / [Trang đang ở] */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
              {organizations.length > 1 ? (
                <Dropdown menu={{ items: orgDropdownItems }} trigger={['click']} placement="bottomLeft">
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      flexShrink: 0,
                      maxWidth: isMobile ? 120 : 320,
                      color: '#0f172a',
                      transition: 'color 0.2s',
                    }}
                    title={`${currentOrgName} (Nhấn để chuyển đổi doanh nghiệp)`}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1677ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#0f172a';
                    }}
                  >
                    <BankOutlined style={{ color: '#1677ff', fontSize: 14, flexShrink: 0 }} />
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: isMobile ? 12.5 : 13.5,
                        color: 'inherit',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {currentOrgName}
                    </span>
                    <DownOutlined style={{ fontSize: 9, color: '#94a3b8', marginLeft: 1 }} />
                  </div>
                </Dropdown>
              ) : (
                <Tooltip title={activeOrg?.taxCode ? `${currentOrgName} (MST: ${activeOrg.taxCode})` : currentOrgName}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'transparent',
                      border: 'none',
                      flexShrink: 0,
                      maxWidth: isMobile ? 120 : 340,
                    }}
                  >
                    <BankOutlined style={{ color: '#1677ff', fontSize: 14, flexShrink: 0 }} />
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: isMobile ? 12.5 : 13.5,
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {currentOrgName}
                    </span>
                  </div>
                </Tooltip>
              )}

              {/* Dấu gạch chéo phân cách */}
              <span
                style={{
                  color: '#94a3b8',
                  fontSize: 13,
                  fontWeight: 300,
                  flexShrink: 0,
                  userSelect: 'none',
                  margin: '0 1px',
                }}
              >
                /
              </span>

              {/* Tên trang hiện tại */}
              <span
                style={{
                  fontWeight: 500,
                  fontSize: isMobile ? 12.5 : 13.5,
                  color: '#475569',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: isMobile ? 110 : 'none',
                }}
              >
                {currentPageTitle}
              </span>
            </div>
          </div>

          <Space size={isMobile ? 6 : 'middle'}>
            <div
              onClick={() => navigate('/wallet')}
              title="Nhấn để xem Ví & Thanh toán"
              style={{
                cursor: 'pointer',
                background: location.pathname === '/wallet' ? '#e6f7ff' : '#f6ffed',
                border: location.pathname === '/wallet' ? '1px solid #91caff' : '1px solid #b7eb8f',
                padding: isMobile ? '3px 8px' : '4px 12px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s',
              }}
            >
              <WalletOutlined style={{ color: location.pathname === '/wallet' ? '#1677ff' : '#0d9488', fontSize: 13 }} />
              <Text strong style={{ color: location.pathname === '/wallet' ? '#0958d9' : '#0f766e', fontSize: isMobile ? 11.5 : 13 }}>
                {wallet ? `${wallet.balance.toLocaleString()}${isMobile ? ' Cr' : ' Credit'}` : `0${isMobile ? ' Cr' : ' Credit'}`}
              </Text>
              {!isMobile && (
                <PlusOutlined style={{ fontSize: 11, color: location.pathname === '/wallet' ? '#1677ff' : '#0d9488' }} />
              )}
            </div>

            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={() => setAiDrawerOpen(true)}
              title="AI Copilot"
              style={{
                background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                border: 'none',
                padding: isMobile ? '4px 10px' : '4px 15px',
              }}
            >
              {!isMobile && 'AI Copilot'}
            </Button>

            {/* Thẻ Hồ Sơ Doanh Nghiệp (User Profile Card) */}
            <Tooltip title="Xem & chỉnh sửa hồ sơ cá nhân">
              <div
                onClick={() => setProfileModalOpen(true)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 0 : 10,
                  padding: isMobile ? '4px' : '4px 12px 4px 6px',
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
                  src={user?.avatar}
                  icon={!user?.avatar && <UserOutlined />}
                  style={{
                    background: user?.avatar ? undefined : 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)',
                    boxShadow: '0 2px 4px rgba(22, 119, 255, 0.25)',
                    flexShrink: 0,
                  }}
                />
                {!isMobile && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
                      <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
                        {user?.name || user?.fullName || 'Người dùng'}
                      </span>
                      <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 500 }}>
                        {user?.roleTitle || 'Chủ doanh nghiệp'}
                      </span>
                    </div>
                    <RightOutlined style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }} />
                  </>
                )}
              </div>
            </Tooltip>
          </Space>
        </Header>

        <Content style={{ margin: isMobile ? '12px 12px 0' : '24px 24px 0', overflow: 'initial', flex: 1 }}>
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
