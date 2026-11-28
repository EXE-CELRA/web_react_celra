import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  PanelLeft,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import apiClient from '../../api/client';
import { useOrgStore } from '../../store/useOrgStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { ConversationItem, ConversationDetail } from '../../interfaces/aiAssistant.interface';
import '../CelraMascot/CelraMascot.css';
import {
  type CitationItem,
  type ProposedChecklistItem,
  type VerificationOption,
  type VerificationChecklistItem,
  type MessageItem,
  getDefaultWelcomeMessage,
  getStoredActiveConversationId,
  setStoredActiveConversationId,
} from './ai-chat/ai-chat.utils';
import { ChatMessageList } from './ai-chat/ChatMessageList';
import { ConversationHistorySidebar } from './ai-chat/ConversationHistorySidebar';

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
 * Thiết kế chuẩn Enterprise SaaS: Minimalist, ChatGPT-like Conversation History
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
  const [showHistorySidebar, setShowHistorySidebar] = useState<boolean>(
    () => localStorage.getItem('celra_chat_sidebar') !== 'false',
  );

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() =>
    getStoredActiveConversationId(user?.id, currentOrgId),
  );
  const [loadingConversations, setLoadingConversations] = useState<boolean>(false);

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [conversationFileIds, setConversationFileIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([
    getDefaultWelcomeMessage(activeOrg?.legalName || activeOrg?.name),
  ]);

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

  // Mở lại một cuộc trò chuyện cũ từ Database
  const loadConversationDetail = useCallback(
    async (convId: string) => {
      setActiveConversationId(convId);
      setStoredActiveConversationId(convId, user?.id, currentOrgId);
      setLoading(true);
      try {
        const detail = (await apiClient.get(
          `/ai-assistant/conversations/${convId}`,
        )) as ConversationDetail;
        if (detail && Array.isArray(detail.messages)) {
          if (detail.messages.length === 0) {
            setMessages([getDefaultWelcomeMessage(activeOrg?.legalName || activeOrg?.name)]);
          } else {
            setMessages(detail.messages);
          }
        }
      } catch (err: unknown) {
        console.warn('Không thể mở cuộc trò chuyện đã chọn:', err);
        setMessages([getDefaultWelcomeMessage(activeOrg?.legalName || activeOrg?.name)]);
        setActiveConversationId(null);
        setStoredActiveConversationId(null, user?.id, currentOrgId);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, currentOrgId, activeOrg?.legalName, activeOrg?.name],
  );

  // Bắt đầu phiên trò chuyện mới (mở khung chat mới toanh, không có câu hỏi cũ)
  const startNewConversation = useCallback(
    (showToast = true) => {
      setActiveConversationId(null);
      setStoredActiveConversationId(null, user?.id, currentOrgId);
      setActiveFileId(null);
      setConversationFileIds([]);
      setAttachedFile(null);
      setInputText('');
      setAcceptedProposals({});
      setIsAccepting({});
      setMessages([getDefaultWelcomeMessage(activeOrg?.legalName || activeOrg?.name)]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      if (showToast) {
        antMessage.success('Đã mở phiên trò chuyện mới!');
      }
    },
    [user?.id, currentOrgId, activeOrg?.legalName, activeOrg?.name],
  );

  // Tải danh sách cuộc trò chuyện từ Database
  const fetchConversations = useCallback(
    async (selectIdAfterFetch?: string | null) => {
      if (!isAuthenticated || !currentOrgId) return;
      setLoadingConversations(true);
      try {
        const res = (await apiClient.get('/ai-assistant/conversations')) as ConversationItem[];
        const convList = Array.isArray(res) ? res : [];
        setConversations(convList);

        // Trường hợp 1: Có chỉ định rõ ràng ID cần nạp (hoặc null để giữ nguyên phiên mới toanh)
        if (selectIdAfterFetch !== undefined) {
          if (selectIdAfterFetch && convList.some((c) => c.id === selectIdAfterFetch)) {
            loadConversationDetail(selectIdAfterFetch);
          } else {
            startNewConversation(false);
          }
          return;
        }

        // Trường hợp 2: Lần đầu mở Drawer, nếu có phiên đã lưu trong localStorage và phiên đó còn tồn tại
        const storedId = getStoredActiveConversationId(user?.id, currentOrgId);
        if (storedId && convList.some((c) => c.id === storedId)) {
          loadConversationDetail(storedId);
        } else {
          // Mặc định hoặc khi đang ở phiên mới: mở khung chat mới toanh, không tự ý nạp câu hỏi của phiên cũ
          startNewConversation(false);
        }
      } catch (err) {
        console.warn('Lỗi tải lịch sử hội thoại từ DB:', err);
      } finally {
        setLoadingConversations(false);
      }
    },
    [isAuthenticated, currentOrgId, user?.id, loadConversationDetail, startNewConversation],
  );

  // Tự động đồng bộ lịch sử khi Drawer mở ra hoặc đổi Org/User
  useEffect(() => {
    if (visible && isAuthenticated && currentOrgId) {
      fetchConversations();
    }
  }, [visible, isAuthenticated, currentOrgId, fetchConversations]);

  // Xóa một cuộc trò chuyện
  const handleDeleteConversation = async (convId: string) => {
    try {
      await apiClient.delete(`/ai-assistant/conversations/${convId}`);
      antMessage.success('Đã xóa cuộc trò chuyện.');
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        startNewConversation(false);
      }
    } catch (err: unknown) {
      const e = err as { message?: string } | null;
      antMessage.error(e?.message || 'Không thể xóa cuộc trò chuyện.');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if ((!query && !attachedFile) || loading) return;

    const actualQuery = query || 'Đọc và phân tích tệp tài liệu đính kèm này giúp tôi.';
    setInputText('');
    const fileToUpload = attachedFile;
    const fileName = fileToUpload?.name;
    setAttachedFile(null);
    const userMsgId = `usr-${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setMessages((prev) => [
      ...prev.filter((m) => m.id !== 'welcome-msg'),
      {
        id: userMsgId,
        sender: 'USER',
        text: fileName ? `${actualQuery}\n[Tài liệu đính kèm: ${fileName}]` : actualQuery,
        timestamp: userTimestamp,
      },
    ]);
    setLoading(true);

    try {
      let uploadedFileId = activeFileId || undefined;
      if (fileToUpload) {
        try {
          const formData = new FormData();
          formData.append('file', fileToUpload);
          if (activeConversationId) {
            formData.append('conversationId', activeConversationId);
          }
          const uploadRes = (await apiClient.post('/ai-assistant/upload-file', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })) as { fileId?: string; fileName?: string; summary?: string };

          if (uploadRes?.fileId) {
            uploadedFileId = uploadRes.fileId;
            setActiveFileId(uploadedFileId);
            setConversationFileIds((prev) => Array.from(new Set([...prev, uploadedFileId!])));
          }
        } catch (uploadErr: unknown) {
          const errObj = uploadErr as { message?: string } | null;
          antMessage.warning(
            errObj?.message || 'Không thể trích xuất tệp, AI sẽ trả lời theo dữ liệu hiện có.',
          );
        }
      }

      const allFileIds = Array.from(
        new Set([...conversationFileIds, ...(uploadedFileId ? [uploadedFileId] : [])]),
      );

      const res = (await apiClient.post('/ai-assistant/chat', {
        message: actualQuery,
        question: actualQuery,
        conversationId: activeConversationId || undefined,
        fileId: uploadedFileId,
        fileIds: allFileIds.length > 0 ? allFileIds : undefined,
        history: messages
          .filter((m) => m.id !== 'welcome-msg')
          .slice(-10)
          .map((m) => ({
            role: m.sender === 'USER' ? 'user' : 'assistant',
            content: m.text,
          })),
      })) as {
        messageId?: string;
        conversationId?: string;
        conversationTitle?: string;
        content?: string;
        answer?: string;
        citations?: CitationItem[];
        attachedFiles?: Array<{ fileId: string; fileName: string; fileType: string; fileSize?: string }>;
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
          attachedFiles: res.attachedFiles || [],
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

      // Nếu đây là cuộc trò chuyện mới được tạo từ Backend
      if (res.conversationId) {
        setActiveConversationId(res.conversationId);
        setStoredActiveConversationId(res.conversationId, user?.id, currentOrgId);

        // Làm mới danh sách hội thoại để cập nhật tiêu đề và mốc thời gian
        apiClient
          .get('/ai-assistant/conversations')
          .then((convs) => {
            if (Array.isArray(convs)) {
              setConversations(convs);
            }
          })
          .catch(() => {});
      }
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

  const activeConvItem = conversations.find((c) => c.id === activeConversationId);

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
            : 'calc(100vw - 240px)'
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
        <div className="flex items-center gap-3 min-w-0">
          {/* Nút bật/tắt lịch sử hội thoại */}
          <button
            type="button"
            onClick={() => {
              setShowHistorySidebar((prev) => {
                const next = !prev;
                localStorage.setItem('celra_chat_sidebar', String(next));
                return next;
              });
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer mr-1 ${
              showHistorySidebar
                ? 'bg-blue-50 text-[#2563EB]'
                : 'text-slate-500 hover:text-[#172B4D] hover:bg-slate-100'
            }`}
            title={showHistorySidebar ? 'Ẩn danh sách lịch sử' : 'Xem danh sách lịch sử'}
          >
            <PanelLeft className="w-4 h-4" />
          </button>

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
              <span className="font-medium text-[#172B4D] truncate max-w-[260px]">
                {activeOrg.legalName || activeOrg.name}
              </span>
            </div>
          ) : null}

          {/* Tiêu đề phiên hội thoại đang mở hoặc trạng thái Phiên mới */}
          {activeConvItem ? (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 border border-blue-100 text-xs text-[#2563EB] min-w-0">
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium truncate max-w-[220px]">
                {activeConvItem.title}
              </span>
            </div>
          ) : (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-700 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold">Phiên trò chuyện mới</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => startNewConversation(true)}
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
        {/* SIDEBAR LỊCH SỬ HỘI THOẠI (CHATGPT-STYLE) */}
        {showHistorySidebar && (
          <ConversationHistorySidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            loading={loadingConversations}
            activeOrgName={activeOrg?.legalName || activeOrg?.name}
            onSelectConversation={loadConversationDetail}
            onNewConversation={() => startNewConversation(true)}
            onDeleteConversation={handleDeleteConversation}
            onToggleSidebar={() => {
              setShowHistorySidebar(false);
              localStorage.setItem('celra_chat_sidebar', 'false');
            }}
          />
        )}

        {/* KHUNG CHAT CHÍNH */}
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
                  title="Đính kèm tài liệu (PDF, Word, Excel, CSV, TXT)"
                >
                  <Paperclip className="w-4 h-4" />
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.txt"
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
                  disabled={(!inputText.trim() && !attachedFile) || loading}
                  className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                    (inputText.trim() || attachedFile) && !loading
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
