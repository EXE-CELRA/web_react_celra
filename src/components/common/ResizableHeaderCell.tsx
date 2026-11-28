import React, { useRef, useState } from 'react';

export interface ResizableHeaderCellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  columnKey?: string;
  onResizeWidth?: (width: number) => void;
  onResizeCommit?: (width: number) => void;
}

const MIN_COL_WIDTH = 60;
const MAX_COL_WIDTH = 1500;

/**
 * Ô tiêu đề bảng Ant Design hỗ trợ kéo mép phải để thay đổi độ rộng cột.
 * Không cần thư viện bên ngoài; chỉ kích hoạt khi truyền `onResizeWidth`.
 */
export const ResizableHeaderCell: React.FC<ResizableHeaderCellProps> = ({
  columnKey: _columnKey,
  onResizeWidth,
  onResizeCommit,
  children,
  style,
  className,
  ...restProps
}) => {
  const thRef = useRef<HTMLTableCellElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  if (!onResizeWidth) {
    return (
      <th ref={thRef} style={style} className={className} {...restProps}>
        {children}
      </th>
    );
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const initialWidth = thRef.current?.getBoundingClientRect().width || 140;
    let latestWidth = Math.round(initialWidth);
    setIsResizing(true);

    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handlePointerMove = (moveEv: PointerEvent) => {
      const delta = moveEv.clientX - startX;
      latestWidth = Math.min(
        MAX_COL_WIDTH,
        Math.max(MIN_COL_WIDTH, Math.round(initialWidth + delta)),
      );
      onResizeWidth(latestWidth);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
      setIsResizing(false);
      onResizeCommit?.(latestWidth);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  return (
    <th
      ref={thRef}
      style={{
        ...style,
        position: style?.position === 'sticky' ? 'sticky' : 'relative',
      }}
      className={`${className || ''} group/col-resize`}
      {...restProps}
    >
      {children}
      <span
        role="separator"
        aria-orientation="vertical"
        title="Kéo để thay đổi độ rộng cột"
        onPointerDown={handlePointerDown}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: 'col-resize',
          touchAction: 'none',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            width: isResizing ? 2 : 1,
            height: '55%',
            borderRadius: 2,
            backgroundColor: isResizing ? '#2563eb' : 'transparent',
            transition: 'background-color 0.15s ease',
          }}
          className="group-hover/col-resize:!bg-blue-400"
        />
      </span>
    </th>
  );
};

export default ResizableHeaderCell;
