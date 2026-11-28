import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message as antMessage } from 'antd';
import { useAuthStore } from '../../store/useAuthStore';
import { useAIChatStore } from '../../store/useAIChatStore';
import mascotImg from '../../assets/celra-mascot.png';
import './CelraMascot.css';

interface BubbleMessage {
  kind: 'greeting' | 'reminder';
  text: string;
}

const GREETING_TEXT =
  'Xin chào! Tôi là CELRA Assistant. Tôi có thể giúp gì cho doanh nghiệp của bạn?';
const REMINDERS = [
  'Bạn đã kiểm tra các nghĩa vụ thuế của doanh nghiệp chưa?',
  'Có công việc tuân thủ nào đang chờ xử lý không?',
  'Đừng quên cập nhật hồ sơ và bằng chứng tuân thủ nhé!',
];

const BUBBLE_MS = 10000;
const REMINDER_GAP_MS = 75000;
const QUIET_MS = 8000;
const DRAG_THRESHOLD_PX = 5;
const VIEWPORT_MARGIN_PX = 8;
const GREET_SESSION_KEY = 'celra_mascot_greeted';
const NOTIFY_STORAGE_KEY = 'celra_mascot_notifications';
const POSITION_STORAGE_KEY = 'celra_mascot_position';

interface MascotPosition {
  x: number;
  y: number;
}

const clampPosition = (x: number, y: number, width: number, height: number): MascotPosition => {
  if (typeof window === 'undefined') return { x, y };
  const maxX = Math.max(VIEWPORT_MARGIN_PX, window.innerWidth - width - VIEWPORT_MARGIN_PX);
  const maxY = Math.max(VIEWPORT_MARGIN_PX, window.innerHeight - height - VIEWPORT_MARGIN_PX);
  return {
    x: Math.min(Math.max(VIEWPORT_MARGIN_PX, x), maxX),
    y: Math.min(Math.max(VIEWPORT_MARGIN_PX, y), maxY),
  };
};

const readStoredPosition = (): MascotPosition | null => {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MascotPosition>;
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      return clampPosition(parsed.x, parsed.y, 82, 92);
    }
    return null;
  } catch {
    return null;
  }
};

const writeStoredPosition = (pos: MascotPosition) => {
  try {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // Storage không khả dụng — bỏ qua
  }
};

const readStoredFlag = (key: string, fallback: boolean) => {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === '1';
  } catch {
    return fallback;
  }
};

const writeStoredFlag = (key: string, value: boolean) => {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // Storage không khả dụng — bỏ qua
  }
};

/**
 * CELRA Mascot — Mascot tĩnh cố định tại góc dưới bên phải màn hình.
 * - Kích thước nhỏ gọn (Desktop: 82px, Mobile: 58px / 50px).
 * - Không tự động di chuyển, không walking animation, không đi theo chuột.
 * - Tự động ẩn đi khi khung chatbox (AIChatDrawer) đang mở.
 * - Hỗ trợ click mở Trợ lý Pháp lý AI (AIChatDrawer) và bong bóng tương tác.
 */
export const CelraMascot: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const chatOpen = useAIChatStore((state) => state.isOpen);
  const openChat = useAIChatStore((state) => state.open);
  const closeChat = useAIChatStore((state) => state.close);

  // 🛡️ BẢO VỆ MÀN HÌNH ĐĂNG NHẬP: Đóng ngay chatbox nếu đang mở khi vào trang đăng nhập/xác thực
  useEffect(() => {
    if (isAuthPage && chatOpen) {
      closeChat();
    }
  }, [isAuthPage, chatOpen, closeChat]);

  const [bubble, setBubble] = useState<BubbleMessage | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() =>
    readStoredFlag(NOTIFY_STORAGE_KEY, true),
  );
  const [pulsing, setPulsing] = useState(false);
  const [position, setPosition] = useState<MascotPosition | null>(() => readStoredPosition());
  const [isDragging, setIsDragging] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    width: number;
    height: number;
    didDrag: boolean;
  } | null>(null);
  const suppressNextClickRef = useRef(false);

  const lastActivityRef = useRef(0);
  const reminderIndexRef = useRef(0);
  const pulseTimerRef = useRef<number | null>(null);

  // Kẹp lại vị trí mascot khi thay đổi kích thước cửa sổ
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const rect = rootRef.current?.getBoundingClientRect();
        const w = rect?.width || 82;
        const h = rect?.height || 92;
        return clampPosition(prev.x, prev.y, w, h);
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ghi nhận thao tác của người dùng để tạm hoãn lời nhắc khi đang thao tác trên website
  useEffect(() => {
    lastActivityRef.current = Date.now();
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };
    const events: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'scroll',
      'wheel',
    ];
    events.forEach((event) =>
      window.addEventListener(event, markActivity, { passive: true }),
    );
    return () => {
      events.forEach((event) => window.removeEventListener(event, markActivity));
    };
  }, []);

  // Lời chào: chỉ 1 lần mỗi phiên làm việc (session), có thể tắt
  useEffect(() => {
    if (isAuthPage) return;
    let alreadyGreeted = false;
    try {
      alreadyGreeted = sessionStorage.getItem(GREET_SESSION_KEY) === '1';
    } catch {
      // ignore
    }
    if (alreadyGreeted || !notificationsEnabled) return;

    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(GREET_SESSION_KEY, '1');
      } catch {
        // ignore
      }
      setBubble({ kind: 'greeting', text: GREETING_TEXT });
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [isAuthPage, notificationsEnabled]);

  // Tự động ẩn bong bóng sau khoảng thời gian hiển thị
  useEffect(() => {
    if (!bubble) return;
    const timer = window.setTimeout(() => setBubble(null), BUBBLE_MS);
    return () => window.clearTimeout(timer);
  }, [bubble]);

  // Lời nhắc nghiệp vụ: định kỳ khi người dùng rảnh
  useEffect(() => {
    if (!notificationsEnabled || isAuthPage) return;
    const timer = window.setInterval(() => {
      if (chatOpen || bubble || document.hidden) return;
      if (Date.now() - lastActivityRef.current < QUIET_MS) return;
      const text = REMINDERS[reminderIndexRef.current % REMINDERS.length];
      reminderIndexRef.current += 1;
      setBubble({ kind: 'reminder', text });
    }, REMINDER_GAP_MS);
    return () => window.clearInterval(timer);
  }, [notificationsEnabled, isAuthPage, chatOpen, bubble]);

  // Dọn timer hiệu ứng khi unmount
  useEffect(() => {
    return () => {
      if (pulseTimerRef.current !== null) {
        window.clearTimeout(pulseTimerRef.current);
      }
    };
  }, []);

  const handleOpenChat = useCallback(() => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    // 🛡️ Ở màn hình login, register, forgot-password: Tuyệt đối không cho phép mở chatbox
    if (isAuthPage) {
      antMessage.warning('Vui lòng đăng nhập để sử dụng Trợ lý Pháp lý AI.');
      return;
    }

    setBubble(null);
    setPulsing(true);
    if (pulseTimerRef.current !== null) {
      window.clearTimeout(pulseTimerRef.current);
    }
    pulseTimerRef.current = window.setTimeout(() => setPulsing(false), 600);

    if (isAuthenticated) {
      openChat();
    } else {
      antMessage.warning('Vui lòng đăng nhập để sử dụng Trợ lý Pháp lý AI.');
      navigate('/login');
    }
  }, [isAuthPage, isAuthenticated, navigate, openChat]);

  const handleDisableNotifications = useCallback(() => {
    setNotificationsEnabled(false);
    writeStoredFlag(NOTIFY_STORAGE_KEY, false);
    setBubble(null);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStateRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: rect.left,
      originY: rect.top,
      width: rect.width,
      height: rect.height,
      didDrag: false,
    };

    const handlePointerMove = (moveEv: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || moveEv.pointerId !== state.pointerId) return;

      const dx = moveEv.clientX - state.startClientX;
      const dy = moveEv.clientY - state.startClientY;

      if (!state.didDrag && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
        return;
      }

      if (!state.didDrag) {
        state.didDrag = true;
        setIsDragging(true);
      }

      const nextPos = clampPosition(
        state.originX + dx,
        state.originY + dy,
        state.width,
        state.height,
      );
      setPosition(nextPos);
    };

    const handlePointerUp = (upEv: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || upEv.pointerId !== state.pointerId) return;

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (state.didDrag) {
        const dx = upEv.clientX - state.startClientX;
        const dy = upEv.clientY - state.startClientY;
        const finalPos = clampPosition(
          state.originX + dx,
          state.originY + dy,
          state.width,
          state.height,
        );
        setPosition(finalPos);
        writeStoredPosition(finalPos);
        suppressNextClickRef.current = true;
        // Phòng hờ trường hợp trình duyệt không bắn sự kiện click sau drag
        window.setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 120);
      }

      setIsDragging(false);
      dragStateRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  }, []);

  // 🛡️ Khi khung chatbox đang mở: Ẩn hoàn toàn mascot để không che khuất hoặc vướng giao diện chat
  if (chatOpen) {
    return null;
  }

  const isOnLeftHalf =
    position !== null && typeof window !== 'undefined' && position.x < window.innerWidth / 2;
  const isNearTop = position !== null && position.y < 190;

  const rootClassName = [
    'celra-mascot',
    pulsing ? 'is-pulsing' : '',
    isDragging ? 'is-dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const rootStyle: React.CSSProperties | undefined = position
    ? {
        left: position.x,
        top: position.y,
        right: 'auto',
        bottom: 'auto',
      }
    : undefined;

  return (
    <div ref={rootRef} className={rootClassName} style={rootStyle}>
      {/* Bong bóng hội thoại / nhắc nhở nổi phía trên (hoặc dưới nếu gần mép trên) */}
      {bubble && (
        <div
          className={[
            'celra-mascot__bubble',
            isOnLeftHalf ? 'is-align-left' : '',
            isNearTop ? 'is-below' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            className="celra-mascot__bubble-main"
            onClick={handleOpenChat}
          >
            <span className="celra-mascot__bubble-text">{bubble.text}</span>
            <span className="celra-mascot__bubble-cta">Hỏi trợ lý AI →</span>
          </button>
          <div className="celra-mascot__bubble-actions">
            <button
              type="button"
              className="celra-mascot__bubble-action"
              onClick={handleDisableNotifications}
            >
              Tắt nhắc nhở
            </button>
            <button
              type="button"
              className="celra-mascot__bubble-close"
              onClick={() => setBubble(null)}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Nút mascot có thể kéo thả di chuyển tự do trên màn hình */}
      <button
        type="button"
        className={`celra-mascot__button ${isAuthPage ? 'is-disabled' : ''}`}
        onPointerDown={handlePointerDown}
        onClick={handleOpenChat}
        aria-label="Mở trợ lý AI CELRA"
        aria-expanded={chatOpen}
        title={
          isAuthPage
            ? 'Vui lòng đăng nhập để sử dụng Trợ lý AI (kéo để di chuyển)'
            : 'Trợ lý AI CELRA — Nhấn để trò chuyện, kéo để di chuyển'
        }
        style={isAuthPage ? { cursor: isDragging ? 'grabbing' : 'grab' } : undefined}
      >
        <img
          className="celra-mascot__img"
          src={mascotImg}
          alt="Trợ lý Mascot CELRA"
          draggable={false}
        />
        <span className="celra-mascot__status" aria-hidden="true" title="Trực tuyến" />
      </button>
    </div>
  );
};

export default CelraMascot;
