import React, { useState, useRef, useEffect } from 'react';
import { Drawer, message as antMessage } from 'antd';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { 
  Bot, 
  User, 
  Send, 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  PlusCircle,
  X,
  RefreshCw,
  ExternalLink
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
  actionType?: 'info' | 'open_compliance_audit' | 'task_proposal';
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
  onOpenAuditModal 
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome-msg',
      sender: 'AI',
      text: 'Xin chào! Tôi là **CELRA Legal & Tax Copilot** - Trợ lý Cố vấn Pháp lý và Thuế Doanh nghiệp được hỗ trợ bởi OpenCode AI.\n\nTôi thấu hiểu bối cảnh dữ liệu của công ty bạn và sẵn sàng giải đáp mọi thắc mắc về thuế môn bài, thuế GTGT, tạm nộp TNDN, chi phí lương hợp lý hoặc các quy định pháp luật F&B.',
      citations: [
        { 
          title: 'Nghị định 252/2026/NĐ-CP', 
          docNumber: '252/2026/NĐ-CP', 
          articleNumber: 'Tạm nộp TNDN 80%',
          sourceUrl: CORE_LEGAL_DOC_LINKS['252/2026']
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
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedProposals, setAcceptedProposals] = useState<Record<string, boolean>>({});
  const [isAccepting, setIsAccepting] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
      const res: any = await apiClient.post('/ai-assistant/chat', { 
        message: query,
        question: query 
      });

      const aiMsgId = res.messageId || `ai-${Date.now()}`;
      const replyContent = res.content || res.answer || 'Đã ghi nhận thông tin từ bạn.';

      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'AI',
          text: replyContent,
          citations: res.citations || [],
          actionType: res.actionType || 'info',
          ctaButton: res.ctaButton,
          proposedChecklists: res.proposedChecklists || [],
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'AI',
          text: 'Rất tiếc, đã có sự cố kết nối tới Engine Trợ lý AI. Vui lòng kiểm tra lại kết nối và thử lại.',
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
    } catch (err: any) {
      antMessage.error(err.message || 'Lỗi khi tạo Checklist từ đề xuất AI');
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

  // Parser markdown đơn giản để in đậm và ngắt dòng đẹp mắt
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      // In đậm cú pháp **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={pIdx} className="italic text-teal-800">
              {part.slice(1, -1)}
            </em>
          );
        }
        return part;
      });

      // Kiểm tra dòng bullet
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 pl-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
            <span className="text-xs leading-relaxed text-slate-800">{formattedParts}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-xs leading-relaxed text-slate-800 my-1">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <Drawer
      title={null}
      placement="right"
      width={typeof window !== 'undefined' && window.innerWidth < 560 ? '100%' : 520}
      onClose={onClose}
      open={visible}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' },
        wrapper: { maxWidth: '100vw' }
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

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
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
              <div className={`max-w-[86%] space-y-2.5`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs shadow-xs space-y-2 leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-none'
                  }`}
                >
                  <div className={isUser ? 'text-white' : 'text-slate-800'}>
                    {renderFormattedText(msg.text)}
                  </div>

                  {/* LEGAL CITATIONS */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                        <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                        <span>Căn cứ pháp lý viện dẫn (Bấm để xem văn bản luật):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, i) => {
                          const href = resolveCitationUrl(c);

                          return (
                            <a
                              key={i}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Xem toàn văn văn bản luật: ${c.title}`}
                              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100/90 border border-teal-200 hover:border-teal-400 px-2 py-0.5 rounded-md transition-all shadow-2xs group cursor-pointer"
                            >
                              <span>{c.title} {c.articleNumber ? `(${c.articleNumber})` : ''}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-teal-600 group-hover:text-teal-900 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
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
            type="text"
            placeholder="Hỏi về thuế môn bài, thuế GTGT, tạm nộp TNDN, chi phí lương..."
            value={inputText}
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

