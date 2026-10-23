import type { CelraFilterBarProps } from '../../interfaces';
export type { CelraFilterBarProps };
import React from 'react';
import { Card, Input, Select, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';





/**
 * CelraFilterBar: Thanh tìm kiếm & bộ lọc dùng chung chuẩn Ant Design
 * - Hỗ trợ ô Input tìm kiếm có icon, phím Enter, nút clear.
 * - Hỗ trợ 1 hoặc nhiều Select lọc trạng thái, phân loại.
 * - Tích hợp sẵn nút "Tìm Kiếm" và nút "Làm Mới".
 * - Bọc trong Card bo góc tinh tế hoặc render dạng thanh ngang phẳng.
 */
export const CelraFilterBar: React.FC<CelraFilterBarProps> = ({
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder = 'Tìm kiếm thông tin...',
  searchWidth = 360,
  allowClear = true,
  selectFilter,
  selectFilters,
  onRefresh,
  searchText = 'Tìm Kiếm',
  refreshText = 'Làm Mới',
  extraActions,
  borderedCard = true,
  style,
  className,
}) => {
  const allSelects = selectFilters || (selectFilter ? [selectFilter] : []);

  const content = (
    <div
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
        ...style,
      }}
      className={className}
    >
      {/* Ô tìm kiếm */}
      {onSearchChange && (
        <Input
          placeholder={searchPlaceholder}
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onPressEnter={onSearch}
          allowClear={allowClear}
          style={{ width: searchWidth, height: 38, borderRadius: 8 }}
        />
      )}

      {/* Các dropdown lựa chọn */}
      {allSelects.map((filter, idx) => (
        <Select
          key={idx}
          value={filter.value}
          onChange={filter.onChange}
          options={filter.options}
          placeholder={filter.placeholder}
          style={{ width: filter.width || 180, height: 38 }}
        />
      ))}

      {/* Nút Tìm Kiếm */}
      {onSearch && (
        <Button
          type="primary"
          onClick={onSearch}
          style={{ height: 38, borderRadius: 8 }}
        >
          {searchText}
        </Button>
      )}

      {/* Nút Làm Mới */}
      {onRefresh && (
        <Button
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          style={{ height: 38, borderRadius: 8 }}
        >
          {refreshText}
        </Button>
      )}

      {/* Các nút hành động bổ sung nếu có */}
      {extraActions}
    </div>
  );

  if (!borderedCard) {
    return content;
  }

  return (
    <Card
      bordered={false}
      style={{
        marginBottom: 16,
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {content}
    </Card>
  );
};

export default CelraFilterBar;
