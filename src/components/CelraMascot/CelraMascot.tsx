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
const GREET_SESSION_KEY = 'celra_mascot_greeted';
const NOTIFY_STORAGE_KEY = 'celra_mascot_notifications';

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
 * - Không tự động di chuyển, không đi theo chuột, không scroll dịch chuyển.
 * - Giữ nguyên nhận diện thương hiệu hình ảnh cú CELRA tốt nghiệp.
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

  const lastActivityRef = useRef(0);
  const reminderIndexRef = useRef(0);
  const pulseTimerRef = useRef<number | null>(null);

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

  const rootClassName = [
    'celra-mascot',
    pulsing ? 'is-pulsing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName}>
      {/* Bong bóng hội thoại / nhắc nhở nổi phía trên mascot */}
      {bubble && (
        <div
          className="celra-mascot__bubble"
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

      {/* Nút mascot cố định góc dưới bên phải */}
      <button
        type="button"
        className={`celra-mascot__button ${isAuthPage ? 'is-disabled' : ''}`}
        onClick={handleOpenChat}
        aria-label="Mở trợ lý AI CELRA"
        aria-expanded={chatOpen}
        title={isAuthPage ? 'Vui lòng đăng nhập để sử dụng Trợ lý AI' : 'Trợ lý AI CELRA — Nhấn để trò chuyện'}
        style={isAuthPage ? { cursor: 'not-allowed' } : undefined}
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
