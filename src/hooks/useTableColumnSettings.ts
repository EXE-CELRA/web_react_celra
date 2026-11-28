import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { message } from 'antd';
import apiClient from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { useOrgStore } from '../store/useOrgStore';
import { ResizableHeaderCell } from '../components/common/ResizableHeaderCell';
import type {
  CustomizableColumnType,
  ResolvedColumnMeta,
  TableColumnConfigItem,
  TablePreferenceResponse,
} from '../interfaces';

/** Trích xuất text thuần từ ReactNode title của AntD Column */
function extractTitleText<T>(title: CustomizableColumnType<T>['title'], fallbackKey: string): string {
  if (typeof title === 'function') return fallbackKey;
  if (typeof title === 'string') return title;
  if (typeof title === 'number') return String(title);
  if (Array.isArray(title)) {
    const joined = title.map((item) => extractTitleText(item, '')).filter(Boolean).join(' ');
    return joined || fallbackKey;
  }
  if (title && typeof title === 'object' && 'props' in title) {
    const props = (title as { props?: { children?: ReactNode } }).props;
    if (props?.children) {
      const inner = extractTitleText(props.children, '');
      if (inner) return inner;
    }
  }
  return fallbackKey;
}

/** Tạo key ổn định cho mỗi cột AntD */
export function resolveColumnKey<T>(col: CustomizableColumnType<T>, index: number): string {
  if (col.columnKey) return String(col.columnKey);
  if (col.key !== undefined && col.key !== null) return String(col.key);
  if (Array.isArray(col.dataIndex)) return col.dataIndex.map(String).join('.');
  if (col.dataIndex !== undefined && col.dataIndex !== null) return String(col.dataIndex);
  return `col_${index}`;
}

/** Kiểm tra cột thao tác / cột bắt buộc không được phép ẩn */
function isLockedColumn<T>(col: CustomizableColumnType<T>, key: string, titleText: string): boolean {
  if (col.locked === true) return true;
  const normalizedKey = key.trim().toLowerCase();
  const normalizedTitle = titleText.trim().toLowerCase();
  return (
    normalizedKey === 'action' ||
    normalizedKey === 'actions' ||
    normalizedKey === 'thao_tac' ||
    normalizedTitle === 'thao tác'
  );
}

/** Merge cấu hình cột đã lưu (DB/cache) với danh sách cột hiện tại trong code */
export function mergeColumnConfigs<T>(
  rawColumns: CustomizableColumnType<T>[],
  savedConfigs: TableColumnConfigItem[] | null | undefined,
): ResolvedColumnMeta[] {
  const savedMap = new Map<string, TableColumnConfigItem>();
  if (Array.isArray(savedConfigs)) {
    savedConfigs.forEach((item, idx) => {
      if (item && typeof item.key === 'string') {
        savedMap.set(item.key, {
          ...item,
          order: typeof item.order === 'number' ? item.order : idx,
        });
      }
    });
  }

  const totalBase = rawColumns.length;

  const merged: ResolvedColumnMeta[] = rawColumns.map((col, idx) => {
    const key = resolveColumnKey(col, idx);
    const title = col.customizerTitle || extractTitleText(col.title, key);
    const locked = isLockedColumn(col, key, title);
    const defaultWidth = typeof col.width === 'number' ? col.width : undefined;
    const defaultFixed: 'left' | 'right' | false =
      col.fixed === true || col.fixed === 'left'
        ? 'left'
        : col.fixed === 'right'
        ? 'right'
        : false;

    const saved = savedMap.get(key);
    const visible = locked
      ? true
      : saved !== undefined
      ? Boolean(saved.visible)
      : col.defaultVisible !== false;

    const width =
      saved && typeof saved.width === 'number' && saved.width >= 50 && saved.width <= 1500
        ? saved.width
        : defaultWidth;

    let fixed: 'left' | 'right' | false = defaultFixed;
    if (saved && (saved.fixed === 'left' || saved.fixed === 'right' || saved.fixed === false)) {
      fixed = locked && defaultFixed === 'right' && saved.fixed === false ? 'right' : saved.fixed;
    }

    // Nếu cột mới được dev thêm vào chưa có trong saved -> giữ vị trí gần cuối (trước cột Thao tác nếu có)
    const fallbackOrder = saved ? saved.order : totalBase + idx;

    return {
      key,
      title,
      visible,
      order: saved ? saved.order : fallbackOrder,
      width,
      defaultWidth,
      fixed,
      defaultFixed,
      locked,
      isExtraColumn: Boolean(col.isExtraColumn),
    };
  });

  // Nếu chưa có saved config nào, giữ nguyên thứ tự khai báo gốc
  if (savedMap.size > 0) {
    merged.sort((a, b) => a.order - b.order);
  }

  // Bảo vệ: không cho phép ẩn hết tất cả các cột nội dung
  const hasAnyVisible = merged.some((m) => m.visible && !m.locked);
  if (!hasAnyVisible && merged.length > 0) {
    const firstUnlock = merged.find((m) => !m.locked) || merged[0];
    firstUnlock.visible = true;
  }

  return merged.map((item, idx) => ({ ...item, order: idx }));
}

export interface UseTableColumnSettingsOptions<T> {
  tableKey?: string;
  columns: CustomizableColumnType<T>[];
  disabled?: boolean;
}

export function useTableColumnSettings<T extends object = any>({
  tableKey,
  columns,
  disabled = false,
}: UseTableColumnSettingsOptions<T>) {
  const { user, isAuthenticated } = useAuthStore();
  const { activeOrg } = useOrgStore();
  const orgScope = activeOrg?.id || 'GLOBAL';
  const userId = user?.id || 'anon';

  const storageKey = tableKey ? `celra_table_pref_${userId}_${orgScope}_${tableKey}` : '';

  const [savedConfigs, setSavedConfigs] = useState<TableColumnConfigItem[]>(() => {
    if (!storageKey) return [];
    try {
      const cached = localStorage.getItem(storageKey);
      return cached ? (JSON.parse(cached) as TableColumnConfigItem[]) : [];
    } catch {
      return [];
    }
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  // Theo dõi viewport để vô hiệu hóa fixed column trên màn hình nhỏ tránh khóa cuộn ngang
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tải cấu hình đồng bộ đa thiết bị từ DB khi đổi tableKey / user / org
  useEffect(() => {
    if (!tableKey || disabled) return;

    // Nạp cache tức thì khi đổi scope
    try {
      const cached = storageKey ? localStorage.getItem(storageKey) : null;
      if (cached) {
        setSavedConfigs(JSON.parse(cached) as TableColumnConfigItem[]);
      } else {
        setSavedConfigs([]);
      }
    } catch {
      setSavedConfigs([]);
    }

    if (!isAuthenticated) return;

    let cancelled = false;
    setIsSyncing(true);
    apiClient
      .get<unknown, TablePreferenceResponse>(`/table-preferences/${encodeURIComponent(tableKey)}`)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res?.columnsConfig) ? res.columnsConfig : [];
        setSavedConfigs(list);
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(list));
        }
      })
      .catch(() => {
        // Giữ fallback từ localStorage nếu tạm mất kết nối
      })
      .finally(() => {
        if (!cancelled) setIsSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tableKey, disabled, isAuthenticated, storageKey]);

  const resolvedColumns = useMemo(
    () => mergeColumnConfigs(columns, savedConfigs),
    [columns, savedConfigs],
  );

  // Ref giữ resolvedColumns mới nhất để callback kéo resize luôn đọc đúng trạng thái mới nhất
  const resolvedColumnsRef = useRef<ResolvedColumnMeta[]>(resolvedColumns);
  useEffect(() => {
    resolvedColumnsRef.current = resolvedColumns;
  }, [resolvedColumns]);

  const buildPayloadFromMeta = useCallback(
    (items: ResolvedColumnMeta[]): TableColumnConfigItem[] =>
      items.map((item, idx) => ({
        key: item.key,
        visible: item.locked ? true : Boolean(item.visible),
        order: idx,
        width:
          typeof item.width === 'number' && !Number.isNaN(item.width)
            ? Math.min(1500, Math.max(50, Math.round(item.width)))
            : undefined,
        fixed: item.fixed || false,
      })),
    [],
  );

  // Cập nhật tạm thời độ rộng cột trong lúc đang kéo (không gọi API để tránh spam)
  const updateColumnWidthLocal = useCallback(
    (key: string, width: number) => {
      const safeWidth = Math.min(1500, Math.max(60, Math.round(width)));
      setSavedConfigs((prev) => {
        const base =
          prev.length > 0 ? prev : buildPayloadFromMeta(resolvedColumnsRef.current);
        const exists = base.some((c) => c.key === key);
        if (exists) {
          return base.map((c) => (c.key === key ? { ...c, width: safeWidth } : c));
        }
        return [
          ...base,
          { key, visible: true, order: base.length, width: safeWidth, fixed: false },
        ];
      });
    },
    [buildPayloadFromMeta],
  );

  // Lưu độ rộng cột sau khi thả chuột kéo (cập nhật localStorage + đồng bộ DB)
  const commitColumnWidth = useCallback(
    (key: string, width: number) => {
      if (!tableKey) return;
      const safeWidth = Math.min(1500, Math.max(60, Math.round(width)));
      const nextPayload = buildPayloadFromMeta(resolvedColumnsRef.current).map((c) =>
        c.key === key ? { ...c, width: safeWidth } : c,
      );
      setSavedConfigs(nextPayload);
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(nextPayload));
      }
      if (isAuthenticated) {
        apiClient
          .put(`/table-preferences/${encodeURIComponent(tableKey)}`, {
            columnsConfig: nextPayload,
          })
          .catch(() => {
            // Đã lưu localStorage dự phòng
          });
      }
    },
    [tableKey, storageKey, isAuthenticated, buildPayloadFromMeta],
  );

  // Lưu cấu hình mới lên DB + cập nhật localStorage
  const saveSettings = useCallback(
    async (nextItems: ResolvedColumnMeta[]) => {
      if (!tableKey) return;

      const payload = buildPayloadFromMeta(nextItems);

      // Bảo vệ: luôn có ít nhất 1 cột không khóa được hiển thị
      if (!payload.some((p, i) => p.visible && !nextItems[i]?.locked) && payload.length > 0) {
        message.warning('Phải hiển thị ít nhất một cột dữ liệu.');
        return false;
      }

      setIsSaving(true);
      try {
        setSavedConfigs(payload);
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(payload));
        }
        if (isAuthenticated) {
          await apiClient.put(`/table-preferences/${encodeURIComponent(tableKey)}`, {
            columnsConfig: payload,
          });
        }
        message.success('Đã lưu tùy chỉnh giao diện bảng (đồng bộ đa thiết bị)');
        setDrawerOpen(false);
        return true;
      } catch {
        message.warning('Đã lưu cục bộ, nhưng chưa đồng bộ được lên máy chủ. Vui lòng thử lại sau.');
        setDrawerOpen(false);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [tableKey, storageKey, isAuthenticated],
  );

  // Khôi phục mẫu ngầm định
  const resetSettings = useCallback(async () => {
    if (!tableKey) return;
    setIsSaving(true);
    try {
      setSavedConfigs([]);
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
      if (isAuthenticated) {
        await apiClient.delete(`/table-preferences/${encodeURIComponent(tableKey)}`);
      }
      message.success('Đã khôi phục cấu hình bảng về mẫu ngầm định');
      setDrawerOpen(false);
    } catch {
      message.warning('Đã khôi phục mặc định trên trình duyệt.');
      setDrawerOpen(false);
    } finally {
      setIsSaving(false);
    }
  }, [tableKey, storageKey, isAuthenticated]);

  // Danh sách cột cuối cùng truyền vào AntD Table
  const visibleColumns: ColumnsType<T> = useMemo(() => {
    if (!tableKey || disabled) {
      return columns as ColumnsType<T>;
    }

    const rawMap = new Map<string, CustomizableColumnType<T>>();
    columns.forEach((col, idx) => {
      rawMap.set(resolveColumnKey(col, idx), col);
    });

    const result: CustomizableColumnType<T>[] = [];
    resolvedColumns.forEach((meta) => {
      if (!meta.visible) return;
      const orig = rawMap.get(meta.key);
      if (!orig) return;

      // Strip các prop mở rộng nội bộ trước khi đưa xuống AntD Table
      const {
        columnKey: _ck,
        customizerTitle: _ct,
        locked: _lk,
        defaultVisible: _dv,
        isExtraColumn: _ie,
        ...antdCol
      } = orig;

      result.push({
        ...antdCol,
        key: antdCol.key ?? meta.key,
        width: meta.width ?? antdCol.width,
        fixed: isMobileViewport ? undefined : meta.fixed || undefined,
        onHeaderCell: (column) => {
          const origHeaderCell = orig.onHeaderCell ? orig.onHeaderCell(column) : {};
          return {
            ...origHeaderCell,
            columnKey: meta.key,
            onResizeWidth: (w: number) => updateColumnWidthLocal(meta.key, w),
            onResizeCommit: (w: number) => commitColumnWidth(meta.key, w),
          };
        },
      });
    });

    return result as ColumnsType<T>;
  }, [
    tableKey,
    disabled,
    columns,
    resolvedColumns,
    isMobileViewport,
    updateColumnWidthLocal,
    commitColumnWidth,
  ]);

  const tableComponents = useMemo(
    () => ({
      header: {
        cell: ResizableHeaderCell,
      },
    }),
    [],
  );

  return {
    visibleColumns,
    resolvedColumns,
    tableComponents,
    drawerOpen,
    setDrawerOpen,
    isSyncing,
    isSaving,
    saveSettings,
    resetSettings,
  };
}
