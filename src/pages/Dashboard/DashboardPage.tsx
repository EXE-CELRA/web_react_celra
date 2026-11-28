/* eslint-disable react-hooks/immutability */
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Progress, Typography, Button, Table, Space, Empty, Tag, message, Alert, Modal, Radio } from 'antd';
import {
  CheckCircleOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import apiClient from '../../api/client';
import { useOrgStore } from '../../store/useOrgStore';
import { useTaskStore } from '../../store/useTaskStore';
import { TaskStatusTag, PriorityTag } from '../../components/common/StatusBadge';
import { getDeadlineStatus } from '../../utils/taxCalendar';

ChartJS.register(ArcElement, Tooltip, Legend);

const { Title, Text, Paragraph } = Typography;

interface PendingLegalUpdateItem {
  id: string;
  sourceType: 'LEGAL_DOCUMENT' | 'RULE';
  sourceCode: string;
  sourceVersion: string;
  title: string;
  legalReference: string;
  issuedBy: string;
  effectiveDate: string;
  sourceUrl?: string;
  syncedAt: string;
  question: string;
  options: string[];
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Chủ doanh nghiệp',
  internal_accountant: 'Kế toán nội bộ',
  service_accountant: 'Kế toán dịch vụ',
  hr_staff: 'Nhân sự',
  expert: 'Chuyên gia',
  admin: 'Quản trị viên',
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrg, organizations } = useOrgStore();
  const { tasks, fetchTasks } = useTaskStore();

  const [stats, setStats] = useState<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    urgentTasksCount: number;
    complianceScore: number;
  }>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    urgentTasksCount: 0,
    complianceScore: 0,
  });

  const [pendingUpdates, setPendingUpdates] = useState<PendingLegalUpdateItem[]>([]);
  const [microSurveyVisible, setMicroSurveyVisible] = useState(false);
  const [microSelectedOption, setMicroSelectedOption] = useState<string>('Đã hoàn thành / Tuân thủ đầy đủ');
  const [updatingLawContext, setUpdatingLawContext] = useState(false);

  const activeUpdate = pendingUpdates[0] || null;

  // Kiểm tra cờ trạng thái hoàn thành bài khảo sát bối cảnh (tách biệt theo từng doanh nghiệp)
  const isSurveyCompleted = Boolean(
    activeOrg?.id &&
    (localStorage.getItem(`celra_survey_completed_${activeOrg.id}`) === 'true' ||
     (activeOrg?.taxCode && activeOrg?.name))
  );

  const handleOpenMicroSurvey = () => {
    if (!activeUpdate) return;
    setMicroSelectedOption(activeUpdate.options[0] || 'Đã hoàn thành / Tuân thủ đầy đủ');
    setMicroSurveyVisible(true);
  };

  const handleAcknowledgeUpdate = async (status: 'CONFIRMED' | 'DISMISSED') => {
    if (!activeUpdate) return;
    setUpdatingLawContext(true);
    try {
      await apiClient.post('/context-facts/legal-updates/acknowledge', {
        sourceType: activeUpdate.sourceType,
        sourceCode: activeUpdate.sourceCode,
        sourceVersion: activeUpdate.sourceVersion,
        status,
        selectedOption: status === 'CONFIRMED' ? microSelectedOption : undefined,
        title: activeUpdate.title,
        legalReference: activeUpdate.legalReference,
      });

      if (status === 'CONFIRMED') {
        message.success(`Đã ghi nhận xác nhận tuân thủ cho ${activeUpdate.sourceCode} vào cơ sở dữ liệu!`);
        setMicroSurveyVisible(false);
      } else {
        message.info(`Đã tạm hoãn thông báo cho ${activeUpdate.sourceCode}.`);
      }

      setPendingUpdates((prev) => prev.filter((item) => item.id !== activeUpdate.id));
    } catch {
      message.error('Lỗi khi lưu xác nhận cập nhật bối cảnh pháp luật');
    } finally {
      setUpdatingLawContext(false);
    }
  };

  useEffect(() => {
    setStats({
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      urgentTasksCount: 0,
      complianceScore: 0,
    });
    setPendingUpdates([]);
    if (activeOrg) {
      loadDashboardData();
    }
  }, [activeOrg]);


  const loadDashboardData = async () => {
    try {
      const isSurveyDone = Boolean(
        activeOrg?.id &&
        (localStorage.getItem(`celra_survey_completed_${activeOrg.id}`) === 'true' ||
         (activeOrg?.taxCode && activeOrg?.name))
      );

      // Kéo dữ liệu cập nhật pháp luật mới từ API (nếu có văn bản / quy tắc mới chưa xác nhận)
      apiClient
        .get<unknown, { pendingUpdates?: PendingLegalUpdateItem[] }>('/context-facts/legal-updates/pending')
        .then((res) => {
          setPendingUpdates(Array.isArray(res?.pendingUpdates) ? res.pendingUpdates : []);
        })
        .catch(() => {
          setPendingUpdates([]);
        });

      // Nếu chưa hoàn thành bài khảo sát, toàn bộ số liệu để là 0
      if (!isSurveyDone) {
        setStats({
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
          urgentTasksCount: 0,
          complianceScore: 0,
        });
        return;
      }

      await fetchTasks();

      const currentTasks = useTaskStore.getState().tasks;
      const total = currentTasks.length;

      // Nếu thực tế chưa có bất kỳ nhiệm vụ nào, thiết lập các chỉ số về 0
      if (total === 0) {
        setStats({
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
          urgentTasksCount: 0,
          complianceScore: 0,
        });
        return;
      }

      let completed = 0;
      let overdue = 0;
      let inProgress = 0;
      let urgent = 0;

      currentTasks.forEach((t) => {
        const s = String(t.status || '').toUpperCase();
        const isCompleted = s === 'COMPLETED' || s === 'VERIFIED' || s === 'DONE';
        const isCancelled = s === 'CANCELLED';
        const p = String(t.customPriority || t.priority || '').toLowerCase();

        if (p === 'high' || p === 'urgent' || p === 'critical') {
          urgent += 1;
        }

        if (isCompleted) {
          completed += 1;
          return;
        }
        if (isCancelled) return;

        const dlStatus = t.dueDate
          ? getDeadlineStatus(t.dueDate, null, false).deadlineStatus
          : null;
        if (s === 'OVERDUE' || dlStatus === 'OVERDUE_BY_CALENDAR') {
          overdue += 1;
        } else {
          inProgress += 1;
        }
      });

      const score = Math.round((completed / total) * 100);

      setStats({
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        overdueTasks: overdue,
        urgentTasksCount: urgent,
        complianceScore: score,
      });
    } catch (err) {
      console.error(err);
    }
  };


  const hasTasks = isSurveyCompleted && stats.totalTasks > 0;
  const chartData = {
    labels: hasTasks ? ['Đã hoàn thành', 'Đang xử lý', 'Quá hạn / Chờ'] : ['Chưa có dữ liệu'],
    datasets: [
      {
        data: hasTasks
          ? [stats.completedTasks, stats.inProgressTasks, stats.overdueTasks]
          : [1],
        backgroundColor: hasTasks
          ? ['#52c41a', '#1677ff', '#ff4d4f']
          : ['#f0f0f0'],
        hoverBackgroundColor: hasTasks
          ? ['#73d13d', '#4096ff', '#ff7875']
          : ['#e4e4e7'],
      },
    ],
  };

  // Hàm chuyển đổi mã ngành nghề sang tiếng Việt thân thiện
  const formatIndustry = (code?: string) => {
    if (!code) return 'Chưa xác định';
    if (code === 'TAG_FNB') return 'F&B - Dịch vụ ăn uống';
    if (code === 'TAG_RETAIL') return 'Bán lẻ & Thương mại';
    if (code === 'TAG_LOGISTICS') return 'Vận tải & Kho bãi';
    if (code === 'TAG_TECH') return 'Công nghệ thông tin';
    return code;
  };

  // Hàm chuyển đổi mã quy mô sang tiếng Việt thân thiện
  const formatScale = (scale?: string, employeeCount?: number) => {
    if (scale) {
      if (scale === 'MICRO') return 'Siêu nhỏ (< 10 nhân sự)';
      if (scale === 'SMALL') return 'Nhỏ (10 - 50 nhân sự)';
      if (scale === 'MEDIUM') return 'Vừa (50 - 200 nhân sự)';
      if (scale === 'LARGE') return 'Lớn (> 200 nhân sự)';
      return scale;
    }
    if (typeof employeeCount === 'number' && employeeCount > 0) {
      if (employeeCount < 10) return `Siêu nhỏ (${employeeCount} nhân sự)`;
      if (employeeCount <= 50) return `Nhỏ (${employeeCount} nhân sự)`;
      if (employeeCount <= 200) return `Vừa (${employeeCount} nhân sự)`;
      return `Lớn (${employeeCount} nhân sự)`;
    }
    return 'Chưa xác định';
  };

  if (!activeOrg && organizations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Empty
          description="Bạn chưa có hồ sơ doanh nghiệp nào trên hệ thống"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" size="large" onClick={() => navigate('/survey')}>
            Bắt đầu tạo hồ sơ doanh nghiệp ngay
          </Button>
        </Empty>
      </div>
    );
  }

  const urgentTasks = isSurveyCompleted
    ? tasks
        .filter((t) => {
          const st = String(t.status || '').toLowerCase();
          return st !== 'completed' && st !== 'verified' && st !== 'done' && st !== 'cancelled';
        })
        .slice(0, 5)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 🔔 BANNER CẬP NHẬT PHÁP LUẬT MỚI TỪ API (CHỈ HIỆN KHI CÓ DỮ LIỆU MỚI CHỜ XÁC NHẬN) */}
      {activeUpdate && (
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <Space wrap>
                <Tag color="volcano" style={{ fontWeight: 'bold' }}>CẬP NHẬT PHÁP LUẬT MỚI</Tag>
                <Tag color="blue" style={{ fontWeight: 'bold' }}>
                  {activeUpdate.sourceCode}
                </Tag>
                {pendingUpdates.length > 1 && (
                  <Tag color="default">Còn {pendingUpdates.length} mục chờ xác nhận</Tag>
                )}
                <strong style={{ fontSize: 14 }}>
                  {activeUpdate.title}
                </strong>
              </Space>
              <Space>
                <Button
                  type="primary"
                  size="small"
                  icon={<ThunderboltOutlined />}
                  onClick={handleOpenMicroSurvey}
                  style={{ backgroundColor: '#fa541c', borderColor: '#fa541c', fontWeight: 600 }}
                >
                  Xác Nhận Nhanh
                </Button>
                <Button
                  type="text"
                  size="small"
                  loading={updatingLawContext}
                  onClick={() => handleAcknowledgeUpdate('DISMISSED')}
                  style={{ color: '#8c8c8c' }}
                >
                  Để sau
                </Button>
              </Space>
            </div>
          }
          description={
            <div style={{ marginTop: 6, fontSize: 12, color: '#595959' }}>
              Nguồn: <strong>{activeUpdate.issuedBy}</strong> • Hiệu lực: <strong>{activeUpdate.effectiveDate}</strong>. Bạn <strong>không cần</strong> làm lại toàn bộ bài khảo sát, chỉ cần xác nhận nhanh tình trạng tuân thủ cho quy định vừa đồng bộ.
              {activeUpdate.sourceUrl && (
                <a
                  href={activeUpdate.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginLeft: 8, color: '#1677ff', fontWeight: 600 }}
                >
                  Xem văn bản gốc ↗
                </a>
              )}
            </div>
          }
          type="warning"
          showIcon
          style={{
            borderRadius: 12,
            border: '1px solid #ffbb96',
            backgroundColor: '#fff7e6',
            boxShadow: '0 2px 8px rgba(250, 84, 28, 0.08)'
          }}
        />
      )}
      <Card
        style={{
          background: 'linear-gradient(135deg, #0d3b66 0%, #1677ff 100%)',
          borderRadius: 12,
          color: '#fff',
          border: 'none',
        }}
      >
        <Row align="middle">
          <Col xs={24}>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>
              {isSurveyCompleted ? (activeOrg?.legalName || activeOrg?.name || 'Chưa xác định') : 'Chưa xác định'}
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0' }}>
              Mã số thuế:{' '}
              <strong style={{ color: '#fff' }}>
                {isSurveyCompleted ? (activeOrg?.taxCode || 'Chưa xác định') : 'Chưa xác định'}
              </strong>{' '}
              | Ngành nghề:{' '}
              <strong style={{ color: '#fff' }}>
                {isSurveyCompleted ? formatIndustry(activeOrg?.industry) : 'Chưa xác định'}
              </strong>{' '}
              | Quy mô:{' '}
              <strong style={{ color: '#fff' }}>
                {isSurveyCompleted
                  ? formatScale(activeOrg?.scale || (activeOrg as any)?.employeeScale, activeOrg?.employeeCount)
                  : 'Chưa xác định'}
              </strong>
            </Paragraph>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Card 1: Điểm Tuân Thủ Toàn Diện */}
        <Col xs={24} sm={12} lg={8}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              border: stats.complianceScore > 70 ? '1px solid #bbf7d0' : '1px solid #fde68a',
              borderLeft: stats.complianceScore > 70 ? '5px solid #16a34a' : '5px solid #d97706',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              padding: '16px 20px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                ĐIỂM TUÂN THỦ TOÀN DIỆN
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: stats.complianceScore > 70 ? '#16a34a' : '#d97706',
                  lineHeight: 1.2,
                  marginTop: 4,
                }}
              >
                {stats.complianceScore} <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>/ 100</span>
              </div>
            </div>
            <Progress
              percent={stats.complianceScore}
              strokeColor={stats.complianceScore > 70 ? '#16a34a' : '#d97706'}
              showInfo={false}
              size="small"
              style={{ margin: '8px 0 0 0' }}
            />
          </div>
        </Col>

        {/* Card 2: Tổng Nghĩa Vụ Đang Quản Lý */}
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
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                TỔNG NGHĨA VỤ ĐANG QUẢN LÝ
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.2,
                  marginTop: 4,
                }}
              >
                {stats.totalTasks}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
              Đã hoàn tất: <Text strong style={{ color: '#16a34a' }}>{stats.completedTasks}</Text> việc
            </div>
          </div>
        </Col>

        {/* Card 3: Nghĩa Vụ Ưu Tiên Cao */}
        <Col xs={24} sm={12} lg={8}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              border: stats.urgentTasksCount > 0 ? '1px solid #fed7aa' : '1px solid #bbf7d0',
              borderLeft: stats.urgentTasksCount > 0 ? '5px solid #ea580c' : '5px solid #16a34a',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              padding: '16px 20px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                NGHĨA VỤ ƯU TIÊN CAO
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: stats.urgentTasksCount > 0 ? '#ea580c' : '#16a34a',
                  lineHeight: 1.2,
                  marginTop: 4,
                }}
              >
                {stats.urgentTasksCount}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
              {stats.urgentTasksCount > 0 ? (
                <Text type="danger" strong>Cần theo dõi sát sao</Text>
              ) : (
                <Text type="success">Trạng thái an toàn</Text>
              )}
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="Nghĩa Vụ Cần Xử Lý Ngay"
            extra={
              <Button type="link" onClick={() => navigate('/tasks')} icon={<ArrowRightOutlined />}>
                Xem tất cả ({isSurveyCompleted ? tasks.length : 0})
              </Button>
            }
            style={{ borderRadius: 10 }}
          >
            {urgentTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <CheckCircleOutlined style={{ fontSize: 36, color: '#52c41a' }} />
                <Paragraph style={{ marginTop: 12 }}>Tất cả các nghĩa vụ tuân thủ đều đang ở trạng thái an toàn!</Paragraph>
              </div>
            ) : (
              <Table
                dataSource={urgentTasks}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
                columns={[
                  {
                    title: 'Tên nghĩa vụ',
                    dataIndex: 'title',
                    width: 280,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    render: (text: string, record: any) => (
                      <div style={{ maxWidth: 270 }}>
                        <Text strong style={{ cursor: 'pointer', color: '#1677ff', fontSize: 13 }} onClick={() => navigate('/tasks')}>
                          {text}
                        </Text>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>{record.legalCitation || record.category}</div>
                      </div>
                    ),
                  },
                  {
                    title: 'Mức độ',
                    dataIndex: 'priority',
                    width: 100,
                    render: (priority) => <PriorityTag priority={priority} />,
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    width: 130,
                    render: (status) => <TaskStatusTag status={status} />,
                  },
                  {
                    title: 'Vai trò phụ trách',
                    dataIndex: 'assigneeRole',
                    width: 140,
                    render: (role: string) => (
                      <Tag color="blue" style={{ margin: 0 }}>
                        {ROLE_LABELS[role] || role || 'Chủ doanh nghiệp'}
                      </Tag>
                    ),
                  },
                ]}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Phân Bổ Tình Trạng Tuân Thủ" style={{ borderRadius: 10, height: '100%' }}>
            <div style={{ maxHeight: 220, display: 'flex', justifyContent: 'center' }}>
              <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* MODAL XÁC NHẬN CẬP NHẬT PHÁP LUẬT TỪ API */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThunderboltOutlined style={{ color: '#fa541c', fontSize: 18 }} />
            <span>Xác Nhận Cập Nhật Quy Định Mới</span>
          </div>
        }
        open={microSurveyVisible && Boolean(activeUpdate)}
        onCancel={() => setMicroSurveyVisible(false)}
        footer={[
          <Button key="back" onClick={() => setMicroSurveyVisible(false)}>
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={updatingLawContext}
            onClick={() => handleAcknowledgeUpdate('CONFIRMED')}
            style={{ backgroundColor: '#fa541c', borderColor: '#fa541c' }}
          >
            Lưu Cập Nhật Bối Cảnh Mới
          </Button>,
        ]}
      >
        {activeUpdate && (
          <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '10px 14px', backgroundColor: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>VĂN BẢN / QUY ĐỊNH MỚI CẬP NHẬT:</Text>
              <Text strong style={{ fontSize: 13, color: '#1677ff' }}>
                {activeUpdate.legalReference}
              </Text>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                {activeUpdate.issuedBy} • Hiệu lực: {activeUpdate.effectiveDate}
              </div>
            </div>

            <div>
              <Text strong style={{ fontSize: 13 }}>
                Câu hỏi rà soát nhanh:
              </Text>
              <Paragraph style={{ marginTop: 6, fontSize: 13, color: '#262626' }}>
                "{activeUpdate.question}"
              </Paragraph>
            </div>

            <div>
              <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Chọn tình trạng tuân thủ thực tế của doanh nghiệp:
              </Text>
              <Radio.Group
                value={microSelectedOption}
                onChange={(e) => setMicroSelectedOption(e.target.value)}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {activeUpdate.options.map((opt) => (
                  <Radio key={opt} value={opt}>{opt}</Radio>
                ))}
              </Radio.Group>
            </div>

            <div style={{ fontSize: 11, color: '#8c8c8c', fontStyle: 'italic' }}>
              * Lưu ý: Câu trả lời được lưu vào hồ sơ bối cảnh của doanh nghiệp và giữ nguyên toàn bộ bản ghi lịch sử trước đó theo nguyên tắc Luật không hồi tố.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
