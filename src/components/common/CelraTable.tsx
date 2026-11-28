export type { CelraTableProps } from '../../interfaces';
import type { CelraTableProps, CustomizableColumnType } from '../../interfaces';
import { Table, ConfigProvider, Button, Tooltip } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useTableColumnSettings } from '../../hooks/useTableColumnSettings';
import { TableColumnCustomizerDrawer } from './TableColumnCustomizerDrawer';

/**
 * CelraTable: Bảng chuẩn giao diện Ant Design của hệ thống CELRA
 * - Header màu xám chuẩn (#f1f5f9) giúp phân tách rõ ràng với dữ liệu hàng.
 * - Mặc định kích thước 'middle', viền lưới bordered=true, thanh cuộn ngang an toàn.
 * - Phân trang tích hợp sẵn chuẩn tiếng Việt (size changer, show total, jump page).
 * - Khi truyền `tableKey`, tự động bật Drawer "Tùy chỉnh giao diện" đồng bộ DB đa thiết bị.
 */
export function CelraTable<T extends object = any>({
  columns = [],
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
  tableKey,
  enableColumnCustomizer = true,
  toolbarExtra,
  components: userComponents,
  ...restProps
}: CelraTableProps<T>) {
  const isCustomizerActive = Boolean(tableKey && enableColumnCustomizer);

  const {
    visibleColumns,
    resolvedColumns,
    tableComponents,
    drawerOpen,
    setDrawerOpen,
    isSaving,
    saveSettings,
    resetSettings,
  } = useTableColumnSettings<T>({
    tableKey,
    columns: columns as CustomizableColumnType<T>[],
    disabled: !isCustomizerActive,
  });

  const mergedComponents = isCustomizerActive
    ? {
        ...userComponents,
        header: {
          ...tableComponents.header,
          ...userComponents?.header,
        },
      }
    : userComponents;

  const mergedPagination =
    pagination === false
      ? false
      : {
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total: number, range: [number, number]) =>
            `${range[0]}-${range[1]} trên tổng số ${total} mục`,
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
      <div className="space-y-2">
        {(isCustomizerActive || toolbarExtra) && (
          <div className="flex items-center justify-end gap-2">
            {toolbarExtra}
            {isCustomizerActive && (
              <Tooltip title="Tùy chỉnh cột hiển thị, thứ tự và độ rộng bảng">
                <Button
                  size="small"
                  icon={<SettingOutlined />}
                  onClick={() => setDrawerOpen(true)}
                  className="rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 border-slate-200"
                >
                  Tùy chỉnh giao diện
                </Button>
              </Tooltip>
            )}
          </div>
        )}

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
            columns={visibleColumns}
            dataSource={dataSource}
            rowKey={rowKey}
            loading={loading}
            pagination={mergedPagination}
            scroll={{ x: 'max-content', ...scroll }}
            components={mergedComponents}
            style={style}
            className={`celra-standard-table ${className || ''}`}
            {...restProps}
          />
        </div>

        {isCustomizerActive && (
          <TableColumnCustomizerDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            columns={resolvedColumns}
            loading={isSaving}
            onSave={saveSettings}
            onReset={resetSettings}
          />
        )}
      </div>
    </ConfigProvider>
  );
}

export default CelraTable;
