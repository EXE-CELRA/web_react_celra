import React from 'react';
import { Tag } from 'antd';
import type { TaskStatus, TaskPriority, RiskSeverity, VerificationStatus } from '../../types';

export const TaskStatusTag: React.FC<{ status: TaskStatus | string }> = ({ status }) => {
  const s = String(status || '').toLowerCase();
  if (s === 'completed' || s === 'done' || s === 'verified') {
    return (
      <Tag color="success" style={{ fontWeight: 500 }}>
        Hoàn thành
      </Tag>
    );
  }
  if (s === 'in_progress' || s === 'waiting_document' || s === 'waiting_verification' || s === 'need_expert') {
    return (
      <Tag color="blue" style={{ fontWeight: 500 }}>
        Đang thực hiện
      </Tag>
    );
  }
  return (
    <Tag color="default" style={{ color: '#475569', backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', fontWeight: 500 }}>
      Mới
    </Tag>
  );
};

export const PriorityTag: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const map: Record<string, { color: string; text: string }> = {
    LOW: { color: 'blue', text: 'Thấp' },
    MEDIUM: { color: 'gold', text: 'Trung bình' },
    HIGH: { color: 'orange', text: 'Cao' },
    CRITICAL: { color: 'red', text: 'Khẩn cấp' },
    // Backend lowercase mappings:
    low: { color: 'blue', text: 'Thấp' },
    medium: { color: 'gold', text: 'Trung bình' },
    high: { color: 'orange', text: 'Cao' },
    urgent: { color: 'red', text: 'Khẩn cấp' },
  };

  const item = map[priority] || { color: 'default', text: priority };
  return <Tag color={item.color}>{item.text}</Tag>;
};

export const SeverityTag: React.FC<{ severity: RiskSeverity }> = ({ severity }) => {
  const map: Record<RiskSeverity, { color: string; text: string }> = {
    LOW: { color: 'green', text: 'Rủi ro thấp' },
    MEDIUM: { color: 'gold', text: 'Rủi ro vừa' },
    HIGH: { color: 'orange', text: 'Rủi ro cao' },
    CRITICAL: { color: 'red', text: 'Rất nguy hiểm' },
  };

  const item = map[severity] || { color: 'default', text: severity };
  return <Tag color={item.color}>{item.text}</Tag>;
};

export const VerificationStatusTag: React.FC<{ status: VerificationStatus }> = ({ status }) => {
  const map: Record<VerificationStatus, { color: string; text: string }> = {
    PENDING: { color: 'warning', text: 'Chờ duyệt' },
    VERIFIED: { color: 'success', text: 'Hợp lệ' },
    REJECTED: { color: 'error', text: 'Từ chối' },
    unverified: { color: 'warning', text: 'Chờ duyệt' },
    accepted: { color: 'success', text: 'Hợp lệ' },
    rejected: { color: 'error', text: 'Từ chối' },
  };

  const item = (map as any)[status] || { color: 'default', text: status };
  return <Tag color={item.color}>{item.text}</Tag>;
};
