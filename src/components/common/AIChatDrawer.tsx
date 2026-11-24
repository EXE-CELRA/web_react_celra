import React, { useState, useRef, useEffect } from 'react';
import { Drawer, message as antMessage } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Send,
  PlusCircle,
  X,
  Maximize2,
  Minimize2,
  Paperclip,
  Building2,
} from 'lucide-react';
import apiClient from '../../api/client';
import { useOrgStore } from '../../store/useOrgStore';
import { useAuthStore } from '../../store/useAuthStore';
import '../CelraMascot/CelraMascot.css';
import {
  type CitationItem,
  type ProposedChecklistItem,
  type VerificationOption,
  type VerificationChecklistItem,
  type MessageItem,
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
  getDefaultWelcomeMessage,
} from './ai-chat/ai-chat.utils';
import { ChatMessageList } from './ai-chat/ChatMessageList';

export type {
  CitationItem,
  ProposedChecklistItem,
  VerificationOption,
  VerificationChecklistItem,
  MessageItem,
};

interface AIChatDrawerProps {
  visible: boolean;
  onClose: () => void;
  onOpenAuditModal?: () => void;
}

/**
 * AIChatDrawer — Không gian làm việc Trợ lý Pháp lý AI CELRA
 * Thiết kế chuẩn Enterprise SaaS: Minimalist, LegalTech Hierarchy
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

  const [isExpanded, setIsExpanded] = useState<boolean>(
    () => localStorage.getItem('celra_chat_expanded') === 'true',
  );
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>(
    () =>
      loadChatHistory(user?.id, currentOrgId) ?? [
        getDefaultWelcomeMessage(activeOrg?.legalName || activeOrg?.name),
      ],
  );

  // Tải đúng lịch sử theo người dùng và doanh nghiệp đang chọn
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const history = loadChatHistory(user.id, currentOrgId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(
      history && history.length > 0
        ? history
        : [getDefaultWelcomeMessage(activeOrg?.legalName || activeOrg?.name)],
    );
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
    const userTimestamp = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

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
      const replyContent =
        res.content || res.answer || 'Đã ghi nhận yêu cầu và đối chiếu dữ liệu tuân thủ.';
      const validActionType:
        | 'info'
        | 'open_compliance_audit'
        | 'task_proposal'
        | 'enterprise_audit' =
        res.actionType === 'enterprise_audit' ||
        res.actionType === 'open_compliance_audit' ||
        res.actionType === 'task_proposal'
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
          isEnterpriseQuery: Boolean(
            res.isEnterpriseQuery || validActionType === 'enterprise_audit',
          ),
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
        const e = err as {
          message?: string;
          error?: string;
          response?: { data?: { message?: string } };
        };
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

  return (
    <Drawer
      title={null}
      closable={false}
      placement="right"
      width={
        isExpanded
          ? '96vw'
          : typeof window !== 'undefined' && window.innerWidth < 1024
            ? '100vw'
            : 'calc(100vw - 260px)'
      }
      onClose={onClose}
      open={visible}
      styles={{
        header: { display: 'none' },
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: '#F5F8FC',
        },
        wrapper: { maxWidth: '100vw', transition: 'width 0.25s ease-in-out' },
      }}
    >
      {/* MAIN HEADER (Clean, Enterprise, Height: 68px, Background: White) */}
      <header className="h-[68px] px-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <h2 className="text-[15px] font-bold text-[#172B4D] tracking-tight">
              Trợ lý Pháp lý AI
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sẵn sàng
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 hidden md:block shrink-0" />

          {activeOrg?.legalName || activeOrg?.name ? (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] min-w-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-[#172B4D] truncate max-w-[320px]">
                {activeOrg.legalName || activeOrg.name}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col bg-[#F5F8FC]">
          {/* Scrollable Message List / Welcome Screen */}
          <ChatMessageList
            messages={messages}
            loading={loading}
            activeOrg={activeOrg}
            acceptedProposals={acceptedProposals}
            isAccepting={isAccepting}
            bottomRef={bottomRef}
            onSendMessage={handleSendMessage}
            onAcceptProposal={handleAcceptProposal}
            onOpenAudit={handleOpenAudit}
          />

          {/* INPUT CHATBOX (Fixed bottom, Minimalist, Modern, Floating Card) */}
          <div className="p-5 bg-gradient-to-t from-[#F5F8FC] via-[#F5F8FC] to-transparent shrink-0">
            <div className="max-w-4xl mx-auto">
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

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100 transition-all p-2.5 flex items-end gap-2"
              >
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

              <p className="mt-2 text-[11px] text-slate-400 text-center">
                CELRA AI hỗ trợ tra cứu và điều phối tuân thủ cho SME. Đối chiếu với văn bản quy
                phạm pháp luật chính thức.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default AIChatDrawer;
