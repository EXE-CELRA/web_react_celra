import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Card,
  Badge,
  Tag,
  Button,
  Drawer,
  Tabs,
  Typography,
  Space,
  Row,
  Col,
  Input,
  Select,
  Form,
  Modal,
  Popconfirm,
  Checkbox,
  Tooltip,
  Segmented,
  Empty,
  message,
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
  BookOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';
import { useTaskStore } from '../../store/useTaskStore';
import { useOrgStore } from '../../store/useOrgStore';
import type { TaskItem, CalendarNote, TaskStatus } from '../../types';
import { TaskStatusTag } from '../../components/common/StatusBadge';
import { TaskDetailDrawer } from '../../components/common/TaskDetailDrawer';
import {
  formatVNCalendarDate,
  getRemainingDaysInfo,
  STATUTORY_PERIOD_METAS,
} from '../../utils/taxCalendar';

dayjs.locale('vi');

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const NOTE_CATEGORIES = [
  { value: 'tax', label: 'Thuế & Hóa đơn', color: 'blue' },
  { value: 'labor', label: 'Lao động & BHXH', color: 'green' },
  { value: 'legal', label: 'Pháp lý doanh nghiệp', color: 'purple' },
  { value: 'reminder', label: 'Nhắc nhở nội bộ', color: 'orange' },
  { value: 'general', label: 'Ghi chú chung', color: 'default' },
];

function isTaskCompleted(status?: TaskStatus | string): boolean {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return s === 'completed' || s === 'done' || s === 'verified';
}

export const ComplianceCalendarPage: React.FC = () => {
  const { activeOrg } = useOrgStore();
  const {
    tasks,
    fetchTasks,
    calendarNotes,
    fetchCalendarNotes,
    createCalendarNote,
    updateCalendarNote,
    deleteCalendarNote,
  } = useTaskStore();

  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'timeline' | 'notes'>('calendar');
  const [taskForDetail, setTaskForDetail] = useState<TaskItem | null>(null);
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchTasks();
  }, [activeOrg?.id]);

  useEffect(() => {
    const monthStr = currentMonth.format('YYYY-MM');
    fetchCalendarNotes(monthStr);
  }, [activeOrg?.id, currentMonth]);

  // Modal thêm/sửa ghi chú
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null);
  const [noteForm] = Form.useForm();
  const [quickNoteForm] = Form.useForm();

  // Map tasks theo ngày YYYY-MM-DD
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const dateKey = dayjs(task.dueDate).format('YYYY-MM-DD');
      const list = map.get(dateKey) || [];
      list.push(task);
      map.set(dateKey, list);
    });
    return map;
  }, [tasks]);

  // Map notes theo ngày YYYY-MM-DD
  const notesByDate = useMemo(() => {
    const map = new Map<string, CalendarNote[]>();
    calendarNotes.forEach((note) => {
      const dateKey = note.date;
      const list = map.get(dateKey) || [];
      list.push(note);
      map.set(dateKey, list);
    });
    return map;
  }, [calendarNotes]);

  // Danh sách tác vụ và ghi chú của ngày đang chọn trong Drawer
  const selectedDateStr = selectedDate.format('YYYY-MM-DD');
  const selectedDateTasks = useMemo(() => {
    return tasksByDate.get(selectedDateStr) || [];
  }, [tasksByDate, selectedDateStr]);

  const selectedDateNotes = useMemo(() => {
    return notesByDate.get(selectedDateStr) || [];
  }, [notesByDate, selectedDateStr]);

  // Render nội dung từng ô ngày trong Calendar
  const dateCellRender = (value: Dayjs) => {
    const dateKey = value.format('YYYY-MM-DD');
    const dayTasks = tasksByDate.get(dateKey) || [];
    const dayNotes = notesByDate.get(dateKey) || [];

    if (dayTasks.length === 0 && dayNotes.length === 0) return null;

    return (
      <div style={{ marginTop: 2 }}>
        {/* Badges tác vụ */}
        {dayTasks.slice(0, 2).map((task) => {
          const isDone = isTaskCompleted(task.status);
          const diff = dayjs(task.dueDate).diff(dayjs(), 'day');
          const isOverdue = !isDone && diff < 0;
          const isCritical = !isDone && diff <= 3;

          let badgeStatus: 'success' | 'error' | 'warning' | 'processing' = 'processing';
          if (isDone) badgeStatus = 'success';
          else if (isOverdue) badgeStatus = 'error';
          else if (isCritical) badgeStatus = 'warning';

          return (
            <Tooltip key={task.id} title={`${task.code}: ${task.title}`}>
              <div
                style={{
                  fontSize: 11,
                  lineHeight: '16px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  borderRadius: 3,
                  padding: '1px 3px',
                  marginBottom: 2,
                  backgroundColor: isDone ? '#f6ffed' : isOverdue ? '#fff1f0' : '#e6f4ff',
                  border: `1px solid ${isDone ? '#b7eb8f' : isOverdue ? '#ffa39e' : '#91caff'}`,
                }}
              >
                <Badge status={badgeStatus} />
                <span
                  style={{
                    marginLeft: 2,
                    fontWeight: isCritical || isOverdue ? 600 : 400,
                    color: isOverdue ? '#cf1322' : '#1f2937',
                  }}
                >
                  {task.title}
                </span>
              </div>
            </Tooltip>
          );
        })}

        {/* Badge ghi chú */}
        {dayNotes.slice(0, 1).map((note) => (
          <Tooltip key={note.id} title={`Ghi chú: ${note.title}`}>
            <div
              style={{
                fontSize: 11,
                lineHeight: '16px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                borderRadius: 3,
                padding: '1px 3px',
                marginBottom: 2,
                backgroundColor: note.isCompleted ? '#f9fafb' : '#f9f0ff',
                border: `1px solid ${note.isCompleted ? '#d9d9d9' : '#d3adf7'}`,
                color: note.isCompleted ? '#8c8c8c' : '#531dab',
                textDecoration: note.isCompleted ? 'line-through' : 'none',
              }}
            >
              <BookOutlined style={{ marginRight: 3, fontSize: 10 }} />
              <span>{note.title}</span>
            </div>
          </Tooltip>
        ))}

        {/* Nếu nhiều hơn 3 mục */}
        {dayTasks.length + dayNotes.length > 3 && (
          <div style={{ fontSize: 10, color: '#8c8c8c', textAlign: 'right', fontWeight: 500 }}>
            +{dayTasks.length + dayNotes.length - 3} mục khác
          </div>
        )}
      </div>
    );
  };

  // Mở modal tạo/sửa note
  const handleOpenNoteModal = (note?: CalendarNote) => {
    if (note) {
      setEditingNote(note);
      noteForm.setFieldsValue({
        date: dayjs(note.date),
        title: note.title,
        category: note.category,
        content: note.content,
      });
    } else {
      setEditingNote(null);
      noteForm.setFieldsValue({
        date: selectedDate,
        title: '',
        category: 'tax',
        content: '',
      });
    }
    setNoteModalOpen(true);
  };

  // Lưu note từ modal
  const handleSaveNoteModal = async () => {
    try {
      const values = await noteForm.validateFields();
      const payload = {
        date: values.date.format('YYYY-MM-DD'),
        title: values.title.trim(),
        category: values.category || 'general',
        content: values.content?.trim(),
      };

      if (editingNote) {
        await updateCalendarNote(editingNote.id, payload);
        message.success('Cập nhật ghi chú thành công!');
      } else {
        await createCalendarNote(payload);
        message.success('Đã thêm ghi chú mới vào lịch!');
      }
      setNoteModalOpen(false);
      noteForm.resetFields();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err.message || 'Lỗi khi lưu ghi chú');
    }
  };

  // Thêm nhanh note từ trong Drawer của ngày
  const handleQuickAddNote = async () => {
    try {
      const values = await quickNoteForm.validateFields();
      await createCalendarNote({
        date: selectedDateStr,
        title: values.title.trim(),
        category: values.category || 'general',
        content: values.content?.trim(),
      });
      message.success('Đã thêm ghi chú cho ngày này!');
      quickNoteForm.resetFields();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err.message || 'Lỗi khi thêm ghi chú');
    }
  };

  // Toggle hoàn thành note
  const handleToggleNoteComplete = async (note: CalendarNote) => {
    try {
      await updateCalendarNote(note.id, { isCompleted: !note.isCompleted });
    } catch (err: any) {
      message.error(err.message || 'Lỗi cập nhật trạng thái');
    }
  };

  // Xóa note
  const handleDeleteNote = async (id: string) => {
    try {
      await deleteCalendarNote(id);
      message.success('Đã xóa ghi chú');
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xóa ghi chú');
    }
  };


  // Danh sách dòng thời gian tất cả các ngày có deadline sắp xếp
  const timelineDates = useMemo(() => {
    const dates = Array.from(tasksByDate.keys()).sort();
    return dates.map((dateStr) => ({
      dateStr,
      date: dayjs(dateStr),
      tasks: tasksByDate.get(dateStr) || [],
      notes: notesByDate.get(dateStr) || [],
    }));
  }, [tasksByDate, notesByDate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* HEADER CARD CHUẨN ĐỒNG BỘ VỚI DANH SÁCH TÁC VỤ */}
      <Card
        title={
          <Space size={10} style={{ minWidth: 0, marginRight: 12 }}>
            <CalendarOutlined style={{ color: '#1677ff', fontSize: 18, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              Lịch Tuân Thủ Pháp Luật & Ghi Chú
            </span>
          </Space>
        }
        extra={
          <Space size={10} wrap style={{ marginLeft: 'auto' }}>
            <Segmented
              value={activeTab}
              onChange={(val) => setActiveTab(val as any)}
              options={[
                { label: 'Lịch Tháng', value: 'calendar', icon: <CalendarOutlined /> },
                { label: 'Dòng Thời Gian', value: 'timeline', icon: <UnorderedListOutlined /> },
                { label: 'Sổ Ghi Chú', value: 'notes', icon: <BookOutlined /> },
              ]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenNoteModal()}
              style={{ borderRadius: 8, backgroundColor: '#1677ff' }}
            >
              Tạo Ghi Chú Mới
            </Button>
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <>
          {/* CHẾ ĐỘ 1: LỊCH THÁNG (CALENDAR VIEW) */}
      {activeTab === 'calendar' && (
        <Card
          style={{
            borderRadius: 12,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
          }}
          title={
            <Space>
              <CalendarOutlined style={{ color: '#1677ff' }} />
              <span style={{ fontWeight: 600 }}>Lịch Pháp Lý Tháng {currentMonth.format('MM/YYYY')}</span>
            </Space>
          }
        >
          <Calendar
            value={currentMonth}
            onPanelChange={(newDate) => setCurrentMonth(newDate)}
            onSelect={(date, selectInfo) => {
              setSelectedDate(date);
              if (selectInfo.source === 'date') {
                setDrawerOpen(true);
              }
            }}
            cellRender={(date, info) => {
              if (info.type === 'date') return dateCellRender(date);
              return info.originNode;
            }}
          />
        </Card>
      )}

      {/* CHẾ ĐỘ 2: DÒNG THỜI GIAN (TIMELINE VIEW) */}
      {activeTab === 'timeline' && (
        <Card style={{ borderRadius: 12 }}>
          {timelineDates.length === 0 ? (
            <Empty description="Chưa có dữ liệu hạn chót tuân thủ nào" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {timelineDates.map(({ dateStr, date, tasks: dayTasks, notes: dayNotes }) => {
                const isToday = date.isSame(dayjs(), 'day');
                const isPast = date.isBefore(dayjs(), 'day');
                return (
                  <Card
                    key={dateStr}
                    size="small"
                    style={{
                      borderRadius: 8,
                      border: isToday ? '2px solid #1677ff' : '1px solid #e2e8f0',
                      backgroundColor: isToday ? '#f0f7ff' : '#fff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10,
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: 6,
                      }}
                    >
                      <Space>
                        <Tag color={isToday ? 'blue' : isPast ? 'default' : 'cyan'} style={{ fontWeight: 600 }}>
                          {formatVNCalendarDate(dateStr)} ({date.format('dddd')})
                        </Tag>
                        {isToday && <Tag color="gold">Hôm nay</Tag>}
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {dayTasks.length} nghĩa vụ | {dayNotes.length} ghi chú
                        </span>
                      </Space>
                      <Button
                        size="small"
                        type="link"
                        onClick={() => {
                          setSelectedDate(date);
                          setDrawerOpen(true);
                        }}
                      >
                        Xem chi tiết & Thêm ghi chú
                      </Button>
                    </div>

                    <Row gutter={[12, 12]}>
                      {dayTasks.map((t) => {
                        const meta = t.periodCycle ? STATUTORY_PERIOD_METAS[t.periodCycle as keyof typeof STATUTORY_PERIOD_METAS] : null;
                        const remaining = getRemainingDaysInfo(t.dueDate || new Date());
                        const isDone = isTaskCompleted(t.status);
                        return (
                          <Col xs={24} md={12} key={t.id}>
                            <div
                              onClick={() => setTaskForDetail(t)}
                              style={{
                                padding: '10px 14px',
                                borderRadius: 8,
                                background: isDone ? '#f6ffed' : '#ffffff',
                                border: isDone ? '1px solid #b7eb8f' : '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              }}
                            >
                              <div style={{ overflow: 'hidden', paddingRight: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                  <Tag color={remaining.tagColor}>{remaining.label}</Tag>
                                  <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                                    {t.code}
                                  </span>
                                </div>
                                <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 600, marginBottom: 2 }}>
                                  {t.title}
                                </div>
                                {meta && (
                                  <div style={{ fontSize: 11, color: '#64748b' }}>
                                    {meta.badge} - {meta.legalBasis}
                                  </div>
                                )}
                              </div>
                              <Space direction="vertical" align="end" size={6} onClick={(e) => e.stopPropagation()}>
                                <TaskStatusTag status={t.status} />
                                <Button
                                  size="small"
                                  type="link"
                                  onClick={() => setTaskForDetail(t)}
                                  style={{ padding: 0, fontWeight: 500 }}
                                >
                                  Chi tiết &gt;
                                </Button>
                              </Space>
                            </div>
                          </Col>
                        );
                      })}

                      {dayNotes.map((n) => (
                        <Col xs={24} md={12} key={n.id}>
                          <div
                            style={{
                              padding: '8px 12px',
                              borderRadius: 6,
                              background: '#faf5ff',
                              border: '1px solid #f3e8ff',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <Space size={4}>
                                <Checkbox
                                  checked={n.isCompleted}
                                  onChange={() => handleToggleNoteComplete(n)}
                                />
                                <Tag color="purple">Ghi chú</Tag>
                                <span
                                  style={{
                                    fontWeight: 500,
                                    fontSize: 13,
                                    textDecoration: n.isCompleted ? 'line-through' : 'none',
                                    color: n.isCompleted ? '#94a3b8' : '#1e293b',
                                  }}
                                >
                                  {n.title}
                                </span>
                              </Space>
                              {n.content && (
                                <div style={{ fontSize: 12, color: '#64748b', marginLeft: 20 }}>
                                  {n.content}
                                </div>
                              )}
                            </div>
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteNote(n.id)}
                            />
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* CHẾ ĐỘ 3: SỔ GHI CHÚ (NOTES BOARD VIEW) */}
      {activeTab === 'notes' && (
        <Card
          style={{ borderRadius: 12 }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <Space>
                <BookOutlined style={{ color: '#722ed1' }} />
                <span style={{ fontWeight: 600 }}>Tất Cả Ghi Chú Pháp Lý & Nhắc Nhở ({calendarNotes.length})</span>
              </Space>
              <Space>
                <Select
                  value={noteCategoryFilter}
                  onChange={setNoteCategoryFilter}
                  style={{ width: 170 }}
                  size="small"
                  options={[
                    { value: 'ALL', label: 'Tất cả phân loại' },
                    ...NOTE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
                  ]}
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenNoteModal()}
                >
                  Thêm Ghi Chú
                </Button>
              </Space>
            </div>
          }
        >
          {calendarNotes.length === 0 ? (
            <Empty description="Chưa có ghi chú nào. Bấm '+ Ghi Chú Mới' để tạo ghi chú đầu tiên." />
          ) : (
            <Row gutter={[16, 16]}>
              {calendarNotes
                .filter((n) => (noteCategoryFilter === 'ALL' ? true : n.category === noteCategoryFilter))
                .map((note) => {
                  const cat = NOTE_CATEGORIES.find((c) => c.value === note.category) || NOTE_CATEGORIES[4];
                  return (
                    <Col xs={24} sm={12} md={8} key={note.id}>
                      <Card
                        size="small"
                        style={{
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          backgroundColor: note.isCompleted ? '#f8fafc' : '#ffffff',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <Tag color={cat.color}>{cat.label}</Tag>
                            <Tag icon={<CalendarOutlined />} color="cyan">
                              {formatVNCalendarDate(note.date)}
                            </Tag>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <Checkbox
                              checked={note.isCompleted}
                              onChange={() => handleToggleNoteComplete(note)}
                              style={{ marginTop: 2 }}
                            />
                            <div style={{ flex: 1 }}>
                              <Text
                                strong
                                style={{
                                  fontSize: 14,
                                  color: note.isCompleted ? '#94a3b8' : '#0f172a',
                                  textDecoration: note.isCompleted ? 'line-through' : 'none',
                                }}
                              >
                                {note.title}
                              </Text>
                              {note.content && (
                                <Paragraph
                                  style={{
                                    fontSize: 12,
                                    color: '#64748b',
                                    marginTop: 4,
                                    marginBottom: 0,
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {note.content}
                                </Paragraph>
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 8,
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>
                            {note.authorName || 'Nội bộ'}
                          </span>
                          <Space size="small">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleOpenNoteModal(note)}
                            />
                            <Popconfirm
                              title="Xóa ghi chú này?"
                              onConfirm={() => handleDeleteNote(note.id)}
                              okText="Xóa"
                              cancelText="Hủy"
                              okButtonProps={{ danger: true }}
                            >
                              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </Space>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
            </Row>
          )}
        </Card>
      )}

        </>
      </Card>

      {/* DRAWER CHI TIẾT KHI CLICK CHỌN 1 NGÀY TRÊN LỊCH */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={typeof window !== 'undefined' && window.innerWidth < 600 ? '100%' : 560}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 24 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                📅 {selectedDate.format('dddd, [ngày] DD/MM/YYYY')}
              </span>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
                {selectedDateTasks.length} tác vụ đến hạn • {selectedDateNotes.length} ghi chú
              </div>
            </div>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleOpenNoteModal()}
            >
              + Ghi Chú
            </Button>
          </div>
        }
      >
        <Tabs
          defaultActiveKey="tasks"
          items={[
            {
              key: 'tasks',
              label: `Nghĩa Vụ Đến Hạn (${selectedDateTasks.length})`,
              children: (
                <div>
                  {selectedDateTasks.length === 0 ? (
                    <Empty
                      description="Không có nghĩa vụ pháp lý nào đến hạn vào ngày này."
                      style={{ marginTop: 40 }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {selectedDateTasks.map((task) => {
                        const meta = task.periodCycle ? STATUTORY_PERIOD_METAS[task.periodCycle as keyof typeof STATUTORY_PERIOD_METAS] : null;
                        const remaining = getRemainingDaysInfo(task.dueDate || new Date());
                        const isDone = isTaskCompleted(task.status);

                        return (
                          <Card
                            key={task.id}
                            size="small"
                            hoverable
                            onClick={() => setTaskForDetail(task)}
                            style={{
                              borderRadius: 8,
                              border: isDone ? '1px solid #b7eb8f' : '1px solid #e2e8f0',
                              backgroundColor: isDone ? '#f6ffed' : '#ffffff',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <Space>
                                <Tag color={remaining.tagColor}>{remaining.label}</Tag>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>{task.code}</span>
                              </Space>
                              <TaskStatusTag status={task.status} />
                            </div>

                            <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>
                              {task.title}
                            </div>

                            {task.description && (
                              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                                {task.description}
                              </div>
                            )}

                            {meta && (
                              <div
                                style={{
                                  background: '#f8fafc',
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  color: '#475569',
                                  marginBottom: 8,
                                }}
                              >
                                <strong>Căn cứ:</strong> {meta.legalBasis}
                              </div>
                            )}

                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: 6,
                                borderTop: '1px solid #f1f5f9',
                              }}
                            >
                              <span style={{ fontSize: 12, color: '#64748b' }}>
                                Phụ trách: <strong>{task.assigneeName}</strong> ({task.assigneeRole})
                              </span>
                              <Button
                                size="small"
                                type="primary"
                                onClick={() => setTaskForDetail(task)}
                              >
                                Chi tiết tác vụ &gt;
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'notes',
              label: `Ghi Chú Trong Ngày (${selectedDateNotes.length})`,
              children: (
                <div>
                  {/* Form thêm nhanh ghi chú */}
                  <Card
                    size="small"
                    style={{
                      borderRadius: 8,
                      marginBottom: 16,
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                    }}
                    title={<span style={{ fontSize: 13, fontWeight: 600 }}>📝 Thêm nhanh ghi chú cho ngày này</span>}
                  >
                    <Form form={quickNoteForm} layout="vertical" onFinish={handleQuickAddNote}>
                      <Form.Item
                        name="title"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề ghi chú' }]}
                        style={{ marginBottom: 8 }}
                      >
                        <Input placeholder="Ví dụ: Gặp kế toán trưởng chốt số liệu..." />
                      </Form.Item>
                      <Row gutter={8}>
                        <Col span={14}>
                          <Form.Item name="category" initialValue="tax" style={{ marginBottom: 8 }}>
                            <Select
                              options={NOTE_CATEGORIES.map((c) => ({
                                value: c.value,
                                label: c.label,
                              }))}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={10}>
                          <Button type="primary" htmlType="submit" block icon={<PlusOutlined />}>
                            Lưu Ghi Chú
                          </Button>
                        </Col>
                      </Row>
                      <Form.Item name="content" style={{ marginBottom: 0 }}>
                        <TextArea rows={2} placeholder="Nội dung chi tiết (không bắt buộc)..." />
                      </Form.Item>
                    </Form>
                  </Card>

                  {/* Danh sách ghi chú của ngày */}
                  {selectedDateNotes.length === 0 ? (
                    <Empty description="Chưa có ghi chú nào cho ngày này." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedDateNotes.map((note) => {
                        const cat = NOTE_CATEGORIES.find((c) => c.value === note.category) || NOTE_CATEGORIES[4];
                        return (
                          <div
                            key={note.id}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 8,
                              border: '1px solid #e2e8f0',
                              backgroundColor: note.isCompleted ? '#f8fafc' : '#ffffff',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Space size={8} align="start">
                                <Checkbox
                                  checked={note.isCompleted}
                                  onChange={() => handleToggleNoteComplete(note)}
                                  style={{ marginTop: 2 }}
                                />
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                    <Tag color={cat.color}>{cat.label}</Tag>
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        fontSize: 13,
                                        color: note.isCompleted ? '#94a3b8' : '#0f172a',
                                        textDecoration: note.isCompleted ? 'line-through' : 'none',
                                      }}
                                    >
                                      {note.title}
                                    </span>
                                  </div>
                                  {note.content && (
                                    <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'pre-wrap' }}>
                                      {note.content}
                                    </div>
                                  )}
                                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                                    Tạo bởi {note.authorName || 'Nội bộ'}
                                  </div>
                                </div>
                              </Space>
                              <Space size="small">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => handleOpenNoteModal(note)}
                                />
                                <Popconfirm
                                  title="Xóa ghi chú này?"
                                  onConfirm={() => handleDeleteNote(note.id)}
                                  okText="Xóa"
                                  cancelText="Hủy"
                                  okButtonProps={{ danger: true }}
                                >
                                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                              </Space>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Drawer>

      {/* MODAL THÊM / SỬA GHI CHÚ CHÍNH THỨC */}
      <Modal
        open={noteModalOpen}
        onCancel={() => setNoteModalOpen(false)}
        onOk={handleSaveNoteModal}
        title={editingNote ? '✏️ Chỉnh Sửa Ghi Chú' : '📝 Thêm Ghi Chú Mới'}
        okText={editingNote ? 'Cập Nhật' : 'Tạo Ghi Chú'}
        cancelText="Hủy"
      >
        <Form form={noteForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Ngày ghi chú"
                rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
              >
                <Input
                  type="date"
                  value={noteForm.getFieldValue('date')?.format('YYYY-MM-DD')}
                  onChange={(e) => {
                    noteForm.setFieldsValue({ date: dayjs(e.target.value) });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Phân loại">
                <Select
                  options={NOTE_CATEGORIES.map((c) => ({
                    value: c.value,
                    label: c.label,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="title"
            label="Tiêu đề ghi chú"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề ghi chú' }]}
          >
            <Input placeholder="Ví dụ: Rà soát phụ lục hợp đồng, kiểm tra hóa đơn tháng..." />
          </Form.Item>

          <Form.Item name="content" label="Nội dung chi tiết">
            <TextArea rows={4} placeholder="Nhập chi tiết công việc cần lưu ý, người liên hệ, tài liệu cần chuẩn bị..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* DRAWER CHI TIẾT NGHĨA VỤ TUÂN THỦ (CHỦ DOANH NGHIỆP TRỰC TIẾP VẬN HÀNH) */}
      <TaskDetailDrawer
        task={taskForDetail}
        open={!!taskForDetail}
        onClose={() => setTaskForDetail(null)}
        onRefresh={fetchTasks}
      />
    </div>
  );
};

export default ComplianceCalendarPage;
