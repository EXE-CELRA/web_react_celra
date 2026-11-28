import type { ColumnType } from 'antd/es/table';

export interface TableColumnConfigItem {
  key: string;
  visible: boolean;
  order: number;
  width?: number;
  fixed?: 'left' | 'right' | false;
}

export interface CustomizableColumnType<T = any> extends ColumnType<T> {
  /** Mã định danh duy nhất cho cột (mặc định fallback sang key hoặc dataIndex) */
  columnKey?: string;
  /** Nhãn hiển thị trong bảng Tùy chỉnh giao diện nếu title của AntD là JSX phức tạp */
  customizerTitle?: string;
  /** Khóa cột: luôn hiển thị, không cho phép ẩn (ví dụ cột Thao tác) */
  locked?: boolean;
  /** Trạng thái hiển thị mặc định nếu chưa có cấu hình lưu (mặc định true) */
  defaultVisible?: boolean;
  /** Đánh dấu cột thuộc nhóm nâng cao (dùng cho nút Hiển thị thêm nếu có nhiều cột) */
  isExtraColumn?: boolean;
}

export interface ResolvedColumnMeta {
  key: string;
  title: string;
  visible: boolean;
  order: number;
  width?: number;
  defaultWidth?: number;
  fixed: 'left' | 'right' | false;
  defaultFixed: 'left' | 'right' | false;
  locked: boolean;
  isExtraColumn: boolean;
}

export interface TablePreferenceResponse {
  tableKey: string;
  organizationScope: string;
  columnsConfig: TableColumnConfigItem[];
  updatedAt?: string | null;
}
