import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Tag, Typography, Progress, Button, Space, Spin, message } from 'antd';
import {
  ShopOutlined,
  DollarCircleOutlined,
  BookOutlined,
  ArrowRightOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { CelraTable } from '../../components/common/CelraTable';

const { Title, Text, Paragraph } = Typography;

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes]: [any, any] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/compliance/macro-analytics'),
      ]);
      setStats(statsRes);
      setAnalytics(analyticsRes);
    } catch (err: any) {
      message.error('Không thể tải dữ liệu bảng điều khiển quản trị: ' + (err.message || 'Lỗi server'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu trung tâm điều hành CELRA..." />
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const recentTxs = stats?.recentTransactions || [];
  const commonRisks = analytics?.commonRisks || [];

  const columns = [
    {
      title: 'Mã GD',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <Text strong code style={{ color: '#2563eb' }}>{text}</Text>,
    },
    {
      title: 'Doanh Nghiệp',
      dataIndex: 'orgName',
      key: 'orgName',
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{name}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>MST: {record.taxCode || '---'}</div>
        </div>
      ),
    },
    {
      title: 'Hạng Mục',
      dataIndex: 'taskName',
      key: 'taskName',
      render: (task: string) => <Text style={{ fontSize: 13 }}>{task || 'Giao dịch ví'}</Text>,
    },
    {
      title: 'Biến Động',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: any) => {
        const isDeposit = record.type === 'deposit';
        return (
          <Text strong style={{ color: isDeposit ? '#16a34a' : '#ea580c', fontSize: 14 }}>
            {isDeposit ? `+${amount.toLocaleString('vi-VN')} ₫ / Cr` : `-${amount.toLocaleString('vi-VN')} Cr`}
          </Text>
        );
      },
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const isSuccess = status === 'success';
        return (
          <Tag color={isSuccess ? 'success' : 'error'} style={{ borderRadius: 4, fontWeight: 500 }}>
            {isSuccess ? 'Thành công' : 'Thất bại'}
          </Tag>
        );
      },
    },
    {
      title: 'Thời Gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time: string) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {new Date(time).toLocaleString('vi-VN')}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Top Banner */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
          Tổng quan hệ thống
        </Title>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Card 1: Tổng Doanh Nghiệp */}
        <Col xs={24} sm={12} lg={8}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              border: '1px solid #bfdbfe',
              borderLeft: '5px solid #2563eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              padding: '16px 20px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.28)',
                outline: '3px solid rgba(37, 99, 235, 0.15)',
                flexShrink: 0,
              }}
            >
              <ShopOutlined style={{ fontSize: 22, color: '#ffffff' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                TỔNG DOANH NGHIỆP
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.2,
                  marginTop: 2,
                }}
              >
                {kpis.totalEnterprises || 0}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Bị khóa: <Text strong type="danger">{kpis.suspendedEnterprises || 0}</Text> doanh nghiệp
              </div>
            </div>
          </div>
        </Col>

        {/* Card 2: Tổng Doanh Thu Nạp */}
        <Col xs={24} sm={12} lg={8}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              border: '1px solid #bbf7d0',
              borderLeft: '5px solid #16a34a',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              padding: '16px 20px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.28)',
                outline: '3px solid rgba(22, 163, 74, 0.15)',
                flexShrink: 0,
              }}
            >
              <DollarCircleOutlined style={{ fontSize: 22, color: '#ffffff' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                TỔNG DOANH THU NẠP
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.2,
                  marginTop: 2,
                }}
              >
                {Number(kpis.totalRevenueVnd || 0).toLocaleString('vi-VN')} ₫
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Credit đã tiêu thụ: <Text strong style={{ color: '#7c3aed' }}>{Number(kpis.totalCreditsSpent || 0).toLocaleString('vi-VN')} Cr</Text>
              </div>
            </div>
          </div>
        </Col>

        {/* Card 3: Kho Tri Thức */}
        <Col xs={24} sm={12} lg={8}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              border: '1px solid #fed7aa',
              borderLeft: '5px solid #ea580c',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              padding: '16px 20px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.28)',
                outline: '3px solid rgba(234, 88, 12, 0.15)',
                flexShrink: 0,
              }}
            >
              <BookOutlined style={{ fontSize: 22, color: '#ffffff' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                KHO TRI THỨC
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.2,
                  marginTop: 2,
                }}
              >
                {kpis.totalRules || 0} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Quy tắc cốt lõi</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Chuẩn hóa tuân thủ theo luật định
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Macro Compliance Analytics & Top Legal Risks */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#f59e0b' }} />
                <span>Báo Cáo Bức Tranh Rủi Ro Pháp Lý Phổ Biến Toàn Sàn</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <Paragraph style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
              Tỷ lệ doanh nghiệp đang gặp cảnh báo hoặc chưa hoàn tất các nghĩa vụ trọng yếu theo quy định hiện hành:
            </Paragraph>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {commonRisks.map((risk: any) => (
                <div key={risk.ruleCode}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text strong style={{ fontSize: 13 }}>
                      {risk.title} <Tag color="blue">{risk.ruleCode}</Tag>
                    </Text>
                    <Text strong style={{ color: risk.affectedPercent >= 50 ? '#dc2626' : '#ea580c' }}>
                      {risk.affectedPercent}% Doanh nghiệp
                    </Text>
                  </div>
                  <Progress
                    percent={risk.affectedPercent}
                    status={risk.affectedPercent >= 50 ? 'exception' : 'active'}
                    strokeColor={risk.affectedPercent >= 50 ? '#ef4444' : '#f59e0b'}
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#10b981' }} />
                <span>Chỉ Số An Toàn Tuân Thủ Chung</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Progress
                type="dashboard"
                percent={analytics?.safeRatePercent || 0}
                strokeColor="#10b981"
                format={(percent) => (
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{percent}%</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Đạt Chuẩn An Toàn</div>
                  </div>
                )}
                size={180}
              />
            </div>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Doanh nghiệp đạt chuẩn:</Text>
                <Text strong style={{ color: '#16a34a' }}>{analytics?.safeOrganizations || 0} DN</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Cần khắc phục khẩn cấp:</Text>
                <Text strong style={{ color: '#dc2626' }}>{analytics?.warningOrganizations || 0} DN</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Global Transactions */}
      <Card
        title="Sổ Cái Giao Dịch Gần Đây Toàn Sàn"
        extra={
          <Button type="link" onClick={() => navigate('/admin/finance')}>
            Xem tất cả sổ cái <ArrowRightOutlined />
          </Button>
        }
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <CelraTable
          columns={columns}
          dataSource={recentTxs}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};
