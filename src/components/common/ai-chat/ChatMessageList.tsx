import React from 'react';
import {
  Bot,
  User,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import type { Organization } from '../../../interfaces';
import { StructuredAIMessage } from '../StructuredAIMessage';
import {
  type MessageItem,
  type ProposedChecklistItem,
  QUICK_PROMPTS,
  resolveCitationUrl,
  renderFormattedText,
} from './ai-chat.utils';

interface ChatMessageListProps {
  messages: MessageItem[];
  loading: boolean;
  isExpanded: boolean;
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
  isExpanded,
  activeOrg,
  acceptedProposals,
  isAccepting,
  bottomRef,
  onSendMessage,
  onAcceptProposal,
  onOpenAudit,
}) => (
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
            Mô tả tình huống hoặc đặt câu hỏi về nghĩa vụ pháp lý của doanh nghiệp. Tôi sẽ giúp bạn
            hiểu quy định và xác định những việc cần thực hiện.
          </p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q.title}
              type="button"
              onClick={() => onSendMessage(q.title)}
              className="min-h-[64px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-[#2563EB]/50 hover:bg-blue-50/40 transition-colors cursor-pointer"
            >
              <span className="block text-[13px] font-semibold text-[#172B4D]">{q.title}</span>
              <span className="block mt-1 text-[11px] text-slate-500">{q.desc}</span>
            </button>
          ))}
        </div>
      </div>
    ) : null}

    {messages
      .filter((msg) => !(msg.id === 'welcome-msg' && messages.length === 1))
      .map((msg) => {
        const isUser = msg.sender === 'USER';
        return (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                isUser ? 'bg-[#2563EB] text-white' : 'bg-[#142B50] text-white'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

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
                    onSendMessage={(txt) => onSendMessage(txt)}
                    onOpenAuditModal={onOpenAudit}
                    resolveCitationUrl={resolveCitationUrl}
                    isEnterpriseQuery={
                      msg.isEnterpriseQuery ?? msg.actionType === 'enterprise_audit'
                    }
                    verificationChecklist={msg.verificationChecklist}
                  />
                )}

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
                      onClick={onOpenAudit}
                      className="w-full py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-200" />
                      <span>Mở Rà soát Tuân thủ ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

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

                          <p className="text-[11px] text-slate-600 leading-relaxed">{prop.reason}</p>

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
                                onClick={() => onAcceptProposal(prop)}
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
);
