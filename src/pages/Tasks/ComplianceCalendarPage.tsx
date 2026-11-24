import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Card,
  Badge,
  Tag,
  Button,
  Space,
  Select,
  Form,
  Tooltip,
  Segmented,
  Radio,
  message,
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  BookOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/vi';
import { getVietnamHoliday } from '../../utils/vietnamHolidays';
import { useTaskStore } from '../../store/useTaskStore';
import { useOrgStore } from '../../store/useOrgStore';
import type { TaskItem, CalendarNote } from '../../types';
import { TaskDetailDrawer } from '../../components/common/TaskDetailDrawer';
import { isTaskCompleted } from './calendar/calendar.constants';
import { CalendarTimelineView } from './calendar/CalendarTimelineView';
import { CalendarNotesBoard } from './calendar/CalendarNotesBoard';
import { CalendarDayDrawer, CalendarNoteModal } from './calendar/CalendarDayDrawer';

dayjs.locale('vi');

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

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null);
  const [noteForm] = Form.useForm();
  const [quickNoteForm] = Form.useForm();

  useEffect(() => {
    fetchTasks();
  }, [activeOrg?.id, fetchTasks]);

  useEffect(() => {
    const monthStr = currentMonth.format('YYYY-MM');
    fetchCalendarNotes(monthStr);
  }, [activeOrg?.id, currentMonth, fetchCalendarNotes]);

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

  const selectedDateStr = selectedDate.format('YYYY-MM-DD');
  const selectedDateTasks = useMemo(
    () => tasksByDate.get(selectedDateStr) || [],
    [tasksByDate, selectedDateStr],
  );
  const selectedDateNotes = useMemo(
    () => notesByDate.get(selectedDateStr) || [],
    [notesByDate, selectedDateStr],
  );

  const timelineDates = useMemo(() => {
    const dates = Array.from(tasksByDate.keys()).sort();
    return dates.map((dateStr) => ({
      dateStr,
      date: dayjs(dateStr),
      tasks: tasksByDate.get(dateStr) || [],
      notes: notesByDate.get(dateStr) || [],
    }));
  }, [tasksByDate, notesByDate]);

  // Render nội dung từng ô ngày trong Calendar
  const dateCellRender = (value: Dayjs) => {
    const dateKey = value.format('YYYY-MM-DD');
    const dayTasks = tasksByDate.get(dateKey) || [];
    const dayNotes = notesByDate.get(dateKey) || [];
    const holiday = getVietnamHoliday(value.toDate());

    const totalItems = dayTasks.length + dayNotes.length;
    if (totalItems === 0 && !holiday) return null;

    // Nếu có ngày lễ thì ưu tiên 2 slot, ngày thường 3 slot
    const maxVisible = holiday ? 2 : 3;

    let taskCount = 0;
    let noteCount = 0;

    if (totalItems <= maxVisible) {
      taskCount = dayTasks.length;
      noteCount = dayNotes.length;
    } else if (dayTasks.length === 0) {
      noteCount = Math.min(dayNotes.length, maxVisible);
    } else if (dayNotes.length === 0) {
      taskCount = Math.min(dayTasks.length, maxVisible);
    } else {
      const maxTasks = Math.min(dayTasks.length, 2);
      noteCount = Math.min(dayNotes.length, Math.max(1, maxVisible - maxTasks));
      taskCount = Math.min(dayTasks.length, maxVisible - noteCount);
    }

    const visibleTasks = dayTasks.slice(0, taskCount);
    const visibleNotes = dayNotes.slice(0, noteCount);
    const hiddenCount = totalItems - (visibleTasks.length + visibleNotes.length);

    return (
      <div style={{ marginTop: 2 }}>
        {holiday && (
          <Tooltip
            title={`${holiday.name} (${holiday.legalBasis}) - Nếu hạn nộp trùng ngày nghỉ thì được chuyển sang ngày làm việc tiếp theo.`}
          >
            <div style={{ marginBottom: 3 }}>
              <Tag
                color="red"
                style={{
                  fontSize: 10,
                  lineHeight: '16px',
                  padding: '0 4px',
                  margin: 0,
                  fontWeight: 700,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  border: '1px solid #ffa39e',
                  backgroundColor: '#fff1f0',
                  color: '#cf1322',
                  borderRadius: 4,
                }}
              >
                ★ {holiday.name}
              </Tag>
            </div>
          </Tooltip>
        )}

        {visibleTasks.map((task) => {
          const isDone = isTaskCompleted(task.status);
          const diff = dayjs(task.dueDate).diff(dayjs(), 'day');
          const isOverdue = !isDone && diff < 0;
          const isCritical = !isDone && diff <= 3;

          let badgeStatus: 'success' | 'error' | 'warning' | 'processing' = 'processing';
          if (isDone) badgeStatus = 'success';
          else if (isOverdue) badgeStatus = 'error';
          else if (isCritical) badgeStatus = 'warning';

          return (
            <Tooltip
              key={task.id}
              title={`${task.code}: ${task.title}${isOverdue ? ' [Quá hạn theo lịch – Chưa xác nhận hoàn thành]' : ''}`}
            >
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

        {visibleNotes.map((note) => (
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

        {hiddenCount > 0 && (
          <div
            style={{
              fontSize: 10,
              color: '#8c8c8c',
              textAlign: 'right',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDate(value);
              setDrawerOpen(true);
            }}
          >
            +{hiddenCount} mục khác
          </div>
        )}
      </div>
    );
  };

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
    } catch (err: unknown) {
      const e = err as { errorFields?: unknown; message?: string };
      if (e?.errorFields) return;
      message.error(e?.message || 'Lỗi khi lưu ghi chú');
    }
  };

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
    } catch (err: unknown) {
      const e = err as { errorFields?: unknown; message?: string };
      if (e?.errorFields) return;
      message.error(e?.message || 'Lỗi khi thêm ghi chú');
    }
  };

  const handleToggleNoteComplete = async (note: CalendarNote) => {
    try {
      await updateCalendarNote(note.id, { isCompleted: !note.isCompleted });
    } catch (err: unknown) {
      const e = err as { message?: string };
      message.error(e?.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteCalendarNote(id);
      message.success('Đã xóa ghi chú');
    } catch (err: unknown) {
      const e = err as { message?: string };
      message.error(e?.message || 'Lỗi khi xóa ghi chú');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title={
          <Space size={10} style={{ minWidth: 0, marginRight: 12 }}>
            <CalendarOutlined style={{ color: '#1677ff', fontSize: 18, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              Lịch Tuân Thủ Pháp Luật &amp; Ghi Chú
            </span>
          </Space>
        }
        extra={
          <Space size={10} wrap style={{ marginLeft: 'auto' }}>
            <Segmented
              value={activeTab}
              onChange={(val) => setActiveTab(val as 'calendar' | 'timeline' | 'notes')}
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
        {/* CHẾ ĐỘ 1: LỊCH THÁNG */}
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
                <span style={{ fontWeight: 600 }}>
                  Lịch Pháp Lý Tháng {currentMonth.format('MM/YYYY')}
                </span>
              </Space>
            }
          >
            <Calendar
              value={currentMonth}
              onPanelChange={(newDate) => setCurrentMonth(newDate)}
              headerRender={({ value, type, onChange, onTypeChange }) => {
                const current = value || currentMonth;
                const year = current.year();
                const month = current.month();

                return (
                  <div
                    style={{
                      padding: '8px 4px 16px 4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      borderBottom: '1px solid #f1f5f9',
                      marginBottom: 12,
                    }}
                  >
                    <Space size={8}>
                      <Button
                        size="middle"
                        icon={<LeftOutlined />}
                        onClick={() => {
                          const prev = current.subtract(1, 'month');
                          setCurrentMonth(prev);
                          onChange(prev);
                        }}
                        className="font-medium rounded-lg"
                      >
                        Tháng trước
                      </Button>
                      <Button
                        size="middle"
                        onClick={() => {
                          const today = dayjs();
                          setCurrentMonth(today);
                          onChange(today);
                        }}
                        style={{
                          fontWeight: 600,
                          color: '#1677ff',
                          borderColor: '#91caff',
                          backgroundColor: '#e6f4ff',
                        }}
                      >
                        Hôm nay
                      </Button>
                      <Button
                        size="middle"
                        onClick={() => {
                          const next = current.add(1, 'month');
                          setCurrentMonth(next);
                          onChange(next);
                        }}
                        className="font-medium rounded-lg"
                      >
                        Tháng sau <RightOutlined />
                      </Button>
                    </Space>

                    <Space size={8}>
                      <Select
                        size="middle"
                        value={year}
                        onChange={(newYear) => {
                          const updated = current.year(newYear);
                          setCurrentMonth(updated);
                          onChange(updated);
                        }}
                        options={Array.from({ length: 15 }, (_, i) => {
                          const y = new Date().getFullYear() - 5 + i;
                          return { label: `Năm ${y}`, value: y };
                        })}
                        style={{ width: 115 }}
                      />
                      <Select
                        size="middle"
                        value={month}
                        onChange={(newMonth) => {
                          const updated = current.month(newMonth);
                          setCurrentMonth(updated);
                          onChange(updated);
                        }}
                        options={Array.from({ length: 12 }, (_, i) => ({
                          label: `Tháng ${i + 1}`,
                          value: i,
                        }))}
                        style={{ width: 105 }}
                      />
                      <Radio.Group
                        size="middle"
                        value={type}
                        onChange={(e) => onTypeChange(e.target.value)}
                      >
                        <Radio.Button value="month">Tháng</Radio.Button>
                        <Radio.Button value="year">Năm</Radio.Button>
                      </Radio.Group>
                    </Space>
                  </div>
                );
              }}
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

        {/* CHẾ ĐỘ 2: DÒNG THỜI GIAN */}
        {activeTab === 'timeline' && (
          <CalendarTimelineView
            timelineDates={timelineDates}
            onSelectDay={(date) => {
              setSelectedDate(date);
              setDrawerOpen(true);
            }}
            onSelectTask={setTaskForDetail}
            onToggleNoteComplete={handleToggleNoteComplete}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {/* CHẾ ĐỘ 3: SỔ GHI CHÚ */}
        {activeTab === 'notes' && (
          <CalendarNotesBoard
            calendarNotes={calendarNotes}
            noteCategoryFilter={noteCategoryFilter}
            onChangeFilter={setNoteCategoryFilter}
            onOpenNoteModal={handleOpenNoteModal}
            onToggleNoteComplete={handleToggleNoteComplete}
            onDeleteNote={handleDeleteNote}
          />
        )}
      </Card>

      {/* DRAWER CHI TIẾT NGÀY */}
      <CalendarDayDrawer
        open={drawerOpen}
        selectedDate={selectedDate}
        selectedDateTasks={selectedDateTasks}
        selectedDateNotes={selectedDateNotes}
        quickNoteForm={quickNoteForm}
        onClose={() => setDrawerOpen(false)}
        onOpenNoteModal={handleOpenNoteModal}
        onQuickAddNote={handleQuickAddNote}
        onSelectTask={setTaskForDetail}
        onToggleNoteComplete={handleToggleNoteComplete}
        onDeleteNote={handleDeleteNote}
      />

      {/* MODAL THÊM / SỬA GHI CHÚ */}
      <CalendarNoteModal
        open={noteModalOpen}
        editingNote={editingNote}
        noteForm={noteForm}
        onCancel={() => setNoteModalOpen(false)}
        onSave={handleSaveNoteModal}
      />

      {/* DRAWER CHI TIẾT NGHĨA VỤ TUÂN THỦ */}
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
