/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  Card,
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
  Avatar,
  message,
    Modal,
  Form,
  Radio,
  Empty,
} from 'antd';
import {
  CheckSquareOutlined,
  PlusOutlined,
  SendOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  AuditOutlined,
  UserOutlined,
  AppstoreOutlined,
  BarsOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../../store/useTaskStore';
import type { TaskItem, TaskStatus, TaskPriority, RoleType } from '../../types';
import { TaskStatusTag, PriorityTag } from '../../components/common/StatusBadge';
import { EvidenceUploadModal } from '../../components/common/EvidenceUploadModal';
import { CelraFilterBar } from '../../components/common/CelraFilterBar';
import { CelraTable } from '../../components/common/CelraTable';
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../api/legalApi';
import { formatVNCalendarDate, getRemainingDaysInfo, STATUTORY_PERIOD_METAS, type StatutoryCycleType } from '../../utils/taxCalendar';

const { Title, Text, Paragraph } = Typography;

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'TODO', label: 'Task mới' },
  { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
];

const PERIOD_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả đợt luật định' },
  { value: 'MONTHLY', label: 'Hàng Tháng (Ngày 20)' },
  { value: 'QUARTERLY', label: 'Hàng Quý (30/04, 31/07, 31/10, 31/01)' },
  { value: 'BIANNUAL_6M', label: '6 Tháng (05/06 & 05/12)' },
  { value: 'ANNUAL', label: 'Cả Năm (Môn bài 30/01 & 31/03)' },
  { value: 'EVENT_10D', label: 'Đợt 10 Ngày (Thuế Ads & NQLĐ)' },
  { value: 'EVENT_20D', label: 'Đợt 20 Ngày (Chuyển kỳ thuế)' },
  { value: 'EVENT_45D', label: 'Đợt 45 Ngày (Quyết toán giải thể)' },
  { value: 'EVENT_3D', label: 'Đợt 03 Ngày (Tạm ngừng / HĐĐT)' },
  { value: 'EVENT_10D_BIZ', label: 'Đợt 10 Ngày (Đổi ĐKKD & Thuế)' },
  { value: 'EVENT_30D_CAPITAL', label: 'Đợt 30 Ngày (ĐK Giảm vốn)' },
  { value: 'EVENT_90D', label: 'Đợt 90 Ngày (Góp đủ vốn ĐL)' },
];

const PRIORITY_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả mức độ ưu tiên' },
  { value: 'URGENT', label: 'Khẩn cấp (Hạn chót)' },
  { value: 'HIGH', label: 'Ưu tiên cao' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'LOW', label: 'Thấp' },
];

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    tasks,
    selectedTask,
    comments,
    fetchTasks,
    fetchTaskById,
    updateTaskStatus,
    createTask,
    fetchComments,
    addComment,
    setSelectedTask,
    isLoading,
  } = useTaskStore();

  const [viewMode, setViewMode] = useState<'TABLE' | 'KANBAN'>('TABLE');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [newCommentText, setNewCommentText] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  useEffect(() => {
    fetchTasks();
  }, []);

  const displayedTasks = tasks
    .filter((t: TaskItem) => {
      // 1. Tìm kiếm theo từ khóa
      if (searchKeyword.trim()) {
        const query = searchKeyword.toLowerCase().trim();
        const matchTitle = t.title?.toLowerCase().includes(query);
        const matchDesc = t.description?.toLowerCase().includes(query);
        const matchCitation = t.legalCitation?.toLowerCase().includes(query);
        const matchCategory = t.category?.toLowerCase().includes(query);
        const matchAssignee = t.assigneeRole?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchCitation && !matchCategory && !matchAssignee) {
          return false;
        }
      }

      // 2. Lọc theo trạng thái công việc (4 loại: Tất cả, Task mới, Đang thực hiện, Hoàn thành)
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'TODO') {
          if (t.status !== 'TODO') return false;
        } else if (statusFilter === 'IN_PROGRESS') {
          if (
            t.status !== 'IN_PROGRESS' &&
            t.status !== 'WAITING_DOCUMENT' &&
            t.status !== 'WAITING_VERIFICATION' &&
            t.status !== 'VERIFIED'
          ) {
            return false;
          }
        } else if (statusFilter === 'COMPLETED') {
          if (t.status !== 'COMPLETED') return false;
        }
      }

      // 3. Lọc theo mức độ ưu tiên
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;

      // 2. Lọc theo Đợt Luật Định cụ thể (11 đợt độc lập)
      if (periodFilter !== 'ALL') {
        if (periodFilter === 'MONTHLY') {
          if (t.periodCycle !== 'MONTHLY' && !t.category?.includes('Tháng') && !t.title?.toLowerCase().includes('hàng tháng')) return false;
        } else if (periodFilter === 'QUARTERLY') {
          if (t.periodCycle !== 'QUARTERLY' && !t.category?.includes('Quý') && !t.title?.toLowerCase().includes('quý')) return false;
        } else if (periodFilter === 'BIANNUAL_6M') {
          if (t.periodCycle !== 'BIANNUAL_6M' && !t.category?.includes('6 Tháng') && !t.category?.includes('bán niên') && !t.title?.toLowerCase().includes('6 tháng')) return false;
        } else if (periodFilter === 'ANNUAL') {
          if (t.periodCycle !== 'ANNUAL' && !t.category?.includes('Năm') && !t.title?.toLowerCase().includes('môn bài') && !t.title?.toLowerCase().includes('bctc') && !t.title?.toLowerCase().includes('quyết toán năm')) return false;
        } else if (periodFilter === 'EVENT_3D') {
          if (t.periodCycle !== 'EVENT_3D' && !t.category?.includes('03 Ngày') && !t.title?.toLowerCase().includes('03 ngày') && !t.title?.toLowerCase().includes('tạm ngừng')) return false;
        } else if (periodFilter === 'EVENT_10D') {
          if (t.periodCycle !== 'EVENT_10D' && !t.title?.toLowerCase().includes('nhà thầu') && !t.title?.toLowerCase().includes('nội quy')) return false;
        } else if (periodFilter === 'EVENT_10D_BIZ') {
          if (t.periodCycle !== 'EVENT_10D_BIZ' && !t.category?.includes('10 Ngày Làm Việc') && !t.title?.toLowerCase().includes('đkkd') && !t.title?.toLowerCase().includes('ngân hàng')) return false;
        } else if (periodFilter === 'EVENT_20D') {
          if (t.periodCycle !== 'EVENT_20D' && !t.category?.includes('20 Ngày') && !t.title?.toLowerCase().includes('20 ngày') && !t.title?.toLowerCase().includes('chuyển đổi kỳ')) return false;
        } else if (periodFilter === 'EVENT_30D_CAPITAL') {
          if (t.periodCycle !== 'EVENT_30D_CAPITAL' && !t.category?.includes('Giảm Vốn') && !t.title?.toLowerCase().includes('giảm vốn')) return false;
        } else if (periodFilter === 'EVENT_45D') {
          if (t.periodCycle !== 'EVENT_45D' && !t.category?.includes('45 Ngày') && !t.title?.toLowerCase().includes('45 ngày') && !t.title?.toLowerCase().includes('giải thể')) return false;
        } else if (periodFilter === 'EVENT_90D') {
          if (t.periodCycle !== 'EVENT_90D' && !t.category?.includes('Góp Vốn') && !t.title?.toLowerCase().includes('góp đủ') && !t.title?.toLowerCase().includes('90 ngày')) return false;
        }
      }


      return true;
    })
    // 4. LUÔN SẮP XẾP VIỆC GẤP LÊN TRÊN CÙNG (Sort by Due Date Ascending)
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

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!selectedTask) return;
    try {
      await updateTaskStatus(selectedTask.id, newStatus);
      message.success(`Đã chuyển trạng thái sang: ${newStatus}`);
      await fetchTasks(statusFilter === 'ALL' ? undefined : { status: statusFilter });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      message.error(err.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newCommentText.trim()) return;
    try {
      await addComment(selectedTask.id, newCommentText.trim());
      setNewCommentText('');
      message.success('Đã gửi trao đổi');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      message.error('Lỗi khi gửi phản hồi');
    }
  };

  const handleCreateTask = async (values: any) => {
    try {
      await createTask({
        title: values.title,
        description: values.description,
        category: values.category,
        priority: values.priority as TaskPriority,
        assigneeRole: values.assigneeRole as RoleType,
        waitingOnRole: values.waitingOnRole as RoleType,
        legalCitation: values.legalCitation,
        estimatedCost: values.estimatedCost,
      });
      message.success('Tạo công việc tuân thủ thành công!');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchTasks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi tạo công việc');
    }
  };

  const columns = [
    {
      title: 'Tên nghĩa vụ / Công việc',
      dataIndex: 'title',
      key: 'title',
      minWidth: 240,
      render: (text: string, record: TaskItem) => (
        <div style={{ wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.5 }}>
          <Text
            strong
            style={{
              color: '#1677ff',
              cursor: 'pointer',
              display: 'inline-block',
              wordBreak: 'break-word',
              whiteSpace: 'normal',
              lineHeight: 1.45,
            }}
            onClick={() => handleOpenTask(record)}
          >
            {text}
          </Text>
          {record.legalCitation && (() => {
            const clean = cleanDLPLUrl(record.legalCitation);
            const directUrl = (clean.startsWith('http') ? clean : null) || matchCoreLegalDocUrl(record.legalCitation);
            return (
              <div
                style={{
                  fontSize: 11,
                  color: '#8c8c8c',
                  marginTop: 4,
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                  lineHeight: 1.35,
                }}
              >
                <AuditOutlined /> {clean}
                {directUrl && (
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginLeft: 6, color: '#0958d9', fontWeight: 500, whiteSpace: 'nowrap' }}
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
      width: 110,
      render: (cat: string) => <Tag color="blue" style={{ margin: 0, whiteSpace: 'nowrap' }}>{cat}</Tag>,
    },
    {
      title: 'Mức độ',
      dataIndex: 'priority',
      key: 'priority',
      width: 95,
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
      title: 'Vai trò thực hiện',
      dataIndex: 'assigneeRole',
      key: 'assigneeRole',
      width: 130,
      render: (role: string) => <Tag color="cyan" style={{ margin: 0, whiteSpace: 'nowrap' }}>{role}</Tag>,
    },
    {
      title: 'Đang đợi',
      dataIndex: 'waitingOnRole',
      key: 'waitingOnRole',
      width: 115,
      render: (role: string) => (role ? <Tag color="orange" style={{ margin: 0, whiteSpace: 'nowrap' }}>Đợi: {role}</Tag> : <Text type="secondary">---</Text>),
    },
    {
      title: 'Kỳ hạn & Hạn chót',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 180,
      render: (date: string, record: TaskItem) => {
        const remaining = getRemainingDaysInfo(date);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <CalendarOutlined style={{ color: '#1677ff', fontSize: 12 }} />
              <Text strong style={{ fontSize: 13 }}>{formatVNCalendarDate(date)}</Text>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Tag color={remaining.tagColor} style={{ margin: 0, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
                <ClockCircleOutlined /> {remaining.label}
              </Tag>
              {record.periodCycle && (
                <Tag color="cyan" style={{ margin: 0, fontSize: 10, whiteSpace: 'nowrap' }}>
                  {STATUTORY_PERIOD_METAS[record.periodCycle as StatutoryCycleType]?.badge || record.periodCycle}
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  const kanbanColumns: Array<{
    key: string;
    statuses: TaskStatus[];
    label: string;
    color: string;
    badgeBg: string;
    badgeText: string;
  }> = [
    {
      key: 'TODO',
      statuses: ['TODO'],
      label: 'Task Mới',
      color: '#64748b',
      badgeBg: '#f1f5f9',
      badgeText: '#475569',
    },
    {
      key: 'IN_PROGRESS',
      statuses: ['IN_PROGRESS', 'WAITING_DOCUMENT', 'WAITING_VERIFICATION', 'VERIFIED'],
      label: 'Đang Thực Hiện',
      color: '#0284c7',
      badgeBg: '#e0f2fe',
      badgeText: '#0369a1',
    },
    {
      key: 'COMPLETED',
      statuses: ['COMPLETED'],
      label: 'Hoàn Thành',
      color: '#16a34a',
      badgeBg: '#dcfce7',
      badgeText: '#15803d',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title={
          <Space>
            <CheckSquareOutlined style={{ color: '#1677ff' }} />
            <span>Danh Mục Công Việc & Nghĩa Vụ Tuân Thủ (Task Coordination)</span>
          </Space>
        }
        extra={
          <Space>
            <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
              <Radio.Button value="TABLE">
                <BarsOutlined /> Danh sách
              </Radio.Button>
              <Radio.Button value="KANBAN">
                <AppstoreOutlined /> Kanban Board
              </Radio.Button>
            </Radio.Group>

            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              Tạo Nghĩa Vụ Mới
            </Button>
          </Space>
        }
        style={{ borderRadius: 10 }}
      >
        {/* Bộ lọc chuẩn hóa với CelraFilterBar */}
        <div style={{ marginBottom: 16 }}>
          <CelraFilterBar
            borderedCard={false}
            searchValue={searchKeyword}
            onSearchChange={setSearchKeyword}
            searchPlaceholder="Tìm theo tên công việc, căn cứ pháp lý, phân loại, vai trò..."
            searchWidth={320}
            selectFilters={[
              {
                value: statusFilter,
                onChange: setStatusFilter,
                options: STATUS_FILTER_OPTIONS,
                placeholder: 'Trạng thái',
                width: 170,
              },
              {
                value: periodFilter,
                onChange: setPeriodFilter,
                options: PERIOD_FILTER_OPTIONS,
                placeholder: 'Đợt luật định',
                width: 260,
              },
              {
                value: priorityFilter,
                onChange: setPriorityFilter,
                options: PRIORITY_FILTER_OPTIONS,
                placeholder: 'Mức độ',
                width: 160,
              },
            ]}
            onRefresh={() => {
              setSearchKeyword('');
              setStatusFilter('ALL');
              setPeriodFilter('ALL');
              setPriorityFilter('ALL');
              fetchTasks();
            }}
            refreshText="Đặt Lại"
            extraActions={
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color="blue" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6 }}>
                  Hiển thị: <strong>{displayedTasks.length}</strong> / {tasks.length} nghĩa vụ
                </Tag>
              </div>
            }
          />
        </div>

        {tasks.length === 0 && !isLoading ? (
          <Card
            style={{
              textAlign: 'center',
              padding: '36px 20px',
              backgroundColor: '#fafafa',
              borderRadius: 12,
              border: '1px dashed #d9d9d9',
              margin: '12px 0',
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" size={8} style={{ maxWidth: 640 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    Chưa có nhiệm vụ hoặc checklist tuân thủ nào được tạo
                  </Text>
                  <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: '1.6', margin: 0 }}>
                    Theo nguyên tắc vận hành của CELRA, hệ thống không tự động tạo tác vụ mẫu khi chưa có sự xác nhận của bạn. 
                    Nhiệm vụ kiểm tra chỉ được khởi tạo khi Chủ doanh nghiệp chọn các thẻ dữ kiện tại <strong>Bối cảnh Doanh nghiệp</strong> và thực hiện 
                    tính năng <strong>"Rà soát tuân thủ" (50.000 VNĐ / thẻ)</strong>.
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
                Đi đến Bối Cảnh để Rà Soát & Tạo Checklist
              </Button>
            </Empty>
          </Card>
        ) : viewMode === 'TABLE' ? (
          <CelraTable
            dataSource={displayedTasks}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
          />
        ) : (
          <div
            style={{
              overflowX: 'auto',
              paddingBottom: 16,
              margin: '0 -4px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 16,
                minWidth: '100%',
              }}
            >
              {kanbanColumns.map((col) => {
                const colTasks = displayedTasks.filter((t: TaskItem) => col.statuses.includes(t.status));
                return (
                  <div
                    key={col.key}
                    style={{
                      background: '#f8fafc',
                      borderRadius: 12,
                      padding: 12,
                      minHeight: 520,
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Header Cột */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: 10,
                        marginBottom: 12,
                        borderBottom: `2px solid ${col.color}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: col.color,
                            display: 'inline-block',
                          }}
                        />
                        <Text strong style={{ fontSize: 13.5, color: '#0f172a' }}>
                          {col.label}
                        </Text>
                      </div>
                      <Tag
                        style={{
                          margin: 0,
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: col.badgeBg,
                          borderColor: 'transparent',
                          color: col.color,
                        }}
                      >
                        {colTasks.length}
                      </Tag>
                    </div>

                    {/* Danh sách thẻ nhiệm vụ trong cột */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                      {colTasks.length === 0 ? (
                        <div
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94a3b8',
                            fontSize: 12,
                            fontStyle: 'italic',
                            padding: '32px 0',
                            border: '1px dashed #e2e8f0',
                            borderRadius: 8,
                          }}
                        >
                          Không có công việc
                        </div>
                      ) : (
                        colTasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => handleOpenTask(t)}
                            style={{
                              background: '#ffffff',
                              borderRadius: 10,
                              padding: '12px 14px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                              cursor: 'pointer',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#93c5fd';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(22, 119, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                            }}
                          >
                            {/* Priority, Category & Sub-status Badge */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <PriorityTag priority={t.priority} />
                                {t.status === 'WAITING_DOCUMENT' && (
                                  <Tag color="warning" style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
                                    Chờ chứng từ
                                  </Tag>
                                )}
                                {t.status === 'WAITING_VERIFICATION' && (
                                  <Tag color="purple" style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
                                    Chờ thẩm định
                                  </Tag>
                                )}
                              </div>
                              {t.category && (
                                <Tag color="blue" style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
                                  {t.category}
                                </Tag>
                              )}
                            </div>

                            {/* Title (Text-wrap chuẩn chỉnh không bị tràn) */}
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#0f172a',
                                lineHeight: 1.45,
                                wordBreak: 'break-word',
                                whiteSpace: 'normal',
                              }}
                            >
                              {t.title}
                            </div>

                            {/* Legal Citation nếu có */}
                            {t.legalCitation && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: '#64748b',
                                  lineHeight: 1.35,
                                  wordBreak: 'break-word',
                                  whiteSpace: 'normal',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <AuditOutlined style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {cleanDLPLUrl(t.legalCitation)}
                                </span>
                              </div>
                            )}

                            {/* Phân cách nhẹ */}
                            <div style={{ height: 1, backgroundColor: '#f1f5f9', margin: '2px 0' }} />

                            {/* Bottom: Hạn chót & Vai trò */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 6,
                                flexWrap: 'wrap',
                              }}
                            >
                              {t.dueDate ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <ClockCircleOutlined style={{ fontSize: 11, color: '#64748b' }} />
                                  <span style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>
                                    {formatVNCalendarDate(t.dueDate)}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>Chưa có hạn</span>
                              )}

                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Tag color="cyan" style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
                                  {t.assigneeRole}
                                </Tag>
                                {t.waitingOnRole && (
                                  <Tag color="orange" style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
                                    Đợi: {t.waitingOnRole}
                                  </Tag>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <Drawer
        title={
          <Space>
            <CheckSquareOutlined style={{ color: '#1677ff' }} />
            <span>Chi Tiết Nghĩa Vụ Tuân Thủ</span>
          </Space>
        }
        width={560}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        extra={
          <Space>
            {selectedTask?.status !== 'COMPLETED' && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                style={{ backgroundColor: '#52c41a' }}
                onClick={() => handleStatusChange('COMPLETED')}
              >
                Đánh Dấu Hoàn Thành
              </Button>
            )}
          </Space>
        }
      >
        {selectedTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {selectedTask.title}
              </Title>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <TaskStatusTag status={selectedTask.status} />
                <PriorityTag priority={selectedTask.priority} />
                <Tag color="geekblue">Phân nhóm: {selectedTask.category}</Tag>
              </div>
            </div>

            {selectedTask.description && (
              <Card size="small" title="Mô Tả Hướng Dẫn Thực Hiện" type="inner">
                <Paragraph style={{ margin: 0, whiteSpace: 'pre-line' }}>{selectedTask.description}</Paragraph>
              </Card>
            )}

            {selectedTask.legalCitation && (() => {
              const clean = cleanDLPLUrl(selectedTask.legalCitation);
              const directUrl = (clean.startsWith('http') ? clean : null) || matchCoreLegalDocUrl(selectedTask.legalCitation);
              return (
                <div style={{ background: '#f0f5ff', padding: 12, borderRadius: 6, borderLeft: '4px solid #1677ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ color: '#1677ff' }}>
                      <AuditOutlined /> Căn cứ pháp lý:
                    </Text>
                    {directUrl && (
                      <a
                        href={directUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, color: '#0958d9', fontWeight: 600 }}
                      >
                        Tra cứu toàn văn trên Cổng DLPL ↗
                      </a>
                    )}
                  </div>
                  <div style={{ marginTop: 4 }}>{clean}</div>
                </div>
              );
            })()}

            <Card size="small" title="Điều Phối Đa Bên (Multi-party Roles)" type="inner">
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Vai trò thực hiện chính:</Text>
                  <div>
                    <Tag color="cyan" style={{ marginTop: 4, fontWeight: 'bold' }}>
                      {selectedTask.assigneeRole}
                    </Tag>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Bên đang chờ cung cấp/duyệt:</Text>
                  <div>
                    {selectedTask.waitingOnRole ? (
                      <Tag color="orange" style={{ marginTop: 4, fontWeight: 'bold' }}>
                        {selectedTask.waitingOnRole}
                      </Tag>
                    ) : (
                      <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                        Không bị nghẽn
                      </Text>
                    )}
                  </div>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="Chuyển Tiến Độ Quy Trình" type="inner">
              <Space wrap>
                <Button size="small" onClick={() => handleStatusChange('IN_PROGRESS')}>
                  Bắt đầu làm
                </Button>
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  onClick={() => setUploadModalOpen(true)}
                >
                  Tải lên hồ sơ chứng từ
                </Button>
                <Button
                  size="small"
                  style={{ color: '#722ed1', borderColor: '#722ed1' }}
                  onClick={() => handleStatusChange('WAITING_VERIFICATION')}
                >
                  Gửi thẩm định chuyên gia
                </Button>
                <Button
                  size="small"
                  type="primary"
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  onClick={() => handleStatusChange('COMPLETED')}
                >
                  Phê duyệt hoàn thành
                </Button>
              </Space>
            </Card>

            <Card size="small" title="Nhật Ký Trao Đổi & Phối Hợp" type="inner">
              <List
                dataSource={comments}
                renderItem={(c) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />}
                      title={
                        <Space>
                          <Text strong>{c.user?.fullName || 'Thành viên'}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {new Date(c.createdAt).toLocaleString('vi-VN')}
                          </Text>
                        </Space>
                      }
                      description={<div style={{ color: '#262626' }}>{c.content}</div>}
                    />
                  </List.Item>
                )}
              />

              <div style={{ marginTop: 12 }}>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="Viết phản hồi hoặc lưu ý cho kế toán/chuyên gia..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onPressEnter={handleAddComment}
                  />
                  <Button type="primary" icon={<SendOutlined />} onClick={handleAddComment}>
                    Gửi
                  </Button>
                </Space.Compact>
              </div>
            </Card>
          </div>
        )}
      </Drawer>

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
                    { label: 'Hóa đơn & Hợp đồng', value: 'INVOICING' },
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assigneeRole"
                label="Vai trò thực hiện chính"
                initialValue="INTERNAL_ACCOUNTANT"
              >
                <Select
                  options={[
                    { label: 'Chủ DN (Owner)', value: 'BUSINESS_OWNER' },
                    { label: 'Kế toán (Accountant)', value: 'INTERNAL_ACCOUNTANT' },
                    { label: 'Nhân sự (HR Officer)', value: 'HR_OFFICER' },
                    { label: 'Vận hành (Ops Lead)', value: 'OPS_LEAD' },
                    { label: 'Đại lý thuê ngoài (Agent)', value: 'OUTSOURCED_AGENT' },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="waitingOnRole" label="Bên cần phối hợp (nếu có)">
                <Select
                  allowClear
                  options={[
                    { label: 'Chủ DN (Owner)', value: 'BUSINESS_OWNER' },
                    { label: 'Kế toán (Accountant)', value: 'INTERNAL_ACCOUNTANT' },
                    { label: 'Nhân sự (HR Officer)', value: 'HR_OFFICER' },
                    { label: 'Chuyên gia thẩm định (Verifier)', value: 'VERIFIER_EXPERT' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="legalCitation" label="Căn cứ pháp lý (Thông tư, Nghị định)">
            <Input placeholder="Nghị định 123/2020/NĐ-CP Điều 9" />
          </Form.Item>

          <Form.Item name="description" label="Hướng dẫn chi tiết">
            <Input.TextArea rows={3} placeholder="Các bước cần thực hiện, chứng từ cần chuẩn bị..." />
          </Form.Item>
        </Form>
      </Modal>

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
