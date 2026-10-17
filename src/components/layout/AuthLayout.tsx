import React from 'react';
import { Row, Col, Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import authBg from '../../assets/auth_bg.png';
import celraLogo from '../../assets/logo_celra_tachnen.png';

const { Title, Paragraph } = Typography;

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  rightButtonText?: string;
  rightButtonLink?: string;
  children: React.ReactNode;
  cardMaxWidth?: number;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  rightButtonText = 'Đăng Ký Miễn Phí',
  rightButtonLink = '/register',
  children,
  cardMaxWidth = 460,
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: `url(${authBg})`,
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >
      {/* 1. TOP NAVBAR NỔI TRÊN NỀN VÀ TRONG SUỐT */}
      <header
        style={{
          height: 72,
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
          position: 'relative',
          zIndex: 100,
        }}
      >
        {/* Logo & Brand Info */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <img
            src={celraLogo}
            alt="CELRA Logo"
            style={{ width: 44, height: 44, objectFit: 'contain' }}
          />
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: '#072448',
                letterSpacing: 1.2,
                lineHeight: 1.1,
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              CELRA
            </div>
            <div style={{ fontSize: 9.5, color: '#475569', fontWeight: 500, marginTop: 2 }}>
              Compliance Evaluation, Legal Recovery & Assistance
            </div>
          </div>
        </div>

        {/* Right Action Button */}
        <div>
          {rightButtonText && (
            <Button
              type="primary"
              onClick={() => navigate(rightButtonLink)}
              style={{
                height: 38,
                padding: '0 20px',
                borderRadius: 8,
                fontWeight: 600,
                backgroundColor: '#0052cc',
                borderColor: '#0052cc',
                boxShadow: '0 4px 14px rgba(0, 82, 204, 0.3)',
              }}
            >
              {rightButtonText}
            </Button>
          )}
        </div>
      </header>

      {/* 2. BODY SECTION TRONG SUỐT HIỂN THỊ NỀN AUTH_BG */}
      <section
        style={{
          flex: 1,
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          padding: '24px 48px',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Row gutter={[48, 24]} align="middle">
            {/* Cột trái: Thông điệp thương hiệu (nâng cao lên khớp với khoảng trắng nền) */}
            <Col xs={24} lg={13} xl={13}>
              <div style={{ maxWidth: 540, marginTop: -240, marginBottom: 20 }}>
                {/* Vạch ngang điểm nhấn màu vàng đồng hoàng gia */}
                <div
                  style={{
                    width: 34,
                    height: 2.5,
                    backgroundColor: '#c5a059',
                    borderRadius: 2,
                    marginBottom: 12,
                  }}
                />

                {/* Subtitle chữ hoa thanh lịch */}
                <div
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: 12.5,
                    marginBottom: 10,
                    textShadow: '0 1px 4px rgba(255, 255, 255, 0.8)',
                  }}
                >
                  NỀN TẢNG QUẢN TRỊ TUÂN THỦ TOÀN DIỆN
                </div>

                {/* Tiêu đề 2 dòng: Xanh than đậm & Xanh dương */}
                <Title
                  level={1}
                  style={{
                    fontSize: 42,
                    fontWeight: 850,
                    lineHeight: 1.22,
                    color: '#0b2545',
                    margin: '0 0 16px 0',
                    letterSpacing: -0.8,
                    textShadow: '0 2px 10px rgba(255, 255, 255, 0.8)',
                  }}
                >
                  Doanh Nghiệp An Toàn <br />
                  <span style={{ color: '#0066cc' }}>Vững Bước Phát Triển</span>
                </Title>

                {/* Đoạn mô tả 3 dòng chuẩn chỉnh */}
                <Paragraph
                  style={{
                    fontSize: 14.5,
                    color: '#475569',
                    lineHeight: 1.65,
                    maxWidth: 480,
                    margin: 0,
                    fontWeight: 450,
                    textShadow: '0 1px 4px rgba(255, 255, 255, 0.9)',
                  }}
                >
                  CELRA đồng hành cùng doanh nghiệp trong việc kiểm soát nghĩa vụ thuế, tuân thủ pháp luật và giảm thiểu rủi ro, hướng tới sự phát triển bền vững.
                </Paragraph>
              </div>
            </Col>

            {/* Cột phải: Khối Card trắng chứa form */}
            <Col xs={24} lg={11} xl={11} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: cardMaxWidth,
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  padding: '24px 28px 20px',
                  boxShadow: '0 12px 36px rgba(9, 30, 66, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.85)',
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Title level={2} style={{ fontSize: 24, fontWeight: 800, color: '#091e42', margin: '0 0 4px 0' }}>
                    {title}
                  </Title>
                  <Paragraph style={{ fontSize: 13, color: '#64748b', lineHeight: 1.45, margin: 0 }}>
                    {subtitle}
                  </Paragraph>
                </div>

                {children}
              </div>
            </Col>
          </Row>
        </div>
      </section>
    </div>
  );
};
