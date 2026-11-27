import apiClient from './client';
import type { LegalRuleCitation, LegalRule, LegalDocumentItem } from '../interfaces';
export type { LegalRuleCitation, LegalRule, LegalDocumentItem };

export const CORE_LEGAL_DOC_LINKS: Record<string, string> = {
  // THUẾ TNDN & QUẢN LÝ THUẾ
  '67/2025': 'https://dulieuphapluat.vn/van-ban/tim-kiem.html?q=67%2F2025%2FQH15',
  '38/2019': 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/luat-quan-ly-thue-2019-54279.html',
  '126/2020': 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-1262020nd-cp-ve-huong-dan-luat-quan-ly-thue-24636.html',
  '91/2022': 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-912022nd-cp-cua-chinh-phu-ve-viec-sua-doi-bo-sung-mot-so-dieu-cua-nghi-dinh-1262020nd-cp-ngay-19102020-cua-chinh-phu-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-quan-ly-thue-1098434.html',
  '80/2021': 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-802021tt-btc-huong-dan-luat-quan-ly-thue-va-nghi-dinh-1262020nd-cp-huong-dan-luat-quan-ly-thue-do-bo-truong-bo-tai-chinh-ban-hanh-962.html',
  '96/2015': 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
  '103/2014': 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-1032014tt-btc-huong-dan-thuc-hien-nghia-vu-thue-ap-dung-doi-voi-to-chuc-ca-nhan-nuoc-ngoai-kinh-doanh-tai-viet-nam-hoac-co-thu-nhap-tai-viet-nam-do-bo-truong-bo-tai-chinh-ban-hanh-243292.html',

  // HÓA ĐƠN CHỨNG TỪ & ĐIỀU KIỆN KHẤU TRỪ CHI PHÍ
  '123/2020': 'https://dulieuphapluat.vn/van-ban/ke-toan-kiem-toan-van-ban/nghi-dinh-1232020nd-cp-quy-dinh-ve-hoa-don-chung-tu-24634.html',
  '78/2021': 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-782021tt-btc-huong-dan-thuc-hien-luat-quan-ly-thue-nghi-dinh-1232020nd-cp-quy-dinh-ve-hoa-don-chung-tu-do-bo-truong-bo-tai-chinh-ban-hanh-1550.html',
  '219/2013': 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-2192013tt-btc-huong-dan-luat-thue-gia-tri-gia-tang-va-nghi-dinh-2092013nd-cp-do-bo-truong-bo-tai-chinh-ban-hanh-323235.html',
  '111/2013': 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-1112013tt-btc-huong-dan-luat-thue-thu-nhap-ca-nhan-va-nghi-dinh-652013nd-cp-do-bo-truong-bo-tai-chinh-ban-hanh-334800.html',

  // DOANH NGHIỆP & XỬ PHẠT VI PHẠM HÀNH CHÍNH THUẾ
  '59/2020': 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/luat-doanh-nghiep-2020-32061.html',
  '125/2020': 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-1252020nd-cp-quy-dinh-ve-xu-phat-vi-pham-hanh-chinh-ve-thue-hoa-don-24591.html',
  '245/2026': 'https://dulieuphapluat.vn/van-ban/tim-kiem.html?q=gia+han+nop+thue+thu+nhap+doanh+nghiep',
};

// Chuẩn hóa và khắc phục triệt để lỗi URL nhân đôi hoặc dạt về trang chủ
export function cleanDLPLUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  const clean = rawUrl.replace(/\.html\.html$/i, '.html');
  const m = clean.match(/(van-ban\/[^\/]+\/[a-zA-Z0-9_\-]+-\d+\.html)$/i);
  if (m) {
    return `https://dulieuphapluat.vn/${m[1]}`;
  }
  return clean;
}

export function matchCoreLegalDocUrl(text?: string): string | undefined {
  if (!text) return undefined;
  for (const [key, url] of Object.entries(CORE_LEGAL_DOC_LINKS)) {
    if (text.includes(key)) {
      // Yêu cầu #5: Deep-link chính xác đến Điều/Khoản thay vì chỉ về trang chủ văn bản
      const articleMatch = text.match(/(Điều\s+\d+|Khoản\s+\d+\s+Điều\s+\d+)/i);
      if (articleMatch) {
        const queryTerm = encodeURIComponent(`${articleMatch[0]} ${key}`);
        return `https://dulieuphapluat.vn/van-ban/tim-kiem.html?q=${queryTerm}`;
      }
      return url;
    }
  }
  return undefined;
}

// ============================================================================
// BỘ ĐỆM CACHE CHỐNG GỌI LIÊN TỤC (RATE LIMIT & QUOTA PROTECTION)
// ============================================================================
const RULES_CACHE_KEY = 'celra_cached_legal_rules';
const RULES_CACHE_TIME_KEY = 'celra_cached_legal_rules_time';
const DOCS_CACHE_PREFIX = 'celra_law_doc_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 giờ

// In-memory cache
let inMemoryRules: Record<string, LegalRule> | null = null;
let inFlightRulesPromise: Promise<Record<string, LegalRule>> | null = null;
const inMemoryDocs = new Map<string, { data: LegalDocumentItem[]; timestamp: number }>();
const inFlightDocSearches = new Map<string, Promise<LegalDocumentItem[]>>();

/**
 * Lấy danh sách quy định pháp luật cốt lõi (có Cache chống gọi liên tục)
 */
export async function getLegalRules(forceRefresh = false): Promise<Record<string, LegalRule>> {
  // 1. Kiểm tra in-memory cache
  if (!forceRefresh && inMemoryRules && Object.keys(inMemoryRules).length > 0) {
    return inMemoryRules;
  }

  // 2. Chống gọi trùng lặp (in-flight deduplication)
  if (inFlightRulesPromise) {
    return inFlightRulesPromise;
  }

  // 3. Kiểm tra localStorage cache
  if (!forceRefresh) {
    try {
      const cachedTimeStr = localStorage.getItem(RULES_CACHE_TIME_KEY);
      const cachedDataStr = localStorage.getItem(RULES_CACHE_KEY);
      if (cachedTimeStr && cachedDataStr) {
        const cachedTime = Number(cachedTimeStr);
        if (Date.now() - cachedTime < CACHE_TTL_MS) {
          const parsed = JSON.parse(cachedDataStr);
          inMemoryRules = parsed;
          return parsed;
        }
      }
    } catch {
      // Bỏ qua lỗi đọc localStorage
    }
  }

  // 4. Gọi API Backend (đồng bộ từ DLPL)
  inFlightRulesPromise = (async () => {
    try {
      const res: any = await apiClient.get('/ai-assistant/legal-rules');
      const list = Array.isArray(res) ? res : res?.data && Array.isArray(res.data) ? res.data : [];
      const map: Record<string, LegalRule> = {};

      list.forEach((r: any) => {
        if (r && r.code) {
          map[r.code] = r;
        }
      });

      inMemoryRules = map;
      try {
        localStorage.setItem(RULES_CACHE_KEY, JSON.stringify(map));
        localStorage.setItem(RULES_CACHE_TIME_KEY, Date.now().toString());
      } catch {
        // Quota storage exceeded
      }
      return map;
    } catch (err: any) {
      console.warn('[LEGAL API] Lỗi tải quy định luật, sử dụng cache cũ nếu có:', err?.message);
      if (inMemoryRules) return inMemoryRules;
      return {};
    } finally {
      inFlightRulesPromise = null;
    }
  })();

  return inFlightRulesPromise;
}

/**
 * Tra cứu trực tiếp văn bản từ API Dữ Liệu Pháp Luật (DLPL)
 * Có Cache 24 giờ và chống gọi liên tục / spam API
 */
export async function searchLegalDocuments(query: string, limit = 5): Promise<LegalDocumentItem[]> {
  const cleanQ = (query || '').trim().toLowerCase();
  if (!cleanQ) return [];

  const cacheKey = `${cleanQ}_${limit}`;

  // 1. In-memory cache
  const inMem = inMemoryDocs.get(cacheKey);
  if (inMem && Date.now() - inMem.timestamp < CACHE_TTL_MS) {
    return inMem.data;
  }

  // 2. Chống gọi trùng lặp (in-flight deduplication)
  const inFlight = inFlightDocSearches.get(cacheKey);
  if (inFlight) return inFlight;

  // 3. LocalStorage cache
  try {
    const lsRaw = localStorage.getItem(`${DOCS_CACHE_PREFIX}${cacheKey}`);
    if (lsRaw) {
      const parsed = JSON.parse(lsRaw);
      if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        inMemoryDocs.set(cacheKey, parsed);
        return parsed.data;
      }
    }
  } catch {
    // Ignore
  }

  // 4. Gọi API Backend (hoặc proxy DLPL)
  const fetchPromise = (async () => {
    try {
      const res: any = await apiClient.get('/ai-assistant/search-legal-docs', {
        params: { q: cleanQ },
      });
      const list = Array.isArray(res) ? res : res?.data && Array.isArray(res.data) ? res.data : [];

      const result: LegalDocumentItem[] = list.map((doc: any) => ({
        id: doc.id || doc.code,
        code: doc.code,
        name: doc.name,
        database: doc.database,
        status: doc.status?.name || doc.status || 'Còn hiệu lực',
        effectiveDate: doc.effectiveDate || doc.effective_date,
        issuedDate: doc.issuedDate || doc.issued_date,
        sourceUrl: cleanDLPLUrl(doc.sourceUrl || doc.source_url) || matchCoreLegalDocUrl(doc.code) || `https://dulieuphapluat.vn/van-ban/tim-kiem.html?q=${encodeURIComponent(doc.code)}`,
      }));

      const cachePayload = { data: result, timestamp: Date.now() };
      inMemoryDocs.set(cacheKey, cachePayload);
      try {
        localStorage.setItem(`${DOCS_CACHE_PREFIX}${cacheKey}`, JSON.stringify(cachePayload));
      } catch {
        // Ignore
      }
      return result;
    } catch (err: any) {
      console.warn('[LEGAL API] Lỗi tra cứu DLPL API:', err?.message);
      return [];
    } finally {
      inFlightDocSearches.delete(cacheKey);
    }
  })();

  inFlightDocSearches.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Trích xuất link tra cứu chính thức trực tiếp trên dulieuphapluat.vn
 */
export function getDirectLegalUrl(citationTitle?: string, docCode?: string, fallbackUrl?: string): string {
  if (fallbackUrl && fallbackUrl.startsWith('http') && !fallbackUrl.includes('.html.html')) {
    return cleanDLPLUrl(fallbackUrl);
  }
  const match = matchCoreLegalDocUrl(docCode || citationTitle);
  if (match) return match;
  if (docCode) {
    return `https://dulieuphapluat.vn/van-ban/tim-kiem.html?q=${encodeURIComponent(docCode)}`;
  }
  return fallbackUrl || 'https://dulieuphapluat.vn';
}
