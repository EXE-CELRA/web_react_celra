import React, { useState, useRef, useEffect } from 'react';
import { Drawer, message as antMessage } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/client';
import { useOrgStore } from '../../store/useOrgStore';
import { useAuthStore } from '../../store/useAuthStore';
import mascotImg from '../../assets/celra-mascot.png';
import '../CelraMascot/CelraMascot.css';
import { StructuredAIMessage } from './StructuredAIMessage';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  PlusCircle, 
  X, 
  RefreshCw, 
  Maximize2, 
  Minimize2,
  Paperclip,
  PanelRightClose,
  PanelRightOpen,
  History,
  Building2,
  AlertCircle,
  ExternalLink,
  ClipboardCheck,
  BookmarkPlus,
} from 'lucide-react';
interface CitationItem {
  title: string;
  docNumber: string;
  articleNumber?: string;
  sourceUrl?: string;
  url?: string;
}

interface ProposedChecklistItem {
  id: string;
  code: string;
  title: string;
  category: string;
  priority: string;
  reason: string;
  legalBasis: string;
  assigneeRole?: string;
}

export interface VerificationOption {
  label: string;
  value: string;
  isCompliant?: boolean;
}

export interface VerificationChecklistItem {
  id: string;
  factKey: string;
  obligationCode: string;
  obligationName: string;
  question: string;
  description: string;
  options: VerificationOption[];
}

interface MessageItem {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  citations?: CitationItem[];
  actionType?: 'info' | 'open_compliance_audit' | 'task_proposal' | 'enterprise_audit';
  isEnterpriseQuery?: boolean;
  verificationChecklist?: VerificationChecklistItem[];
  ctaButton?: {
    text: string;
    action: string;
  };
  proposedChecklists?: ProposedChecklistItem[];
  timestamp?: string;
}

interface AIChatDrawerProps {
  visible: boolean;
  onClose: () => void;
  onOpenAuditModal?: () => void;
}
const CHAT_STORAGE_KEY = 'celra_chat_history';

function getChatStorageKey(userId?: string, orgId?: string): string {
  if (!userId) return `${CHAT_STORAGE_KEY}_unauth`;
  return `${CHAT_STORAGE_KEY}_u_${userId}_org_${orgId || 'default'}`;
}

function loadChatHistory(userId?: string, orgId?: string): MessageItem[] | null {
  try {
    if (!userId) return null;
    const key = getChatStorageKey(userId, orgId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed as MessageItem[];
  } catch {
    return null;
  }
}

function saveChatHistory(messages: MessageItem[], userId?: string, orgId?: string): void {
  try {
    if (!userId) return;
    const key = getChatStorageKey(userId, orgId);
    localStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // Storage full or unavailable — silently fail, chat still works
  }
}

function clearChatHistory(userId?: string, orgId?: string): void {
  try {
    if (!userId) return;
    const key = getChatStorageKey(userId, orgId);
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
const getDefaultWelcomeMessage = (companyName?: string): MessageItem => ({
  id: 'welcome-msg',
  sender: 'AI',
  text: `Xin chào! Tôi là trợ lý pháp lý AI của CELRA.\n\nMô tả tình huống hoặc đặt câu hỏi về nghĩa vụ pháp lý của doanh nghiệp. Tôi sẽ giúp bạn hiểu quy định và xác định những việc cần thực hiện.\n\n${companyName ? `Bối cảnh hiện tại: **${companyName}**. Hãy cung cấp thêm thông tin nếu doanh nghiệp của bạn có đặc điểm chưa được cập nhật trong hồ sơ.` : 'Hãy cung cấp ngành nghề, quy mô hoặc loại hình doanh nghiệp để tôi có thêm bối cảnh.'}`,
  actionType: 'info',
});

import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../api/legalApi';

// Chuẩn hóa và khắc phục triệt để lỗi URL DLPL hoặc liên kết văn bản pháp luật gốc
function resolveCitationUrl(c: CitationItem): string {
  const rawUrl = c.sourceUrl || c.url;
  const clean = cleanDLPLUrl(rawUrl);
  if (clean && clean.startsWith('http')) {
    return clean;
  }

  const searchKey = `${c.docNumber || ''} ${c.title || ''}`;
  const matched = matchCoreLegalDocUrl(searchKey);
  if (matched) {
    return matched;
  }

  const query = c.docNumber || c.title;
  return `https://dulieuphapluat.vn/van-ban/tim-kiem.html?q=${encodeURIComponent(query)}`;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ 
  visible, 
  onClose,
  onOpenAuditModal,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  const { user, isAuthenticated } = useAuthStore();
  const { activeOrg } = useOrgStore();
  const currentOrgId = activeOrg?.id || localStorage.getItem('celra_active_org_id') || undefined;

  // 🛡️ NGUYÊN TẮC BẢO MẬT: Chỉ người dùng đã đăng nhập mới được phép mở và sử dụng khung chat.
  // Ở màn hình đăng nhập (hoặc khi chưa đăng nhập), luôn đóng khung chat ngay lập tức.
  useEffect(() => {
    if (visible && (isAuthPage || !isAuthenticated)) {
      onClose();
      if (!isAuthPage) {
        antMessage.warning('Vui lòng đăng nhập để sử dụng Trợ lý Pháp lý AI.');
        navigate('/login');
      }
    }
  }, [visible, isAuthPage, isAuthenticated, onClose, navigate]);

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    return localStorage.getItem('celra_chat_expanded') === 'true';
  });
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>(() => {
    return loadChatHistory(user?.id, currentOrgId) ?? [getDefaultWelcomeMessage(activeOrg?.name)];
  });

  // 🛡️ ĐẢM BẢO CÔ LẬP TUYỆT ĐỐI: Tải đúng lịch sử chat theo userId và Doanh nghiệp hiện hành
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const history = loadChatHistory(user.id, currentOrgId);
    setMessages(history && history.length > 0 ? history : [getDefaultWelcomeMessage(activeOrg?.name)]);
  }, [user?.id, currentOrgId, activeOrg?.name, isAuthenticated]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedProposals, setAcceptedProposals] = useState<Record<string, boolean>>({});
  const [isAccepting, setIsAccepting] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  // Cuộn ngay xuống câu hỏi mới nhất khi Drawer mở ra
  useEffect(() => {
    if (visible) {
      // Đợi Drawer animation hoàn tất rồi cuộn xuống đáy
      const timer1 = setTimeout(() => scrollToBottom('auto'), 80);
      const timer2 = setTimeout(() => scrollToBottom('smooth'), 250);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [visible]);

  // Tự động cuộn xuống khi có tin nhắn mới hoặc AI đang phản hồi
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, loading]);

  useEffect(() => {
    if (isAuthenticated && user?.id && messages.length > 0) {
      saveChatHistory(messages, user.id, currentOrgId);
    }
  }, [messages, user?.id, currentOrgId, isAuthenticated]);

  // Danh mục câu hỏi gợi ý nhanh (Quick Prompts)
  const quickPrompts = [
    {
      title: 'Doanh nghiệp tôi cần tuân thủ những nghĩa vụ pháp lý nào?',
      desc: 'Tổng hợp nghĩa vụ theo bối cảnh doanh nghiệp',
    },
    {
      title: 'Quy định về thuế TNDN hiện nay như thế nào?',
      desc: 'Phân tích quy định và nghĩa vụ liên quan',
    },
    {
      title: 'Doanh nghiệp cần chuẩn bị hồ sơ gì?',
      desc: 'Liệt kê hồ sơ và bằng chứng cần nộp',
    },
    {
      title: 'Tôi cần làm gì để hoàn thành nghĩa vụ tuân thủ?',
      desc: 'Chuyển kết quả thành các bước thực hiện',
    },
    {
      title: 'Có quy định mới nào ảnh hưởng đến doanh nghiệp tôi?',
      desc: 'Xác định thay đổi có liên quan',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    setInputText('');
    const fileName = attachedFile?.name;
    setAttachedFile(null);
    const userMsgId = `usr-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'USER',
        text: fileName ? `${query}\nTài liệu đính kèm: ${fileName}` : query,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setLoading(true);

    try {
      const res = (await apiClient.post('/ai-assistant/chat', {
        message: query,
        question: query,
        history: messages.slice(-10).map(m => ({
          role: m.sender === 'USER' ? 'user' : 'assistant',
          content: m.text,
        })),
      })) as {
        messageId?: string;
        content?: string;
        answer?: string;
        citations?: CitationItem[];
        actionType?: 'info' | 'open_compliance_audit' | 'task_proposal' | 'enterprise_audit';
        isEnterpriseQuery?: boolean;
        verificationChecklist?: VerificationChecklistItem[];
        ctaButton?: { text: string; action: string };
        proposedChecklists?: ProposedChecklistItem[];
      };
      const aiMsgId = res.messageId || `ai-${Date.now()}`;
      const replyContent = res.content || res.answer || 'Đã ghi nhận câu hỏi và xử lý dữ liệu tuân thủ.';

      const validActionType: 'info' | 'open_compliance_audit' | 'task_proposal' | 'enterprise_audit' =
        res.actionType === 'enterprise_audit' || res.actionType === 'open_compliance_audit' || res.actionType === 'task_proposal'
          ? res.actionType
          : 'info';

      const isEnterprise = Boolean(
        res.isEnterpriseQuery ||
        validActionType === 'enterprise_audit'
      );

      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'AI',
          text: replyContent,
          citations: res.citations || [],
          actionType: validActionType,
          isEnterpriseQuery: isEnterprise,
          verificationChecklist: res.verificationChecklist || [],
          ctaButton: res.ctaButton,
          proposedChecklists: res.proposedChecklists || [],
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

    } catch (err: unknown) {
      let backendMsg = 'Rất tiếc, đã có sự cố kết nối tới Engine Trợ lý AI. Vui lòng kiểm tra lại kết nối và thử lại.';
      if (typeof err === 'string') {
        backendMsg = err;
      } else if (err && typeof err === 'object') {
        const e = err as { message?: string; error?: string; response?: { data?: { message?: string } } };
        backendMsg = e.response?.data?.message || e.message || e.error || backendMsg;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'AI',
          text: backendMsg,
          actionType: 'info',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async (proposal: ProposedChecklistItem) => {
    setIsAccepting((prev) => ({ ...prev, [proposal.id]: true }));
    try {
      await apiClient.post('/ai-assistant/accept-proposal', {
        title: proposal.title,
        code: proposal.code,
        category: proposal.category,
        priority: proposal.priority || 'high',
        reason: proposal.reason,
        legalBasis: proposal.legalBasis,
        assigneeRole: proposal.assigneeRole || 'accountant',
      });

      setAcceptedProposals((prev) => ({ ...prev, [proposal.id]: true }));
      antMessage.success(`🎉 Đã tạo thành công Checklist "${proposal.title}" vào hệ thống!`);
    } catch (err: unknown) {
      const e = err as { message?: string } | null;
      antMessage.error(e?.message || 'Lỗi khi tạo Checklist từ đề xuất AI');
    } finally {
      setIsAccepting((prev) => ({ ...prev, [proposal.id]: false }));
    }
  };

  const handleOpenAudit = () => {
    onClose();
    if (onOpenAuditModal) {
      onOpenAuditModal();
    } else {
      navigate('/context');
    }
  };

  const latestAiMessage = [...messages].reverse().find((message) => message.sender === 'AI' && message.id !== 'welcome-msg');
  const latestUserMessage = [...messages].reverse().find((message) => message.sender === 'USER');

  // Từ điển chuyển ngữ mã kỹ thuật Backend sang nhãn tiếng Việt trang nhã cho người dùng
  const BE_FIELD_LABELS: Record<string, string> = {
    q_tax_corp_2: 'Tạm nộp thuế TNDN (80%)',
    q_tax_corp_3: 'Thanh toán không dùng tiền mặt (>20 triệu)',
    q_tax_salary_1: 'Hồ sơ chi phí tiền lương & thuế TNCN',
    q_tax_corp_1: 'Kê khai thuế GTGT/TNCN',
    q_fnb_tax_1: 'Hóa đơn điện tử máy tính tiền',
    q_fnb_tax_2: 'Đối soát doanh thu POS/QR',
    q_fnb_tax_3: 'Chứng từ nguyên liệu thực phẩm',
    q_ecom_tax_1: 'Đối soát sàn TMĐT (Shopee/TikTok)',
    q_ecom_tax_2: 'Dòng tiền thu hộ COD',
    q_ecom_tax_3: 'Hóa đơn đầu vào hàng online',
    company_type_tag: 'Loại hình doanh nghiệp',
    employee_scale: 'Quy mô nhân sự',
    industry_tags: 'Ngành nghề kinh doanh',
    tax_code: 'Mã số thuế',
    APPLICABLE: 'Đã xác định nghĩa vụ áp dụng',
    POSSIBLE: 'Có khả năng áp dụng nhưng chưa đủ dữ liệu',
    NEEDS_VERIFICATION: 'Cần xác minh thông tin hoặc căn cứ',
    NOT_APPLICABLE: 'Đã có căn cứ xác định không áp dụng',
    COMPLETED: 'Có đủ bằng chứng xác nhận hoàn thành',
    IN_PROGRESS: 'Đang thực hiện và có dữ liệu xác nhận',
    OVERDUE: 'Quá hạn theo lịch – Chưa xác nhận hoàn thành',
  };

  // Parser định dạng thông minh: Xóa sạch toàn bộ ký tự thô (#, ##, ####, ****, *) và thay thế các mã trường kỹ thuật phía Backend
  const renderFormattedText = (rawText?: string) => {
    if (!rawText) return null;

    // 1. Thay thế mã kỹ thuật Backend (q_tax_...) thành tiếng Việt dễ hiểu
    let sanitizedText = rawText;
    // Xóa tiền tố kỹ thuật dạng [Mã thẻ: q_...] hoặc [Mã: q_...]
    sanitizedText = sanitizedText.replace(/\[?(?:Mã thẻ|Mã|Key):\s*([a-zA-Z0-9_]+)\]?/gi, (_, key) => {
      return BE_FIELD_LABELS[key] || '';
    });
    // Thay thế độc lập các mã còn sót
    Object.entries(BE_FIELD_LABELS).forEach(([k, v]) => {
      sanitizedText = sanitizedText.replaceAll(k, v);
    });

    // 2. Tiền xử lý xóa sạch ký tự rác Markdown (dấu # thừa, 4 dấu sao ****)
    sanitizedText = sanitizedText
      .replace(/\*{4,}/g, '') // xóa các cụm **** thừa
      .replace(/\*{3}(.*?)\*{3}/g, '**$1**'); // chuẩn hóa *** thành **

    const lines = sanitizedText.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Xử lý dòng tiêu đề (#, ##, ###, #### hoặc dòng số 1. 2. 3. in hoa)
      const headerMatch = trimmed.match(/^(?:#{1,6}\s*|\d+\.\s+)([^\n]+)$/);
      const isExplicitHeader = trimmed.startsWith('#');

      if (isExplicitHeader && headerMatch) {
        // Xóa sạch mọi ký tự # và * trong tiêu đề
        const cleanTitle = headerMatch[1].replace(/[#*]+/g, '').trim();
        return (
          <div
            key={idx}
            className="font-bold text-sm text-teal-950 border-b border-teal-100 pb-1 mt-3 mb-1.5"
          >
            {cleanTitle}
          </div>
        );
      }

      // Dòng bình thường: Xóa bỏ mọi dấu # nếu có lọt vào giữa câu
      const lineWithoutHash = line.replace(/#{1,6}\s*/g, '');

      // Tokenizer bóc tách in đậm (**text**) và in nghiêng (*text*) sạch sẽ
      const elements: React.ReactNode[] = [];
      const tokenRegex = /(\*\*[^*]+?\*\*|\*[^*]+?\*)/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = tokenRegex.exec(lineWithoutHash)) !== null) {
        if (match.index > lastIndex) {
          const plain = lineWithoutHash.substring(lastIndex, match.index).replace(/[*#]+/g, '');
          elements.push(plain);
        }
        const matchedText = match[0];
        if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
          const boldContent = matchedText.slice(2, -2).replace(/[*#]+/g, '').trim();
          if (boldContent) {
            elements.push(
              <strong key={`b-${idx}-${match.index}`} className="font-bold text-slate-900">
                {boldContent}
              </strong>
            );
          }
        } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
          const italicContent = matchedText.slice(1, -1).replace(/[*#]+/g, '').trim();
          if (italicContent) {
            elements.push(
              <em key={`i-${idx}-${match.index}`} className="italic text-teal-800">
                {italicContent}
              </em>
            );
          }
        }
        lastIndex = tokenRegex.lastIndex;
      }
      if (lastIndex < lineWithoutHash.length) {
        const tail = lineWithoutHash.substring(lastIndex).replace(/[*#]+/g, '');
        elements.push(tail);
      }

      // Kiểm tra dòng gạch đầu dòng bullet (- hoặc *)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
            <span className="text-xs leading-relaxed text-slate-800">{elements}</span>
          </div>
        );
      }

      // Dòng trống
      if (!trimmed) {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="text-xs leading-relaxed text-slate-800 my-1">
          {elements}
        </p>
      );
    });
  };
  return (
    <Drawer
      title={null}
      placement="right"
      width={isExpanded ? '96vw' : (window.innerWidth < 1024 ? '100vw' : '88vw')}
      onClose={onClose}
      open={visible}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' },
        wrapper: { maxWidth: '100vw', transition: 'width 0.25s ease-in-out' }
      }}
    >
      {/* DRAWER HEADER */}
      <div className="h-[72px] px-5 bg-[#142B50] text-white flex items-center justify-between border-b border-[#203a66] shrink-0">
        <div className="flex items-center gap-3">
          {/* Biểu tượng Trợ lý Pháp lý AI: Mascot cú CELRA tĩnh */}
          <div
            className="celra-chat-header-mascot"
            title="Mascot cú CELRA — Trợ lý Pháp lý AI"
            aria-label="Mascot cú CELRA Trợ lý Pháp lý AI"
          >
            <img
              src={mascotImg}
              alt="CELRA Mascot"
              className="celra-chat-header-mascot__img"
              draggable={false}
            />
            <span className="celra-chat-header-mascot__status" title="CELRA AI đang trực tuyến" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-white tracking-wide">
                Trợ lý pháp lý AI
              </h3>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              CELRA AI đang hoạt động
              {activeOrg?.legalName || activeOrg?.name ? (
                <span className="text-slate-400">• {activeOrg.legalName || activeOrg.name}</span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => antMessage.info('Lịch sử cuộc trò chuyện được lưu theo doanh nghiệp hiện tại.')}
            className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Lịch sử trò chuyện"
            aria-label="Lịch sử trò chuyện"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              clearChatHistory(user?.id, currentOrgId);
              setMessages([getDefaultWelcomeMessage(activeOrg?.name)]);
              antMessage.success('Đã làm mới phiên hội thoại!');
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Làm mới lịch sử chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsExpanded((prev) => {
                const next = !prev;
                localStorage.setItem('celra_chat_expanded', String(next));
                return next;
              });
            }}
            title={isExpanded ? 'Thu nhỏ giao diện chat (Mặc định 68vw)' : 'Phóng to tối đa màn hình (96vw)'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 flex flex-col bg-[#F8FAFC]">
      {/* MESSAGES LIST AREA */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {messages.length === 1 && messages[0].id === 'welcome-msg' ? (
          <div className="min-h-full flex flex-col justify-center max-w-[760px] mx-auto py-8">
            <div className="mb-7">
              <div className="w-11 h-11 rounded-xl bg-[#142B50] text-white flex items-center justify-center mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h1 className="text-[22px] leading-tight font-bold text-[#172B4D] mb-2">
                Xin chào! Tôi là trợ lý pháp lý AI của CELRA.
              </h1>
              <p className="text-[14px] leading-6 text-slate-600 max-w-[680px]">
                Mô tả tình huống hoặc đặt câu hỏi về nghĩa vụ pháp lý của doanh nghiệp.
                Tôi sẽ giúp bạn hiểu quy định và xác định những việc cần thực hiện.
              </p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
              {quickPrompts.map((q) => (
                <button
                  key={q.title}
                  type="button"
                  onClick={() => handleSendMessage(q.title)}
                  className="min-h-[64px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-[#2563EB]/50 hover:bg-blue-50/40 transition-colors cursor-pointer"
                >
                  <span className="block text-[13px] font-semibold text-[#172B4D]">{q.title}</span>
                  <span className="block mt-1 text-[11px] text-slate-500">{q.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {messages.filter((msg) => !(msg.id === 'welcome-msg' && messages.length === 1)).map((msg) => {
          const isUser = msg.sender === 'USER';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#142B50] text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Content */}
              {/* Message Bubble Content - Tự co giãn theo chiều rộng màn hình lớn */}
              <div className={`${isExpanded ? 'max-w-[92%]' : 'max-w-[88%]'} space-y-2.5`}>
                <div
                  className={`p-4 rounded-2xl text-[13px] shadow-xs space-y-2.5 leading-relaxed ${
                    isUser
                      ? 'bg-[#EAF2FF] text-[#172B4D] rounded-tr-md'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-tl-md'
                  }`}
                >
                  {isUser ? (
                    <div className="text-[#172B4D] text-[13px] leading-relaxed">
                      {renderFormattedText(msg.text)}
                    </div>
                  ) : (
                    <StructuredAIMessage
                      text={msg.text}
                      citations={msg.citations || []}
                      organization={activeOrg}
                      onSendMessage={(txt) => handleSendMessage(txt)}
                      onOpenAuditModal={handleOpenAudit}
                      resolveCitationUrl={resolveCitationUrl}
                      isEnterpriseQuery={msg.isEnterpriseQuery ?? (msg.actionType === 'enterprise_audit')}
                      verificationChecklist={msg.verificationChecklist}
                    />
                  )}

                  {/* VẤN ĐỀ 2: UPSELL CARD KHI PHÁT HIỆN HỎI QUÉT LỖI DN */}
                  {msg.actionType === 'open_compliance_audit' && (
                    <div className="mt-3 p-3.5 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border-2 border-teal-500/40 rounded-xl space-y-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-teal-600 text-white rounded-lg">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-teal-950">
                            Kích hoạt Rà soát Tuân thủ Doanh nghiệp
                          </h5>
                          <span className="text-[10px] text-teal-800">
                            Phân tích bối cảnh tự động • Tạo Checklist điều phối theo gói thuê bao
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleOpenAudit}
                        className="w-full py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-200" />
                        <span>Mở Rà soát Tuân thủ ngay</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* PROPOSED CHECKLIST CARDS */}
                  {msg.proposedChecklists && msg.proposedChecklists.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Đề xuất tác vụ tuân thủ cần làm ngay:</span>
                      </div>

                      {msg.proposedChecklists.map((prop) => {
                        const isDone = acceptedProposals[prop.id];
                        const isSubmitting = isAccepting[prop.id];
                        return (
                          <div
                            key={prop.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                {prop.code}
                              </span>
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                {prop.priority === 'urgent' ? 'Khẩn cấp' : 'Mức độ cao'}
                              </span>
                            </div>

                            <h6 className="text-xs font-bold text-slate-900 leading-snug">
                              {prop.title}
                            </h6>

                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {prop.reason}
                            </p>

                            <div className="pt-1 flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 italic">
                                Luật: {prop.legalBasis}
                              </span>

                              {isDone ? (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Đã tạo Task
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleAcceptProposal(prop)}
                                  disabled={isSubmitting}
                                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                                >
                                  <PlusCircle className="w-3 h-3" />
                                  {isSubmitting ? 'Đang tạo...' : 'Tạo Checklist ngay'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {msg.timestamp && (
                  <div className={`text-[10px] text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#142B50] text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-md shadow-xs text-xs text-slate-600 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-[#2563EB] animate-spin" />
              <span>CELRA AI đang đối chiếu bối cảnh và căn cứ pháp lý...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {messages.length > 1 ? (
        <div className="px-5 pb-2 bg-[#F8FAFC] shrink-0">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {quickPrompts.slice(0, 3).map((q) => (
              <button
                key={q.title}
                type="button"
                onClick={() => handleSendMessage(q.title)}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:border-[#2563EB]/40 hover:text-[#2563EB] transition-colors cursor-pointer"
              >
                {q.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* INPUT BAR */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        {attachedFile ? (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] text-[#172B4D]">
            <span className="flex items-center gap-2 min-w-0">
              <Paperclip className="w-4 h-4 shrink-0 text-[#2563EB]" />
              <span className="truncate">{attachedFile.name}</span>
            </span>
            <button type="button" onClick={() => setAttachedFile(null)} className="ml-2 text-slate-500 hover:text-slate-800 cursor-pointer" aria-label="Gỡ tài liệu">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <label className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-[#2563EB]/40 hover:text-[#2563EB] cursor-pointer" title="Đính kèm PDF hoặc DOCX">
            <Paperclip className="w-4 h-4" />
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(event) => setAttachedFile(event.target.files?.[0] || null)}
            />
          </label>
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Nhập câu hỏi hoặc mô tả tình huống pháp lý của doanh nghiệp..."
            value={inputText}
            onFocus={() => setTimeout(() => scrollToBottom('smooth'), 120)}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={loading}
            className="flex-1 max-h-32 min-h-10 resize-none px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[16px] md:text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className={`w-10 h-10 shrink-0 rounded-lg text-white flex items-center justify-center transition-colors cursor-pointer ${
              inputText.trim() && !loading
                ? 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Gửi câu hỏi"
            aria-label="Gửi câu hỏi"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <p className="mt-2 text-[10px] text-slate-400 text-center">
          Nội dung AI hỗ trợ tham khảo và không thay thế ý kiến tư vấn pháp lý chuyên môn.
        </p>
      </div>
        </div>

        {contextPanelOpen ? (
          <aside className="hidden lg:flex w-[300px] shrink-0 flex-col border-l border-slate-200 bg-white overflow-y-auto">
            <div className="h-[52px] px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[12px] font-bold text-[#172B4D]">Ngữ cảnh câu hỏi</span>
              <button
                type="button"
                onClick={() => setContextPanelOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                title="Thu gọn panel ngữ cảnh"
                aria-label="Thu gọn panel ngữ cảnh"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <section>
                <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <Building2 className="w-4 h-4" />
                  Doanh nghiệp
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[13px] font-bold text-[#172B4D]">
                    {activeOrg?.legalName || activeOrg?.name || 'Chưa cập nhật tên doanh nghiệp'}
                  </p>
                  {activeOrg?.legalType || activeOrg?.loaiHinhPhapLy ? (
                    <p className="mt-1 text-[11px] text-slate-500">{activeOrg.legalType || activeOrg.loaiHinhPhapLy}</p>
                  ) : null}
                  {activeOrg?.industry || activeOrg?.nganhNghe ? (
                    <p className="mt-2 text-[11px] text-slate-600">Ngành: {activeOrg.industry || activeOrg.nganhNghe}</p>
                  ) : null}
                  {activeOrg?.scale ? (
                    <p className="mt-1 text-[11px] text-slate-600">Quy mô: {activeOrg.scale}</p>
                  ) : null}
                </div>
              </section>

              <section>
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Chủ đề hiện tại</h4>
                {latestUserMessage ? (
                  <p className="text-[12px] leading-5 text-slate-700">{latestUserMessage.text}</p>
                ) : (
                  <p className="text-[12px] leading-5 text-slate-500">Chưa có câu hỏi trong phiên này.</p>
                )}
                {latestAiMessage?.verificationChecklist?.length ? (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Cần xác minh thêm thông tin từ doanh nghiệp.</span>
                  </div>
                ) : null}
              </section>

              <section>
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Tài liệu tham khảo</h4>
                {latestAiMessage?.citations?.length ? (
                  <div className="space-y-2">
                    {latestAiMessage.citations.slice(0, 4).map((citation, index) => (
                      <a
                        key={`${citation.docNumber}-${index}`}
                        href={resolveCitationUrl(citation)}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg border border-slate-200 p-3 hover:border-[#2563EB]/40"
                      >
                        <p className="text-[12px] font-semibold text-[#172B4D]">{citation.title}</p>
                        {citation.docNumber ? <p className="mt-1 text-[10px] text-slate-500">{citation.docNumber}</p> : null}
                        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#2563EB]">
                          Xem chi tiết <ExternalLink className="w-3 h-3" />
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] leading-5 text-slate-500">Chưa xác minh được văn bản pháp luật cho câu hỏi hiện tại.</p>
                )}
              </section>

              <section>
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Hành động nhanh</h4>
                <div className="space-y-2">
                  <button type="button" onClick={handleOpenAudit} className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-[#172B4D] hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                    <ClipboardCheck className="w-4 h-4 text-[#2563EB]" />
                    Đánh giá tuân thủ
                  </button>
                  <button type="button" onClick={() => navigate('/tasks')} className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-[#172B4D] hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                    <BookmarkPlus className="w-4 h-4 text-[#2563EB]" />
                    Tạo nhiệm vụ liên quan
                  </button>
                </div>
              </section>
            </div>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setContextPanelOpen(true)}
            className="hidden lg:flex w-10 h-10 mt-3 mr-3 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#2563EB] cursor-pointer"
            title="Mở panel ngữ cảnh"
            aria-label="Mở panel ngữ cảnh"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
        )}
      </div>
    </Drawer>
  );
};
export default AIChatDrawer;

