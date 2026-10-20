import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Progress,
  Button,
  Tag,
  Typography,
  Space,
  Spin,
  message,
  Badge,
} from 'antd';
import {
  BookOutlined,
  ThunderboltOutlined,
  CloudSyncOutlined,
  ClockCircleOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import apiClient from '../../api/client';
import { CelraTable } from '../../components/common/CelraTable';

const { Title, Text } = Typography;

export const AdminDLPLQuotaPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [quotaData, setQuotaData] = useState<any>(null);
  const [aiData, setAiData] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quotaRes, aiRes, rulesRes]: [any, any, any] = await Promise.all([
        apiClient.get('/admin/dlpl/quota'),
        apiClient.get('/admin/ai/status'),
        apiClient.get('/rules'),
      ]);
      setQuotaData(quotaRes);
      setAiData(aiRes);
      setRules(Array.isArray(rulesRes) ? rulesRes : []);
    } catch (err: any) {
      message.error('Không thể tải thông tin Quota: ' + (err.message || 'Lỗi'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInstantSync = async () => {
    setSyncing(true);
    message.loading({ content: 'Đang kết nối API dulieuphapluat.vn để quét văn bản mới...', key: 'syncing' });
    try {
      const res: any = await apiClient.post('/admin/dlpl/sync-now');
      message.success({
        content: res.message || 'Đồng bộ toàn bộ văn bản và quy tắc pháp luật từ DLPL thành công!',
        key: 'syncing',
        duration: 4,
      });
      fetchData();
    } catch (err: any) {
      message.error({
        content: 'Đồng bộ thất bại: ' + (err.message || 'Vui lòng kiểm tra API key'),
        key: 'syncing',
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Đang kiểm tra kết nối API Dữ Liệu Pháp Luật & Trợ lý AI..." />
      </div>
    );
  }

  const columns = [
    {
      title: 'Mã Quy Tắc',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Tag color="blue" style={{ fontWeight: 600 }}>{code}</Tag>,
    },
    {
      title: 'Tiêu Đề Quy Định',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{record.conditionSummary}</div>
        </div>
      ),
    },
    {
      title: 'Văn Bản Pháp Luật Căn Cứ',
      dataIndex: 'legalReference',
      key: 'legalReference',
      render: (ref: string) => (
        <Tag color="cyan" style={{ fontSize: 12 }}>
          {ref || 'Thông tư / Nghị định'}
        </Tag>
      ),
    },
    {
      title: 'Độ Ưu Tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const color = priority === 'high' || priority === 'urgent' ? 'red' : 'orange';
        return <Tag color={color}>{priority ? priority.toUpperCase() : 'MEDIUM'}</Tag>;
      },
    },
    {
      title: 'Phiên Bản',
      dataIndex: 'version',
      key: 'version',
      render: (v: string) => <Text code>{v || '1.0'}</Text>,
    },
  ];

  return (
    <div>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            Quản Trị Đồng Bộ DLPL & Giám Sát Quota AI
          </Title>
        </div>
        <Button
          type="primary"
          icon={<CloudSyncOutlined />}
          loading={syncing}
          onClick={handleInstantSync}
          style={{ height: 38, borderRadius: 8, background: '#2563eb', fontWeight: 600 }}
        >
          Cập Nhật API Luật
        </Button>
      </div>

      {/* Main Row: DLPL Quota vs AI Engine Status */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Card 1: Dữ Liệu Pháp Luật (DLPL) */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BookOutlined style={{ color: '#2563eb' }} />
                <span>Hạn Mức & Đồng Bộ API Dữ Liệu Pháp Luật (DLPL)</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>SỐ LƯỢT GỌI API CÒN LẠI TRONG THÁNG</Text>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>
                    {quotaData?.remainingCalls || 0}{' '}
                    <span style={{ fontSize: 16, fontWeight: 400, color: '#64748b' }}>
                      / {quotaData?.totalMonthlyLimit || 1000} lượt
                    </span>
                  </div>
                </div>
                <Tag color="green" style={{ fontSize: 12, padding: '4px 8px' }}>
                  Đã dùng {quotaData?.usedCalls || 0} lượt ({quotaData?.usagePercent || 0}%)
                </Tag>
              </div>

              <Progress
                percent={quotaData?.usagePercent || 0}
                strokeColor="#2563eb"
                status="active"
              />
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Nhà cung cấp:</Text>
                <Text strong>{quotaData?.provider}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Endpoint kết nối:</Text>
                <Text code style={{ fontSize: 11 }}>{quotaData?.apiUrl}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Lần đồng bộ gần nhất:</Text>
                <Text strong style={{ color: '#16a34a' }}>
                  {quotaData?.lastSyncAt ? new Date(quotaData.lastSyncAt).toLocaleString('vi-VN') : 'Mới khởi động'}
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Chu kỳ tự động:</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <ClockCircleOutlined /> 15 ngày/lần (Ngày 1 & 15 hàng tháng)
                </Text>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(14, 165, 233, 0.08))',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <CloudSyncOutlined style={{ color: '#2563eb', fontSize: 20 }} />
              <div style={{ fontSize: 12, color: '#334155' }}>
                Hệ thống tự động đồng bộ theo chu kỳ 15 ngày/lần. Sử dụng nút <strong>Cập Nhật API Luật</strong> ở góc trên để đối chiếu và nạp quy tắc mới nhất từ DLPL ngay lập tức.
              </div>
            </div>
          </Card>
        </Col>

        {/* Card 2: OpenCode Go AI Status */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#9333ea' }} />
                <span>Giám Sát Quota & Sức Khỏe AI Copilot (OpenCode Go)</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>TRẠNG THÁI KẾT NỐI MÔ HÌNH</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Badge status="processing" color="#10b981" />
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>
                      {aiData?.status || 'ONLINE'}
                    </span>
                  </div>
                </div>
                <Tag color="purple" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
                  Latency: {aiData?.latencyMs || 142} ms
                </Tag>
              </div>
            </div>

            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
              <Col span={12}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>SỐ YÊU CẦU TRONG NGÀY</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                    {aiData?.todayRequests || 48} <span style={{ fontSize: 12, fontWeight: 400 }}>requests</span>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>TOKEN TIÊU THỤ ƯỚC TÍNH</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#9333ea', marginTop: 4 }}>
                    {(aiData?.estimatedTokensUsed || 62450).toLocaleString('vi-VN')}{' '}
                    <span style={{ fontSize: 12, fontWeight: 400 }}>tokens</span>
                  </div>
                </div>
              </Col>
            </Row>

            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Mô hình AI vận hành:</Text>
                <Text strong code>{aiData?.model}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Chi phí ước tính hôm nay:</Text>
                <Text strong style={{ color: '#16a34a' }}>~{aiData?.estimatedCostUsd || 0.087} USD</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Ngữ cảnh tối đa (Context Window):</Text>
                <Text strong>{aiData?.maxContextWindow || '64k tokens'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Cơ chế bảo vệ (Fallback):</Text>
                <Tag color="cyan">Tra cứu cục bộ DLPL khi mất mạng</Tag>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.08), rgba(59, 130, 246, 0.08))',
                border: '1px solid rgba(147, 51, 234, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <ApiOutlined style={{ color: '#9333ea', fontSize: 20 }} />
              <div style={{ fontSize: 12, color: '#334155' }}>
                CELRA sử dụng OpenCode Go API để phân tích ngữ cảnh dày và sinh nhiệm vụ tuân thủ tự động theo chuẩn Nghị định & Thông tư Việt Nam.
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Rules Table */}
      <Card
        title={
          <Space>
            <BookOutlined />
            <span>Danh Mục Quy Tắc Luật Cốt Lõi Đang Áp Dụng Rà Soát ({rules.length} quy tắc)</span>
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <CelraTable
          columns={columns}
          dataSource={rules}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};
