/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Drawer,
  Typography,
  Input,
  Select,
  Row,
  Col,
  List,
  message,
  Tabs,
  Modal,
  Form,
  Radio,
  Empty,
  Badge,
  Tooltip,
} from 'antd';
import {
  CheckSquareOutlined,
  PlusOutlined,
  AuditOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../../store/useTaskStore';
import type { TaskItem, TaskStatus, TaskPriority, StatutoryCycleType, ComplianceNotification } from '../../types';
import { TaskStatusTag, PriorityTag } from '../../components/common/StatusBadge';
import { EvidenceUploadModal } from '../../components/common/EvidenceUploadModal';
import { TaskDetailDrawer } from '../../components/common/TaskDetailDrawer';
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../api/legalApi';
import { formatVNCalendarDate, getRemainingDaysInfo, STATUTORY_PERIOD_METAS } from '../../utils/taxCalendar';

const { Text, Paragraph } = Typography;

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    tasks,
    selectedTask,
    notifications,
    unreadNotificationsCount,
    fetchTasks,
    fetchTaskById,
    createTask,
    fetchComments,
    setSelectedTask,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    isLoading,
  } = useTaskStore();

  
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
    const [createModalOpen, setCreateModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
      const [createForm] = Form.useForm();

  useEffect(() => {
    fetchTasks();
    fetchNotifications();
  }, []);

  // Đếm số lượng task theo từng đợt luật định
  const getPeriodCount = (periodCode: string) => {
    if (periodCode === 'ALL') return tasks.length;
    return tasks.filter((t: TaskItem) => {
      if (t.periodCycle) return t.periodCycle === periodCode;
      if (periodCode === 'MONTHLY') return t.category?.includes('Tháng') || t.title?.toLowerCase().includes('hàng tháng');
      if (periodCode === 'QUARTERLY') return t.category?.includes('Quý') || t.title?.toLowerCase().includes('quý');
      if (periodCode === 'BIANNUAL_6M') return t.category?.includes('6 Tháng') || t.category?.includes('bán niên');
      if (periodCode === 'ANNUAL') return t.category?.includes('Năm') || t.title?.toLowerCase().includes('môn bài') || t.title?.toLowerCase().includes('quyết toán');
      if (periodCode === 'EVENT_3D') return t.category?.includes('03 Ngày') || t.title?.toLowerCase().includes('tạm ngừng');
      if (periodCode === 'EVENT_10D') return t.category?.includes('10 Ngày') && !t.category?.includes('Làm Việc');
      if (periodCode === 'EVENT_10D_BIZ') return t.category?.includes('10 Ngày Làm Việc') || t.title?.toLowerCase().includes('đkkd');
      if (periodCode === 'EVENT_20D') return t.category?.includes('20 Ngày');
      if (periodCode === 'EVENT_30D_CAPITAL') return t.category?.includes('Giảm Vốn');
      if (periodCode === 'EVENT_45D') return t.category?.includes('45 Ngày');
      if (periodCode === 'EVENT_90D') return t.category?.includes('Góp Vốn') || t.title?.toLowerCase().includes('90 ngày');
      return false;
    }).length;
  };

  // Định nghĩa các nhóm trạng thái: Mới, Đang thực hiện, Đã hoàn thành
  const isNewStatus = (status?: string) => {
    const s = String(status || '').toLowerCase();
    return s === 'need_info' || s === 'pending_assignee' || s === 'todo';
  };

  const isInProgressStatus = (status?: string) => {
    const s = String(status || '').toLowerCase();
    return (
      s === 'in_progress' ||
      s === 'waiting_document' ||
      s === 'waiting_verification' ||
      s === 'need_expert'
    );
  };

  const isCompletedStatus = (status?: string) => {
    const s = String(status || '').toLowerCase();
    return s === 'completed' || s === 'done' || s === 'verified';
  };

  const newCount = tasks.filter((t) => isNewStatus(t.status)).length;
  const inProgressCount = tasks.filter((t) => isInProgressStatus(t.status)).length;
  const completedCount = tasks.filter((t) => isCompletedStatus(t.status)).length;

  const displayedTasks = tasks
    .filter((t: TaskItem) => {
      if (statusFilter === 'NEW' && !isNewStatus(t.status)) return false;
      if (statusFilter === 'IN_PROGRESS' && !isInProgressStatus(t.status)) return false;
      if (statusFilter === 'COMPLETED' && !isCompletedStatus(t.status)) return false;

      if (periodFilter !== 'ALL') {
        if (t.periodCycle) {
          if (t.periodCycle !== periodFilter) return false;
        } else {
          if (periodFilter === 'MONTHLY' && !t.category?.includes('Tháng') && !t.title?.toLowerCase().includes('hàng tháng')) return false;
          if (periodFilter === 'QUARTERLY' && !t.category?.includes('Quý') && !t.title?.toLowerCase().includes('quý')) return false;
          if (periodFilter === 'BIANNUAL_6M' && !t.category?.includes('6 Tháng') && !t.category?.includes('bán niên')) return false;
          if (periodFilter === 'ANNUAL' && !t.category?.includes('Năm') && !t.title?.toLowerCase().includes('môn bài')) return false;
          if (periodFilter === 'EVENT_3D' && !t.category?.includes('03 Ngày')) return false;
          if (periodFilter === 'EVENT_10D' && !t.title?.toLowerCase().includes('nhà thầu') && !t.title?.toLowerCase().includes('nội quy')) return false;
          if (periodFilter === 'EVENT_10D_BIZ' && !t.category?.includes('10 Ngày Làm Việc')) return false;
          if (periodFilter === 'EVENT_20D' && !t.category?.includes('20 Ngày')) return false;
          if (periodFilter === 'EVENT_30D_CAPITAL' && !t.category?.includes('Giảm Vốn')) return false;
          if (periodFilter === 'EVENT_45D' && !t.category?.includes('45 Ngày')) return false;
          if (periodFilter === 'EVENT_90D' && !t.category?.includes('Góp Vốn')) return false;
        }
      }
      return true;
    })
    .sort((a: TaskItem, b: TaskItem) => {
      const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return timeA - timeB;
    });

  const handleOpenTask = async (task: TaskItem) => {
    setSelectedTask(task);
    await fetchTaskById(task.id);
    await fetchComments(task.id);
  };

  const handleOpenTaskFromNotification = async (notif: ComplianceNotification) => {
    await markNotificationAsRead(notif.id);
    if (notif.taskId) {
      const found = tasks.find((t) => t.id === notif.taskId);
      if (found) {
        handleOpenTask(found);
      } else {
        await fetchTaskById(notif.taskId);
      }
      setNotificationDrawerOpen(false);
    }
  };

  const handleCreateTask = async (values: any) => {
    try {
      await createTask({
        title: values.title,
        category: values.category,
        priority: values.priority || 'medium',
        dueDate: values.dueDate ? values.dueDate.toISOString() : new Date().toISOString(),
        description: values.description || '',
        assigneeName: 'Chủ doanh nghiệp',
        assigneeRole: 'owner',
        status: 'need_info',
      });
      message.success('Đã tạo nghĩa vụ tuân thủ mới!');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchTasks();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi tạo nghĩa vụ');
    }
  };

  const columns = [
    {
      title: 'Tên nghĩa vụ / Công việc',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: TaskItem) => (
        <div>
          <Text strong style={{ color: '#0958d9', cursor: 'pointer', fontSize: 13 }} onClick={() => handleOpenTask(record)}>
            {text}
          </Text>
          {record.ruleCode && (
            <div style={{ marginTop: 2 }}>
              <Tag color="cyan" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                {record.ruleCode}
              </Tag>
            </div>
          )}
          {(record.legalCitation || record.legalBasis) && (() => {
            const basis = record.legalCitation || record.legalBasis;
            const clean = cleanDLPLUrl(basis);
            const directUrl = (clean.startsWith('http') ? clean : null) || matchCoreLegalDocUrl(basis);
            return (
              <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 3 }}>
                <AuditOutlined /> {clean.length > 70 ? `${clean.substring(0, 70)}...` : clean}
                {directUrl && (
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginLeft: 6, color: '#0958d9', fontWeight: 500 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    [Xem DLPL ↗]
                  </a>
                )}
              </div>
            );
          })()}
        </div>
      ),
    },
    {
      title: 'Phân loại',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (cat: string) => <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{cat}</Tag>,
    },
    {
      title: 'Mức độ',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority: TaskPriority) => <PriorityTag priority={priority} />,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: TaskStatus) => <TaskStatusTag status={status} />,
    },
    {
      title: 'Người phụ trách',
      key: 'assignee',
      width: 135,
      render: () => (
        <Tag color="geekblue" style={{ margin: 0, fontSize: 11, padding: '2px 8px' }}>
          <UserOutlined style={{ marginRight: 4 }} />
          Chủ doanh nghiệp
        </Tag>
      ),
    },
    {
      title: 'Kỳ hạn & Hạn chót pháp lý',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 195,
      render: (date: string, record: TaskItem) => {
        const remaining = getRemainingDaysInfo(date);
        const periodMeta = record.periodCycle ? STATUTORY_PERIOD_METAS[record.periodCycle as StatutoryCycleType] : null;
        return (
          <Space direction="vertical" size={2}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarOutlined style={{ color: '#1677ff', fontSize: 12 }} />
              <Text strong style={{ fontSize: 12.5 }}>{formatVNCalendarDate(date)}</Text>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Tag color={remaining.tagColor} style={{ margin: 0, fontSize: 10.5, fontWeight: 500 }}>
                <ClockCircleOutlined /> {remaining.label}
              </Tag>
              {periodMeta && (
                <Tag color={periodMeta.color} style={{ margin: 0, fontSize: 10 }}>
                  {periodMeta.badge}
                </Tag>
              )}
            </div>
          </Space>
        );
      },
    },
  ];

  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* HEADER CARD */}
      <Card
        title={
          <Space size={10}>
            <CheckSquareOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              Hệ Thống Checklist & Tác Vụ Tuân Thủ Pháp Luật (CELRA Statutory Compliance)
            </span>
          </Space>
        }
        extra={
          <Space size={8}>
            {/* NÚT THÔNG BÁO NHẮC HẠN */}
            <Tooltip title="Thông báo nhắc hạn tuân thủ">
              <Badge count={unreadNotificationsCount} overflowCount={99}>
                <Button
                  icon={<BellOutlined />}
                  onClick={() => setNotificationDrawerOpen(true)}
                  style={{ borderRadius: 8 }}
                >
                  Nhắc Hạn
                </Button>
              </Badge>
            </Tooltip>

            

            
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              Tạo Nghĩa Vụ Mới
            </Button>
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <>
            {/* Bộ lọc trạng thái */}
            <div style={{ marginBottom: 12 }}>
              <Tabs
                activeKey={statusFilter}
                onChange={(key) => setStatusFilter(key)}
                items={[
                  { key: 'ALL', label: `Tất cả trạng thái (${tasks.length})` },
                  { key: 'NEW', label: `Mới (${newCount})` },
                  { key: 'IN_PROGRESS', label: `Đang thực hiện (${inProgressCount})` },
                  { key: 'COMPLETED', label: `Hoàn thành (${completedCount})` },
                ]}
                style={{ marginBottom: 0 }}
              />
            </div>

            {/* THANH LỌC 11 ĐỢT LUẬT ĐỊNH KÈM SỐ ĐẾM (BADGES) */}
            <Card
              size="small"
              style={{
                marginBottom: 16,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarOutlined style={{ color: '#0ea5e9', fontSize: 13 }} />
                  <Text strong style={{ fontSize: 12, color: '#0f172a' }}>
                    11 Đợt Luật Định:
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Sắp xếp: <strong>Hạn gần nhất lên đầu</strong>
                </Text>
              </div>

              <div style={{ overflowX: 'auto', paddingBottom: 2 }}>
                <Radio.Group
                  size="small"
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  buttonStyle="solid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: 6,
                    minWidth: 920,
                    width: '100%',
                  }}
                >
                  <Radio.Button value="ALL" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Tất cả ({getPeriodCount('ALL')})
                  </Radio.Button>
                  <Radio.Button value="MONTHLY" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    1. Hàng tháng (Hạn ngày 20) ({getPeriodCount('MONTHLY')})
                  </Radio.Button>
                  <Radio.Button value="QUARTERLY" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    2. Hàng quý (30/04, 31/07...) ({getPeriodCount('QUARTERLY')})
                  </Radio.Button>
                  <Radio.Button value="BIANNUAL_6M" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    3. 6 Tháng / Bán niên ({getPeriodCount('BIANNUAL_6M')})
                  </Radio.Button>
                  <Radio.Button value="ANNUAL" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    4. Cả năm (Môn bài, BCTC) ({getPeriodCount('ANNUAL')})
                  </Radio.Button>
                  <Radio.Button value="EVENT_10D" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    5. Từng lần 10 ngày ({getPeriodCount('EVENT_10D')})
                  </Radio.Button>

                  <Radio.Button value="EVENT_20D" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    6. Đợt 20 ngày ({getPeriodCount('EVENT_20D')})
                  </Radio.Button>
                  <Radio.Button value="EVENT_45D" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    7. Đợt 45 ngày ({getPeriodCount('EVENT_45D')})
                  </Radio.Button>
                  <Radio.Button value="EVENT_3D" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    8. 03 Ngày làm việc ({getPeriodCount('EVENT_3D')})
                  </Radio.Button>
                  <Radio.Button value="EVENT_10D_BIZ" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    9. 10 Ngày làm việc ({getPeriodCount('EVENT_10D_BIZ')})
                  </Radio.Button>
                  <Radio.Button value="EVENT_90D" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    10. Đợt 90 ngày ({getPeriodCount('EVENT_90D')})
                  </Radio.Button>
                  <Radio.Button value="EVENT_30D_CAPITAL" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    11. Đợt 30 ngày ({getPeriodCount('EVENT_30D_CAPITAL')})
                  </Radio.Button>
                </Radio.Group>
              </div>
            </Card>

            {tasks.length === 0 && !isLoading ? (
              <Card
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  backgroundColor: '#fafafa',
                  borderRadius: 12,
                  border: '1px dashed #d9d9d9',
                }}
              >
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Space direction="vertical" size={8} style={{ maxWidth: 600 }}>
                      <Text strong style={{ fontSize: 16 }}>
                        Chưa có nhiệm vụ hoặc checklist tuân thủ nào được tạo
                      </Text>
                      <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: '1.6', margin: 0 }}>
                        Theo quy chuẩn CELRA, tác vụ không tự động tạo bừa bãi. Vui lòng vào trang <strong>Bối cảnh Doanh nghiệp</strong> và bấm <strong>"Rà soát tuân thủ"</strong> để hệ thống đối chiếu luật và đề xuất Checklist chính thức.
                      </Paragraph>
                    </Space>
                  }
                >
                  <Button
                    type="primary"
                    size="large"
                    icon={<ThunderboltOutlined />}
                    style={{ marginTop: 16 }}
                    onClick={() => navigate('/context')}
                  >
                    Đi đến Bối Cảnh để Rà Soát &amp; Tạo Checklist
                  </Button>
                </Empty>
              </Card>
            ) : (
              <Table
                dataSource={displayedTasks}
                columns={columns}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 12 }}
              />
            )}
          </>

      </Card>

      {/* DRAWER THÔNG BÁO NHẮC HẠN */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              <BellOutlined style={{ color: '#0958d9' }} />
              <span>Thông Báo Nhắc Hạn Tuân Thủ</span>
            </Space>
            {unreadNotificationsCount > 0 && (
              <Button size="small" type="link" onClick={markAllNotificationsAsRead}>
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>
        }
        open={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        width={typeof window !== 'undefined' && window.innerWidth < 480 ? '100%' : 420}
      >
        {notifications.length === 0 ? (
          <Empty description="Không có thông báo nhắc hạn nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(notif) => {
              const getMilestoneTag = (m: string) => {
                if (m === 'BEFORE_7D') return <Tag color="blue">Trước 7 ngày</Tag>;
                if (m === 'BEFORE_3D') return <Tag color="orange">Trước 3 ngày</Tag>;
                if (m === 'BEFORE_1D') return <Tag color="volcano">Ngày mai</Tag>;
                if (m === 'DUE_TODAY') return <Tag color="red">Hôm nay</Tag>;
                if (m === 'OVERDUE') return <Tag color="magenta">Quá hạn</Tag>;
                return <Tag>{m}</Tag>;
              };

              return (
                <List.Item
                  onClick={() => handleOpenTaskFromNotification(notif)}
                  style={{
                    cursor: 'pointer',
                    background: notif.isRead ? '#ffffff' : '#f0f7ff',
                    padding: '12px',
                    borderRadius: 8,
                    marginBottom: 8,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <Text strong style={{ fontSize: 13, color: notif.isRead ? '#475569' : '#0958d9' }}>
                          {notif.title}
                        </Text>
                        {getMilestoneTag(notif.milestone)}
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                          {new Date(notif.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Drawer>

      {/* DRAWER CHI TIẾT TÁC VỤ (CHỦ DOANH NGHIỆP TRỰC TIẾP VẬN HÀNH) */}
      <TaskDetailDrawer
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onRefresh={fetchTasks}
      />

      {/* MODAL TẠO TASK MỚI */}
      <Modal
        title="Tạo Mới Nghĩa Vụ / Nhiệm Vụ Tuân Thủ"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        okText="Tạo Nhiệm Vụ"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateTask}>
          <Form.Item
            name="title"
            label="Tiêu đề nghĩa vụ / công việc"
            rules={[{ required: true, message: 'Vui lòng nhập tên công việc' }]}
          >
            <Input placeholder="Ví dụ: Nộp tờ khai thuế GTGT Q1, Khám sức khỏe định kỳ..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Phân loại" initialValue="TAX">
                <Select
                  options={[
                    { label: 'Thuế & Kế toán', value: 'TAX' },
                    { label: 'Lao động & BHXH', value: 'LABOR' },
                    { label: 'PCCC & An toàn', value: 'FIRE_SAFETY' },
                    { label: 'Pháp lý & Giấy phép', value: 'LEGAL' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Mức độ ưu tiên" initialValue="HIGH">
                <Select
                  options={[
                    { label: 'Khẩn cấp', value: 'CRITICAL' },
                    { label: 'Cao', value: 'HIGH' },
                    { label: 'Trung bình', value: 'MEDIUM' },
                    { label: 'Thấp', value: 'LOW' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Hướng dẫn chi tiết">
            <Input.TextArea rows={3} placeholder="Các bước cần thực hiện, chứng từ cần chuẩn bị..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL TẢI BẰNG CHỨNG */}
      <EvidenceUploadModal
        visible={uploadModalOpen}
        taskId={selectedTask?.id}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          if (selectedTask) fetchTaskById(selectedTask.id);
          fetchTasks();
        }}
      />
    </div>
  );
};
