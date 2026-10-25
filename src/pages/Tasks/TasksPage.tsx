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
  DatePicker,
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
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../../store/useTaskStore';
import { useOrgStore } from '../../store/useOrgStore';
import type { TaskItem, TaskStatus, StatutoryCycleType, ComplianceNotification } from '../../types';
import { TaskStatusTag } from '../../components/common/StatusBadge';
import { EvidenceUploadModal } from '../../components/common/EvidenceUploadModal';
import { TaskDetailDrawer } from '../../components/common/TaskDetailDrawer';
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../api/legalApi';
import { formatVNCalendarDate, getRemainingDaysInfo, STATUTORY_PERIOD_METAS } from '../../utils/taxCalendar';

const { Text, Paragraph } = Typography;

const PRIORITY_WEIGHTS: Record<string, number> = {
  low: 1,
  LOW: 1,
  medium: 2,
  MEDIUM: 2,
  high: 3,
  HIGH: 3,
  urgent: 4,
  critical: 4,
  CRITICAL: 4,
};

function getPriorityWeight(p?: string | null): number {
  if (!p) return 2;
  return PRIORITY_WEIGHTS[p.toLowerCase()] || PRIORITY_WEIGHTS[p] || 2;
}

function getPriorityLabel(p?: string | null): string {
  if (!p) return 'Trung bình';
  const val = p.toLowerCase();
  if (val === 'urgent' || val === 'critical') return 'Khẩn cấp';
  if (val === 'high') return 'Cao';
  if (val === 'medium') return 'Trung bình';
  if (val === 'low') return 'Thấp';
  return p;
}

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrg } = useOrgStore();
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
    updateTaskPriority,
    isLoading,
  } = useTaskStore();

  
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
    const [createModalOpen, setCreateModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
      const [createForm] = Form.useForm();

  useEffect(() => {
    if (activeOrg?.id) {
      fetchTasks();
      fetchNotifications();
    }
  }, [activeOrg?.id]);

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
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
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
      const rawPriority = String(values.priority || 'medium').toLowerCase();
      const priority = rawPriority === 'critical' ? 'urgent' : rawPriority;

      await createTask({
        title: values.title,
        category: values.category || 'Thuế & Kế toán',
        priority: priority as any,
        dueDate: values.dueDate ? values.dueDate.toISOString() : new Date().toISOString(),
        description: values.description || '',
        assigneeName: 'Chủ doanh nghiệp',
        assigneeRole: 'owner',
        status: 'need_info',
      });
      message.success('Đã tạo nghĩa vụ tuân thủ mới thành công!');
      setCreateModalOpen(false);
      createForm.resetFields();
      setStatusFilter('ALL');
      setPeriodFilter('ALL');
      fetchTasks();
    } catch (err: any) {
      const errMsg = Array.isArray(err.response?.data?.message)
        ? err.response.data.message.join(', ')
        : (err.response?.data?.message || err.message || 'Lỗi khi tạo nghĩa vụ');
      message.error(errMsg);
    }
  };

  const columns = [
    {
      title: 'Tên nghĩa vụ / Công việc',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: TaskItem) => (
        <div>
          <Text strong style={{ color: '#000000', cursor: 'pointer', fontSize: 13 }} className="hover:text-blue-600 transition-colors" onClick={() => handleOpenTask(record)}>
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
      key: 'priority',
      width: 140,
      render: (_: any, record: TaskItem) => {
        const statutory = (record.statutoryPriority || record.legalRisk || record.priority || 'medium') as string;
        const currentP = (record.customPriority || record.priority || 'medium') as string;
        const isCustom = Boolean(record.customPriority && String(record.customPriority).toLowerCase() !== String(statutory).toLowerCase());
        const isDowngraded = isCustom && getPriorityWeight(currentP) < getPriorityWeight(statutory);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }} onClick={(e) => e.stopPropagation()}>
            <Select
              size="small"
              bordered={false}
              style={{
                width: 112,
                padding: 0,
                fontSize: 12,
                fontWeight: 500,
                background: '#f8fafc',
                borderRadius: 4,
                border: '1px solid #e2e8f0',
              }}
              value={String(currentP).toLowerCase()}
              popupMatchSelectWidth={false}
              onChange={async (newVal) => {
                try {
                  await updateTaskPriority(record.id, newVal);
                  message.success('Đã cập nhật mức ưu tiên vận hành!');
                } catch {
                  message.error('Lỗi khi cập nhật mức ưu tiên');
                }
              }}
              options={[
                { label: '🔴 Khẩn cấp', value: 'urgent' },
                { label: '🟠 Cao', value: 'high' },
                { label: '🟡 Trung bình', value: 'medium' },
                { label: '🔵 Thấp', value: 'low' },
              ]}
            />
            {isCustom && (
              <Tooltip
                title={
                  isDowngraded
                    ? `⚠️ Rủi ro luật định mức [${getPriorityLabel(statutory).toUpperCase()}]. Việc hạ ưu tiên nội bộ không làm giảm mức phạt của cơ quan Thuế/Nhà nước.`
                    : `Ưu tiên vận hành do Chủ DN tùy biến. Mức rủi ro luật định là [${getPriorityLabel(statutory)}].`
                }
              >
                <span
                  style={{
                    fontSize: 10,
                    cursor: 'help',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    color: isDowngraded ? '#cf1322' : '#475569',
                    background: isDowngraded ? '#fff1f0' : '#f1f5f9',
                    border: isDowngraded ? '1px solid #ffa39e' : '1px solid #cbd5e1',
                    padding: '1px 6px',
                    borderRadius: 4,
                    width: 'fit-content',
                  }}
                >
                  {isDowngraded && <WarningOutlined style={{ fontSize: 10, color: '#cf1322' }} />}
                  Luật: {getPriorityLabel(statutory)}
                </span>
              </Tooltip>
            )}
          </div>
        );
      },
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
                  {
                    key: 'NEW',
                    label: (
                      <span>
                        Mới <Tag color="default" style={{ marginLeft: 4, borderRadius: 10, color: '#475569', backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }}>{newCount}</Tag>
                      </span>
                    ),
                  },
                  {
                    key: 'IN_PROGRESS',
                    label: (
                      <span>
                        Đang thực hiện <Tag color="blue" style={{ marginLeft: 4, borderRadius: 10 }}>{inProgressCount}</Tag>
                      </span>
                    ),
                  },
                  {
                    key: 'COMPLETED',
                    label: (
                      <span>
                        Hoàn thành <Tag color="success" style={{ marginLeft: 4, borderRadius: 10 }}>{completedCount}</Tag>
                      </span>
                    ),
                  },
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
                  <Radio.Button value="EVENT_3D" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    03 Ngày làm việc ({getPeriodCount('EVENT_3D')})
                  </Radio.Button>
                  <Radio.Button value="EVENT_10D" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Từng lần 10 ngày ({getPeriodCount('EVENT_10D')})
                  </Radio.Button>
                  <Radio.Button value="EVENT_10D_BIZ" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    10 Ngày làm việc ({getPeriodCount('EVENT_10D_BIZ')})
                  </Radio.Button>
                  <Radio.Button value="EVENT_20D" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Đợt 20 ngày ({getPeriodCount('EVENT_20D')})
                  </Radio.Button>
                  <Radio.Button value="MONTHLY" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Hàng tháng (Hạn ngày 20) ({getPeriodCount('MONTHLY')})
                  </Radio.Button>

                  <Radio.Button value="EVENT_30D_CAPITAL" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Đợt 30 ngày ({getPeriodCount('EVENT_30D_CAPITAL')})
                  </Radio.Button>
                  <Radio.Button value="EVENT_45D" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Đợt 45 ngày ({getPeriodCount('EVENT_45D')})
                  </Radio.Button>
                  <Radio.Button value="QUARTERLY" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Hàng quý (30/04, 31/07...) ({getPeriodCount('QUARTERLY')})
                  </Radio.Button>
                  <Radio.Button value="EVENT_90D" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Đợt 90 ngày ({getPeriodCount('EVENT_90D')})
                  </Radio.Button>
                  <Radio.Button value="BIANNUAL_6M" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    6 Tháng / Bán niên ({getPeriodCount('BIANNUAL_6M')})
                  </Radio.Button>
                  <Radio.Button value="ANNUAL" style={{ borderRadius: 6, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    Cả năm (Môn bài, BCTC) ({getPeriodCount('ANNUAL')})
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
                pagination={{
                  defaultPageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} nghĩa vụ`,
                }}
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
              <Form.Item name="category" label="Phân loại" initialValue="Thuế & Kế toán">
                <Select
                  options={[
                    { label: 'Thuế & Kế toán', value: 'Thuế & Kế toán' },
                    { label: 'Lao động & BHXH', value: 'Lao động & BHXH' },
                    { label: 'PCCC & An toàn', value: 'PCCC & An toàn' },
                    { label: 'Pháp lý & Giấy phép', value: 'Pháp lý & Giấy phép' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Mức độ ưu tiên" initialValue="high">
                <Select
                  options={[
                    { label: '🔴 Khẩn cấp', value: 'urgent' },
                    { label: '🟠 Cao', value: 'high' },
                    { label: '🟡 Trung bình', value: 'medium' },
                    { label: '🔵 Thấp', value: 'low' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="dueDate" label="Hạn chót thực hiện (Tùy chọn)">
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày đến hạn hoàn thành..."
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
