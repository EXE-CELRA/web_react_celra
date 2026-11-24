import React from 'react';
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../../api/legalApi';

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

// 3 câu hỏi gợi ý cốt lõi chuẩn Enterprise LegalTech (từ nhánh dev)
export const CURATED_SUGGESTIONS = [
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
] as const;

// Danh mục câu hỏi gợi ý nhanh cũ (giữ lại làm dữ liệu dự phòng)
export const QUICK_PROMPTS = [
  {
    title: 'Doanh nghiệp tôi cần tuân thủ những nghĩa vụ pháp lý nào?',
    desc: 'Tổng hợp nghĩa vụ theo bối cảnh doanh nghiệp',
  },
  {
    title: 'Quy định về thuế TNDN hiện nay như thế nào?',
    desc: 'Phân tích quy định và nghĩa vụ liên quan',
  },
  {
    title: 'Doanh nghiệp cần chuẩn bị hồ sơ gì?',
    desc: 'Liệt kê hồ sơ và bằng chứng cần nộp',
  },
  {
    title: 'Tôi cần làm gì để hoàn thành nghĩa vụ tuân thủ?',
    desc: 'Chuyển kết quả thành các bước thực hiện',
  },
  {
    title: 'Có quy định mới nào ảnh hưởng đến doanh nghiệp tôi?',
    desc: 'Xác định thay đổi có liên quan',
  },
] as const;

const CHAT_STORAGE_KEY = 'celra_chat_history';

function getChatStorageKey(userId?: string, orgId?: string): string {
  if (!userId) return `${CHAT_STORAGE_KEY}_unauth`;
  return `${CHAT_STORAGE_KEY}_u_${userId}_org_${orgId || 'default'}`;
}

export function loadChatHistory(userId?: string, orgId?: string): MessageItem[] | null {
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

export function saveChatHistory(messages: MessageItem[], userId?: string, orgId?: string): void {
  try {
    if (!userId) return;
    const key = getChatStorageKey(userId, orgId);
    localStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function clearChatHistory(userId?: string, orgId?: string): void {
  try {
    if (!userId) return;
    const key = getChatStorageKey(userId, orgId);
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getDefaultWelcomeMessage(companyName?: string): MessageItem {
  return {
    id: 'welcome-msg',
    sender: 'AI',
    text: `Xin chào! Tôi là Trợ lý Pháp lý AI của CELRA.\n\nTôi hỗ trợ doanh nghiệp tìm hiểu quy định pháp luật, xác định nghĩa vụ tuân thủ và quản lý các công việc cần thực hiện.\n\n${
      companyName ? `Bối cảnh áp dụng: **${companyName}**.` : 'Hãy nhập câu hỏi pháp lý để bắt đầu.'
    }`,
    actionType: 'info',
  };
}

// Chuẩn hóa và khắc phục liên kết văn bản pháp luật gốc
export function resolveCitationUrl(c: CitationItem): string {
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

// Từ điển chuyển ngữ mã kỹ thuật Backend sang nhãn tiếng Việt
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
  OVERDUE: 'Quá hạn theo lịch – Chưa xác nhận hoàn thành',
};

// Parser định dạng thông minh: Xóa ký tự Markdown thừa và chuyển ngữ mã trường Backend
export function renderFormattedText(rawText?: string): React.ReactNode {
  if (!rawText) return null;

  let sanitizedText = rawText.replace(
    /\[?(?:Mã thẻ|Mã|Key):\s*([a-zA-Z0-9_]+)\]?/gi,
    (_, key: string) => BE_FIELD_LABELS[key] || '',
  );
  Object.entries(BE_FIELD_LABELS).forEach(([k, v]) => {
    sanitizedText = sanitizedText.replaceAll(k, v);
  });

  sanitizedText = sanitizedText
    .replace(/\*{4,}/g, '')
    .replace(/\*{3}(.*?)\*{3}/g, '**$1**');

  const lines = sanitizedText.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    const headerMatch = trimmed.match(/^(?:#{1,6}\s*|\d+\.\s+)([^\n]+)$/);
    const isExplicitHeader = trimmed.startsWith('#');

    if (isExplicitHeader && headerMatch) {
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

    const lineWithoutHash = line.replace(/#{1,6}\s*/g, '');
    const elements: React.ReactNode[] = [];
    const tokenRegex = /(\*\*[^*]+?\*\*|\*[^*]+?\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(lineWithoutHash)) !== null) {
      if (match.index > lastIndex) {
        elements.push(lineWithoutHash.substring(lastIndex, match.index).replace(/[*#]+/g, ''));
      }
      const matchedText = match[0];
      if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
        const boldContent = matchedText.slice(2, -2).replace(/[*#]+/g, '').trim();
        if (boldContent) {
          elements.push(
            <strong key={`b-${idx}-${match.index}`} className="font-bold text-slate-900">
              {boldContent}
            </strong>,
          );
        }
      } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
        const italicContent = matchedText.slice(1, -1).replace(/[*#]+/g, '').trim();
        if (italicContent) {
          elements.push(
            <em key={`i-${idx}-${match.index}`} className="italic text-teal-800">
              {italicContent}
            </em>,
          );
        }
      }
      lastIndex = tokenRegex.lastIndex;
    }
    if (lastIndex < lineWithoutHash.length) {
      elements.push(lineWithoutHash.substring(lastIndex).replace(/[*#]+/g, ''));
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <div key={idx} className="flex items-start gap-2 my-1 pl-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
          <span className="text-xs leading-relaxed text-slate-800">{elements}</span>
        </div>
      );
    }

    if (!trimmed) {
      return <div key={idx} className="h-1.5" />;
    }

    return (
      <p key={idx} className="text-xs leading-relaxed text-slate-800 my-1">
        {elements}
      </p>
    );
  });
}
