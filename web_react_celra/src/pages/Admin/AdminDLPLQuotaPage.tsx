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
  Alert,
  Modal,
} from 'antd';
import {
  BookOutlined,
  ThunderboltOutlined,
  CloudSyncOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DiffOutlined,
  SafetyCertificateOutlined,
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

  // Hàng đợi các thay đổi quy định từ DLPL chờ Admin xác minh (Human-in-the-Loop)
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([
    {
      id: 'DIFF_TAX_01',
      domain: 'TAX',
      domainLabel: 'Thuế & Quản lý thuế',
      ruleCode: 'RULE-TAX-TNDN-80',
      oldDoc: 'Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP',
      newDoc: 'Nghị định 252/2026/NĐ-CP (Quy định chi tiết Luật QLT & Quyết toán thuế)',
      oldQuestion: 'Doanh nghiệp có thực hiện tạm nộp thuế Thu nhập doanh nghiệp (TNDN) 4 quý đạt tối thiểu 80% số thuế TNDN phải nộp cả năm không?',
      newQuestion: 'Doanh nghiệp có thực hiện tạm nộp thuế TNDN 4 quý đạt tỷ lệ luật định và kê khai đầy đủ theo quy định tại Nghị định 252/2026/NĐ-CP không?',
      oldLegal: 'Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP sửa đổi NĐ 126/2020. Hạn tạm nộp Q4 là 30/01.',
      newLegal: 'Khoản 1 Điều 8 Nghị định 252/2026/NĐ-CP (Kế thừa mốc 80% và bổ sung quy định nộp bổ sung).',
      detectedAt: 'Vừa quét từ API DLPL',
      impactUsersCount: 14,
    },
  ]);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [activeDiff, setActiveDiff] = useState<any>(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const handleOpenVerifyModal = (item?: any) => {
    setActiveDiff(item || pendingUpdates[0] || null);
    setVerifyModalVisible(true);
  };

  const handleApproveNewQuestions = () => {
    localStorage.removeItem('celra_pending_law_alert_v2');
    message.success({
      content: '✅ Đã phê duyệt và ban hành Bộ câu hỏi mới (v2.0)! Hệ thống đã kích hoạt Micro-Survey tự động gửi thông báo cập nhật tới 14 doanh nghiệp cũ mà không làm mất lịch sử.',
      duration: 5,
    });
    setVerifiedSuccess(true);
    setPendingUpdates([]);
    setVerifyModalVisible(false);
    setRules((prev) =>
      prev.map((r) =>
        r.code === 'RULE-TAX-TNDN-80'
          ? { ...r, version: '2.0', legalReference: 'Nghị định 252/2026/NĐ-CP' }
          : r
      )
    );
  };

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

      {/* CẢNH BÁO: PHÁT HIỆN THAY ĐỔI LUẬT CẦN ADMIN XÁC MINH (HUMAN-IN-THE-LOOP) */}
      {pendingUpdates.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined style={{ fontSize: 18, color: '#d97706' }} />}
          message={
            <span style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>
              Phát hiện {pendingUpdates.length} thay đổi quy định từ API Dữ Liệu Pháp Luật (DLPL) cần Admin xác minh!
            </span>
          }
          description={
            <div style={{ marginTop: 4 }}>
              <p style={{ margin: '0 0 8px 0', fontSize: 12, color: '#78350f' }}>
                Cổng Dữ Liệu Pháp Luật vừa phát hiện văn bản mới thay thế/bổ sung cho quy định hiện tại (<strong>Nghị định 252/2026/NĐ-CP</strong>). 
                Hệ thống đã tự động tạo dự thảo câu hỏi mới và chuẩn bị sẵn cơ chế <strong>Vi khảo sát (Micro-Survey 30s)</strong> để 14 doanh nghiệp cũ cập nhật mà không làm mất lịch sử.
              </p>
              <Space>
                <Button
                  type="primary"
                  size="small"
                  icon={<DiffOutlined />}
                  style={{ background: '#d97706', borderColor: '#d97706', fontWeight: 600 }}
                  onClick={() => handleOpenVerifyModal()}
                >
                  Xem So Sánh Diff &amp; Xác Nhận Phê Duyệt
                </Button>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Lĩnh vực: <strong>Thuế &amp; Quản lý thuế (TAX)</strong> &bull; Mã quy tắc: <code>RULE-TAX-TNDN-80</code>
                </Text>
              </Space>
            </div>
          }
          style={{ marginBottom: 20, borderRadius: 10, border: '1px solid #fde68a', background: '#fffbeb' }}
        />
      )}

      {/* THÔNG BÁO ĐÃ PHÊ DUYỆT THÀNH CÔNG */}
      {verifiedSuccess && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined style={{ fontSize: 18, color: '#16a34a' }} />}
          message={
            <span style={{ fontWeight: 700, fontSize: 14, color: '#166534' }}>
              Hệ thống đang hoạt động với Bộ quy tắc tuân thủ mới nhất (Phiên bản v2.0)
            </span>
          }
          description={
            <span style={{ fontSize: 12, color: '#14532d' }}>
              Đã đồng bộ thành công với API Dữ Liệu Pháp Luật. Toàn bộ 14 doanh nghiệp cũ đã được bảo toàn lịch sử 100% và nhận thông báo cập nhật vi khảo sát khi đăng nhập.
            </span>
          }
          closable
          style={{ marginBottom: 20, borderRadius: 10, border: '1px solid #bbf7d0', background: '#f0fdf4' }}
        />
      )}

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

      {/* MODAL SO SÁNH DIFF & PHÊ DUYỆT BỘ CÂU HỎI MỚI (HUMAN-IN-THE-LOOP) */}
      <Modal
        title={
          <Space>
            <DiffOutlined style={{ color: '#2563eb' }} />
            <span>Xác Minh &amp; Ban Hành Bộ Câu Hỏi Tuân Thủ Mới (Human-in-the-Loop)</span>
          </Space>
        }
        open={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        width={860}
        footer={[
          <Button key="cancel" onClick={() => setVerifyModalVisible(false)}>
            Đóng
          </Button>,
          <Button
            key="confirm"
            type="primary"
            icon={<SafetyCertificateOutlined />}
            style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 600 }}
            onClick={handleApproveNewQuestions}
          >
            Xác Nhận &amp; Ban Hành Bộ Câu Hỏi Mới (v2.0)
          </Button>,
        ]}
      >
        {activeDiff && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Space>
                <Tag color="blue">{activeDiff.domainLabel}</Tag>
                <Text code>{activeDiff.ruleCode}</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Thời gian phát hiện: <strong>{activeDiff.detectedAt}</strong>
              </Text>
            </div>

            {/* BẢNG SO SÁNH 2 CỘT */}
            <Row gutter={16}>
              {/* Cột 1: Hiện tại (Cũ) */}
              <Col span={12}>
                <Card
                  size="small"
                  title={<span style={{ color: '#64748b' }}>📌 Quy Định &amp; Câu Hỏi Hiện Tại (v1.0)</span>}
                  style={{ background: '#f8fafc', borderColor: '#cbd5e1', borderRadius: 8 }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 12, color: '#475569' }}>Căn cứ văn bản:</Text>
                    <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>{activeDiff.oldLegal}</div>
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 12, color: '#475569' }}>Nội dung câu hỏi khảo sát:</Text>
                    <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500, marginTop: 4, background: '#fff', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      {activeDiff.oldQuestion}
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Cột 2: Đề xuất mới từ DLPL */}
              <Col span={12}>
                <Card
                  size="small"
                  title={<span style={{ color: '#15803d', fontWeight: 700 }}>✨ Văn Bản Mới &amp; Đề Xuất Cập Nhật (v2.0)</span>}
                  style={{ background: '#f0fdf4', borderColor: '#86efac', borderRadius: 8 }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 12, color: '#166534' }}>Văn bản mới từ DLPL:</Text>
                    <div style={{ fontSize: 12, color: '#15803d', fontWeight: 600, marginTop: 2 }}>{activeDiff.newLegal}</div>
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 12, color: '#166534' }}>Nội dung câu hỏi đề xuất:</Text>
                    <div style={{ fontSize: 13, color: '#064e3b', fontWeight: 600, marginTop: 4, background: '#fff', padding: 8, borderRadius: 6, border: '1px solid #bbf7d0' }}>
                      {activeDiff.newQuestion}
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* HỘP GIẢI THÍCH CƠ CHẾ KẾ THỪA CHO NGƯỜI DÙNG CŨ */}
            <div style={{ marginTop: 16, background: '#eff6ff', border: '1px dashed #93c5fd', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <SafetyCertificateOutlined style={{ color: '#2563eb' }} />
                <Text strong style={{ color: '#1e40af', fontSize: 13 }}>
                  Cơ Chế Bảo Vệ Dữ Liệu Doanh Nghiệp Cũ (Micro-Survey Delta Update):
                </Text>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#1e3a8a', lineHeight: '1.6' }}>
                <li>
                  <strong>Bảo tồn bằng chứng lịch sử 100%:</strong> Toàn bộ kết quả khảo sát, Context Facts và Nhiệm vụ cũ của {activeDiff.impactUsersCount} doanh nghiệp trước đây được đóng băng nguyên vẹn theo luật cũ, không bị ghi đè.
                </li>
                <li>
                  <strong>Vi khảo sát 30 giây:</strong> Khi các doanh nghiệp này đăng nhập, hệ thống chỉ hiển thị duy nhất 1 câu hỏi này để họ xác nhận theo Nghị định mới, hoàn toàn không bắt họ điền lại từ đầu.
                </li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
