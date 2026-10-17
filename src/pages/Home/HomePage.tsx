import React from 'react';
import { Button, Row, Col, Typography, Card, Space, Tag } from 'antd';
import {
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  FolderOpenOutlined,
  WalletOutlined,
  ReadOutlined,
  FileSearchOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Paragraph, Text } = Typography;

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', color: '#1f1f1f' }}>
      {/* 1. NAVIGATION HEADER */}
      <header
        style={{
          height: 72,
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1677ff 0%, #003a8c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 20,
            }}
          >
            C
          </div>
          <div>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, color: '#001529' }}>CELRA</span>
            <span style={{ fontSize: 12, color: '#1677ff', fontWeight: 600, marginLeft: 6 }}>COMPLIANCE</span>
          </div>
        </div>

        <Space size="large">
          <Button type="text" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            Tính Năng
          </Button>
          <Button type="text" onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}>
            Quy Trình Hoạt Động
          </Button>
          <Button type="text" onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}>
            Lợi Ích Doanh Nghiệp
          </Button>
        </Space>

        <Space size="middle">
          {isAuthenticated ? (
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/dashboard')}
              style={{ height: 42, borderRadius: 8 }}
            >
              Vào Bảng Điều Khiển ({user?.fullName || 'Tài khoản'})
            </Button>
          ) : (
            <>
              <Button size="large" onClick={() => navigate('/login')} style={{ height: 42, borderRadius: 8 }}>
                Đăng Nhập
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/register')}
                style={{ height: 42, borderRadius: 8, background: 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)' }}
              >
                Đăng Ký Miễn Phí
              </Button>
            </>
          )}
        </Space>
      </header>

      {/* 2. HERO BANNER SECTION */}
      <section
        style={{
          padding: '80px 48px 100px',
          background: 'linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Tag
            color="blue"
            style={{
              padding: '4px 16px',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 20,
              border: '1px solid #91caff',
            }}
          >
            <ThunderboltOutlined /> Nền Tảng Tuân Thủ & Điều Phối Nghĩa Vụ Đa Bên Thế Hệ Mới
          </Tag>

          <Title
            level={1}
            style={{
              fontSize: 48,
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#001529',
              marginBottom: 20,
              letterSpacing: -1,
            }}
          >
            Tự Động Hóa Quản Trị Tuân Thủ, <br />
            <span style={{ background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Loại Bỏ 100% Rủi Ro Phạt Thuế & Pháp Lý
            </span>
          </Title>

          <Paragraph
            style={{
              fontSize: 18,
              color: '#595959',
              lineHeight: 1.6,
              maxWidth: 760,
              margin: '0 auto 36px',
            }}
          >
            CELRA kết nối Chủ doanh nghiệp, Kế toán nội bộ, Nhân sự và Chuyên gia thẩm định độc lập trên một hệ thống
            thống nhất. Tự động sinh lịch trình nghĩa vụ, lưu trữ chứng từ minh chứng và ký quỹ bảo chứng (Escrow) minh bạch.
          </Paragraph>

          <Space size="middle" wrap style={{ justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              style={{
                height: 52,
                padding: '0 36px',
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #1677ff 0%, #003a8c 100%)',
                boxShadow: '0 8px 20px rgba(22, 119, 255, 0.35)',
              }}
            >
              Bắt Đầu Khởi Tạo Doanh Nghiệp
            </Button>
            <Button
              size="large"
              icon={<FileSearchOutlined />}
              onClick={() => navigate('/survey')}
              style={{ height: 52, padding: '0 30px', fontSize: 16, borderRadius: 10 }}
            >
              Khảo Sát Tuân Thủ Ngay
            </Button>
          </Space>

          {/* Social Proof Badges */}
          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
              <Text strong>Cập nhật Nghị định 123 & Thông tư 133/200</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
              <Text strong>Ví Ký Quỹ Escrow An Toàn 100%</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
              <Text strong>Nhật Ký Kiểm Toán Bất Biến (Audit Trail)</Text>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES GRID */}
      <section id="features" style={{ padding: '80px 48px', backgroundColor: '#fafafa' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Title level={2} style={{ fontSize: 34, fontWeight: 700 }}>
              6 Trụ Cột Đột Phá Của Hệ Thống CELRA
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 16 }}>
              Giải pháp khép kín từ đánh giá hiện trạng, điều phối nhiệm vụ đến bảo chứng thanh toán
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card
                bordered={false}
                style={{ height: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 10, background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <SafetyCertificateOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                </div>
                <Title level={4}>1. Context Engine Đa Chiều</Title>
                <Paragraph type="secondary">
                  Quản lý 9 nhóm dữ liệu ngữ cảnh (Pháp lý, Thuế, BHXH, PCCC, Giấy phép con). Mọi thay đổi đều được lưu vết lịch sử và kích hoạt tái đánh giá.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                bordered={false}
                style={{ height: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <ThunderboltOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                </div>
                <Title level={4}>2. Rule Engine Tự Động Hóa</Title>
                <Paragraph type="secondary">
                  Tự động phân tích quy định pháp luật dựa trên hồ sơ đặc thù để sinh lịch trình nộp thuế, báo cáo tài chính và cảnh báo rủi ro tức thì.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                bordered={false}
                style={{ height: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f9f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <TeamOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                </div>
                <Title level={4}>3. Điều Phối Đa Bên (Multi-party)</Title>
                <Paragraph type="secondary">
                  Phân định rõ vai trò thực hiện (Assignee) và bên đang chờ duyệt (Waiting On), loại bỏ triệt để tình trạng đùn đẩy trách nhiệm giữa Kế toán và Chủ DN.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                bordered={false}
                style={{ height: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 10, background: '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <FolderOpenOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                </div>
                <Title level={4}>4. Kho Chứng Từ (Evidence Vault)</Title>
                <Paragraph type="secondary">
                  Lưu trữ tập trung hóa đơn, tờ khai và giấy phép trên Disk Storage an toàn. Chuyên gia Verifier kiểm tra và xác thực tính hợp lệ từng hồ sơ.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                bordered={false}
                style={{ height: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 10, background: '#fff0f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <WalletOutlined style={{ fontSize: 24, color: '#eb2f96' }} />
                </div>
                <Title level={4}>5. Ký Quỹ Ví Escrow Bảo Chứng</Title>
                <Paragraph type="secondary">
                  Nạp tiền tự động qua VietQR động. Tạm giữ tiền ký quỹ (Hold) khi thuê chuyên gia ngoài gói và chỉ giải phóng (Capture) khi đã nghiệm thu hoàn tất.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                bordered={false}
                style={{ height: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 10, background: '#e6fffb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <ReadOutlined style={{ fontSize: 24, color: '#08979c' }} />
                </div>
                <Title level={4}>6. Tra Cứu Căn Cứ Pháp Điển</Title>
                <Paragraph type="secondary">
                  Tích hợp Cổng Dữ Liệu Pháp Luật Quốc Gia (DLPL), tự động đối chiếu thông tư, nghị định và trích dẫn chính xác từng số Điều, Khoản kèm khung xử phạt thực tế.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* 4. WORKFLOW SECTION */}
      <section id="workflow" style={{ padding: '80px 48px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <Title level={2} style={{ fontSize: 34, fontWeight: 700, marginBottom: 16 }}>
            Quy Trình 3 Bước Tinh Gọn
          </Title>
          <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 48 }}>
            Từ thiết lập ban đầu đến kiểm soát tuân thủ hoàn hảo
          </Paragraph>

          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <div style={{ padding: '24px 16px', background: '#f9fbfd', borderRadius: 12, border: '1px solid #eef2f6' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1677ff', color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  1
                </div>
                <Title level={4}>Khai Báo Hồ Sơ Onboarding</Title>
                <Paragraph type="secondary">
                  Điền 5 bước về ngành nghề, chế độ kế toán và quy mô lao động để hệ thống định hình hồ sơ.
                </Paragraph>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div style={{ padding: '24px 16px', background: '#f9fbfd', borderRadius: 12, border: '1px solid #eef2f6' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#52c41a', color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  2
                </div>
                <Title level={4}>Thực Hiện & Tải Chứng Từ</Title>
                <Paragraph type="secondary">
                  Theo dõi danh mục nghĩa vụ theo lịch, đính kèm chứng từ minh chứng và thảo luận trực tiếp.
                </Paragraph>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div style={{ padding: '24px 16px', background: '#f9fbfd', borderRadius: 12, border: '1px solid #eef2f6' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#722ed1', color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  3
                </div>
                <Title level={4}>Thẩm Định & Bảo Chứng</Title>
                <Paragraph type="secondary">
                  Chuyên gia thẩm tra tính hợp pháp, ký quỹ bảo chứng giao dịch an toàn và ghi vết kiểm toán.
                </Paragraph>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section
        style={{
          padding: '80px 48px',
          background: 'linear-gradient(135deg, #001529 0%, #003a8c 100%)',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Title level={2} style={{ color: '#fff', fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
            Bắt Đầu Quản Trị Tuân Thủ Doanh Nghiệp Ngay Hôm Nay
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 36 }}>
            Trải nghiệm nền tảng điều phối nghĩa vụ toàn diện, minh bạch và an toàn tuyệt đối.
          </Paragraph>

          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
            style={{
              height: 52,
              padding: '0 40px',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 10,
              backgroundColor: '#52c41a',
              borderColor: '#52c41a',
              boxShadow: '0 8px 20px rgba(82, 196, 26, 0.4)',
            }}
          >
            Đăng Ký Tài Khoản Miễn Phí
          </Button>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer style={{ padding: '40px 48px', backgroundColor: '#000c17', color: 'rgba(255,255,255,0.65)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#1677ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            C
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>CELRA Platform</span>
        </div>
        <div style={{ fontSize: 13 }}>
          © {new Date().getFullYear()} CELRA Compliance & Multi-party Coordination. Bản quyền thuộc về dự án liên ngành EXE101.
        </div>
      </footer>
    </div>
  );
};
