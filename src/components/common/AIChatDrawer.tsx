import React, { useState, useRef, useEffect } from 'react';
import { Drawer, message as antMessage } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/client';
import { useOrgStore } from '../../store/useOrgStore';
import { useAuthStore } from '../../store/useAuthStore';
import mascotImg from '../../assets/celra-mascot.png';
import '../CelraMascot/CelraMascot.css';
import { StructuredAIMessage } from './StructuredAIMessage';
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../api/legalApi';
import { 
  Send, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  PlusCircle, 
  X, 
  RefreshCw, 
  Maximize2, 
  Minimize2,
  Paperclip,
  Building2,
  BookOpen,
} from 'lucide-react';

export interface CitationItem {
  title: string;
  docNumber: string;
  articleNumber?: string;
  sourceUrl?: string;
  url?: string;
}

export interface ProposedChecklistItem {
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

export interface MessageItem {
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
    // Storage full or unavailable — silently fail
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
  text: `Xin chào! Tôi là Trợ lý Pháp lý AI của CELRA.\n\nTôi hỗ trợ doanh nghiệp tìm hiểu quy định pháp luật, xác định nghĩa vụ tuân thủ và quản lý các công việc cần thực hiện.\n\n${companyName ? `Bối cảnh áp dụng: **${companyName}**.` : 'Hãy nhập câu hỏi pháp lý để bắt đầu.'}`,
  actionType: 'info',
});

// Chuẩn hóa và khắc phục liên kết văn bản pháp luật gốc
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

// 3 câu hỏi gợi ý cốt lõi chuẩn Enterprise LegalTech
const CURATED_SUGGESTIONS = [
  {
    title: 'Doanh nghiệp của tôi có những nghĩa vụ thuế TNDN và GTGT nào sắp đến hạn quý này?',
    category: 'Thuế TNDN & GTGT',
  },
  {
    title: 'Quy định về thời hạn lập và lưu trữ hồ sơ lao động theo Bộ luật Lao động 2019?',
    category: 'Lao động & Tiền lương',
  },
  {
    title: 'Kiểm tra danh mục tuân thủ pháp lý bắt buộc đối với ngành bán lẻ vàng bạc đá quý?',
    category: 'Điều kiện kinh doanh',
  },
];

/**
 * AIChatDrawer — Không gian làm việc Trợ lý Pháp lý AI CELRA
 * Thiết kế chuẩn Enterprise SaaS: Minimalist, 3-Column Layout, LegalTech Hierarchy
 */
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

  // Bảo vệ màn hình đăng nhập: Chỉ người dùng đã đăng nhập mới được sử dụng
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
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>(() => {
    return loadChatHistory(user?.id, currentOrgId) ?? [getDefaultWelcomeMessage(activeOrg?.legalName || activeOrg?.name)];
  });

  // Tải đúng lịch sử theo người dùng và doanh nghiệp đang chọn
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const history = loadChatHistory(user.id, currentOrgId);
    setMessages(history && history.length > 0 ? history : [getDefaultWelcomeMessage(activeOrg?.legalName || activeOrg?.name)]);
  }, [user?.id, currentOrgId, activeOrg?.legalName, activeOrg?.name, isAuthenticated]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedProposals, setAcceptedProposals] = useState<Record<string, boolean>>({});
  const [isAccepting, setIsAccepting] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    if (visible) {
      const timer1 = setTimeout(() => scrollToBottom('auto'), 80);
      const timer2 = setTimeout(() => scrollToBottom('smooth'), 250);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [visible]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, loading]);

  useEffect(() => {
    if (isAuthenticated && user?.id && messages.length > 0) {
      saveChatHistory(messages, user.id, currentOrgId);
    }
  }, [messages, user?.id, currentOrgId, isAuthenticated]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    setInputText('');
    const fileName = attachedFile?.name;
    setAttachedFile(null);
    const userMsgId = `usr-${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'USER',
        text: fileName ? `${query}\n[Tài liệu đính kèm: ${fileName}]` : query,
        timestamp: userTimestamp,
      },
    ]);
    setLoading(true);

    try {
      const res = (await apiClient.post('/ai-assistant/chat', {
        message: query,
        question: query,
        history: messages.slice(-10).map((m) => ({
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
      const replyContent = res.content || res.answer || 'Đã ghi nhận yêu cầu và đối chiếu dữ liệu tuân thủ.';
      const validActionType =
        res.actionType === 'enterprise_audit' || res.actionType === 'open_compliance_audit' || res.actionType === 'task_proposal'
          ? res.actionType
          : 'info';

      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'AI',
          text: replyContent,
          citations: res.citations || [],
          actionType: validActionType,
          isEnterpriseQuery: Boolean(res.isEnterpriseQuery || validActionType === 'enterprise_audit'),
          verificationChecklist: res.verificationChecklist || [],
          ctaButton: res.ctaButton,
          proposedChecklists: res.proposedChecklists || [],
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: unknown) {
      let backendMsg = 'Đã có sự cố kết nối tới Engine AI. Vui lòng thử lại sau giây lát.';
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
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
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
      antMessage.success(`Đã thêm nhiệm vụ tuân thủ: "${proposal.title}"`);
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

  const isWelcomeScreen = messages.length === 1 && messages[0].id === 'welcome-msg';

  return (
    <Drawer
      title={null}
      closable={false}
      placement="right"
      width={isExpanded ? '96vw' : (typeof window !== 'undefined' && window.innerWidth < 1024 ? '100vw' : 'calc(100vw - 260px)')}
      onClose={onClose}
      open={visible}
      styles={{
        header: { display: 'none' },
        body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%', background: '#F5F8FC' },
        wrapper: { maxWidth: '100vw', transition: 'width 0.25s ease-in-out' }
      }}
    >
      {/* ==============================================================
          MAIN HEADER (Clean, Enterprise, Height: 68px, Background: White)
          ============================================================== */}
      <header className="h-[68px] px-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between shrink-0 z-10 shadow-xs">
        
        {/* Left Title & Organization Context */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <h2 className="text-[15px] font-bold text-[#172B4D] tracking-tight">
              Trợ lý Pháp lý AI
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Sẵn sàng
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 hidden md:block shrink-0"></div>

          {/* Enterprise Badge */}
          {activeOrg?.legalName || activeOrg?.name ? (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] min-w-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-[#172B4D] truncate max-w-[320px]">
                {activeOrg.legalName || activeOrg.name}
              </span>
            </div>
          ) : null}
        </div>

        {/* Right Header Actions (Chỉ giữ chức năng thực sự cần thiết) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Bắt đầu phiên mới */}
          <button
            type="button"
            onClick={() => {
              clearChatHistory(user?.id, currentOrgId);
              setMessages([getDefaultWelcomeMessage(activeOrg?.legalName || activeOrg?.name)]);
              antMessage.success('Đã bắt đầu phiên tư vấn mới!');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#172B4D] bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Bắt đầu phiên tư vấn mới"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Phiên mới</span>
          </button>

          {/* Toggle Phóng to / Thu nhỏ */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded((prev) => {
                const next = !prev;
                localStorage.setItem('celra_chat_expanded', String(next));
                return next;
              });
            }}
            className="p-2 text-slate-500 hover:text-[#172B4D] hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title={isExpanded ? 'Thu nhỏ giao diện' : 'Phóng to tối đa'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Đóng Drawer */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-[#172B4D] hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Đóng khung chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ==============================================================
          MAIN CONTENT AREA (Chat Column + Right Context Panel)
          ============================================================== */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* ==============================================================
            CHAT COLUMN (Welcome Screen / Conversation + Fixed Input)
            ============================================================== */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#F5F8FC]">
          
          {/* Scrollable Message List / Welcome Screen */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
            
            {/* WELCOME SCREEN (Khi chưa có hội thoại) */}
            {isWelcomeScreen ? (
              <div className="min-h-full flex flex-col items-center justify-center max-w-2xl mx-auto py-8">
                
                {/* Mascot CELRA (Kích thước vừa phải: 76px, tĩnh, bóng đổ nhẹ) */}
                <div className="mb-5 relative">
                  <div className="w-[76px] h-[84px] flex items-center justify-center">
                    <img 
                      src={mascotImg} 
                      alt="CELRA Mascot" 
                      className="w-full h-full object-contain filter drop-shadow(0 8px 16px rgba(20,43,80,0.12))"
                      draggable={false}
                    />
                  </div>
                  <span className="absolute -bottom-1 right-2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs"></span>
                </div>

                <h3 className="text-xl font-bold text-[#172B4D] text-center tracking-tight mb-2">
                  Xin chào! Tôi là Trợ lý Pháp lý AI của CELRA.
                </h3>
                <p className="text-[13.5px] leading-relaxed text-[#64748B] text-center max-w-lg mb-8">
                  Tôi hỗ trợ doanh nghiệp tìm hiểu quy định pháp luật, xác định nghĩa vụ tuân thủ và quản lý các công việc cần thực hiện.
                </p>

                {/* Đúng 3 câu hỏi gợi ý cốt lõi */}
                <div className="w-full space-y-2.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-1">
                    Câu hỏi đề xuất dành cho doanh nghiệp
                  </div>

                  {CURATED_SUGGESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(s.title)}
                      className="w-full text-left p-3.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-sm transition-all group flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-[#172B4D] group-hover:text-[#2563EB] transition-colors leading-relaxed">
                          {s.title}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* CONVERSATION LIST (Khi đã có tin nhắn trao đổi) */}
            {!isWelcomeScreen && (
              <div className="max-w-4xl mx-auto w-full space-y-6">
                {messages.map((msg) => {
              const isUser = msg.sender === 'USER';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                      isUser
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-white border border-[#E2E8F0] p-1'
                    }`}
                  >
                    {isUser ? (
                      <span className="text-[11px] font-semibold">Tôi</span>
                    ) : (
                      <img src={mascotImg} alt="CELRA AI" className="w-full h-full object-contain" />
                    )}
                  </div>

                  {/* Message Bubble Content */}
                  <div className={`space-y-1.5 ${isUser ? 'max-w-[75%]' : 'max-w-[85%]'}`}>
                    <div
                      className={`p-4 rounded-2xl text-[13px] leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-[#2563EB] text-white rounded-tr-xs'
                          : 'bg-white text-[#172B4D] border border-[#E2E8F0] rounded-tl-xs'
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap leading-relaxed text-[13px]">
                          {msg.text}
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

                      {/* PROPOSED CHECKLIST CARDS */}
                      {msg.proposedChecklists && msg.proposedChecklists.length > 0 && (
                        <div className="mt-3.5 space-y-2 pt-3 border-t border-slate-100">
                          <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Đề xuất nhiệm vụ tuân thủ cần làm:</span>
                          </div>

                          {msg.proposedChecklists.map((prop) => {
                            const isDone = acceptedProposals[prop.id];
                            const isSubmitting = isAccepting[prop.id];
                            return (
                              <div
                                key={prop.id}
                                className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1.5"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                    {prop.code}
                                  </span>
                                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                    {prop.priority === 'urgent' ? 'Khẩn cấp' : 'Mức độ cao'}
                                  </span>
                                </div>

                                <div className="text-xs font-bold text-[#142B50] leading-snug">
                                  {prop.title}
                                </div>

                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                  {prop.reason}
                                </p>

                                <div className="pt-1 flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500 italic">
                                    Luật: {prop.legalBasis}
                                  </span>

                                  {isDone ? (
                                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      Đã tạo Task
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAcceptProposal(prop)}
                                      disabled={isSubmitting}
                                      className="px-2.5 py-1 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                                    >
                                      <PlusCircle className="w-3 h-3" />
                                      {isSubmitting ? 'Đang tạo...' : 'Tạo Checklist'}
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

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-[#E2E8F0] p-1 shadow-xs flex items-center justify-center shrink-0">
                  <img src={mascotImg} alt="CELRA AI" className="w-full h-full object-contain" />
                </div>
                <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-xs shadow-xs text-xs text-slate-600 flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4 text-[#2563EB] animate-spin" />
                  <span>CELRA AI đang đối chiếu bối cảnh doanh nghiệp và căn cứ pháp luật...</span>
                </div>
              </div>
            )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ==============================================================
              INPUT CHATBOX (Fixed bottom, Minimalist, Modern, Floating Card)
              ============================================================== */}
          <div className="p-5 bg-gradient-to-t from-[#F5F8FC] via-[#F5F8FC] to-transparent shrink-0">
            <div className="max-w-4xl mx-auto">
              
              {/* File Attachment Pill */}
              {attachedFile ? (
                <div className="mb-2 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-[#172B4D]">
                  <span className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="truncate font-medium">{attachedFile.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="ml-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Gỡ tài liệu"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null}

              {/* Input Form Container */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100 transition-all p-2.5 flex items-end gap-2"
              >
                {/* Attachment Button */}
                <label 
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:text-[#172B4D] hover:bg-slate-50 transition-colors cursor-pointer" 
                  title="Đính kèm tài liệu (PDF, Word)"
                >
                  <Paperclip className="w-4 h-4" />
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                  />
                </label>

                {/* Auto-expanding Textarea */}
                <div className="flex-1 min-h-[36px] flex items-center">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    placeholder="Nhập câu hỏi pháp lý, quy định thuế, lao động hoặc nghĩa vụ tuân thủ..."
                    value={inputText}
                    onFocus={() => setTimeout(() => scrollToBottom('smooth'), 120)}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={loading}
                    className="w-full text-xs text-[#172B4D] placeholder-slate-400 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 leading-relaxed py-1"
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || loading}
                  className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                    inputText.trim() && !loading
                      ? 'bg-[#2563EB] hover:bg-blue-700 text-white cursor-pointer shadow-xs'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                  title="Gửi câu hỏi (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Reassuring Legal Disclaimer */}
              <p className="mt-2 text-[11px] text-slate-400 text-center">
                CELRA AI hỗ trợ tra cứu và điều phối tuân thủ cho SME. Đối chiếu với văn bản quy phạm pháp luật chính thức.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default AIChatDrawer;

