import React, { useState, useEffect, useMemo } from 'react';
import { Drawer, Input, Checkbox, Button, InputNumber, Tooltip, Tag } from 'antd';
import {
  SearchOutlined,
  QuestionCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { GripVertical } from 'lucide-react';
import type { ResolvedColumnMeta } from '../../interfaces';

export interface TableColumnCustomizerDrawerProps {
  open: boolean;
  onClose: () => void;
  columns: ResolvedColumnMeta[];
  loading?: boolean;
  onSave: (nextColumns: ResolvedColumnMeta[]) => Promise<boolean | void> | void;
  onReset: () => Promise<void> | void;
}

const DEFAULT_COLLAPSED_COUNT = 10;

export const TableColumnCustomizerDrawer: React.FC<TableColumnCustomizerDrawerProps> = ({
  open,
  onClose,
  columns,
  loading = false,
  onSave,
  onReset,
}) => {
  const [draft, setDraft] = useState<ResolvedColumnMeta[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isEditingWidth, setIsEditingWidth] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(columns.map((c) => ({ ...c })));
      setSearchText('');
      setIsEditingWidth(false);
      setShowAllRows(false);
      setDraggedKey(null);
      setDragOverKey(null);
    }
  }, [open, columns]);

  const normalizedSearch = searchText.trim().toLowerCase();

  const filteredList = useMemo(() => {
    const bySearch = normalizedSearch
      ? draft.filter((c) => c.title.toLowerCase().includes(normalizedSearch))
      : draft;

    if (normalizedSearch || showAllRows) {
      return bySearch;
    }

    // Ẩn bớt cột nâng cao hoặc danh sách quá dài nếu chưa bấm "Hiển thị thêm"
    const hasExtraFlag = bySearch.some((c) => c.isExtraColumn);
    if (hasExtraFlag) {
      return bySearch.filter((c) => !c.isExtraColumn || c.visible);
    }
    return bySearch.slice(0, DEFAULT_COLLAPSED_COUNT);
  }, [draft, normalizedSearch, showAllRows]);

  const hasHiddenMore = useMemo(() => {
    if (normalizedSearch || showAllRows) return false;
    return filteredList.length < draft.length;
  }, [normalizedSearch, showAllRows, filteredList.length, draft.length]);

  const unlockableColumns = useMemo(() => draft.filter((c) => !c.locked), [draft]);
  const allUnlockableChecked =
    unlockableColumns.length > 0 && unlockableColumns.every((c) => c.visible);
  const someUnlockableChecked =
    unlockableColumns.some((c) => c.visible) && !allUnlockableChecked;

  const handleToggleAll = (checked: boolean) => {
    setDraft((prev) => {
      const next = prev.map((c) => (c.locked ? { ...c, visible: true } : { ...c, visible: checked }));
      // Bảo vệ: nếu bỏ chọn tất cả, giữ lại ít nhất cột dữ liệu đầu tiên không khóa
      if (!checked) {
        const firstUnlock = next.find((c) => !c.locked);
        if (firstUnlock) firstUnlock.visible = true;
      }
      return next;
    });
  };

  const handleToggleVisible = (key: string, checked: boolean) => {
    setDraft((prev) =>
      prev.map((c) => {
        if (c.key !== key || c.locked) return c;
        return { ...c, visible: checked };
      }),
    );
  };

  const handleWidthChange = (key: string, val: number | null) => {
    setDraft((prev) =>
      prev.map((c) =>
        c.key === key
          ? { ...c, width: typeof val === 'number' && val > 0 ? val : undefined }
          : c,
      ),
    );
  };

  const handleToggleFixed = (key: string, checked: boolean) => {
    setDraft((prev) =>
      prev.map((c) => {
        if (c.key !== key) return c;
        if (checked) {
          return {
            ...c,
            fixed: c.defaultFixed === 'right' ? 'right' : 'left',
          };
        }
        return { ...c, fixed: false };
      }),
    );
  };

  const moveItemByKey = (sourceKey: string, targetKey: string) => {
    if (sourceKey === targetKey) return;
    setDraft((prev) => {
      const fromIdx = prev.findIndex((item) => item.key === sourceKey);
      const toIdx = prev.findIndex((item) => item.key === targetKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const stepMove = (key: string, delta: -1 | 1) => {
    setDraft((prev) => {
      const idx = prev.findIndex((item) => item.key === key);
      const targetIdx = idx + delta;
      if (idx === -1 || targetIdx < 0 || targetIdx >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(idx, 1);
      updated.splice(targetIdx, 0, moved);
      return updated.map((item, i) => ({ ...item, order: i }));
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width={typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 760}
      closable={true}
      destroyOnClose={false}
      title={
        <div className="flex items-center justify-between pr-2">
          <span className="text-lg font-bold text-slate-900">Tùy chỉnh giao diện</span>
          <Tooltip title="Chọn cột hiển thị, kéo thả để đổi thứ tự, chỉnh độ rộng hoặc ghim cố định cột. Cấu hình được đồng bộ đa thiết bị theo tài khoản của bạn.">
            <QuestionCircleOutlined className="text-slate-400 hover:text-slate-600 text-base cursor-help" />
          </Tooltip>
        </div>
      }
      footer={
        <div className="flex items-center justify-between py-1">
          <Button onClick={onClose} disabled={loading} className="rounded-lg font-medium">
            Hủy
          </Button>
          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => onReset()}
              loading={loading}
              className="rounded-lg font-medium"
            >
              Lấy mẫu ngầm định
            </Button>
            <Button
              type="primary"
              loading={loading}
              onClick={() => onSave(draft)}
              className="rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 border-emerald-600 px-5"
            >
              Cất
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Thanh tìm kiếm & bật chỉnh độ rộng (không cho phép đổi tên cột) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <Input
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Nhập từ khóa tìm kiếm"
            prefix={<SearchOutlined className="text-slate-400" />}
            className="sm:w-64 rounded-lg"
          />

          <button
            type="button"
            onClick={() => setIsEditingWidth((prev) => !prev)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-transparent border-0 p-0 cursor-pointer self-start sm:self-auto"
          >
            {isEditingWidth ? 'Xong chỉnh độ rộng' : 'Sửa độ rộng cột'}
          </button>
        </div>

        {/* Bảng cấu hình các cột */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2.5 px-2 w-12 text-center">Thứ tự</th>
                  <th className="py-2.5 px-2 w-10 text-center">
                    <Checkbox
                      checked={allUnlockableChecked}
                      indeterminate={someUnlockableChecked}
                      onChange={(e) => handleToggleAll(e.target.checked)}
                    />
                  </th>
                  <th className="py-2.5 px-3">Tên cột trên giao diện</th>
                  <th className="py-2.5 px-3 w-28">Độ rộng (px)</th>
                  <th className="py-2.5 px-3 w-28 text-center">Cố định cột</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((col, idx) => {
                  const isDragOver = dragOverKey === col.key && draggedKey !== col.key;
                  const globalIndex = draft.findIndex((d) => d.key === col.key);
                  return (
                    <tr
                      key={col.key}
                      draggable={!normalizedSearch}
                      onDragStart={() => setDraggedKey(col.key)}
                      onDragOver={(e) => {
                        if (normalizedSearch) return;
                        e.preventDefault();
                        setDragOverKey(col.key);
                      }}
                      onDrop={(e) => {
                        if (normalizedSearch) return;
                        e.preventDefault();
                        if (draggedKey) {
                          moveItemByKey(draggedKey, col.key);
                        }
                        setDraggedKey(null);
                        setDragOverKey(null);
                      }}
                      onDragEnd={() => {
                        setDraggedKey(null);
                        setDragOverKey(null);
                      }}
                      className={`transition-colors ${
                        isDragOver
                          ? 'bg-blue-50/80 border-t-2 border-t-blue-500'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Kéo thả & nút di chuyển */}
                      <td className="py-2 px-2 text-center">
                        <div className="inline-flex items-center gap-0.5 text-slate-400">
                          <span
                            title={
                              normalizedSearch
                                ? 'Xóa từ khóa tìm kiếm để kéo thả đổi thứ tự'
                                : 'Kéo thả để đổi thứ tự cột'
                            }
                            className={normalizedSearch ? 'opacity-40' : 'cursor-grab active:cursor-grabbing hover:text-slate-600'}
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                          <div className="flex flex-col leading-none">
                            <button
                              type="button"
                              disabled={globalIndex <= 0}
                              onClick={() => stepMove(col.key, -1)}
                              className="p-0 border-0 bg-transparent text-[9px] text-slate-400 hover:text-blue-600 disabled:opacity-25 cursor-pointer"
                              aria-label="Di chuyển lên"
                            >
                              <ArrowUpOutlined />
                            </button>
                            <button
                              type="button"
                              disabled={globalIndex >= draft.length - 1}
                              onClick={() => stepMove(col.key, 1)}
                              className="p-0 border-0 bg-transparent text-[9px] text-slate-400 hover:text-blue-600 disabled:opacity-25 cursor-pointer"
                              aria-label="Di chuyển xuống"
                            >
                              <ArrowDownOutlined />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Checkbox ẩn/hiện (khóa cột thao tác) */}
                      <td className="py-2 px-2 text-center">
                        {col.locked ? (
                          <Tooltip title="Cột thao tác cố định, không thể ẩn">
                            <Checkbox checked={true} disabled />
                          </Tooltip>
                        ) : (
                          <Checkbox
                            checked={col.visible}
                            onChange={(e) => handleToggleVisible(col.key, e.target.checked)}
                          />
                        )}
                      </td>

                      {/* Tên cột (chỉ đọc, không cho đổi tên) */}
                      <td className="py-2.5 px-3 text-slate-800 font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{col.title || `Cột ${idx + 1}`}</span>
                          {col.locked && (
                            <Tag
                              icon={<LockOutlined />}
                              color="default"
                              className="text-[10px] m-0 bg-slate-100 text-slate-600 border-slate-200"
                            >
                              Bắt buộc
                            </Tag>
                          )}
                        </div>
                      </td>

                      {/* Độ rộng */}
                      <td className="py-2 px-3 text-slate-700 font-mono">
                        {isEditingWidth ? (
                          <InputNumber
                            size="small"
                            min={60}
                            max={1500}
                            value={col.width ?? null}
                            placeholder="Tự động"
                            onChange={(val) => handleWidthChange(col.key, val)}
                            className="w-24"
                          />
                        ) : (
                          <span>{col.width ? `${col.width}` : 'Tự động'}</span>
                        )}
                      </td>

                      {/* Cố định cột */}
                      <td className="py-2 px-3 text-center">
                        <Tooltip
                          title={
                            col.fixed
                              ? col.fixed === 'right'
                                ? 'Đang cố định bên phải'
                                : 'Đang cố định bên trái'
                              : 'Cố định cột khi cuộn ngang'
                          }
                        >
                          <Checkbox
                            checked={Boolean(col.fixed)}
                            onChange={(e) => handleToggleFixed(col.key, e.target.checked)}
                          />
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })}

                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Không tìm thấy cột nào khớp với từ khóa "{searchText}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nút Hiển thị thêm khi danh sách dài hoặc có cột nâng cao */}
        {hasHiddenMore && (
          <button
            type="button"
            onClick={() => setShowAllRows(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-transparent border-0 p-0 cursor-pointer"
          >
            Hiển thị thêm ({draft.length - filteredList.length} cột)
          </button>
        )}
      </div>
    </Drawer>
  );
};

export default TableColumnCustomizerDrawer;
