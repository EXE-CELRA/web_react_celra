import type React from 'react';
import type { TableProps } from 'antd';
import type { SelectFilterConfig } from './common.interface';
import type { Organization } from './organization.interface';
import type { TaskItem } from './task.interface';
import type { DynamicSituationQuestion } from './survey.interface';
import type { CitationItem } from './aiAssistant.interface';

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

export interface CelraTableProps<T = any> extends TableProps<T> {
  headerBg?: string;
  headerTextColor?: string;
}

export interface ContextComplianceAuditModalProps {
  isOpen?: boolean;
  visible?: boolean;
  onClose: () => void;
  initialSelectedFactId?: string | null;
  initialSelectedGroup?: string | null;
  onSuccess?: () => void;
}

export interface ElectronicReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: any | null;
}

export interface EvidenceUploadModalProps {
  visible: boolean;
  taskId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export interface MandatoryOnboardingModalProps {
  open: boolean;
  onSuccess: () => void;
}

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

export interface StickyBottomActionBarProps {
  /** Bước hiện tại (nếu là dạng wizard) */
  currentStep?: number;
  /** Tổng số bước */
  totalSteps?: number;
  /** Tiêu đề ngắn gọn về bước hoặc trạng thái */
  title?: string;
  /** Mô tả chi tiết hoặc thông báo phụ */
  subtitle?: string;
  /** Tỉ lệ hoàn thành % (0 - 100) */
  progressPercent?: number;
  /** Nhãn mô tả tiến độ (VD: 'Đã hoàn thành 10/10 câu') */
  progressLabel?: string;

  /** Cấu hình nút hành động chính (Next / Submit / Activate) */
  primaryAction: {
    label: string;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    variant?: 'teal' | 'blue' | 'emerald';
  };

  /** Cấu hình nút hành động phụ (Back / Cancel) */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    icon?: React.ReactNode;
  };

  /** Nút hành động nhanh đặc biệt (VD: Nút Kích hoạt nhanh ngay ở bước giữa) */
  quickAction?: {
    label: string;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
  };

  /** Class CSS tùy biến thêm */
  className?: string;
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

export interface UnsavedChangesModalProps {
  /** Kiểm soát trạng thái hiển thị Modal */
  open: boolean;
  /** Tiêu đề Modal */
  title?: string;
  /** Nội dung thông điệp cảnh báo */
  description?: string;
  /** Chi tiết dữ liệu hoặc cảnh báo bổ sung */
  warningDetail?: string;

  /** Nhãn nút bấm Lưu & Tiếp tục (Primary Action) */
  saveText?: string;
  /** Nhãn nút bấm Rời đi không lưu (Destructive / Discard) */
  discardText?: string;
  /** Nhãn nút Ở lại màn hình hiện tại (Cancel / Stay) */
  cancelText?: string;

  /** Hàm thực thi khi người dùng bấm 'Lưu & Tiếp tục' */
  onSaveAndProceed?: () => Promise<void> | void;
  /** Hàm thực thi khi người dùng bấm 'Rời đi không lưu' */
  onDiscard?: () => void;
  /** Hàm thực thi khi người dùng bấm 'Ở lại' hoặc tắt modal */
  onCancel?: () => void;

  /** Trạng thái đang lưu dữ liệu */
  isSaving?: boolean;
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
