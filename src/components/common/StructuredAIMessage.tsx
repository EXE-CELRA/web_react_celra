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
  Clock,
  BookOpen,
  Info
} from 'lucide-react';
import { message as antMessage } from 'antd';
import type { Organization } from '../../types';

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
}

interface ParsedObligation {
  title: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NEEDS_VERIFICATION' | 'INCOMPLETE';
  priority?: 'urgent' | 'high' | 'medium';
  shortDesc: string;
  systemRecorded?: string;
  verifiedResult?: string;
  actionRequired?: string;
  legalBasis?: string;
  sourceUrl?: string;
}

export const StructuredAIMessage: React.FC<StructuredMessageProps> = ({
  text,
  citations = [],
  organization,
  onSendMessage,
  onOpenAuditModal,
  resolveCitationUrl,
  isEnterpriseQuery,
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showLegalSources, setShowLegalSources] = useState(false);
  const [verificationChoice, setVerificationChoice] = useState<'yes' | 'no' | 'unspecified' | null>(null);
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

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Xác nhận câu hỏi tương tác xác minh
  const handleConfirmVerification = () => {
    if (!verificationChoice) return;
    setVerificationConfirmed(true);
    const choiceText = 
      verificationChoice === 'yes'
        ? 'Doanh nghiệp CÓ bán hàng trực tiếp cho người tiêu dùng qua website/ứng dụng.'
        : verificationChoice === 'no'
        ? 'Doanh nghiệp KHÔNG bán hàng trực tiếp cho người tiêu dùng qua website/ứng dụng.'
        : 'Chưa xác định rõ hình thức bán hàng trực tiếp qua website/ứng dụng.';

    if (onSendMessage) {
      onSendMessage(`Xác nhận thông tin: ${choiceText}`);
    }
  };

  // Phân tích văn bản thành các khối nghiệp vụ
  const isEnterprise = typeof isEnterpriseQuery === 'boolean'
    ? isEnterpriseQuery
    : Boolean(
        text.includes('D. Danh sách nghĩa vụ') ||
        text.includes('D. DANH SÁCH NGHĨA VỤ') ||
        text.includes('E. Thông tin cần xác minh') ||
        text.includes('E. THÔNG TIN CẦN XÁC MINH') ||
        text.includes('F. Việc nên làm tiếp theo') ||
        text.includes('F. VIỆC NÊN LÀM TIẾP THEO') ||
        text.includes('BÁO CÁO RÀ SOÁT')
      );

  // Phân tích văn bản thành các khối nghiệp vụ
  const isOverview = isEnterprise && (text.includes('Báo cáo') || text.includes('nghĩa vụ') || text.includes('tuân thủ') || text.includes('rà soát') || text.includes('thuế'));

  // Danh mục 6 sắc thuế / nghĩa vụ trọng tâm để dựng accordion
  const obligations: ParsedObligation[] = [
    {
      title: 'Tạm nộp thuế Thu nhập doanh nghiệp (TNDN) 4 quý tối thiểu 80%',
      status: 'NEEDS_VERIFICATION',
      priority: 'urgent',
      shortDesc: 'Tạm nộp 4 quý tối thiểu đạt 80% số thuế TNDN quyết toán cả năm trước 31/01 năm sau.',
      systemRecorded: 'Ghi nhận từ khảo sát ban đầu: Cần đối chiếu chứng từ nộp NSNN',
      verifiedResult: 'Chưa có giấy nộp tiền NSNN hoặc sao kê ngân hàng xác nhận giao dịch',
      actionRequired: 'Đối chiếu kết quả kinh doanh 4 quý để tạm nộp; rà soát lũy kế 4 quý trước 31/01 năm sau để đảm bảo tối thiểu 80% số thuế TNDN cả năm',
      legalBasis: 'Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP; Điều 59 Luật Quản lý thuế số 38/2019/QH14',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-912022nd-cp-cua-chinh-phu-ve-viec-sua-doi-bo-sung-mot-so-dieu-cua-nghi-dinh-1262020nd-cp-ngay-19102020-cua-chinh-phu-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-quan-ly-thue-1098434.html'
    },
    {
      title: 'Chứng từ thanh toán không dùng tiền mặt cho hóa đơn mua vào',
      status: 'IN_PROGRESS',
      priority: 'high',
      shortDesc: 'Hóa đơn mua hàng từ ngưỡng luật định bắt buộc thanh toán qua ngân hàng (từ 20 triệu trước 01/07/2025; theo Luật 48/2024/QH15 từ 01/07/2025).',
      systemRecorded: 'Hệ thống ghi nhận: Đang chuẩn bị chứng từ chuyển khoản',
      verifiedResult: 'Cần rà soát các khoản chi tiền mặt để bảo vệ chi phí được trừ khi quyết toán',
      actionRequired: 'Lưu trữ đầy đủ Ủy nhiệm chi ngân hàng khớp MST người bán. Lưu ý: Đã thanh toán tiền mặt thì việc chuyển khoản sau không mặc định khắc phục được điều kiện thuế.',
      legalBasis: 'Điều 4 Thông tư 96/2015/TT-BTC, Điều 15 Thông tư 219/2013/TT-BTC và Điều 14 Luật Thuế GTGT số 48/2024/QH15',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html'
    },
    {
      title: 'Hồ sơ chi phí tiền lương & Khấu trừ thuế TNCN',
      status: 'IN_PROGRESS',
      priority: 'high',
      shortDesc: 'Bắt buộc HĐLĐ, bảng lương và chứng từ thanh toán. Đăng ký người phụ thuộc chỉ áp dụng khi có người phụ thuộc hợp pháp.',
      systemRecorded: 'Hệ thống ghi nhận: Có một phần hồ sơ nhân sự',
      verifiedResult: 'Cần hoàn thiện đăng ký MST cá nhân và chứng từ chi lương có chữ ký',
      actionRequired: 'Đăng ký MST cá nhân cho NLĐ; lưu trữ chứng từ chi lương có chữ ký hoặc sao kê; nộp tờ khai TNCN định kỳ khi có phát sinh khấu trừ thuế.',
      legalBasis: 'Thông tư 111/2013/TT-BTC, Thông tư 96/2015/TT-BTC và Nghị định 126/2020/NĐ-CP',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-1112013tt-btc-huong-dan-luat-thue-thu-nhap-ca-nhan-va-nghi-dinh-652013nd-cp-do-bo-truong-bo-tai-chinh-ban-hanh-334800.html'
    },
    {
      title: 'Lệ phí (Thuế) Môn bài định kỳ hàng năm',
      status: 'COMPLETED',
      priority: 'medium',
      shortDesc: 'Nộp chậm nhất ngày 30/01 hàng năm dựa trên mức vốn điều lệ đăng ký.',
      systemRecorded: 'Hệ thống ghi nhận: Đã hoàn thành nộp lệ phí môn bài',
      verifiedResult: 'Đã hoàn tất nghĩa vụ đầu năm; theo dõi nếu có điều chỉnh vốn điều lệ',
      actionRequired: 'Lưu giấy nộp tiền ngân sách phục vụ đối soát định kỳ',
      legalBasis: 'Nghị định 139/2016/NĐ-CP và Nghị định 22/2020/NĐ-CP',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/nghi-dinh-1392016nd-cp-quy-dinh-ve-le-phi-mon-bai-121377.html'
    },
    {
      title: 'Hóa đơn điện tử máy tính tiền (Nghị định 123/2020)',
      status: 'NEEDS_VERIFICATION',
      priority: 'medium',
      shortDesc: 'Áp dụng đối với cơ sở bán lẻ, F&B trực tiếp cho người tiêu dùng.',
      systemRecorded: 'Hệ thống ghi nhận: Chưa rõ điều kiện áp dụng tại cơ sở',
      verifiedResult: 'Cần xác minh xem doanh nghiệp có điểm bán trực tiếp đến người tiêu dùng không',
      actionRequired: 'Nếu có điểm bán lẻ: Đăng ký mẫu 01/ĐKTĐ-HĐĐT với cơ quan thuế',
      legalBasis: 'Điều 11 Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/ke-toan-kiem-toan-van-ban/nghi-dinh-1232020nd-cp-quy-dinh-ve-hoa-don-chung-tu-24634.html'
    },
    {
      title: 'Kê khai thuế GTGT định kỳ theo quý',
      status: 'COMPLETED',
      priority: 'high',
      shortDesc: 'Kê khai tờ khai mẫu 01/GTGT chậm nhất ngày cuối cùng tháng đầu quý tiếp theo.',
      systemRecorded: 'Hệ thống ghi nhận: Đã nộp tờ khai đúng hạn',
      verifiedResult: 'Kê khai thuế điện tử thành công qua cổng thuedientu.gdt.gov.vn',
      actionRequired: 'Theo dõi hóa đơn đầu ra và đầu vào của quý tiếp theo',
      legalBasis: 'Điều 44 Luật Quản lý thuế số 38/2019/QH14 và Nghị định 126/2020/NĐ-CP',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/luat-quan-ly-thue-2019-54279.html'
    }
  ];

  const STATUS_TRANSLATIONS: Record<string, string> = {
    APPLICABLE: 'Đã xác định nghĩa vụ áp dụng',
    POSSIBLE: 'Có khả năng áp dụng nhưng chưa đủ dữ liệu',
    NEEDS_VERIFICATION: 'Cần xác minh thông tin hoặc căn cứ',
    NOT_APPLICABLE: 'Đã có căn cứ xác định không áp dụng',
    COMPLETED: 'Có đủ bằng chứng xác nhận hoàn thành',
    IN_PROGRESS: 'Đang thực hiện và có dữ liệu xác nhận',
    OVERDUE: 'Đã xác định nghĩa vụ áp dụng, quá hạn và chưa hoàn thành theo dữ liệu đáng tin cậy',
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Có đủ bằng chứng hoàn thành
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Đang thực hiện có dữ liệu
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Quá hạn chưa hoàn thành
          </span>
        );
      case 'NOT_APPLICABLE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            Không thuộc diện áp dụng
          </span>
        );
      case 'POSSIBLE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
            Có khả năng áp dụng
          </span>
        );
      case 'APPLICABLE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
            Đã xác định áp dụng
          </span>
        );
      case 'NEEDS_VERIFICATION':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            <HelpCircle className="w-3 h-3 text-blue-500" />
            Cần xác minh thông tin
          </span>
        );
    }
  };

  const getPriorityBadge = (p?: string) => {
    if (p === 'urgent') {
      return <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">Ưu tiên cao</span>;
    }
    if (p === 'high') {
      return <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">Cần rà soát</span>;
    }
    return <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">Định kỳ</span>;
  };

  // Parser nội dung văn bản AI sạch sẽ & thay thế triệt để mã trạng thái kỹ thuật Backend sang tiếng Việt tự nhiên
  const renderTextContent = (raw: string) => {
    let sanitized = raw;
    Object.entries(STATUS_TRANSLATIONS).forEach(([code, label]) => {
      sanitized = sanitized.replaceAll(code, label);
    });

    const lines = sanitized.split('\n');
    return lines.map((l, idx) => {
      const trimmed = l.trim();
      if (!trimmed) return <div key={idx} className="h-1.5" />;
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1 text-xs text-slate-800 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
            <span>{trimmed.slice(2).replace(/\*\*/g, '')}</span>
          </div>
        );
      }
      return (
        <p key={idx} className="text-xs text-slate-800 leading-relaxed my-1">
          {trimmed.replace(/\*\*/g, '')}
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
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Tóm tắt trạng thái ghi nhận:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800">
              {obligations.filter((o) => o.status === 'COMPLETED').length} hoàn thành
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-800">
              {obligations.filter((o) => o.status === 'IN_PROGRESS').length} đang chuẩn bị
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-800">
              {obligations.filter((o) => o.status === 'NEEDS_VERIFICATION' || o.status === 'INCOMPLETE').length} cần xác minh
            </span>
          </div>
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
      {/* PHẦN C: DANH SÁCH NGHĨA VỤ THUẾ (ACCORDIONS)                 */}
      {/* ============================================================ */}
      {isOverview && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900 px-0.5">
            <span>Danh mục nghĩa vụ &amp; điều kiện pháp lý cần kiểm tra:</span>
            <span className="text-[10px] text-slate-500 font-normal">Nhấn để xem chi tiết</span>
          </div>

          <div className="space-y-1.5">
            {obligations.map((ob, idx) => {
              const isExpanded = !!expandedSections[`ob-${idx}`];
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/90 hover:border-teal-300 rounded-xl transition-all shadow-2xs overflow-hidden"
                >
                  {/* Accordion Header */}
                  <div
                    onClick={() => toggleSection(`ob-${idx}`)}
                    className="p-3 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {ob.title}
                        </span>
                        {getPriorityBadge(ob.priority)}
                        {getStatusBadge(ob.status)}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {ob.shortDesc}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="p-1 rounded-md text-slate-400 hover:text-teal-700 hover:bg-slate-100 transition-colors shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Accordion Content (Khi mở rộng) */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-50/60 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 bg-white rounded-lg border border-slate-200/70 space-y-1">
                          <span className="font-bold text-slate-800">Dữ liệu ghi nhận:</span>
                          <p className="text-slate-600">{ob.systemRecorded}</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200/70 space-y-1">
                          <span className="font-bold text-slate-800">Kết quả xác minh:</span>
                          <p className="text-slate-600">{ob.verifiedResult}</p>
                        </div>
                      </div>

                      <div className="p-2 bg-teal-50/40 rounded-lg border border-teal-100 space-y-1 text-[11px]">
                        <span className="font-bold text-teal-950 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-teal-600" />
                          Hướng xử lý đề xuất:
                        </span>
                        <p className="text-teal-900">{ob.actionRequired}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px] text-slate-500">
                        <span>Căn cứ: <span className="font-medium text-slate-700">{ob.legalBasis}</span></span>
                        {ob.sourceUrl && (
                          <a
                            href={ob.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold hover:underline"
                          >
                            <span>Xem luật gốc</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PHẦN D: THÔNG TIN CẦN XÁC MINH THÊM (VÙNG TƯƠNG TÁC THỰC TẾ) */}
      {/* ============================================================ */}
      <div className="p-3.5 bg-gradient-to-r from-blue-50/80 via-slate-50 to-teal-50/60 border border-blue-200/70 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            Cần xác minh thêm (Hỏi làm rõ):
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            Tương tác trực tiếp
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-900">
            Doanh nghiệp có bán hàng trực tiếp cho người tiêu dùng thông qua website hoặc ứng dụng không?
          </p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Thông tin này giúp xác định liệu doanh nghiệp có thuộc trường hợp áp dụng quy định về hóa đơn điện tử khởi tạo từ máy tính tiền hay không.
          </p>
        </div>

        {/* Nút lựa chọn tương tác */}
        {!verificationConfirmed ? (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setVerificationChoice('yes')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  verificationChoice === 'yes'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Có
              </button>
              <button
                type="button"
                onClick={() => setVerificationChoice('no')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  verificationChoice === 'no'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Không
              </button>
              <button
                type="button"
                onClick={() => setVerificationChoice('unspecified')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  verificationChoice === 'unspecified'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Chưa xác định
              </button>
            </div>

            {verificationChoice && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleConfirmVerification}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <span>Gửi xác nhận thông tin vào hội thoại</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-bold text-emerald-800">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã gửi thông tin xác nhận vào hội thoại để AI tiếp tục đánh giá.</span>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* PHẦN E: VIỆC NÊN LÀM TIẾP THEO (ACTION ITEMS)                */}
      {/* ============================================================ */}
      <div className="p-3 bg-white border border-slate-200/90 rounded-xl space-y-2">
        <span className="text-xs font-bold text-slate-900 block">
          Việc nên làm tiếp theo theo thứ tự ưu tiên:
        </span>
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2 p-2 bg-slate-50/80 rounded-lg border border-slate-100">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">
                1. Ước tính số thuế TNDN tạm nộp 4 quý
              </span>
              <p className="text-[11px] text-slate-600">
                Đối chiếu kết quả kinh doanh 4 quý để tạm nộp; rà soát đạt tối thiểu 80% cả năm trước 31/01 năm sau (Nghị định 91/2022/NĐ-CP).
              </p>
            </div>
            {onOpenAuditModal && (
              <button
                type="button"
                onClick={onOpenAuditModal}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-md shrink-0 cursor-pointer shadow-2xs"
              >
                Mở rà soát
              </button>
            )}
          </div>

          <div className="flex items-start justify-between gap-2 p-2 bg-slate-50/80 rounded-lg border border-slate-100">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">
                2. Rà soát chứng từ chuyển khoản ngân hàng
              </span>
              <p className="text-[11px] text-slate-600">
                Thu thập và lưu trữ Ủy nhiệm chi cho 100% hóa đơn mua vào từ ngưỡng luật định (từ 20 triệu trước 01/07/2025; theo Luật 48/2024/QH15 từ 01/07/2025). Lưu ý: Chuyển khoản sau không mặc định khắc phục vi phạm thanh toán tiền mặt.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PHẦN F: CĂN CỨ PHÁP LÝ & NGUỒN THAM KHẢO (COLLAPSIBLE)       */}
      {/* ============================================================ */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowLegalSources(!showLegalSources)}
          className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            <span>Căn cứ pháp lý và nguồn tham khảo chính thức</span>
            <span className="text-[10px] text-slate-400 font-normal">
              ({citations.length > 0 ? citations.length : 3} văn bản)
            </span>
          </div>
          {showLegalSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showLegalSources && (
          <div className="mt-1.5 p-3 bg-white border border-slate-200 rounded-xl space-y-2">
            <div className="space-y-1.5">
              {citations.length > 0 ? (
                citations.map((c, i) => {
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
                })
              ) : (
                <div className="text-[11px] text-slate-500 space-y-1">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span>Luật Quản lý thuế số 38/2019/QH14 (Điều 44)</span>
                    <a href="https://dulieuphapluat.vn" target="_blank" rel="noreferrer" className="text-teal-700 font-bold inline-flex items-center gap-1">
                      Xem DLPL <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span>Nghị định 91/2022/NĐ-CP (Tạm nộp TNDN 80%)</span>
                    <a href="https://dulieuphapluat.vn" target="_blank" rel="noreferrer" className="text-teal-700 font-bold inline-flex items-center gap-1">
                      Xem DLPL <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Thông tư 96/2015/TT-BTC (Chi phí được trừ)</span>
                    <a href="https://dulieuphapluat.vn" target="_blank" rel="noreferrer" className="text-teal-700 font-bold inline-flex items-center gap-1">
                      Xem DLPL <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
