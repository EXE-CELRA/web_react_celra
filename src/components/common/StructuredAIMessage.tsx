import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  HelpCircle, 
  Sparkles,
  ArrowRight,
  BookOpen,
  Info
} from 'lucide-react';
import { message as antMessage } from 'antd';
import type { Organization } from '../../types';
import type { VerificationChecklistItem } from './AIChatDrawer';
export interface CitationItem {
  title: string;
  docNumber: string;
  articleNumber?: string;
  sourceUrl?: string;
  url?: string;
}

export interface StructuredMessageProps {
  text: string;
  citations?: CitationItem[];
  organization?: Organization | null;
  onSendMessage?: (text: string) => void;
  onOpenAuditModal?: () => void;
  resolveCitationUrl: (c: CitationItem) => string;
  isEnterpriseQuery?: boolean;
  verificationChecklist?: VerificationChecklistItem[];
}

export const StructuredAIMessage: React.FC<StructuredMessageProps> = ({
  text,
  citations = [],
  organization,
  onSendMessage,
  onOpenAuditModal,
  resolveCitationUrl,
  isEnterpriseQuery,
  verificationChecklist = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);
  const [showLegalSources, setShowLegalSources] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  // Sao chép tin nhắn vào clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    antMessage.success('Đã sao chép nội dung câu trả lời!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type: 'liked' | 'disliked') => {
    setFeedback(type);
    antMessage.success(type === 'liked' ? 'Cảm ơn bạn đã đánh giá hữu ích!' : 'Đã ghi nhận phản hồi để cải thiện chất lượng!');
  };


  // Xác nhận bộ checklist thu thập thông tin còn thiếu & gửi phân tích lại
  const handleConfirmChecklist = () => {
    if (Object.keys(selectedAnswers).length === 0) return;
    setVerificationConfirmed(true);

    const formattedPayload = Object.entries(selectedAnswers)
      .map(([key, val]) => {
        const item = (verificationChecklist || []).find((x) => x.factKey === key);
        return `${item?.obligationName || key}: ${val}`;
      })
      .join('; ');

    if (onSendMessage) {
      onSendMessage(`Xác nhận thông tin: ${formattedPayload}`);
    }
  };

  // Phân tích văn bản thành các khối nghiệp vụ
  const isEnterprise = typeof isEnterpriseQuery === 'boolean'
    ? isEnterpriseQuery
    : Boolean(
        text.includes('1. **Tổng quan**') ||
        text.includes('1. Tổng quan') ||
        text.includes('2. **Kết luận**') ||
        text.includes('D. Danh sách nghĩa vụ') ||
        text.includes('D. DANH SÁCH NGHĨA VỤ') ||
        text.includes('E. Thông tin cần xác minh') ||
        text.includes('E. THÔNG TIN CẦN XÁC MINH') ||
        text.includes('F. Việc nên làm tiếp theo') ||
        text.includes('F. VIỆC NÊN LÀM TIẾP THEO') ||
        text.includes('BÁO CÁO RÀ SOÁT')
      );

  const STATUS_TRANSLATIONS: Record<string, string> = {
    APPLICABLE: 'Đã xác định nghĩa vụ áp dụng',
    POSSIBLE: 'Có khả năng áp dụng nhưng chưa đủ dữ liệu',
    NEEDS_VERIFICATION: 'Cần xác minh thông tin hoặc căn cứ',
    NOT_APPLICABLE: 'Đã có căn cứ xác định không áp dụng',
    COMPLETED: 'Có đủ bằng chứng xác nhận hoàn thành',
    IN_PROGRESS: 'Đang thực hiện và có dữ liệu xác nhận',
    OVERDUE: 'Đã xác định nghĩa vụ áp dụng, quá hạn và chưa hoàn thành theo dữ liệu đáng tin cậy',
  };

  // Parser nội dung văn bản AI sạch sẽ & thay thế triệt để mã trạng thái kỹ thuật Backend sang tiếng Việt tự nhiên
  const renderTextContent = (raw: string) => {
    let sanitized = raw;
    Object.entries(STATUS_TRANSLATIONS).forEach(([code, label]) => {
      sanitized = sanitized.replaceAll(code, label);
    });

    // Tiền xử lý dấu sao thừa
    sanitized = sanitized
      .replace(/\*{4,}/g, '')
      .replace(/\*{3}(.*?)\*{3}/g, '**$1**');

    const lines = sanitized.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-1.5" />;

      // Xử lý dòng tiêu đề (#, ##, ###, #### hoặc dòng số 1. 2. 3. in hoa)
      const headerMatch = trimmed.match(/^(?:#{1,6}\s*|\d+\.\s+)([^\n]+)$/);
      const isExplicitHeader = trimmed.startsWith('#');

      if (isExplicitHeader && headerMatch) {
        const cleanTitle = headerMatch[1].replace(/[#*]+/g, '').trim();
        return (
          <div
            key={idx}
            className="font-bold text-xs sm:text-sm text-teal-950 border-b border-teal-100 pb-1 mt-3 mb-1.5"
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

      // Kiểm tra dòng bullet (- hoặc *)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1 text-xs text-slate-800 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
            <span>{elements}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-800 leading-relaxed my-1">
          {elements}
        </p>
      );
    });
  };

  // Khi hỏi chung về luật (không phải rà soát doanh nghiệp): Chỉ trả lời văn bản bình thường, nguồn luật và thanh thao tác
  if (!isEnterprise) {
    return (
      <div className="space-y-3 w-full text-slate-900">
        {/* Nội dung diễn giải của AI (Trả lời luật bình thường) */}
        <div className="text-xs text-slate-800 leading-relaxed">
          {renderTextContent(text)}
        </div>

        {/* Nguồn pháp lý nếu có văn bản trích dẫn */}
        {citations.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowLegalSources(!showLegalSources)}
              className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                <span>Căn cứ pháp lý tra cứu</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({citations.length} văn bản)
                </span>
              </div>
              {showLegalSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showLegalSources && (
              <div className="mt-1.5 p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                {citations.map((c, i) => {
                  const href = resolveCitationUrl(c);
                  return (
                    <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-0">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block">{c.title}</span>
                        <span className="text-[10px] text-slate-500">{c.articleNumber || 'Văn bản quy phạm pháp luật'}</span>
                      </div>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold shrink-0 ml-2"
                      >
                        <span>Tra cứu DLPL</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PHẦN G: THANH THAO TÁC TIN NHẮN (MESSAGE ACTIONS BAR) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 text-slate-600 font-medium transition-colors cursor-pointer"
              title="Sao chép toàn bộ câu trả lời"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 mr-1">Hữu ích?</span>
            <button
              type="button"
              onClick={() => handleFeedback('liked')}
              className={`p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer ${
                feedback === 'liked' ? 'text-teal-600 bg-teal-50' : 'text-slate-400'
              }`}
              title="Hữu ích"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFeedback('disliked')}
              className={`p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer ${
                feedback === 'disliked' ? 'text-rose-600 bg-rose-50' : 'text-slate-400'
              }`}
              title="Chưa hữu ích"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 w-full text-slate-900">
      {/* ============================================================ */}
      {/* PHẦN A: TIÊU ĐỀ & METADATA DOANH NGHIỆP                      */}
      {/* ============================================================ */}
      <div className="pb-2.5 border-b border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-teal-950 tracking-tight">
              Tổng quan tuân thủ thuế &amp; pháp lý
            </h4>
          </div>
          <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
            Enterprise Engine
          </span>
        </div>

        {/* Metadata chip gọn gàng */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md text-slate-700">
            <Building2 className="w-3 h-3 text-teal-600 shrink-0" />
            <span className="font-bold truncate max-w-[200px] sm:max-w-none">
              {organization?.name || 'Doanh nghiệp CELRA'}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
            <span>MST:</span>
            <span className="font-bold text-slate-700">{organization?.taxCode || 'Đang cập nhật'}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
            <span>Quy mô:</span>
            <span className="font-bold text-slate-700">{organization?.employeeCount ? `${organization.employeeCount} người` : 'Chưa cập nhật'}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Dữ liệu: {new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PHẦN B: TÓM TẮT NHANH (SUMMARY CHIPS & CANH BAO)              */}
      {/* ============================================================ */}
      <div className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Nội dung phân tích &amp; tư vấn tuân thủ:
          </span>
        </div>

        {/* Nội dung diễn giải chính của AI */}
        <div className="pt-1 text-xs text-slate-700 leading-relaxed border-t border-slate-200/60">
          {renderTextContent(text)}
        </div>

        {/* Cảnh báo chuẩn mực bắt buộc */}
        <div className="p-2 bg-amber-50/70 border border-amber-200/60 rounded-lg flex items-start gap-1.5 text-[11px] text-amber-900 leading-relaxed">
          <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
          <span>
            Trạng thái checklist phản ánh dữ liệu hệ thống ghi nhận từ khảo sát ban đầu, không tự động đồng nghĩa với việc doanh nghiệp vi phạm pháp luật.
          </span>
        </div>
      </div>


      {/* ============================================================ */}
      {/* PHẦN D: THÔNG TIN CẦN XÁC MINH THÊM (VÙNG TƯƠNG TÁC THỰC TẾ) */}
      {/* ============================================================ */}
      {/* PHẦN D: BỘ CHECKLIST THU THẬP THÔNG TIN CÒN THIẾU             */}
      {/* ============================================================ */}
      {verificationChecklist && verificationChecklist.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-blue-50/80 via-slate-50 to-teal-50/60 border border-blue-200/70 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              Cần xác minh thêm (Bộ Checklist thu thập thông tin):
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {verificationChecklist.length} điểm cần làm rõ
            </span>
          </div>

          {!verificationConfirmed ? (
            <div className="space-y-3 pt-1">
              {verificationChecklist.map((item, idx) => {
                const currentVal = selectedAnswers[item.factKey];
                return (
                  <div key={item.id || idx} className="p-2.5 bg-white rounded-lg border border-slate-200/80 space-y-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200">
                          {item.obligationCode || `Mục ${idx + 1}`}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {item.question}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {item.options.map((opt, oIdx) => {
                        const isSelected = currentVal === opt.value;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => setSelectedAnswers((prev) => ({ ...prev, [item.factKey]: opt.value }))}
                            className={`p-2 rounded-lg text-left text-xs font-medium transition-all border cursor-pointer flex items-start gap-1.5 ${
                              isSelected
                                ? 'bg-blue-50 text-blue-900 border-blue-500 ring-1 ring-blue-500'
                                : 'bg-slate-50/60 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                              isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span className="text-[11px] leading-tight">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {Object.keys(selectedAnswers).length > 0 && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmChecklist}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <span>Xác nhận thông tin &amp; Phân tích lại với bối cảnh mới</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-bold text-emerald-800">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Đã gửi thông tin xác nhận vào hội thoại. AI đang kết hợp ngữ cảnh để phân tích lại toàn diện.</span>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* PHẦN E: ĐIỀU PHỐI TÁC VỤ TUÂN THỦ                            */}
      {/* ============================================================ */}
      {onOpenAuditModal && (
        <div className="p-2.5 bg-teal-50/50 border border-teal-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-lg bg-teal-600 text-white shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
            <span className="text-slate-700 truncate">
              Chuyển các hành động trên thành tác vụ điều phối trong hệ thống
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenAuditModal}
            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg shrink-0 cursor-pointer shadow-2xs transition-all"
          >
            Mở rà soát tác vụ
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* PHẦN F: CĂN CỨ PHÁP LÝ & NGUỒN THAM KHẢO (COLLAPSIBLE)       */}
      {/* ============================================================ */}
      {citations && citations.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowLegalSources(!showLegalSources)}
            className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>Căn cứ pháp lý tra cứu</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({citations.length} văn bản)
              </span>
            </div>
            {showLegalSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showLegalSources && (
            <div className="mt-1.5 p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="space-y-1.5">
                {citations.map((c, i) => {
                  const href = resolveCitationUrl(c);
                  return (
                    <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-0">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block">{c.title}</span>
                        <span className="text-[10px] text-slate-500">{c.articleNumber || 'Văn bản quy phạm pháp luật'}</span>
                      </div>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold shrink-0 ml-2"
                      >
                        <span>Tra cứu DLPL</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* PHẦN G: THANH THAO TÁC TIN NHẮN (MESSAGE ACTIONS BAR)         */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 text-slate-600 font-medium transition-colors cursor-pointer"
            title="Sao chép toàn bộ câu trả lời"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 mr-1">Hữu ích?</span>
          <button
            type="button"
            onClick={() => handleFeedback('liked')}
            className={`p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer ${
              feedback === 'liked' ? 'text-teal-600 bg-teal-50' : 'text-slate-400'
            }`}
            title="Hữu ích"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleFeedback('disliked')}
            className={`p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer ${
              feedback === 'disliked' ? 'text-rose-600 bg-rose-50' : 'text-slate-400'
            }`}
            title="Chưa hữu ích"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default StructuredAIMessage;
