import React from 'react';
import { Card, Tag, Button, Space, Row, Col, Checkbox, Empty } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { TaskItem, CalendarNote } from '../../../types';
import { TaskStatusTag } from '../../../components/common/StatusBadge';
import {
  formatVNCalendarDate,
  getRemainingDaysInfo,
  STATUTORY_PERIOD_METAS,
} from '../../../utils/taxCalendar';
import { isTaskCompleted } from './calendar.constants';

export interface TimelineDateGroup {
  dateStr: string;
  date: Dayjs;
  tasks: TaskItem[];
  notes: CalendarNote[];
}

interface CalendarTimelineViewProps {
  timelineDates: TimelineDateGroup[];
  onSelectDay: (date: Dayjs) => void;
  onSelectTask: (task: TaskItem) => void;
  onToggleNoteComplete: (note: CalendarNote) => void;
  onDeleteNote: (id: string) => void;
}

export const CalendarTimelineView: React.FC<CalendarTimelineViewProps> = ({
  timelineDates,
  onSelectDay,
  onSelectTask,
  onToggleNoteComplete,
  onDeleteNote,
}) => (
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
                  <Tag
                    color={isToday ? 'blue' : isPast ? 'default' : 'cyan'}
                    style={{ fontWeight: 600 }}
                  >
                    {formatVNCalendarDate(dateStr)} ({date.format('dddd')})
                  </Tag>
                  {isToday && <Tag color="gold">Hôm nay</Tag>}
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    {dayTasks.length} nghĩa vụ | {dayNotes.length} ghi chú
                  </span>
                </Space>
                <Button size="small" type="link" onClick={() => onSelectDay(date)}>
                  Xem chi tiết &amp; Thêm ghi chú
                </Button>
              </div>

              <Row gutter={[12, 12]}>
                {dayTasks.map((t) => {
                  const meta = t.periodCycle
                    ? STATUTORY_PERIOD_METAS[
                        t.periodCycle as keyof typeof STATUTORY_PERIOD_METAS
                      ]
                    : null;
                  const remaining = getRemainingDaysInfo(t.dueDate || new Date());
                  const isDone = isTaskCompleted(t.status);
                  return (
                    <Col xs={24} md={12} key={t.id}>
                      <div
                        onClick={() => onSelectTask(t)}
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
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 4,
                            }}
                          >
                            <Tag color={remaining.tagColor}>{remaining.label}</Tag>
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                              {t.code}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: '#1e293b',
                              fontWeight: 600,
                              marginBottom: 2,
                            }}
                          >
                            {t.title}
                          </div>
                          {meta && (
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              {meta.badge} - {meta.legalBasis}
                            </div>
                          )}
                        </div>
                        <Space
                          direction="vertical"
                          align="end"
                          size={6}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <TaskStatusTag status={t.status} />
                          <Button
                            size="small"
                            type="link"
                            onClick={() => onSelectTask(t)}
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
                            onChange={() => onToggleNoteComplete(n)}
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
                        onClick={() => onDeleteNote(n.id)}
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
);
