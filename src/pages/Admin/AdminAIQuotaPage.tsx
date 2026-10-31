import React, { useEffect, useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Typography,
  Space,
  Spin,
  message,
  Badge,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Divider,
} from 'antd';
import {
  SettingOutlined,
  KeyOutlined,
  CheckOutlined,
  LinkOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
} from 'chart.js';
import apiClient from '../../api/client';
import { CelraTable } from '../../components/common/CelraTable';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  ChartLegend,
  Filler,
);

const { Text } = Typography;

interface AIAnalyticsData {
  status: 'ONLINE' | 'DISCONNECTED' | 'DEGRADED';
  latencyMs: number;
  provider: string;
  model: string;
  endpoint?: string;
  apiKeyMasked: string;
  hasApiKey: boolean;
  currentMonth?: string;
  monthRequests: number;
  monthTokens: number;
  chart: {
    labels: string[];
    tokens: number[];
    requests: number[];
  };
  enterprises: Array<{
    orgId: string;
    orgName: string;
    taxCode?: string;
    requests: number;
    tokens: number;
    lastUsedAt: string;
  }>;
}

export const AdminAIQuotaPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AIAnalyticsData | null>(null);

  // Modal Quản Lý Cấu Hình & Đổi Key AI Provider
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiForm] = Form.useForm();
  const [testingKey, setTestingKey] = useState(false);
  const [savingAiConfig, setSavingAiConfig] = useState(false);
  const [connectedModels, setConnectedModels] = useState<string[]>([]);
  const [keyValidated, setKeyValidated] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get('/admin/ai/analytics');
      setAnalytics(res);
    } catch (err: any) {
      message.error('Không thể tải dữ liệu thống kê AI: ' + (err.message || 'Lỗi'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleOpenAiModal = async () => {
    const currentProvider = analytics?.provider === 'Chưa kết nối' ? 'GEMINI' : (analytics?.provider || 'GEMINI');
    setKeyValidated(Boolean(analytics?.hasApiKey));

    // Đọc danh sách model đã xác thực trong Database từ Backend
    try {
      const cfg: any = await apiClient.get('/admin/ai/config');
      if (cfg && Array.isArray(cfg.availableModels) && cfg.availableModels.length > 0) {
        setConnectedModels(cfg.availableModels);
      } else if (analytics?.hasApiKey && analytics.model) {
        setConnectedModels([analytics.model]);
      }
    } catch {
      if (analytics?.hasApiKey && analytics.model) {
        setConnectedModels([analytics.model]);
      }
    }

    aiForm.setFieldsValue({
      provider: currentProvider,
      apiKey: '',
      apiUrl: analytics?.endpoint && analytics.endpoint !== 'Chưa cấu hình'
        ? analytics.endpoint
        : (currentProvider === 'GEMINI'
          ? 'https://generativelanguage.googleapis.com/v1beta/openai'
          : 'https://opencode.ai/inference/openai/v1'),
      model: analytics?.model && analytics.model !== 'Chưa kết nối model' ? analytics.model : undefined,
    });
    setAiModalVisible(true);
  };

  const handleTestKey = async () => {
    const values = await aiForm.validateFields(['provider', 'apiUrl']);
    const inputKey = aiForm.getFieldValue('apiKey');
    setTestingKey(true);
    try {
      const res: any = await apiClient.post('/admin/ai/test-key', {
        provider: values.provider,
        apiKey: inputKey || undefined,
        apiUrl: values.apiUrl,
      });

      message.success(res.message || '✅ Xác thực kết nối thành công!');
      if (Array.isArray(res.models) && res.models.length > 0) {
        setConnectedModels(res.models);
        setKeyValidated(true);
        aiForm.setFieldsValue({ model: res.recommendedModel || res.models[0] });
      }
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xác thực. Vui lòng kiểm tra lại API Key.');
      setKeyValidated(false);
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveAiConfig = async () => {
    const values = await aiForm.validateFields();
    setSavingAiConfig(true);
    try {
      const res: any = await apiClient.patch('/admin/ai/config', {
        provider: values.provider,
        apiKey: values.apiKey || undefined,
        apiUrl: values.apiUrl,
        model: values.model,
      });

      message.success(res.message || 'Đã cập nhật cấu hình AI thành công!');
      setAiModalVisible(false);
      fetchAnalytics();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi lưu cấu hình AI.');
    } finally {
      setSavingAiConfig(false);
    }
  };

  const handleResetAiKey = async () => {
    try {
      await apiClient.delete('/admin/ai/config');
      message.success('Đã ngắt kết nối và xóa toàn bộ API Key AI thành công! Trạng thái chuyển sang DISCONNECTED.');
      setAiModalVisible(false);
      fetchAnalytics();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi ngắt kết nối API Key');
    }
  };

  // Cấu hình Biểu đồ Chart.js dạng sóng (Line Wave Chart)
  const chartConfig = useMemo(() => {
    const labels = analytics?.chart?.labels || Array.from({ length: 30 }, (_, i) => `Ngày ${i + 1}`);
    const tokenData = analytics?.chart?.tokens || Array(30).fill(0);

    return {
      data: {
        labels,
        datasets: [
          {
            label: 'Tokens tiêu thụ',
            data: tokenData,
            borderColor: '#9333ea',
            borderWidth: 2.5,
            backgroundColor: 'rgba(147, 51, 234, 0.12)',
            fill: true,
            tension: 0.42, // Độ cong sóng mượt mà theo bản vẽ
            pointRadius: 2.5,
            pointHoverRadius: 6,
            pointBackgroundColor: '#9333ea',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => ` ${ctx.parsed.y.toLocaleString('vi-VN')} tokens`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: any) => {
                if (value >= 1000000) return `${value / 1000000}M token`;
                if (value >= 1000) return `${value / 1000}K token`;
                return `${value} token`;
              },
            },
            grid: { color: '#f1f5f9' },
          },
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 15,
            },
          },
        },
      },
    };
  }, [analytics]);

  // Cột cho Bảng phân bổ Doanh nghiệp
  const enterpriseColumns = [
    {
      title: 'Doanh Nghiệp',
      dataIndex: 'orgName',
      key: 'orgName',
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{name}</div>
          {record.taxCode && (
            <div style={{ fontSize: 11.5, color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>
              MST: {record.taxCode}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Request Tháng',
      dataIndex: 'requests',
      key: 'requests',
      width: '25%',
      render: (req: number) => (
        <span style={{ fontWeight: 700, color: '#1e293b' }}>
          {(req || 0).toLocaleString('vi-VN')} requests
        </span>
      ),
    },
    {
      title: 'Token Tiêu Thụ',
      dataIndex: 'tokens',
      key: 'tokens',
      width: '30%',
      render: (tok: number) => (
        <span
          style={{
            fontWeight: 700,
            color: '#9333ea',
            background: '#faf5ff',
            padding: '3px 10px',
            borderRadius: 6,
            border: '1px solid #f3e8ff',
            fontSize: 13,
          }}
        >
          {(tok || 0).toLocaleString('vi-VN')} Tokens
        </span>
      ),
    },
  ];

  if (loading && !analytics) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu hạn mức &amp; lưu lượng AI..." />
      </div>
    );
  }

  const isConnected = analytics?.hasApiKey && analytics?.status !== 'DISCONNECTED';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* KHỐI 1: MAIN CONTAINER CARD THEO ĐÚNG BẢN VẼ */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
          border: '1px solid #e2e8f0',
          marginBottom: 24,
        }}
      >
        {/* 1. THANH HEADER TRẠNG THÁI: connected / latency: 187ms | [Ngắt kết nối] [Cài đặt] */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 20,
            borderBottom: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge
                status={isConnected ? 'processing' : 'default'}
                color={isConnected ? '#16a34a' : '#94a3b8'}
              />
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: isConnected ? '#16a34a' : '#64748b',
                  letterSpacing: -0.2,
                }}
              >
                {isConnected ? 'connected' : 'disconnected'}
              </span>
            </div>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <div
              style={{
                background: '#faf5ff',
                border: '1px solid #f3e8ff',
                color: '#9333ea',
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              latency: {isConnected ? `${analytics?.latencyMs || 0}ms` : '0ms'}
            </div>
          </div>

          <Space size={10}>
            {isConnected && (
              <Button
                danger
                icon={<DisconnectOutlined />}
                onClick={handleResetAiKey}
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  height: 36,
                  padding: '0 14px',
                }}
              >
                Ngắt Kết Nối
              </Button>
            )}
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={handleOpenAiModal}
              style={{
                borderRadius: 8,
                background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
                borderColor: '#7c3aed',
                fontWeight: 600,
                fontSize: 13,
                height: 36,
                padding: '0 16px',
                boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
              }}
            >
              Cài Đặt
            </Button>
          </Space>
        </div>

        {/* 2. HÀNG 3 THẺ KPI TỔNG HỢP: Tổng Request tháng - Tổng Token tháng - Mô hình */}
        <Row gutter={[16, 16]} style={{ margin: '20px 0' }}>
          <Col xs={24} md={8}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
                borderRadius: 12,
                padding: '16px 20px',
                height: '100%',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Tổng Request của tháng
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
                {(analytics?.monthRequests ?? 0).toLocaleString('vi-VN')}{' '}
                <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Requests</span>
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
                borderRadius: 12,
                padding: '16px 20px',
                height: '100%',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Tổng Token của tháng
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#9333ea' }}>
                {(analytics?.monthTokens ?? 0).toLocaleString('vi-VN')}{' '}
                <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Tokens</span>
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
                borderRadius: 12,
                padding: '16px 20px',
                height: '100%',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Mô hình AI vận hành
              </div>
              <div>
                {isConnected ? (
                  <>
                    <Tag color="blue" style={{ fontWeight: 700, fontSize: 13, padding: '2px 8px' }}>
                      {analytics?.model}
                    </Tag>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                      Nhà cung cấp: <strong>{analytics?.provider}</strong> &bull; Key: <code>{analytics?.apiKeyMasked}</code>
                    </div>
                  </>
                ) : (
                  <Text type="secondary" italic style={{ fontSize: 13 }}>
                    Chưa kết nối mô hình
                  </Text>
                )}
              </div>
            </div>
          </Col>
        </Row>

        {/* 3. BIỂU ĐỒ CHART: 50K - 100K - 200K - 500K tokens, trục hoành Ngày 1 -> 30 */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                Biểu Đồ Tiêu Thụ Token Trong Tháng (Ngày 1 &rarr; Ngày 30/31)
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Đường sóng thể hiện lượng token toàn sàn tiêu thụ theo từng ngày
              </div>
            </div>
            <Tag color="purple" style={{ fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>
              {analytics?.currentMonth || 'Tháng Hiện Tại'}
            </Tag>
          </div>

          <div style={{ height: 280, width: '100%' }}>
            <Line data={chartConfig.data} options={chartConfig.options as any} />
          </div>
        </div>

        {/* 4. BẢNG PHÂN BỔ DOANH NGHIỆP: Doanh nghiệp | Request tháng | Token */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Chi Tiết Tiêu Thụ Theo Từng Doanh Nghiệp
            </span>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Sắp xếp theo doanh nghiệp sử dụng nhiều token nhất
            </span>
          </div>

          <CelraTable
            columns={enterpriseColumns}
            dataSource={analytics?.enterprises || []}
            rowKey="orgId"
            pagination={{
              pageSize: 5,
              showTotal: (total: number) => `Tổng số ${total} doanh nghiệp`,
            }}
          />
        </div>
      </Card>

      {/* MODAL CÀI ĐẶT API KEY VÀ THAY ĐỔI MODEL */}
      {/* MODAL CÀI ĐẶT */}
      <Modal
        title={
          <Space>
            <SettingOutlined style={{ color: '#9333ea' }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Cài Đặt</span>
          </Space>
        }
        open={aiModalVisible}
        onCancel={() => setAiModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAiModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="test"
            type="dashed"
            loading={testingKey}
            icon={keyValidated ? <CheckOutlined style={{ color: '#16a34a' }} /> : <SettingOutlined />}
            onClick={handleTestKey}
            style={{
              borderColor: keyValidated ? '#16a34a' : '#9333ea',
              color: keyValidated ? '#16a34a' : '#9333ea',
              fontWeight: 600,
            }}
          >
            {keyValidated ? '✓ Đã Xác Thực' : 'Xác Thực API'}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={savingAiConfig}
            disabled={!keyValidated && !analytics?.hasApiKey}
            onClick={handleSaveAiConfig}
            style={{ background: '#7e22ce', borderColor: '#7e22ce', fontWeight: 600 }}
          >
            Lưu Mô Hình
          </Button>,
        ]}
        width={620}
        centered
        destroyOnClose
      >
        <Form form={aiForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="provider" label="Chọn Nhà Cung Cấp AI (Provider)" required>
            <Radio.Group
              buttonStyle="solid"
              onChange={(e) => {
                const val = e.target.value;
                setKeyValidated(false);
                if (val === 'GEMINI') {
                  aiForm.setFieldsValue({
                    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
                    model: 'gemini-3.5-flash-lite',
                  });
                } else if (val === 'OPENCODE') {
                  aiForm.setFieldsValue({
                    apiUrl: 'https://opencode.ai/inference/openai/v1',
                    model: 'deepseek-v4.1-flash',
                  });
                }
              }}
            >
              <Radio.Button value="GEMINI" style={{ fontWeight: 600 }}>Google Gemini AI</Radio.Button>
              <Radio.Button value="OPENCODE" style={{ fontWeight: 600 }}>OpenCode</Radio.Button>
              <Radio.Button value="CUSTOM" style={{ fontWeight: 600 }}>Tùy Chỉnh</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key Mới"
            tooltip="Hệ thống tự động ghi nhớ Key đã lưu. Bỏ trống ô này nếu bạn muốn giữ nguyên API Key hiện tại để đổi model mà không cần nhập lại."
          >
            <Input.Password
              placeholder={analytics?.hasApiKey ? `Đang dùng key đã lưu (${analytics.apiKeyMasked})` : 'Nhập API Key mới (VD: AIzaSy...)'}
              prefix={<KeyOutlined style={{ color: '#94a3b8' }} />}
              onChange={(e) => {
                if (e.target.value) setKeyValidated(false);
              }}
            />
          </Form.Item>

          <Form.Item
            name="apiUrl"
            label="API Base URL"
            rules={[{ required: true, message: 'Vui lòng nhập API URL' }]}
          >
            <Input
              prefix={<LinkOutlined style={{ color: '#94a3b8' }} />}
              placeholder="https://generativelanguage.googleapis.com/v1beta/openai"
            />
          </Form.Item>

          <Divider style={{ margin: '14px 0' }} />

          <Form.Item
            name="model"
            label="Lựa Chọn Mô Hình"
            rules={[{ required: true, message: 'Vui lòng chọn model' }]}
          >
            <Select
              showSearch
              placeholder={connectedModels.length > 0 ? 'Chọn model AI' : (analytics?.model ? analytics.model : 'Vui lòng bấm Xác Thực API để nạp models')}
              size="large"
              notFoundContent="Chưa có model nào. Vui lòng bấm nút 'Xác Thực API' ở dưới để nạp models từ Provider."
              options={connectedModels.map((m) => ({
                value: m,
                label: m,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
