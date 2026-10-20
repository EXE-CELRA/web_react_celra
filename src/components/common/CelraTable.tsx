import { Table, ConfigProvider, type TableProps } from 'antd';

export interface CelraTableProps<T = any> extends TableProps<T> {
  headerBg?: string;
  headerTextColor?: string;
}

/**
 * CelraTable: Bảng chuẩn giao diện Ant Design của hệ thống CELRA
 * - Header màu xám chuẩn (#f1f5f9) giúp phân tách rõ ràng với dữ liệu hàng.
 * - Mặc định kích thước 'middle', viền lưới bordered=true, thanh cuộn ngang an toàn.
 * - Phân trang tích hợp sẵn chuẩn tiếng Việt (size changer, show total, jump page).
 * - Tái sử dụng dễ dàng ở tất cả các trang quản trị và người dùng.
 */
export function CelraTable<T extends object = any>({
  columns,
  dataSource,
  rowKey = 'id',
  loading,
  bordered = true,
  size = 'middle',
  pagination,
  scroll,
  headerBg = '#f1f5f9',
  headerTextColor = '#0f172a',
  style,
  className,
  ...restProps
}: CelraTableProps<T>) {
  const mergedPagination =
    pagination === false
      ? false
      : {
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          position: ['bottomCenter' as const],
          ...pagination,
        };

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerBg: headerBg,
            headerColor: headerTextColor,
            headerSplitColor: '#cbd5e1',
            borderColor: '#e2e8f0',
            rowHoverBg: '#f8fafc',
          },
        },
      }}
    >
      <div className="celra-table-wrapper" style={{ overflow: 'hidden', borderRadius: 8 }}>
        <style>{`
          .celra-table-wrapper .ant-table-thead > tr > th {
            background-color: ${headerBg} !important;
            color: ${headerTextColor} !important;
            font-weight: 600 !important;
            border-bottom: 2px solid #cbd5e1 !important;
          }
          .celra-table-wrapper .ant-pagination {
            justify-content: center !important;
            display: flex !important;
            margin-top: 16px !important;
          }
        `}</style>
        <Table<T>
          bordered={bordered}
          size={size}
          columns={columns}
          dataSource={dataSource}
          rowKey={rowKey}
          loading={loading}
          pagination={mergedPagination}
          scroll={{ x: 'max-content', ...scroll }}
          style={style}
          className={`celra-standard-table ${className || ''}`}
          {...restProps}
        />
      </div>
    </ConfigProvider>
  );
}

export default CelraTable;
