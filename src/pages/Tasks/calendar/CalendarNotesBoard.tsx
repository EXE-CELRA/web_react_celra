import React from 'react';
import {
  Card,
  Tag,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Select,
  Popconfirm,
  Checkbox,
  Empty,
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
} from '@ant-design/icons';
import type { CalendarNote } from '../../../types';
import { formatVNCalendarDate } from '../../../utils/taxCalendar';
import { NOTE_CATEGORIES } from './calendar.constants';

const { Text, Paragraph } = Typography;

interface CalendarNotesBoardProps {
  calendarNotes: CalendarNote[];
  noteCategoryFilter: string;
  onChangeFilter: (val: string) => void;
  onOpenNoteModal: (note?: CalendarNote) => void;
  onToggleNoteComplete: (note: CalendarNote) => void;
  onDeleteNote: (id: string) => void;
}

export const CalendarNotesBoard: React.FC<CalendarNotesBoardProps> = ({
  calendarNotes,
  noteCategoryFilter,
  onChangeFilter,
  onOpenNoteModal,
  onToggleNoteComplete,
  onDeleteNote,
}) => (
  <Card
    style={{ borderRadius: 12 }}
    title={
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Space>
          <BookOutlined style={{ color: '#722ed1' }} />
          <span style={{ fontWeight: 600 }}>
            Tất Cả Ghi Chú Pháp Lý &amp; Nhắc Nhở ({calendarNotes.length})
          </span>
        </Space>
        <Space>
          <Select
            value={noteCategoryFilter}
            onChange={onChangeFilter}
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
            onClick={() => onOpenNoteModal()}
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
            const cat =
              NOTE_CATEGORIES.find((c) => c.value === note.category) || NOTE_CATEGORIES[4];
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
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 8,
                      }}
                    >
                      <Tag color={cat.color}>{cat.label}</Tag>
                      <Tag icon={<CalendarOutlined />} color="cyan">
                        {formatVNCalendarDate(note.date)}
                      </Tag>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Checkbox
                        checked={note.isCompleted}
                        onChange={() => onToggleNoteComplete(note)}
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
                </Card>
              </Col>
            );
          })}
      </Row>
    )}
  </Card>
);
