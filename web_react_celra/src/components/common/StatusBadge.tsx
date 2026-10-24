import React from 'react';
import { Tag } from 'antd';
import type { TaskStatus, TaskPriority, RiskSeverity, VerificationStatus } from '../../types';

export const TaskStatusTag: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const map: Record<TaskStatus, { color: string; text: string }> = {
    TODO: { color: 'default', text: 'Chờ xử lý' },
    IN_PROGRESS: { color: 'processing', text: 'Đang thực hiện' },
    WAITING_DOCUMENT: { color: 'warning', text: 'Chờ chứng từ' },
    WAITING_VERIFICATION: { color: 'purple', text: 'Chờ thẩm định' },
    VERIFIED: { color: 'cyan', text: 'Đã thẩm định' },
    OVERDUE: { color: 'error', text: 'Quá hạn' },
    COMPLETED: { color: 'success', text: 'Hoàn thành' },
    CANCELLED: { color: 'default', text: 'Đã hủy' },
  };

  const item = map[status] || { color: 'default', text: status };
  return <Tag color={item.color}>{item.text}</Tag>;
};

export const PriorityTag: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const map: Record<TaskPriority, { color: string; text: string }> = {
    LOW: { color: 'blue', text: 'Thấp' },
    MEDIUM: { color: 'gold', text: 'Trung bình' },
    HIGH: { color: 'orange', text: 'Cao' },
    CRITICAL: { color: 'red', text: 'Khẩn cấp' },
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
  };

  const item = map[status] || { color: 'default', text: status };
  return <Tag color={item.color}>{item.text}</Tag>;
};
