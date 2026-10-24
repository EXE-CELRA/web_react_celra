/**
 * 🏛️ QUY ĐỊNH ĐỊA BÀN ƯU ĐÃI THUẾ THU NHẬP DOANH NGHIỆP (TNDN)
 * Căn cứ: 
 * - Phụ lục III Nghị định 31/2021/NĐ-CP (Quy định chi tiết Luật Đầu tư)
 * - Điều 15, Điều 16 Nghị định 218/2013/NĐ-CP (Hướng dẫn thi hành Luật Thuế TNDN)
 */

export type TaxIncentiveTier = 'ZONE_SPECIAL_DIFFICULT' | 'ZONE_DIFFICULT' | 'ZONE_STANDARD';

export interface TaxIncentiveInfo {
  tier: TaxIncentiveTier;
  taxRate: number;              // 0.10, 0.17 hoặc 0.20
  taxRatePercentText: string;   // '10%', '17%', '20%'
  title: string;
  badgeColor: string;
  exemptionPolicy: string;
  legalBasis: string;
  matchedKeywords: string[];
}

// 1. Danh sách từ khóa: Khu Công Nghệ Cao, Khu Kinh Tế & Địa bàn ĐẶC BIỆT KHÓ KHĂN
const SPECIAL_DIFFICULT_KEYWORDS = [
  'KHU CÔNG NGHỆ CAO', 'KCNC', 'KHU KINH TẾ', 'KKT',
  'HOÀNG SA', 'TRƯỜNG SA', 'CÔ TÔ', 'CÔN ĐẢO', 'PHÚ QUÝ', 'LÝ SƠN', 'KIÊN HẢI', 'BẠCH LONG VĨ', 'CỒN CỎ',
  // Tây Bắc & Miền núi phía Bắc đặc biệt khó khăn
  'MƯỜNG NHÉ', 'NẬM PỒ', 'TỦA CHÙA', 'ĐIỆN BIÊN ĐÔNG', 'SÌN HỒ', 'MƯỜNG TÈ', 'NẬM NHÙN', 'PHONG THỔ',
  'MÈO VẠC', 'ĐỒNG VĂN', 'YÊN MINH', 'QUẢN BẠ', 'BẮC MÊ', 'HOÀNG SU PHÌ', 'XÍN MẦN',
  'MÙ CANG CHẢI', 'TRẠM TẤU', 'BẮC HÀ', 'SI MA CAI', 'MƯỜNG KHƯƠNG', 'BÁT XÁT',
  'PÁC NẶM', 'NGÂN SƠN', 'BA BỂ', 'BẢO LÂM', 'BẢO LẠC', 'HÀ QUẢNG', 'THÔNG NÔNG',
  // Miền Trung & Tây Nguyên đặc biệt khó khăn
  'KỲ SƠN', 'TƯƠNG DƯƠNG', 'QUẾ PHONG', 'MƯỜNG LÁT', 'QUAN HÓA', 'QUAN SƠN', 'BÁ THƯỚC',
  'MINH HÓA', 'HƯỚNG HÓA', 'ĐAKRÔNG', 'A LƯỚI', 'NAM ĐÔNG', 'NAM TRÀ MY', 'PHƯỚC SƠN', 'TÂY GIANG',
  'BA TƠ', 'TRÀ BỒNG', 'MINH LONG', 'SƠN TÂY', 'SƠN HÀ', 'AN LÃO', 'VĨNH THẠNH', 'VÂN CANH',
  'TU MƠ RÔNG', 'KON PLÔNG', 'SA THẦY', 'IA H\'DRAI', 'ĐĂK GLEI', 'KRÔNG BÔNG', 'EASÚP', 'LẮK',
  // Đồng bằng Sông Cửu Long (vùng sâu, ven biển, hải đảo đặc biệt khó khăn)
  'NGỌC HIỂN', 'NĂM CĂN', 'ĐẦM DƠI', 'U MINH', 'THỚI BÌNH', 'HỒNG DÂN', 'PHƯỚC LONG', 'ĐÔNG HẢI',
  'AN BIÊN', 'AN MINH', 'VĨNH THUẬN', 'GIANG THÀNH', 'HÀ TIÊN', 'PHÚ QUỐC', 'TRI TÔN', 'TỊNH BIÊN'
];

// 2. Danh sách từ khóa: Địa bàn có điều kiện KT-XH KHÓ KHĂN
const DIFFICULT_KEYWORDS = [
  // Trung du & Ngoại ô khó khăn
  'LỤC NGẠN', 'SƠN ĐỘNG', 'LỤC NAM', 'YÊN THẾ', 'ĐỊNH HÓA', 'VÕ NHAI', 'ĐẠI TỪ',
  'CẨM THỦY', 'THƯỜNG XUÂN', 'NHƯ XUÂN', 'NHƯ THANH', 'THẠCH THÀNH',
  'QUỲ CHÂU', 'QUỲ HỢP', 'CON CUÔNG', 'TÂN KỲ', 'ANH SƠN', 'THANH CHƯƠNG',
  'HƯƠNG KHÊ', 'VŨ QUANG', 'KỲ ANH', 'TUYÊN HÓA', 'QUẢNG TRẠCH', 'GIO LINH', 'CAM LỘ',
  'ĐÔNG GIANG', 'BẮC TRÀ MY', 'TIÊN PHƯỚC', 'NÚI THÀNH', 'BÌNH SƠN', 'MỘ ĐỨC', 'ĐỨC PHỔ',
  'HOÀI ÂN', 'PHÙ CÁT', 'PHÙ MỸ', 'SƠN HÒA', 'SÔNG HINH', 'ĐỒNG XUÂN',
  'BÁC ÁI', 'NINH SƠN', 'THUẬN BẮC', 'THUẬN NAM', 'TUY PHONG', 'BẮC BÌNH',
  'ĐĂK HÀ', 'ĐĂK TÔ', 'NGỌC HỒI', 'CHƯ PĂH', 'MANG YANG', 'KÔNG CHRO', 'KRÔNG PA', 'IA PA',
  'CẦN GIỜ', 'TÂN PHÚ (ĐỒNG NAI)', 'ĐỊNH QUÁN', 'BÙ ĐĂNG', 'BÙ ĐỐP', 'LỘC NINH'
];

/**
 * Tự động bóc tách chuỗi địa chỉ để xác định cấp độ ưu đãi thuế TNDN
 */
export function detectTaxIncentiveZone(address: string): TaxIncentiveInfo {
  const normalized = (address || '').toUpperCase().trim();
  const matchedSpecial: string[] = [];
  const matchedDifficult: string[] = [];

  // 1. Kiểm tra nhóm Đặc biệt khó khăn / KCNC / KKT
  for (const kw of SPECIAL_DIFFICULT_KEYWORDS) {
    if (normalized.includes(kw)) {
      matchedSpecial.push(kw);
    }
  }

  if (matchedSpecial.length > 0) {
    return {
      tier: 'ZONE_SPECIAL_DIFFICULT',
      taxRate: 0.10,
      taxRatePercentText: '10%',
      title: 'Địa bàn KT-XH Đặc Biệt Khó Khăn / Khu Công Nghệ Cao / KKT',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      exemptionPolicy: 'Thuế suất ưu đãi 10% trong 15 năm; Miễn thuế 4 năm và Giảm 50% số thuế phải nộp trong 9 năm tiếp theo.',
      legalBasis: 'Khoản 1 Điều 15 & Khoản 1 Điều 16 Nghị định 218/2013/NĐ-CP & Phụ lục III Nghị định 31/2021/NĐ-CP.',
      matchedKeywords: matchedSpecial
    };
  }

  // 2. Kiểm tra nhóm Khó khăn
  for (const kw of DIFFICULT_KEYWORDS) {
    if (normalized.includes(kw)) {
      matchedDifficult.push(kw);
    }
  }

  if (matchedDifficult.length > 0) {
    return {
      tier: 'ZONE_DIFFICULT',
      taxRate: 0.17,
      taxRatePercentText: '17%',
      title: 'Địa bàn có điều kiện KT-XH Khó Khăn',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      exemptionPolicy: 'Thuế suất ưu đãi 17% trong 10 năm; Miễn thuế 2 năm và Giảm 50% số thuế phải nộp trong 4 năm tiếp theo.',
      legalBasis: 'Khoản 3 Điều 15 & Khoản 3 Điều 16 Nghị định 218/2013/NĐ-CP & Phụ lục III Nghị định 31/2021/NĐ-CP.',
      matchedKeywords: matchedDifficult
    };
  }

  // 3. Địa bàn thông thường (Phổ thông)
  return {
    tier: 'ZONE_STANDARD',
    taxRate: 0.20,
    taxRatePercentText: '20%',
    title: 'Địa bàn thông thường (Thuế suất phổ thông)',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    exemptionPolicy: 'Áp dụng thuế suất thuế TNDN phổ thông 20% theo quy định chung.',
    legalBasis: 'Điều 10 Luật Thuế Thu nhập doanh nghiệp số 14/2008/QH12 (sửa đổi, bổ sung bởi Luật số 32/2013/QH13).',
    matchedKeywords: []
  };
}
