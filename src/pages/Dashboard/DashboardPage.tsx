/* eslint-disable react-hooks/immutability */
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Progress, Statistic, Typography, Button, Table, Space, Empty, Tag, message } from 'antd';
import {
  SafetyCertificateOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  WalletOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
  RobotOutlined,
  PlusOutlined,
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
  const { wallet, fetchWallet } = useWalletStore();

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
    complianceScore: 100,
  });
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    if (activeOrg) {
      loadDashboardData();
    }
  }, [activeOrg]);

  const [triggering, setTriggering] = useState(false);

  const loadDashboardData = async () => {
    try {
      await fetchTasks();
      await fetchWallet();

      const currentTasks = useTaskStore.getState().tasks;
      const completed = currentTasks.filter((t) => t.status === 'COMPLETED').length;
      const inProgress = currentTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'TODO').length;
      const overdue = currentTasks.filter((t) => t.status === 'OVERDUE').length;
      const urgent = currentTasks.filter(
        (t) =>
          (t.priority as string)?.toLowerCase() === 'high' ||
          (t.priority as string)?.toLowerCase() === 'urgent' ||
          (t.priority as string)?.toLowerCase() === 'critical',
      ).length;
      const total = currentTasks.length;

      const score = total > 0 ? Math.round((completed / total) * 100) : 100;

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

  const chartData = {
    labels: ['Đã hoàn thành', 'Đang xử lý', 'Quá hạn / Chờ'],
    datasets: [
      {
        data: [
          stats.completedTasks,
          stats.inProgressTasks,
          stats.overdueTasks,
        ],
        backgroundColor: ['#52c41a', '#1677ff', '#ff4d4f'],
        hoverBackgroundColor: ['#73d13d', '#4096ff', '#ff7875'],
      },
    ],
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

  const urgentTasks = tasks
    .filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card
        style={{
          background: 'linear-gradient(135deg, #0d3b66 0%, #1677ff 100%)',
          borderRadius: 12,
          color: '#fff',
          border: 'none',
        }}
      >
        <Row align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>
              {activeOrg?.legalName || 'Hồ Sơ Doanh Nghiệp'}
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0' }}>
              Mã số thuế: <strong style={{ color: '#fff' }}>{activeOrg?.taxCode || '---'}</strong> | Ngành nghề:{' '}
              <strong style={{ color: '#fff' }}>{activeOrg?.industry || 'Chưa cập nhật'}</strong> | Quy mô:{' '}
              <strong style={{ color: '#fff' }}>{activeOrg?.scale || 'MICRO'}</strong>
            </Paragraph>
          </Col>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-explicit-any
          <Col xs={24} md={8} style={{ textAlign: 'right', marginTop: 16 }}>
            <Space wrap>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setQrModalOpen(true)}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Nạp Tiền Vào Ví
              </Button>
              <Button icon={<FileTextOutlined />} onClick={() => navigate('/survey')}>
                Thu Thập Bối Cảnh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10 }}>
            <Statistic
              title="Điểm Tuân Thủ Toàn Diện"
              value={stats.complianceScore}
              suffix="/ 100"
              valueStyle={{ color: stats.complianceScore > 70 ? '#52c41a' : '#fa8c16', fontWeight: 'bold' }}
              prefix={<SafetyCertificateOutlined />}
            />
            <Progress
              percent={stats.complianceScore}
              strokeColor={stats.complianceScore > 70 ? '#52c41a' : '#fa8c16'}
              showInfo={false}
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10 }}>
            <Statistic
              title="Tổng Nghĩa Vụ Đang Quản Lý"
              value={stats.totalTasks}
              valueStyle={{ color: '#1677ff', fontWeight: 'bold' }}
              prefix={<CheckCircleOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Đã hoàn tất: <strong>{stats.completedTasks}</strong> việc
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10 }}>
            <Statistic
              title="Nghĩa Vụ Ưu Tiên Cao"
              value={stats.urgentTasksCount}
              valueStyle={{ color: stats.urgentTasksCount > 0 ? '#fa8c16' : '#52c41a', fontWeight: 'bold' }}
              prefix={<WarningOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Cần theo dõi sát sao
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 10 }}>
            <Statistic
              title="Số Dư Ví Ký Quỹ & Bảo Chứng"
              value={wallet?.balance || 0}
              precision={0}
              valueStyle={{ color: '#389e0d', fontWeight: 'bold' }}
              prefix={<WalletOutlined />}
              formatter={(val) =>
                new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val))
              }
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Khả dụng để thuê thẩm định
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="Nghĩa Vụ Cần Xử Lý Ngay"
            extra={
              <Button type="link" onClick={() => navigate('/tasks')} icon={<ArrowRightOutlined />}>
                Xem tất cả ({tasks.length})
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

      <VietQRModal visible={qrModalOpen} onClose={() => setQrModalOpen(false)} onSuccess={loadDashboardData} />
    </div>
  );
};
