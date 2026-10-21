import React, { useState, useRef, useEffect } from 'react';
import { Drawer, message as antMessage } from 'antd';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { useOrgStore } from '../../store/useOrgStore';
import { useContextStore } from '../../store/useContextStore';
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
  Minimize2 
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

interface MessageItem {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  citations?: CitationItem[];
  actionType?: 'info' | 'open_compliance_audit' | 'task_proposal' | 'enterprise_audit';
  isEnterpriseQuery?: boolean;
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

function loadChatHistory(orgId?: string): MessageItem[] | null {
  try {
    const key = orgId ? `${CHAT_STORAGE_KEY}_${orgId}` : CHAT_STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed as MessageItem[];
  } catch {
    return null;
  }
}

function saveChatHistory(messages: MessageItem[], orgId?: string): void {
  try {
    const key = orgId ? `${CHAT_STORAGE_KEY}_${orgId}` : CHAT_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // Storage full or unavailable — silently fail, chat still works
  }
}

function clearChatHistory(orgId?: string): void {
  try {
    const key = orgId ? `${CHAT_STORAGE_KEY}_${orgId}` : CHAT_STORAGE_KEY;
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}


import { cleanDLPLUrl, matchCoreLegalDocUrl, CORE_LEGAL_DOC_LINKS } from '../../api/legalApi';

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
  const { activeOrg } = useOrgStore();
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    return localStorage.getItem('celra_chat_expanded') === 'true';
  });
  const [messages, setMessages] = useState<MessageItem[]>(() => {
    const orgId = localStorage.getItem('celra_active_org_id') || undefined;
    return loadChatHistory(orgId) ?? [
      {
        id: 'welcome-msg',
        sender: 'AI',
        text: 'Xin chào! Tôi là **CELRA Legal & Tax Copilot** - Trợ lý Cố vấn Pháp lý và Thuế Doanh Nghiệp được hỗ trợ bởi OpenCode AI.\n\nTôi thấu hiểu bối cảnh dữ liệu của công ty bạn và sẵn sàng giải đáp mọi thắc mắc về thuế môn bài, thuế GTGT, tạm nộp TNDN, chi phí lương hợp lý hoặc các quy định pháp luật F&B.',
        citations: [
          { 
            title: 'Nghị định 91/2022/NĐ-CP', 
            docNumber: '91/2022/NĐ-CP', 
            articleNumber: 'Tạm nộp TNDN 80%',
            sourceUrl: CORE_LEGAL_DOC_LINKS['91/2022']
          },
          { 
            title: 'Nghị định 126/2020/NĐ-CP', 
            docNumber: '126/2020/NĐ-CP', 
            articleNumber: 'Kê khai thuế',
            sourceUrl: CORE_LEGAL_DOC_LINKS['126/2020']
          },
          { 
            title: 'Thông tư 96/2015/TT-BTC', 
            docNumber: '96/2015/TT-BTC', 
            articleNumber: 'Chi phí lương',
            sourceUrl: CORE_LEGAL_DOC_LINKS['96/2015']
          },
        ],
        actionType: 'info',
      },
    ];
  });
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedProposals, setAcceptedProposals] = useState<Record<string, boolean>>({});
  const [isAccepting, setIsAccepting] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const orgId = localStorage.getItem('celra_active_org_id') || undefined;
    saveChatHistory(messages, orgId);
  }, [messages]);

  // Danh mục câu hỏi gợi ý nhanh (Quick Prompts)
  const quickPrompts = [
    {
      title: 'Tôi có còn thiếu tuân thủ nào không?',
      desc: 'Kiểm tra tổng quan rủi ro pháp lý & thuế của DN',
      highlight: true,
    },
    {
      title: 'Tạm nộp thuế TNDN 80% là thế nào?',
      desc: 'Hạn chót và mức phạt chậm nộp 0.03%/ngày',
    },
    {
      title: 'Hạn nộp tờ khai thuế GTGT và TNCN quý này?',
      desc: 'Quy định kỳ kê khai và thời hạn nộp tờ khai quý',
    },
    {
      title: 'Thuế môn bài nộp khi nào và mức nộp bao nhiêu?',
      desc: 'Nghị định 139/2016 và chính sách miễn năm đầu',
    },
    {
      title: 'Chi phí lương F&B cần chứng từ gì để hợp lệ?',
      desc: 'Quy chuẩn trừ thuế TNDN và hóa đơn từ 20 triệu',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    setInputText('');
    const userMsgId = `usr-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'USER',
        text: query,
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
          ctaButton: res.ctaButton,
          proposedChecklists: res.proposedChecklists || [],
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Nếu là tin nhắn xác nhận thông tin, tự động làm mới store ContextFact của doanh nghiệp trên FE
      if (query.toLowerCase().startsWith('xác nhận thông tin:') || query.toLowerCase().startsWith('xac nhan thong tin:')) {
        useContextStore.getState().fetchFacts();
      }
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
    OVERDUE: 'Đã xác định nghĩa vụ áp dụng, quá hạn và chưa hoàn thành theo dữ liệu đáng tin cậy',
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
      width={isExpanded ? '96vw' : (window.innerWidth < 1024 ? '100vw' : '68vw')}
      onClose={onClose}
      open={visible}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' },
        wrapper: { maxWidth: '100vw', transition: 'all 0.25s ease-in-out' }
      }}
    >
      {/* DRAWER HEADER */}
      <div className="p-4 bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white flex items-center justify-between border-b border-teal-800/50 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-400/40">
              <Bot className="w-5 h-5 text-teal-400" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                CELRA Legal &amp; Tax Copilot
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                OpenCode AI
              </span>
            </div>
            <p className="text-[11px] text-teal-200/80 mt-0.5">
              Cố vấn tuân thủ pháp luật &amp; thuế • Thấu hiểu bối cảnh DN
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const orgId = localStorage.getItem('celra_active_org_id') || undefined;
              clearChatHistory(orgId);
              setMessages([
                {
                  id: 'welcome-msg',
                  sender: 'AI',
                  text: 'Xin chào! Tôi là **CELRA Legal & Tax Copilot** - Trợ lý Cố vấn Pháp lý và Thuế Doanh nghiệp được hỗ trợ bởi OpenCode AI.\n\nTôi sẵn sàng giải đáp mọi thắc mắc về thuế môn bài, thuế GTGT, tạm nộp TNDN, chi phí lương hợp lý hoặc các quy định pháp luật F&B.',
                  citations: [
                    { title: 'Nghị định 91/2022/NĐ-CP', docNumber: '91/2022/NĐ-CP', articleNumber: 'Tạm nộp TNDN 80%', sourceUrl: CORE_LEGAL_DOC_LINKS['91/2022'] },
                    { title: 'Nghị định 126/2020/NĐ-CP', docNumber: '126/2020/NĐ-CP', articleNumber: 'Kê khai thuế', sourceUrl: CORE_LEGAL_DOC_LINKS['126/2020'] },
                    { title: 'Thông tư 96/2015/TT-BTC', docNumber: '96/2015/TT-BTC', articleNumber: 'Chi phí lương', sourceUrl: CORE_LEGAL_DOC_LINKS['96/2015'] },
                  ],
                  actionType: 'info',
                },
              ]);
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

      {/* MESSAGES LIST AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'USER';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                  isUser
                    ? 'bg-emerald-600 text-white'
                    : 'bg-teal-700 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Content */}
              {/* Message Bubble Content - Tự co giãn theo chiều rộng màn hình lớn */}
              <div className={`${isExpanded ? 'max-w-[92%]' : 'max-w-[88%]'} space-y-2.5`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm shadow-xs space-y-2.5 leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-none'
                  }`}
                >
                  {isUser ? (
                    <div className="text-white text-xs leading-relaxed">
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
                            Chỉ từ 25 Credit/thẻ • Tự động tạo Checklist điều phối
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
            <div className="w-7 h-7 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-xs text-xs text-slate-600 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
              <span>CELRA Copilot đang đối chiếu dữ liệu bối cảnh &amp; quy chuẩn luật...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* QUICK PROMPT CHIPS */}
      <div className="p-2.5 bg-slate-100/90 border-t border-slate-200 shrink-0">
        <div className="text-[11px] font-bold text-slate-600 px-1 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Gợi ý câu hỏi nhanh:</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.title)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium shrink-0 transition-all cursor-pointer text-left border flex items-center gap-1.5 shadow-2xs hover:shadow-xs ${
                q.highlight
                  ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold hover:bg-teal-100'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span>{q.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* INPUT BAR */}
      <div className="p-3.5 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Hỏi về thuế môn bài, thuế GTGT, tạm nộp TNDN, chi phí lương..."
            value={inputText}
            onFocus={() => {
              // Khi người dùng click/focus vào ô nhập chat, tự động cuộn xuống tin nhắn mới nhất
              setTimeout(() => scrollToBottom('smooth'), 120);
            }}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className={`p-2.5 rounded-xl text-white transition-all cursor-pointer shadow-xs ${
              inputText.trim() && !loading
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Gửi câu hỏi"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </Drawer>
  );
};
export default AIChatDrawer;

