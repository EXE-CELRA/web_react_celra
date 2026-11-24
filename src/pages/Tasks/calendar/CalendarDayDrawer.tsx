import React from 'react';
import {
  Card,
  Tag,
  Button,
  Drawer,
  Tabs,
  Space,
  Row,
  Col,
  Input,
  Select,
  Form,
  Modal,
  Popconfirm,
  Checkbox,
  Empty,
  type FormInstance,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { TaskItem, CalendarNote } from '../../../types';
import { TaskStatusTag } from '../../../components/common/StatusBadge';
import { getRemainingDaysInfo, STATUTORY_PERIOD_METAS } from '../../../utils/taxCalendar';
import { NOTE_CATEGORIES, isTaskCompleted } from './calendar.constants';

const { TextArea } = Input;

interface CalendarDayDrawerProps {
  open: boolean;
  selectedDate: Dayjs;
  selectedDateTasks: TaskItem[];
  selectedDateNotes: CalendarNote[];
  quickNoteForm: FormInstance;
  onClose: () => void;
  onOpenNoteModal: (note?: CalendarNote) => void;
  onQuickAddNote: () => void;
  onSelectTask: (task: TaskItem) => void;
  onToggleNoteComplete: (note: CalendarNote) => void;
  onDeleteNote: (id: string) => void;
}

export const CalendarDayDrawer: React.FC<CalendarDayDrawerProps> = ({
  open,
  selectedDate,
  selectedDateTasks,
  selectedDateNotes,
  quickNoteForm,
  onClose,
  onOpenNoteModal,
  onQuickAddNote,
  onSelectTask,
  onToggleNoteComplete,
  onDeleteNote,
}) => (
  <Drawer
    open={open}
    onClose={onClose}
    width={typeof window !== 'undefined' && window.innerWidth < 600 ? '100%' : 560}
    title={
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          paddingRight: 24,
        }}
      >
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
          onClick={() => onOpenNoteModal()}
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
                    const meta = task.periodCycle
                      ? STATUTORY_PERIOD_METAS[
                          task.periodCycle as keyof typeof STATUTORY_PERIOD_METAS
                        ]
                      : null;
                    const remaining = getRemainingDaysInfo(task.dueDate || new Date());
                    const isDone = isTaskCompleted(task.status);

                    return (
                      <Card
                        key={task.id}
                        size="small"
                        hoverable
                        onClick={() => onSelectTask(task)}
                        style={{
                          borderRadius: 8,
                          border: isDone ? '1px solid #b7eb8f' : '1px solid #e2e8f0',
                          backgroundColor: isDone ? '#f6ffed' : '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 6,
                          }}
                        >
                          <Space>
                            <Tag color={remaining.tagColor}>{remaining.label}</Tag>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{task.code}</span>
                          </Space>
                          <TaskStatusTag status={task.status} />
                        </div>

                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: '#1e293b',
                            marginBottom: 4,
                          }}
                        >
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
                          <Button size="small" type="primary" onClick={() => onSelectTask(task)}>
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
              <Card
                size="small"
                style={{
                  borderRadius: 8,
                  marginBottom: 16,
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                }}
                title={
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    📝 Thêm nhanh ghi chú cho ngày này
                  </span>
                }
              >
                <Form form={quickNoteForm} layout="vertical" onFinish={onQuickAddNote}>
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

              {selectedDateNotes.length === 0 ? (
                <Empty description="Chưa có ghi chú nào cho ngày này." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedDateNotes.map((note) => {
                    const cat =
                      NOTE_CATEGORIES.find((c) => c.value === note.category) || NOTE_CATEGORIES[4];
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
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Space size={8} align="start">
                            <Checkbox
                              checked={note.isCompleted}
                              onChange={() => onToggleNoteComplete(note)}
                              style={{ marginTop: 2 }}
                            />
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  marginBottom: 2,
                                }}
                              >
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
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: '#64748b',
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
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
                              onClick={() => onOpenNoteModal(note)}
                            />
                            <Popconfirm
                              title="Xóa ghi chú này?"
                              onConfirm={() => onDeleteNote(note.id)}
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
);

interface CalendarNoteModalProps {
  open: boolean;
  editingNote: CalendarNote | null;
  noteForm: FormInstance;
  onCancel: () => void;
  onSave: () => void;
}

export const CalendarNoteModal: React.FC<CalendarNoteModalProps> = ({
  open,
  editingNote,
  noteForm,
  onCancel,
  onSave,
}) => (
  <Modal
    open={open}
    onCancel={onCancel}
    onOk={onSave}
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
        <TextArea
          rows={4}
          placeholder="Nhập chi tiết công việc cần lưu ý, người liên hệ, tài liệu cần chuẩn bị..."
        />
      </Form.Item>
    </Form>
  </Modal>
);
