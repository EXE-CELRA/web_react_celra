/* eslint-disable react-hooks/immutability */
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Progress, Typography, Button, Table, Space, Empty, Tag, message, Alert, Modal, Radio } from 'antd';
import {
  SafetyCertificateOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import apiClient from '../../api/client';
import { useOrgStore } from '../../store/useOrgStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useWalletStore } from '../../store/useWalletStore';
import { TaskStatusTag, PriorityTag } from '../../components/common/StatusBadge';
import { VietQRModal } from '../../components/common/VietQRModal';

ChartJS.register(ArcElement, Tooltip, Legend);

const { Title, Text, Paragraph } = Typography;

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrg, organizations } = useOrgStore();
  const { tasks, fetchTasks } = useTaskStore();
  const { fetchWallet } = useWalletStore();

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
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [showLawAlert, setShowLawAlert] = useState<boolean>(() => {
    return localStorage.getItem('celra_pending_law_alert_v2') !== 'dismissed';
  });
  const [microSurveyVisible, setMicroSurveyVisible] = useState(false);
  const [microSelectedOption, setMicroSelectedOption] = useState<string>('Đã hoàn thành / Tuân thủ đầy đủ');
  const [updatingLawContext, setUpdatingLawContext] = useState(false);
  // Kiểm tra cờ trạng thái hoàn thành bài khảo sát bối cảnh
  const isSurveyCompleted = localStorage.getItem('celra_survey_completed') === 'true';


  const handleOpenMicroSurvey = () => {
    setMicroSurveyVisible(true);
  };

  const handleConfirmMicroSurvey = async () => {
    setUpdatingLawContext(true);
    try {
      localStorage.setItem('celra_pending_law_alert_v2', 'dismissed');
      localStorage.setItem('celra_law_rule_tndn_version', '2.0');
      message.success('✅ Đã cập nhật thành công bối cảnh tuân thủ lên phiên bản Luật mới (Nghị định 252/2026/NĐ-CP)! Dữ liệu lịch sử cũ vẫn được bảo toàn.');
      setShowLawAlert(false);
      setMicroSurveyVisible(false);
      await loadDashboardData();
    } catch {
      message.error('Lỗi khi cập nhật bối cảnh');
    } finally {
      setUpdatingLawContext(false);
    }
  };

  useEffect(() => {
    if (activeOrg) {
      loadDashboardData();
    }
  }, [activeOrg]);

  const [triggering, setTriggering] = useState(false);

  const loadDashboardData = async () => {
    try {
      const isSurveyDone = localStorage.getItem('celra_survey_completed') === 'true';

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
      await fetchWallet();

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

      const completed = currentTasks.filter((t) => {
        const s = String(t.trangThai || t.status || '').toUpperCase();
        return s === 'COMPLETED' || s === 'VERIFIED';
      }).length;
      const inProgress = currentTasks.filter((t) => {
        const s = String(t.trangThai || t.status || '').toUpperCase();
        return s === 'IN_PROGRESS' || s === 'TODO' || s === 'WAITING_VERIFICATION' || s === 'NEED_INFO';
      }).length;
      const overdue = currentTasks.filter((t) => {
        const s = String(t.trangThai || t.status || '').toUpperCase();
        return s === 'OVERDUE';
      }).length;
      const urgent = currentTasks.filter((t) => {
        const p = String(t.doUuTien || t.priority || '').toLowerCase();
        return p === 'high' || p === 'urgent' || p === 'critical';
      }).length;

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

  const handleTriggerRules = async () => {
    setTriggering(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await apiClient.post('/rules/trigger-evaluation');
      message.success(res?.message || 'Đã kích hoạt quét quy tắc tuân thủ và sinh nhiệm vụ thành công!');
      await loadDashboardData();
      navigate('/tasks');
    } catch (err: unknown) {
      console.warn('Trigger rules evaluation fallback:', err);
      navigate('/tasks');
    } finally {
      setTriggering(false);
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
  const formatScale = (scale?: string) => {
    if (!scale) return 'Chưa xác định';
    if (scale === 'MICRO') return 'Siêu nhỏ (< 10 nhân sự)';
    if (scale === 'SMALL') return 'Nhỏ (10 - 50 nhân sự)';
    if (scale === 'MEDIUM') return 'Vừa (50 - 200 nhân sự)';
    if (scale === 'LARGE') return 'Lớn (> 200 nhân sự)';
    return scale;
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
    ? tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').slice(0, 5)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 🔔 BANNER THÔNG BÁO LUẬT MỚI VỪA BAN HÀNH (MICRO-SURVEY 30 GIÂY) */}
      {showLawAlert && (
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <Space wrap>
                <Tag color="volcano" style={{ fontWeight: 'bold' }}>QUY ĐỊNH MỚI 2026</Tag>
                <Tag color="blue" style={{ fontWeight: 'bold' }}>MICRO-SURVEY 30 GIÂY</Tag>
                <strong style={{ fontSize: 14 }}>
                  Nghị định 252/2026/NĐ-CP vừa ban hành có điều khoản sửa đổi ảnh hưởng đến doanh nghiệp bạn!
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
                  Xác Nhận Nhanh (30 Giây)
                </Button>
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    localStorage.setItem('celra_pending_law_alert_v2', 'dismissed');
                    setShowLawAlert(false);
                  }}
                  style={{ color: '#8c8c8c' }}
                >
                  Để sau
                </Button>
              </Space>
            </div>
          }
          description={
            <div style={{ marginTop: 6, fontSize: 12, color: '#595959' }}>
              Ban Quản trị CELRA vừa duyệt cập nhật văn bản từ Cổng Dữ Liệu Pháp Luật. Bạn <strong>không cần</strong> làm lại toàn bộ bài khảo sát, chỉ cần 30 giây để cập nhật trạng thái tuân thủ cho điều khoản quy định mới này.
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
                {isSurveyCompleted ? formatScale(activeOrg?.scale || (activeOrg as any)?.employeeScale) : 'Chưa xác định'}
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
                background: stats.complianceScore > 70
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: stats.complianceScore > 70
                  ? '0 4px 12px rgba(22, 163, 74, 0.28)'
                  : '0 4px 12px rgba(217, 119, 6, 0.28)',
                outline: stats.complianceScore > 70
                  ? '3px solid rgba(22, 163, 74, 0.15)'
                  : '3px solid rgba(217, 119, 6, 0.15)',
                flexShrink: 0,
              }}
            >
              <SafetyCertificateOutlined style={{ fontSize: 22, color: '#ffffff' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 11.5,
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
                  fontSize: 22,
                  fontWeight: 800,
                  color: stats.complianceScore > 70 ? '#16a34a' : '#d97706',
                  lineHeight: 1.2,
                  marginTop: 2,
                }}
              >
                {stats.complianceScore} <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>/ 100</span>
              </div>
              <Progress
                percent={stats.complianceScore}
                strokeColor={stats.complianceScore > 70 ? '#16a34a' : '#d97706'}
                showInfo={false}
                size="small"
                style={{ margin: '6px 0 0 0' }}
              />
            </div>
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
              <CheckCircleOutlined style={{ fontSize: 22, color: '#ffffff' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 11.5,
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
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.2,
                  marginTop: 2,
                }}
              >
                {stats.totalTasks}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Đã hoàn tất: <Text strong style={{ color: '#16a34a' }}>{stats.completedTasks}</Text> việc
              </div>
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
                background: stats.urgentTasksCount > 0
                  ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                  : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: stats.urgentTasksCount > 0
                  ? '0 4px 12px rgba(234, 88, 12, 0.28)'
                  : '0 4px 12px rgba(22, 163, 74, 0.28)',
                outline: stats.urgentTasksCount > 0
                  ? '3px solid rgba(234, 88, 12, 0.15)'
                  : '3px solid rgba(22, 163, 74, 0.15)',
                flexShrink: 0,
              }}
            >
              <WarningOutlined style={{ fontSize: 22, color: '#ffffff' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 11.5,
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
                  fontSize: 22,
                  fontWeight: 800,
                  color: stats.urgentTasksCount > 0 ? '#ea580c' : '#16a34a',
                  lineHeight: 1.2,
                  marginTop: 2,
                }}
              >
                {stats.urgentTasksCount}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {stats.urgentTasksCount > 0 ? (
                  <Text type="danger" strong>Cần theo dõi sát sao</Text>
                ) : (
                  <Text type="success">Trạng thái an toàn</Text>
                )}
              </div>
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    render: (text: string, record: any) => (
                      <div>
                        <Text strong style={{ cursor: 'pointer', color: '#1677ff' }} onClick={() => navigate('/tasks')}>
                          {text}
                        </Text>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>{record.legalCitation || record.category}</div>
                      </div>
                    ),
                  },
                  {
                    title: 'Mức độ',
                    dataIndex: 'priority',
                    width: 110,
                    render: (priority) => <PriorityTag priority={priority} />,
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    width: 140,
                    render: (status) => <TaskStatusTag status={status} />,
                  },
                  {
                    title: 'Vai trò phụ trách',
                    dataIndex: 'assigneeRole',
                    width: 130,
                    render: (role) => <Tag color="blue">{role}</Tag>,
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
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Button
                type="primary"
                icon={<RobotOutlined />}
                block
                loading={triggering}
                onClick={handleTriggerRules}
                style={{ background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)', border: 'none' }}
              >
                Tự Động Sinh Thêm Nghĩa Vụ
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* MODAL MICRO-SURVEY 30 GIÂY */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThunderboltOutlined style={{ color: '#fa541c', fontSize: 18 }} />
            <span>Cập Nhật Bối Cảnh Luật Mới (30 Giây)</span>
          </div>
        }
        open={microSurveyVisible}
        onCancel={() => setMicroSurveyVisible(false)}
        footer={[
          <Button key="back" onClick={() => setMicroSurveyVisible(false)}>
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={updatingLawContext}
            onClick={handleConfirmMicroSurvey}
            style={{ backgroundColor: '#fa541c', borderColor: '#fa541c' }}
          >
            Lưu Cập Nhật Bối Cảnh Mới
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '10px 14px', backgroundColor: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>CĂN CỨ PHÁP LUẬT MỚI:</Text>
            <Text strong style={{ fontSize: 13, color: '#1677ff' }}>
              Khoản 1 Điều 8 Nghị định 252/2026/NĐ-CP (Sửa đổi, bổ sung quy định nộp thuế TNDN &amp; Quản lý thuế)
            </Text>
          </div>

          <div>
            <Text strong style={{ fontSize: 13 }}>
              Câu hỏi tình huống mới:
            </Text>
            <Paragraph style={{ marginTop: 6, fontSize: 13, color: '#262626' }}>
              "Doanh nghiệp có thực hiện tạm nộp thuế TNDN 4 quý đạt tỷ lệ luật định và kê khai đầy đủ theo quy định tại Nghị định 252/2026/NĐ-CP không?"
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
              <Radio value="Đã hoàn thành / Tuân thủ đầy đủ">Đã hoàn thành / Tuân thủ đầy đủ</Radio>
              <Radio value="Chưa thực hiện / Chưa có">Chưa thực hiện / Chưa có</Radio>
              <Radio value="Đang chuẩn bị / Có một phần">Đang chuẩn bị / Có một phần</Radio>
              <Radio value="Chưa rõ quy định">Chưa rõ quy định</Radio>
            </Radio.Group>
          </div>

          <div style={{ fontSize: 11, color: '#8c8c8c', fontStyle: 'italic' }}>
            * Lưu ý: Câu trả lời sẽ tự động nâng cấp dữ kiện Context Fact lên phiên bản v2.0 mà vẫn giữ nguyên bản ghi lịch sử ở phiên bản cũ theo nguyên tắc Luật không hồi tố.
          </div>
        </div>
      </Modal>

      <VietQRModal visible={qrModalOpen} onClose={() => setQrModalOpen(false)} onSuccess={loadDashboardData} />
    </div>
  );
};
