import React, { useState, useRef, useEffect } from 'react';
import { Drawer, message as antMessage } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Send,
  X,
  RefreshCw,
  Maximize2,
  Minimize2,
  Paperclip,
  History,
} from 'lucide-react';
import apiClient from '../../api/client';
import { useOrgStore } from '../../store/useOrgStore';
import { useAuthStore } from '../../store/useAuthStore';
import mascotImg from '../../assets/celra-mascot.png';
import '../CelraMascot/CelraMascot.css';
import {
  type CitationItem,
  type ProposedChecklistItem,
  type VerificationOption,
  type VerificationChecklistItem,
  type MessageItem,
  QUICK_PROMPTS,
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
  getDefaultWelcomeMessage,
} from './ai-chat/ai-chat.utils';
import { ChatMessageList } from './ai-chat/ChatMessageList';
import { ChatContextSidebar } from './ai-chat/ChatContextSidebar';

export type { VerificationOption, VerificationChecklistItem };

interface AIChatDrawerProps {
  visible: boolean;
  onClose: () => void;
  onOpenAuditModal?: () => void;
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

  // 🛡️ Chỉ người dùng đã đăng nhập mới được phép mở và sử dụng khung chat
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
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>(
    () => loadChatHistory(user?.id, currentOrgId) ?? [getDefaultWelcomeMessage(activeOrg?.name)],
  );

  // Cô lập lịch sử chat theo userId và Doanh nghiệp hiện hành
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const history = loadChatHistory(user.id, currentOrgId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(
      history && history.length > 0 ? history : [getDefaultWelcomeMessage(activeOrg?.name)],
    );
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
        res.content || res.answer || 'Đã ghi nhận câu hỏi và xử lý dữ liệu tuân thủ.';
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
      let backendMsg =
        'Rất tiếc, đã có sự cố kết nối tới Engine Trợ lý AI. Vui lòng kiểm tra lại kết nối và thử lại.';
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

  const latestAiMessage = [...messages]
    .reverse()
    .find((m) => m.sender === 'AI' && m.id !== 'welcome-msg');
  const latestUserMessage = [...messages].reverse().find((m) => m.sender === 'USER');

  return (
    <Drawer
      title={null}
      placement="right"
      width={isExpanded ? '96vw' : window.innerWidth < 1024 ? '100vw' : '88vw'}
      onClose={onClose}
      open={visible}
      styles={{
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: '#f8fafc',
        },
        wrapper: { maxWidth: '100vw', transition: 'width 0.25s ease-in-out' },
      }}
    >
      {/* DRAWER HEADER */}
      <div className="h-[72px] px-5 bg-[#142B50] text-white flex items-center justify-between border-b border-[#203a66] shrink-0">
        <div className="flex items-center gap-3">
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
              <h3 className="text-[15px] font-bold text-white tracking-wide">Trợ lý pháp lý AI</h3>
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
            onClick={() =>
              antMessage.info('Lịch sử cuộc trò chuyện được lưu theo doanh nghiệp hiện tại.')
            }
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
            title={
              isExpanded
                ? 'Thu nhỏ giao diện chat (Mặc định 68vw)'
                : 'Phóng to tối đa màn hình (96vw)'
            }
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
          {/* MESSAGES LIST */}
          <ChatMessageList
            messages={messages}
            loading={loading}
            isExpanded={isExpanded}
            activeOrg={activeOrg}
            acceptedProposals={acceptedProposals}
            isAccepting={isAccepting}
            bottomRef={bottomRef}
            onSendMessage={handleSendMessage}
            onAcceptProposal={handleAcceptProposal}
            onOpenAudit={handleOpenAudit}
          />

          {/* QUICK PROMPT CHIPS */}
          {messages.length > 1 ? (
            <div className="px-5 pb-2 bg-[#F8FAFC] shrink-0">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {QUICK_PROMPTS.slice(0, 3).map((q) => (
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
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="ml-2 text-slate-500 hover:text-slate-800 cursor-pointer"
                  aria-label="Gỡ tài liệu"
                >
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
              <label
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-[#2563EB]/40 hover:text-[#2563EB] cursor-pointer"
                title="Đính kèm PDF hoặc DOCX"
              >
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
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
            <p className="mt-2 text-[10px] text-slate-400 text-center">
              Nội dung AI hỗ trợ tham khảo và không thay thế ý kiến tư vấn pháp lý chuyên môn.
            </p>
          </div>
        </div>

        {/* RIGHT CONTEXT SIDEBAR */}
        <ChatContextSidebar
          open={contextPanelOpen}
          activeOrg={activeOrg}
          latestUserMessage={latestUserMessage}
          latestAiMessage={latestAiMessage}
          onToggleOpen={setContextPanelOpen}
          onOpenAudit={handleOpenAudit}
          onOpenTasks={() => navigate('/tasks')}
        />
      </div>
    </Drawer>
  );
};

export default AIChatDrawer;
