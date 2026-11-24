import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import mascotImg from '../../../assets/celra-mascot.png';
import type { Organization } from '../../../interfaces';
import { StructuredAIMessage } from '../StructuredAIMessage';
import {
  type MessageItem,
  type ProposedChecklistItem,
  CURATED_SUGGESTIONS,
  resolveCitationUrl,
} from './ai-chat.utils';

interface ChatMessageListProps {
  messages: MessageItem[];
  loading: boolean;
  activeOrg: Organization | null;
  acceptedProposals: Record<string, boolean>;
  isAccepting: Record<string, boolean>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  onSendMessage: (text?: string) => void;
  onAcceptProposal: (proposal: ProposedChecklistItem) => void;
  onOpenAudit: () => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  loading,
  activeOrg,
  acceptedProposals,
  isAccepting,
  bottomRef,
  onSendMessage,
  onAcceptProposal,
  onOpenAudit,
}) => {
  const isWelcomeScreen = messages.length === 1 && messages[0].id === 'welcome-msg';

  return (
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
            <span className="absolute -bottom-1 right-2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
          </div>

          <h3 className="text-xl font-bold text-[#172B4D] text-center tracking-tight mb-2">
            Xin chào! Tôi là Trợ lý Pháp lý AI của CELRA.
          </h3>
          <p className="text-[13.5px] leading-relaxed text-[#64748B] text-center max-w-lg mb-8">
            Tôi hỗ trợ doanh nghiệp tìm hiểu quy định pháp luật, xác định nghĩa vụ tuân thủ và quản
            lý các công việc cần thực hiện.
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
                onClick={() => onSendMessage(s.title)}
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
                        onSendMessage={(txt) => onSendMessage(txt)}
                        onOpenAuditModal={onOpenAudit}
                        resolveCitationUrl={resolveCitationUrl}
                        isEnterpriseQuery={
                          msg.isEnterpriseQuery ?? msg.actionType === 'enterprise_audit'
                        }
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
                                    onClick={() => onAcceptProposal(prop)}
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
                    <div
                      className={`text-[10px] text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}
                    >
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
  );
};
