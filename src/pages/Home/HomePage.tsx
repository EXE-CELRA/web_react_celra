import React from 'react';
import { Button, Row, Col, Typography, Card, Space, Dropdown, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import {
  FacebookFilled,
  TikTokFilled,
  PhoneOutlined,
  UserOutlined,
  RightOutlined,
  DashboardOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import heroBg from '../../assets/bg-homepage.png';
import celraLogo from '../../assets/logo_celra_tachnen.png';

const { Title, Paragraph } = Typography;

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const role = user?.role || localStorage.getItem('celra_active_role');
  const isSuperAdmin = role === 'admin' || (user as any)?.isSuperAdmin;

  const handleGoToPortal = () => {
    if (isSuperAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'portal',
      icon: <DashboardOutlined style={{ fontSize: 15, color: '#1677ff' }} />,
      label: <span style={{ fontWeight: 500, fontSize: 13 }}>Vào Trang Quản Trị</span>,
      onClick: handleGoToPortal,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ fontSize: 15, color: '#ef4444' }} />,
      label: <span style={{ fontWeight: 500, fontSize: 13, color: '#ef4444' }}>Đăng xuất</span>,
      onClick: () => {
        logout();
        navigate('/');
      },
    },
  ];
  const [isMobile, setIsMobile] = React.useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', color: '#1f1f1f' }}>
      {/* 1. NAVIGATION HEADER (TRONG SUỐT NỔI TRÊN BACKGROUND) */}
      <header
        style={{
          height: 76,
          padding: isMobile ? '0 16px' : '0 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img
            src={celraLogo}
            alt="CELRA Logo"
            style={{ width: 52, height: 52, objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span
              style={{
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: 1.5,
                color: '#072448',
                lineHeight: 1.1,
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              CELRA
            </span>
            <span
              style={{
                fontSize: 11,
                color: '#475569',
                fontWeight: 500,
                letterSpacing: 0.2,
                marginTop: 2,
              }}
            >
              Compliance Evaluation, Legal Recovery & Assistance
            </span>
          </div>
        </div>

        <Space size="middle">
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 14px 4px 6px',
                  borderRadius: 16,
                  background: '#ffffff',
                  border: '1.5px solid #93c5fd',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  height: 42,
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.16)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: isSuperAdmin ? '#7c3aed' : '#1677ff',
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.25 }}>
                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
                    {user?.hoVaTen || user?.name || user?.fullName || (isSuperAdmin ? 'Quản Trị Viên' : 'Chủ doanh nghiệp')}
                  </span>
                  <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 500 }}>
                    {isSuperAdmin ? 'Quản Trị Viên Hệ Thống' : (user?.chucDanh || user?.roleTitle || 'Chủ doanh nghiệp')}
                  </span>
                </div>
                <RightOutlined style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }} />
              </div>
            </Dropdown>
          ) : (
            <>
              <Button
                size="large"
                onClick={() => navigate('/login')}
                style={{
                  height: 40,
                  borderRadius: 8,
                  fontWeight: 500,
                  color: '#091e42',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  borderColor: 'rgba(0, 0, 0, 0.12)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                Đăng Nhập
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/register')}
                style={{
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: '#0052cc',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(0, 82, 204, 0.3)',
                }}
              >
                Đăng Ký Miễn Phí
              </Button>
            </>
          )}
        </Space>
      </header>

      {/* 2. HERO & FEATURES SECTION TRÊN NỀN BACKGROUND TOÀN PHẦN */}
      <section
        style={{
          position: 'relative',
          padding: isMobile ? '96px 16px 40px' : '128px 48px 56px',
          backgroundImage: `url(${heroBg})`,
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          textAlign: 'center',
          overflow: 'hidden',
          minHeight: 'calc(100vh - 120px)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>

          {/* Khối tiêu đề & Nút bấm */}
          <div style={{ maxWidth: 980, margin: '0 auto 48px' }}>
            <Title
              level={1}
              style={{
                fontSize: isMobile ? 32 : 54,
                fontWeight: 850,
                lineHeight: 1.25,
                color: '#091e42',
                marginBottom: 24,
                letterSpacing: -1.2,
                textShadow: '0 2px 10px rgba(255, 255, 255, 0.8)',
              }}
            >
              Hệ Thống Quản Trị <span style={{ color: '#0052cc' }}>Tuân Thủ</span>
            </Title>

            <Paragraph
              style={{
                fontSize: 17,
                color: '#172b4d',
                lineHeight: 1.7,
                maxWidth: 820,
                margin: '0 auto 36px',
                fontWeight: 450,
                textShadow: '0 1px 4px rgba(255, 255, 255, 0.9)',
              }}
            >
              <span style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#091e42' }}>
                Không còn lo lắng về nguy cơ bị phạt thuế, trễ hạn kê khai hay bỏ sót nghĩa vụ pháp lý.
              </span>
              CELRA giúp doanh nghiệp chủ động kiểm soát nghĩa vụ thuế và tuân thủ pháp luật trên một nền tảng duy nhất. Tự động nhắc hạn, quản lý hồ sơ chứng từ, giúp giảm thiểu rủi ro vi phạm, hạn chế phát sinh tiền phạt và an tâm vận hành doanh nghiệp.
            </Paragraph>

            {/* Nút hành động chính duy nhất (đã bỏ mũi tên và bỏ nút trắng) */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  if (isAuthenticated) {
                    handleGoToPortal();
                  } else {
                    navigate('/register');
                  }
                }}
                style={{
                  height: 52,
                  padding: '0 40px',
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 10,
                  backgroundColor: '#0052cc',
                  borderColor: '#0052cc',
                  boxShadow: '0 8px 24px rgba(0, 82, 204, 0.35)',
                }}
              >
                Bắt Đầu Khởi Tạo Doanh Nghiệp
              </Button>
            </div>
          </div>

          {/* 3 Thẻ tính năng nằm trực tiếp trên nền background */}
          <Row gutter={[20, 20]} style={{ textAlign: 'left' }}>
            <Col xs={24} md={8}>
              <Card
                bordered={false}
                styles={{ body: { padding: '16px 20px' } }}
                style={{
                  height: '100%',
                  borderRadius: 10,
                  border: '1px solid #eaecf0',
                  boxShadow: '0 4px 16px rgba(9, 30, 66, 0.08)',
                  backgroundColor: '#ffffff',
                }}
              >
                <Title level={5} style={{ fontSize: 15.5, fontWeight: 700, margin: '0 0 6px 0', color: '#091e42', lineHeight: 1.35 }}>
                  1. Khảo Sát Hiện Trạng & Bắt Bệnh Rủi Ro
                </Title>
                <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.5, margin: 0, color: '#475569' }}>
                  Khảo sát nhanh theo ngành nghề (F&B, thương mại, dịch vụ...) để phát hiện ngay các lỗ hổng tuân thủ tiềm ẩn kèm khung tiền phạt tương ứng.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                bordered={false}
                styles={{ body: { padding: '16px 20px' } }}
                style={{
                  height: '100%',
                  borderRadius: 10,
                  border: '1px solid #eaecf0',
                  boxShadow: '0 4px 16px rgba(9, 30, 66, 0.08)',
                  backgroundColor: '#ffffff',
                }}
              >
                <Title level={5} style={{ fontSize: 15.5, fontWeight: 700, margin: '0 0 6px 0', color: '#091e42', lineHeight: 1.35 }}>
                  2. Lịch Nghĩa Vụ & Nhắc Hạn Thuế Tự Động
                </Title>
                <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.5, margin: 0, color: '#475569' }}>
                  Tự động sinh lịch nộp tờ khai quý, tạm nộp TNDN đạt 80% (NĐ 91 & 252), thuế GTGT, BCTC; cảnh báo sớm trước hạn tránh bị tính tiền phạt chậm nộp.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                bordered={false}
                styles={{ body: { padding: '16px 20px' } }}
                style={{
                  height: '100%',
                  borderRadius: 10,
                  border: '1px solid #eaecf0',
                  boxShadow: '0 4px 16px rgba(9, 30, 66, 0.08)',
                  backgroundColor: '#ffffff',
                }}
              >
                <Title level={5} style={{ fontSize: 15.5, fontWeight: 700, margin: '0 0 6px 0', color: '#091e42', lineHeight: 1.35 }}>
                  3. Tra Cứu Căn Cứ Pháp Điển & Khung Xử Phạt
                </Title>
                <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.5, margin: 0, color: '#475569' }}>
                  Tích hợp Cổng Dữ Liệu Pháp Luật Quốc Gia, trích dẫn chính xác từng số Điều, Khoản và mức phạt tiền thực tế theo các Nghị định mới nhất.
                </Paragraph>
              </Card>
            </Col>
          </Row>

        </div>
      </section>


      {/* 4. FOOTER */}
      <footer style={{ padding: '28px 48px 20px', backgroundColor: '#000c17', color: 'rgba(255,255,255,0.65)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 24,
            }}
          >
            {/* Cột trái: Logo qua trái, Tên CELRA, Hotline, Facebook, TikTok */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <img
                  src={celraLogo}
                  alt="CELRA Logo"
                  style={{ width: 60, height: 60, objectFit: 'contain' }}
                />
                <div>
                  <div style={{ color: '#ffffff', fontWeight: 900, fontSize: 22, letterSpacing: 1.5, lineHeight: 1.1 }}>
                    CELRA
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 11, fontWeight: 500, marginTop: 2 }}>
                    Compliance Evaluation, Legal Recovery & Assistance
                  </div>
                </div>
              </div>

              {/* Dưới logo: Hotline, Facebook, TikTok */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PhoneOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                  <span>Hotline: <strong style={{ color: '#ffffff' }}>0908 123 456</strong> (Tư vấn 24/7)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FacebookFilled style={{ color: '#1877f2', fontSize: 14 }} />
                  <span>Facebook: <a href="https://www.facebook.com/profile.php?id=61594373626408" target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.85)' }}>CELRA Fanpage</a></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TikTokFilled style={{ color: '#ffffff', fontSize: 14 }} />
                  <span>TikTok: <a href="https://www.tiktok.com/@cskh.celra" target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.85)' }}>@cskh.celra</a></span>
                </div>
              </div>
            </div>

            {/* Cột phải: 2 icon Facebook & TikTok to rõ ràng */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                Kênh Mạng Xã Hội
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href="https://www.facebook.com/profile.php?id=61594373626408"
                  target="_blank"
                  rel="noreferrer"
                  title="Facebook CELRA"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1877f2',
                    fontSize: 20,
                    transition: 'all 0.2s',
                  }}
                >
                  <FacebookFilled />
                </a>
                <a
                  href="https://www.tiktok.com/@cskh.celra"
                  target="_blank"
                  rel="noreferrer"
                  title="TikTok CELRA"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 20,
                    transition: 'all 0.2s',
                  }}
                >
                  <TikTokFilled />
                </a>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 11.5, marginTop: 6 }}>
                Theo dõi các bản tin pháp lý & thông báo thuế
              </span>
            </div>
          </div>

          {/* Dòng bản quyền cuối trang */}
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              marginTop: 20,
              paddingTop: 14,
              textAlign: 'center',
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            © {new Date().getFullYear()} CELRA Compliance Evaluation, Legal Recovery & Assistance. Bản quyền thuộc về dự án liên ngành EXE101.
          </div>
        </div>
      </footer>
    </div>
  );
};
