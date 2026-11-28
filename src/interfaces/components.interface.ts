import type React from 'react';
import type { TableProps } from 'antd';
import type { SelectFilterConfig } from './common.interface';
import type { Organization } from './organization.interface';
import type { TaskItem } from './task.interface';
import type { DynamicSituationQuestion } from './survey.interface';
import type { CitationItem } from './aiAssistant.interface';
import type { CustomizableColumnType } from './tablePreference.interface';

export interface CelraFilterBarProps {
  // Tìm kiếm theo từ khóa
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: () => void;
  searchPlaceholder?: string;
  searchWidth?: number | string;
  allowClear?: boolean;

  // Bộ lọc Dropdown (1 hoặc nhiều)
  selectFilter?: SelectFilterConfig;
  selectFilters?: SelectFilterConfig[];

  // Nút hành động
  onRefresh?: () => void;
  searchText?: string;
  refreshText?: string;
  extraActions?: React.ReactNode;

  // Khung bọc & CSS
  borderedCard?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export interface AIChatDrawerProps {
  visible: boolean;
  onClose: () => void;
  onOpenAuditModal?: () => void;
}

export interface CelraTableProps<T extends object = Record<string, unknown>> extends TableProps<T> {
  headerBg?: string;
  headerTextColor?: string;
  /** Khóa định danh duy nhất của bảng để bật Tùy chỉnh giao diện & đồng bộ DB đa thiết bị */
  tableKey?: string;
  /** Bật/tắt nút Tùy chỉnh giao diện cột (mặc định true nếu có tableKey) */
  enableColumnCustomizer?: boolean;
  /** Danh sách cột hỗ trợ metadata khóa/cố định (locked, customizerTitle, defaultVisible...) */
  columns?: CustomizableColumnType<T>[];
  /** Nội dung chèn thêm bên cạnh nút Tùy chỉnh giao diện trên thanh công cụ bảng */
  toolbarExtra?: React.ReactNode;
}

export interface ElectronicReceiptTransaction {
  id?: string;
  code?: string;
  amount?: number;
  status?: string;
  type?: string;
  timestamp?: string;
  createdAt?: string;
  taskName?: string;
  requestedBy?: string;
  note?: string;
}

export interface ElectronicReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: ElectronicReceiptTransaction | null;
}

export type { EvidenceUploadModalProps } from './evidence.interface';

export interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export interface SandboxBankingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  packageInfo?: {
    id: string;
    name: string;
    credits: number;
    priceVnd: number;
  } | null;
  customAmount?: number;
}

export interface StructuredMessageProps {
  text: string;
  citations?: CitationItem[];
  organization?: Organization | null;
  onSendMessage?: (text: string) => void;
  onOpenAuditModal?: () => void;
  resolveCitationUrl: (c: CitationItem) => string;
  isEnterpriseQuery?: boolean;
}

export interface TaskDetailDrawerProps {
  task: TaskItem | null;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export interface VietQRModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialPackage?: {
    id: string;
    name: string;
    credits: number;
    priceVnd: number;
  } | null;
}

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  rightButtonText?: string;
  rightButtonLink?: string;
  children: React.ReactNode;
  cardMaxWidth?: number;
}

export interface QuestionCardProps {
  question: DynamicSituationQuestion;
  index: number;
  disabled?: boolean;
  onSelect: (option: string) => void;
}
