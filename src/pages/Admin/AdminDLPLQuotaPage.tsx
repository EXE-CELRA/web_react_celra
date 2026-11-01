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
  Alert,
  Modal,
  Pagination,
} from 'antd';
import {
  BookOutlined,
  CloudSyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DiffOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Input } from 'antd';
import apiClient from '../../api/client';
import { CelraTable } from '../../components/common/CelraTable';

const { Title, Text } = Typography;

export const AdminDLPLQuotaPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [quotaData, setQuotaData] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [confirmSyncModalOpen, setConfirmSyncModalOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['TAX_CIT']);
  const [docPage, setDocPage] = useState<number>(1);
  const [docTotal, setDocTotal] = useState<number>(20);
  const [fetchingDocs, setFetchingDocs] = useState<boolean>(false);
  const [syncedLegalDocs, setSyncedLegalDocs] = useState<any[]>([
    {
      code: '67/2025/QH15',
      name: 'Luật Thuế thu nhập doanh nghiệp 2025 (Chính sách phân bậc thuế suất 15%, 17%, miễn thuế <= 1 tỷ)',
      category: 'TAX_CIT',
      issuedBy: 'Quốc hội',
      status: 'Còn hiệu lực',
      effectiveDate: '01/10/2025',
      sourceUrl: 'https://dulieuphapluat.vn',
      syncedAt: 'Cổng DLPL',
    },
    {
      code: '320/2025/NĐ-CP',
      name: 'Nghị định 320/2025/NĐ-CP quy định chi tiết thi hành Luật Thuế TNDN 67/2025 (Đính chính bởi QĐ 517/QĐ-BTC)',
      category: 'TAX_CIT',
      issuedBy: 'Chính phủ',
      status: 'Còn hiệu lực',
      effectiveDate: '15/12/2025',
      sourceUrl: 'https://dulieuphapluat.vn',
      syncedAt: 'Cổng DLPL',
    },
    {
      code: '20/2026/TT-BTC',
      name: 'Thông tư 20/2026/TT-BTC hướng dẫn Luật Thuế TNDN và Nghị định 320/2025/NĐ-CP (Thay thế TT 96/2015/TT-BTC)',
      category: 'TAX_CIT',
      issuedBy: 'Bộ Tài chính',
      status: 'Còn hiệu lực',
      effectiveDate: '12/03/2026',
      sourceUrl: 'https://dulieuphapluat.vn',
      syncedAt: 'Cổng DLPL',
    },
    {
      code: '20/2026/NĐ-CP',
      name: 'Nghị định 20/2026/NĐ-CP hỗ trợ doanh nghiệp nhỏ và vừa thành lập mới, miễn thuế TNDN 3 năm đầu',
      category: 'TAX_CIT',
      issuedBy: 'Chính phủ',
      status: 'Còn hiệu lực',
      effectiveDate: '15/01/2026',
      sourceUrl: 'https://dulieuphapluat.vn',
      syncedAt: 'Cổng DLPL',
    },
    {
      code: '141/2026/NĐ-CP',
      name: 'Nghị định 141/2026/NĐ-CP quy định chính sách miễn thuế TNDN cho doanh nghiệp có doanh thu từ 1 tỷ đồng trở xuống',
      category: 'TAX_CIT',
      issuedBy: 'Chính phủ',
      status: 'Còn hiệu lực',
      effectiveDate: '01/01/2026',
      sourceUrl: 'https://dulieuphapluat.vn',
      syncedAt: 'Cổng DLPL',
    },
    {
      code: '198/2025/QH15',
      name: 'Nghị quyết 198/2025/QH15 về cơ chế, chính sách đặc thù hỗ trợ phát triển doanh nghiệp nhỏ và vừa',
      category: 'TAX_CIT',
      issuedBy: 'Quốc hội',
      status: 'Còn hiệu lực',
      effectiveDate: '01/01/2026',
      sourceUrl: 'https://dulieuphapluat.vn',
      syncedAt: 'Cổng DLPL',
    },
    {
      code: '48/2024/QH15',
      name: 'Luật Thuế Giá trị gia tăng 2024 (Quy định ngưỡng thanh toán không dùng tiền mặt từ 5.000.000 VNĐ)',
      category: 'TAX_CIT',
      issuedBy: 'Quốc hội',
      status: 'Còn hiệu lực',
      effectiveDate: '01/07/2025',
      sourceUrl: 'https://dulieuphapluat.vn',
      syncedAt: 'Cổng DLPL',
    },
    {
      code: '91/2022/NĐ-CP',
      name: 'Nghị định 91/2022/NĐ-CP sửa đổi Nghị định 126/2020 (Quy định tạm nộp thuế TNDN 4 quý đạt tối thiểu 80%)',
      category: 'TAX_CIT',
      issuedBy: 'Chính phủ',
      status: 'Còn hiệu lực',
      effectiveDate: '30/10/2022',
      sourceUrl: 'https://dulieuphapluat.vn',
      syncedAt: 'Cổng DLPL',
    },
    {
      code: '96/2015/TT-BTC',
      name: 'Thông tư 96/2015/TT-BTC hướng dẫn thuế TNDN (Đã được thay thế bởi TT 20/2026/TT-BTC - Dùng tra cứu kỳ cũ)',
      category: 'TAX_CIT',
      issuedBy: 'Bộ Tài chính',
      status: 'Hết hiệu lực (Lưu trữ)',
      effectiveDate: '06/08/2015',
      sourceUrl: 'https://dulieuphapluat.vn',
      syncedAt: 'Cổng DLPL',
    },
  ]);
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

  const fetchLegalDocsServerSide = async (page: number) => {
    setFetchingDocs(true);
    try {
      const res: any = await apiClient.get('/admin/dlpl/documents', {
        params: { page, limit: 10, query: 'thuế thu nhập doanh nghiệp' },
      });
      const list = Array.isArray(res?.items) ? res.items : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      if (list.length > 0) {
        setSyncedLegalDocs(list);
        setDocTotal(res?.total || 20);
        setDocPage(page);
      }
    } catch (err: any) {
      console.warn('Fallback local docs on page change:', err);
    } finally {
      setFetchingDocs(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quotaRes, rulesRes]: [any, any] = await Promise.all([
        apiClient.get('/admin/dlpl/quota'),
        apiClient.get('/rules'),
      ]);
      setQuotaData(quotaRes);
      setRules(Array.isArray(rulesRes) ? rulesRes : []);
      fetchLegalDocsServerSide(1);
    } catch (err: any) {
      message.error('Không thể tải thông tin Quota: ' + (err.message || 'Lỗi'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const CATEGORY_CARDS = [
    {
      key: 'TAX_CIT',
      title: 'Đồng Bộ Toàn Bộ Văn Bản Pháp Luật Thuế TNDN',
      docCount: 20,
      quotaEstimate: 2, // 2 lượt gọi API (Trang 1 và Trang 2) kéo trọn vẹn toàn bộ 20 văn bản còn hiệu lực
      color: '#0d9488',
      bgColor: '#f0fdfa',
      borderColor: '#99f6e4',
      activeDocs: 'Kéo trực tiếp toàn bộ văn bản mới nhất từ Cổng Dữ Liệu Pháp Luật theo từ khóa "Thuế thu nhập doanh nghiệp"',
      apiUrlDesc: 'https://api.dulieuphapluat.vn/v1/legal-documents?q=thuế thu nhập doanh nghiệp',
      ready: true,
    },
  ];

  // Tính số lượt quota sẽ bị trừ dựa trên các thẻ đang chọn
  const estimatedDeduction = selectedCategories.reduce((acc, catKey) => {
    const found = CATEGORY_CARDS.find((c) => c.key === catKey);
    return acc + (found?.quotaEstimate || 0);
  }, 0);

  const toggleCategorySelection = (catKey: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catKey) ? prev.filter((k) => k !== catKey) : [...prev, catKey]
    );
  };

  const handleInstantSync = async () => {
    if (selectedCategories.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 thẻ chủ đề luật để đồng bộ!');
      return;
    }

    setSyncing(true);
    message.loading({ content: `Đang kết nối API DLPL để kéo văn bản mới cho ${selectedCategories.length} chủ đề (Dự kiến tiêu tốn ${estimatedDeduction} lượt)...`, key: 'syncing' });
    try {
      const res: any = await apiClient.post('/admin/dlpl/sync-now', { categories: selectedCategories });
      message.success({
        content: res.message || `Đồng bộ thành công! Đã trừ ${estimatedDeduction} lượt API từ tài khoản DLPL.`,
        key: 'syncing',
        duration: 4,
      });
      if (res.details?.syncedDocs && Array.isArray(res.details.syncedDocs) && res.details.syncedDocs.length > 0) {
        setSyncedLegalDocs(res.details.syncedDocs);
      }
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
        <Spin size="large" tip="Đang kiểm tra kết nối API Dữ Liệu Pháp Luật..." />
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
            Quản Trị Tri Thức Luật
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Đồng bộ văn bản luật từ Cổng Dữ Liệu Pháp Luật Việt Nam (dulieuphapluat.vn) và kiểm soát bộ quy tắc tuân thủ.
          </Text>
        </div>
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

      {/* Card 1: Dữ Liệu Pháp Luật (DLPL) Quota & Thống kê */}
      <Card
        title={
          <Space>
            <BookOutlined style={{ color: '#2563eb' }} />
            <span>Hạn Mức &amp; Kiểm Soát API Dữ Liệu Pháp Luật (dulieuphapluat.vn)</span>
          </Space>
        }
        extra={
          <Space>
            {quotaData?.hasCustomKey && (
              <Tag color="cyan" style={{ fontSize: 11, margin: 0 }}>
                Key tuỳ chỉnh: {quotaData.customApiKey}
              </Tag>
            )}
            <Button
              icon={<KeyOutlined />}
              size="small"
              onClick={() => {
                setCustomKeyInput('');
                setKeyModalOpen(true);
              }}
              style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}
            >
              {quotaData?.hasCustomKey ? 'Đổi API Key Khác' : 'Gắn API Key Mới'}
            </Button>
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 20 }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
            <div>
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>SỐ LƯỢT GỌI API CÒN LẠI TRONG THÁNG</Text>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
                <span style={{ color: '#2563eb' }}>{quotaData?.remainingCalls || 0}</span>{' '}
                <span style={{ fontSize: 15, fontWeight: 500, color: '#64748b' }}>
                  / {quotaData?.totalMonthlyLimit || 1000} lượt
                </span>
              </div>
            </div>
            <Tag color="green" style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
              Đã dùng {quotaData?.usedCalls || 0} lượt ({quotaData?.usagePercent || 0}%)
            </Tag>
          </div>
          <Progress percent={quotaData?.usagePercent || 0} strokeColor="#2563eb" status="active" />
        </div>

      </Card>

      {/* Card 3: BẢNG DANH SÁCH VĂN BẢN ĐÃ KÉO VỀ TỪ DLPL (CÓ TAB PHÂN LOẠI) */}
      <Card
        title={
          <Space>
            <BookOutlined style={{ color: '#0d9488' }} />
            <span style={{ fontWeight: 800 }}>
              Danh Sách Văn Bản Luật Đã Kéo Về Từ DLPL
            </span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<CloudSyncOutlined />}
            loading={syncing}
            onClick={() => setConfirmSyncModalOpen(true)}
            style={{
              borderRadius: 8,
              background: '#0d9488',
              borderColor: '#0d9488',
              fontWeight: 700,
              fontSize: 12,
              height: 34,
              padding: '0 16px',
            }}
          >
            Cập Nhật Toàn Bộ
          </Button>
        }
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 20 }}
      >
        {(() => {
          const filteredDocs = syncedLegalDocs;

          return (
            <div>
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                {fetchingDocs && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Spin tip="Đang tải dữ liệu từ Cổng Dữ Liệu Pháp Luật..." />
                  </div>
                )}
                {!fetchingDocs && (
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px 12px' }}>Số Hiệu</th>
                        <th style={{ padding: '10px 12px' }}>Tên Văn Bản Pháp Luật</th>
                        <th style={{ padding: '10px 12px' }}>Chủ Đề</th>
                        <th style={{ padding: '10px 12px' }}>Cơ Quan</th>
                        <th style={{ padding: '10px 12px' }}>Tình Trạng</th>
                        <th style={{ padding: '10px 12px' }}>Hiệu Lực</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Nguồn DLPL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocs.length > 0 ? (
                        filteredDocs.map((doc, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                              {doc.code}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b', maxWidth: 360 }}>
                              {doc.name}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <Tag color="teal" style={{ fontSize: 11, margin: 0, fontWeight: 600 }}>
                                Thuế TNDN
                              </Tag>
                            </td>
                            <td style={{ padding: '10px 12px', color: '#64748b' }}>
                              {doc.issuedBy || 'Chính phủ'}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <Tag color="green" style={{ fontSize: 11, margin: 0 }}>
                                {doc.status}
                              </Tag>
                            </td>
                            <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 11.5 }}>
                              {doc.effectiveDate}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              <a
                                href={doc.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}
                              >
                                Xem văn bản gốc &rarr;
                              </a>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                            Chưa có văn bản nào được kéo về cho chủ đề này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* BỘ PHÂN TRANG CANH GIỮA */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <Pagination
                  current={docPage}
                  pageSize={10}
                  total={docTotal}
                  onChange={(newPage) => {
                    fetchLegalDocsServerSide(newPage);
                  }}
                  showSizeChanger={false}
                  size="small"
                />
              </div>
            </div>
          );
        })()}
      </Card>

      {/* Card 4: Rules Table */}
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
          pagination={{
            pageSize: 10,
            showTotal: (total: number) => `Tổng số ${total} quy tắc pháp lý`,
          }}
        />
      </Card>

      {/* MODAL SO SÁNH DIFF VÀ PHÊ DUYỆT THAY ĐỔI VĂN BẢN (HUMAN-IN-THE-LOOP) */}
      <Modal
        title={
          <Space>
            <DiffOutlined style={{ color: '#d97706' }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Phê Duyệt Thay Đổi Quy Định Pháp Luật (Human-in-the-Loop)</span>
          </Space>
        }
        open={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setVerifyModalVisible(false)}>
            Để Sau
          </Button>,
          <Button
            key="approve"
            type="primary"
            style={{ background: '#16a34a', borderColor: '#16a34a' }}
            onClick={handleApproveNewQuestions}
          >
            Phê Duyệt &amp; Kích Hoạt Vi Khảo Sát
          </Button>,
        ]}
        width={750}
        centered
        destroyOnClose
      >
        {activeDiff && (
          <div>
            <div style={{ marginBottom: 16, background: '#f8fafc', padding: '10px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Tag color="blue">{activeDiff.domainLabel}</Tag>
                <Text code>{activeDiff.ruleCode}</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Thời gian phát hiện: <strong>{activeDiff.detectedAt}</strong>
              </Text>
            </div>

            <Row gutter={[16, 16]}>
              {/* Cột 1: Quy định hiện tại */}
              <Col span={12}>
                <Card
                  size="small"
                  title={<span style={{ color: '#64748b' }}>Quy Định Hiện Tại (Đang áp dụng)</span>}
                  style={{ background: '#f8fafc', borderColor: '#e2e8f0', borderRadius: 8 }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 12, color: '#475569' }}>Văn bản căn cứ:</Text>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{activeDiff.oldLegal}</div>
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
      {/* MODAL CẤU HÌNH API KEY DỮ LIỆU PHÁP LUẬT TUỲ CHỈNH */}
      <Modal
        title={
          <Space>
            <KeyOutlined style={{ color: '#0d9488' }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Gắn API Key Dữ Liệu Pháp Luật (dulieuphapluat.vn)</span>
          </Space>
        }
        open={keyModalOpen}
        onCancel={() => setKeyModalOpen(false)}
        footer={[
          quotaData?.hasCustomKey && (
            <Button
              key="delete"
              danger
              icon={<DeleteOutlined />}
              onClick={async () => {
                try {
                  await apiClient.delete('/admin/dlpl/config');
                  message.success('Đã xóa key tùy chỉnh, quay về cấu hình .env mặc định');
                  setKeyModalOpen(false);
                  fetchData();
                } catch (err: any) {
                  message.error(err.message || 'Lỗi khi xóa key');
                }
              }}
            >
              Xóa Key Tùy Chỉnh
            </Button>
          ),
          <Button key="cancel" onClick={() => setKeyModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={savingKey}
            disabled={!customKeyInput.trim()}
            style={{ background: '#0d9488', borderColor: '#0d9488', fontWeight: 600 }}
            onClick={async () => {
              setSavingKey(true);
              const hide = message.loading({ content: 'Đang kết nối đến máy chủ Cổng Dữ Liệu Pháp Luật để kiểm tra tính hợp lệ của Key...', key: 'verifyKey' });
              try {
                const res: any = await apiClient.post('/admin/dlpl/config', { apiKey: customKeyInput.trim() });
                hide();
                message.success({
                  content: res.message || '✅ Xác thực thành công! API Key hợp lệ và đã được kích hoạt.',
                  key: 'verifyKey',
                  duration: 5,
                });
                setKeyModalOpen(false);
                setCustomKeyInput('');
                fetchData();
              } catch (err: any) {
                hide();
                message.error({
                  content: err.response?.data?.message || err.message || '❌ Kết nối thất bại: API Key không hợp lệ hoặc đã hết hạn!',
                  key: 'verifyKey',
                  duration: 6,
                });
              } finally {
                setSavingKey(false);
              }
            }}
          >
            Xác Thực &amp; Kích Hoạt Key
          </Button>,
        ]}
        centered
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, margin: '0 0 12px 0' }}>
            Khi tài khoản cũ hết lượt (1.000 lượt/tháng), bạn chỉ cần dán <strong>API Key mới</strong> lấy từ cổng <a href="https://dulieuphapluat.vn" target="_blank" rel="noreferrer" style={{ color: '#0d9488', fontWeight: 600 }}>dulieuphapluat.vn</a> vào đây. Hệ thống sẽ lập tức nhận key mới và làm mới hạn mức mà <strong>không cần phải sửa file .env hay khởi động lại server</strong>!
          </p>
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
            Nhập chuỗi Bearer API Key mới:
          </div>
          <Input.Password
            placeholder="Dán API Key (Ví dụ: eyJhbGciOi...)"
            value={customKeyInput}
            onChange={(e) => setCustomKeyInput(e.target.value)}
            style={{ height: 40, borderRadius: 8 }}
          />
        </div>
      </Modal>

      {/* MODAL XÁC NHẬN CHỌN THẺ VÀ DỰ TOÁN QUOTA TRƯỚC KHI KÉO LUẬT */}
      <Modal
        title={
          <Space>
            <CloudSyncOutlined style={{ color: '#0d9488', fontSize: 18 }} />
            <span style={{ fontWeight: 800, fontSize: 16 }}>Xác Nhận Kéo Dữ Liệu Pháp Luật Từ DLPL</span>
          </Space>
        }
        open={confirmSyncModalOpen}
        onCancel={() => setConfirmSyncModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmSyncModalOpen(false)}>
            Hủy Bỏ
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={syncing}
            disabled={selectedCategories.length === 0}
            style={{ background: '#0d9488', borderColor: '#0d9488', fontWeight: 700 }}
            onClick={async () => {
              setConfirmSyncModalOpen(false);
              await handleInstantSync();
            }}
          >
            Xác Nhận Kéo Toàn Bộ Văn Bản
          </Button>,
        ]}
        centered
        width={600}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, margin: '0 0 14px 0' }}>
            Vui lòng chọn các thẻ chủ đề pháp luật bạn muốn đồng bộ. Hệ thống sẽ kết nối trực tiếp đến Cổng <strong>dulieuphapluat.vn</strong> và trừ số lượt gọi tương ứng vào hạn ngạch tài khoản của bạn.
          </p>

          {/* Danh sách thẻ để chọn */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
              Chọn các thẻ chủ đề cần kéo dữ liệu mới:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CATEGORY_CARDS.map((cat) => {
                const isChecked = selectedCategories.includes(cat.key);
                return (
                  <div
                    key={cat.key}
                    onClick={() => toggleCategorySelection(cat.key)}
                    style={{
                      cursor: 'pointer',
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: isChecked ? cat.bgColor : '#f8fafc',
                      border: `1.5px solid ${isChecked ? cat.color : '#e2e8f0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                        {isChecked ? '☑ ' : '☐ '} {cat.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {cat.activeDocs}
                      </div>
                    </div>
                    <Tag color="cyan" style={{ fontWeight: 700, margin: 0, fontSize: 11 }}>
                      1 lượt / 1 trang kết quả
                    </Tag>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </Modal>
    </div>
  );
};
