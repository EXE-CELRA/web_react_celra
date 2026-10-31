/**
 * 🏛️ MODULE RÀ SOÁT THUẾ SUẤT VÀ CHÍNH SÁCH ƯU ĐÃI THUẾ TNDN 2026 (LEAN TAX STANDARDS)
 * Căn cứ pháp lý:
 * - Luật Thuế Thu nhập doanh nghiệp số 67/2025/QH15
 * - Nghị định 320/2025/NĐ-CP (Quy định chi tiết thi hành Luật Thuế TNDN)
 * - Nghị định 141/2026/NĐ-CP (Chính sách miễn thuế TNDN cho doanh nghiệp doanh thu <= 1 tỷ đồng)
 * - Nghị định 20/2026/NĐ-CP (Khoản 3 Điều 7: Miễn thuế TNDN 3 năm đối với DNNVV đăng ký kinh doanh lần đầu)
 * - Nghị định 31/2021/NĐ-CP & Nghị định 218/2013/NĐ-CP (Ưu đãi địa bàn KT-XH khó khăn & đặc biệt khó khăn)
 */

export interface CitTaxTierResult {
  taxRate: number;              // 0, 0.10, 0.15, 0.17, 0.20
  taxRatePercentText: string;   // '0% (Miễn thuế)', '10%', '15%', '17%', '20%'
  tierCode: 'EXEMPT_UNDER_1B' | 'EXEMPT_3_YEARS' | 'RATE_15' | 'RATE_17' | 'RATE_20' | 'RATE_ZONE_10' | 'RATE_ZONE_17';
  title: string;
  badgeColor: string;
  isExempted: boolean;
  legalBasis: string;
  explanation: string;
  normalizedRevenue: number;    // Doanh thu năm trước đã quy đổi đủ 12 tháng
  missingConditions?: string[]; // Điều kiện còn thiếu cần xác minh
}

export interface TaxCheckerInput {
  priorYearRevenue?: number;            // Doanh thu kỳ trước liền kề (VNĐ)
  operatingMonthsPriorYear?: number;    // Số tháng hoạt động thực tế trong năm trước (1-12)
  isNewlyEstablished?: boolean;         // Thành lập trong năm hiện tại
  isFirstTimeStartup?: boolean;         // Doanh nghiệp vừa & nhỏ đăng ký lần đầu
  hasRelatedParty?: boolean;            // Có công ty con / giao dịch liên kết loại trừ
  zoneTaxRate?: number;                 // Thuế suất ưu đãi địa bàn (nếu có: 0.10 hoặc 0.17)
  zoneTitle?: string;
  zoneLegalBasis?: string;
}

/**
 * Hàm chuẩn hóa doanh thu kỳ trước quy đổi đủ 12 tháng
 * Công thức luật định: Doanh thu quy đổi = (Doanh thu thực tế / Số tháng hoạt động) * 12
 */
export function calculateNormalizedRevenue(revenue = 0, months = 12): number {
  if (months <= 0) return 0;
  if (months >= 12) return Math.max(0, revenue);
  return Math.round((Math.max(0, revenue) / months) * 12);
}

/**
 * 🎯 RULE ENGINE: XÁC ĐỊNH BẬC THUẾ SUẤT TNDN & CHÍNH SÁCH MIỄN GIẢM NĂM 2026
 */
export function determineCitTaxRate(input: TaxCheckerInput): CitTaxTierResult {
  const isNew = Boolean(input.isNewlyEstablished);
  const isFirstStartup = Boolean(input.isFirstTimeStartup);
  const hasRelated = Boolean(input.hasRelatedParty);
  const months = input.operatingMonthsPriorYear && input.operatingMonthsPriorYear > 0 ? Math.min(12, input.operatingMonthsPriorYear) : 12;
  const rawRevenue = input.priorYearRevenue || 0;
  const normalizedRev = calculateNormalizedRevenue(rawRevenue, months);

  // 1. ƯU ĐÃI ĐỊA BÀN ĐẶC BIỆT KHÓ KHĂN / KCNC / KKT (10% - Cố định ưu đãi cao nhất)
  if (input.zoneTaxRate === 0.10) {
    return {
      taxRate: 0.10,
      taxRatePercentText: '10%',
      tierCode: 'RATE_ZONE_10',
      title: 'Thuế suất ưu đãi 10% (KCNC / KKT / Địa bàn ĐB Khó khăn)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      isExempted: false,
      legalBasis: input.zoneLegalBasis || 'Điều 15 Nghị định 218/2013/NĐ-CP & Phụ lục III Nghị định 31/2021/NĐ-CP.',
      explanation: 'Doanh nghiệp đặt trụ sở tại địa bàn đặc biệt khó khăn hoặc KCNC, áp dụng thuế suất ưu đãi 10% trong 15 năm.',
      normalizedRevenue: normalizedRev,
    };
  }

  // 2. MIỄN THUẾ 3 NĂM: Doanh nghiệp nhỏ và vừa đăng ký kinh doanh lần đầu (Khoản 3 Điều 7 NĐ 20/2026/NĐ-CP)
  if (isFirstStartup && !hasRelated) {
    return {
      taxRate: 0,
      taxRatePercentText: '0% (Miễn thuế 3 năm)',
      tierCode: 'EXEMPT_3_YEARS',
      title: 'Miễn thuế TNDN 03 năm (DNNVV Đăng ký lần đầu)',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      isExempted: true,
      legalBasis: 'Khoản 3 Điều 7 Nghị định 20/2026/NĐ-CP (Chính sách hỗ trợ DNNVV đăng ký lần đầu).',
      explanation: 'Doanh nghiệp nhỏ và vừa thành lập mới từ đề án khởi nghiệp sáng tạo hoặc đăng ký lần đầu (không thuộc diện sáp nhập, chia tách hay tái cơ cấu).',
      normalizedRevenue: normalizedRev,
      missingConditions: [
        'Người đại diện pháp luật chưa từng đứng tên doanh nghiệp giải thể/phá sản trong 3 năm qua',
        'Không phát sinh quan hệ công ty mẹ - con né thuế',
      ],
    };
  }

  // 3. DOANH NGHIỆP MỚI THÀNH LẬP TRONG NĂM HIỆN TẠI
  if (isNew) {
    if (rawRevenue > 0 && rawRevenue <= 1000000000 && !hasRelated) {
      return {
        taxRate: 0,
        taxRatePercentText: '0% (Xem xét miễn)',
        tierCode: 'EXEMPT_UNDER_1B',
        title: 'Miễn thuế TNDN (Doanh thu dự kiến <= 1 tỷ)',
        badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
        isExempted: true,
        legalBasis: 'Nghị định 141/2026/NĐ-CP & Luật Thuế TNDN 67/2025/QH15.',
        explanation: 'Doanh nghiệp mới thành lập dự kiến doanh thu năm đầu không quá 1 tỷ đồng: Tạm thời không phải tạm nộp thuế TNDN quý. Quyết toán thực tế cuối năm.',
        normalizedRevenue: 0,
      };
    }

    return {
      taxRate: 0.15,
      taxRatePercentText: '15% (Khởi điểm)',
      tierCode: 'RATE_15',
      title: 'Thuế suất khởi điểm 15% (Doanh nghiệp mới thành lập)',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      isExempted: false,
      legalBasis: 'Luật Thuế TNDN số 67/2025/QH15 & Nghị định 320/2025/NĐ-CP.',
      explanation: 'Doanh nghiệp mới thành lập trong năm được xếp tạm vào bậc doanh thu phổ thông của DNNVV (15%), quyết toán theo doanh thu thực tế khi kết thúc năm tài chính.',
      normalizedRevenue: 0,
    };
  }

  // 4. DOANH NGHIỆP ĐANG HOẠT ĐỘNG: PHÂN THEO DOANH THU NĂM TRƯỚC LIỀN KỀ QUY ĐỔI 12 THÁNG
  
  // Bậc A: Doanh thu quy đổi <= 1 tỷ VNĐ -> Miễn thuế TNDN theo NĐ 141/2026/NĐ-CP
  if (normalizedRev <= 1000000000 && normalizedRev > 0 && !hasRelated) {
    return {
      taxRate: 0,
      taxRatePercentText: '0% (Miễn thuế)',
      tierCode: 'EXEMPT_UNDER_1B',
      title: 'Miễn thuế TNDN theo Nghị định 141/2026 (Doanh thu <= 1 tỷ)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      isExempted: true,
      legalBasis: 'Nghị định 141/2026/NĐ-CP & Luật Thuế Thu nhập doanh nghiệp số 67/2025/QH15.',
      explanation: `Doanh thu năm trước liền kề (${rawRevenue.toLocaleString('vi-VN')} đ quy đổi 12 tháng: ${normalizedRev.toLocaleString('vi-VN')} đ) không quá 1 tỷ đồng. Đủ điều kiện xem xét miễn thuế TNDN.`,
      normalizedRevenue: normalizedRev,
      missingConditions: [
        'Không thuộc đối tượng công ty liên kết theo Nghị định 132/2020/NĐ-CP',
        'Thực hiện chế độ kế toán, hóa đơn điện tử hợp pháp theo Luật Quản lý thuế',
      ],
    };
  }

  // Bậc B: Doanh thu quy đổi > 1 tỷ đến 3 tỷ VNĐ -> Thuế suất 15%
  if (normalizedRev > 1000000000 && normalizedRev <= 3000000000) {
    return {
      taxRate: 0.15,
      taxRatePercentText: '15%',
      tierCode: 'RATE_15',
      title: 'Thuế suất ưu đãi 15% (Doanh thu năm trước > 1 tỷ đến 3 tỷ)',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      isExempted: false,
      legalBasis: 'Luật Thuế Thu nhập doanh nghiệp số 67/2025/QH15 & Nghị định 320/2025/NĐ-CP.',
      explanation: `Doanh thu năm trước quy đổi 12 tháng là ${normalizedRev.toLocaleString('vi-VN')} đ (thuộc ngưỡng 1 - 3 tỷ đồng), được áp dụng thuế suất ưu đãi doanh nghiệp siêu nhỏ 15%.`,
      normalizedRevenue: normalizedRev,
    };
  }

  // Bậc C: Doanh thu quy đổi > 3 tỷ đến 50 tỷ VNĐ -> Thuế suất 17%
  if (normalizedRev > 3000000000 && normalizedRev <= 50000000000) {
    return {
      taxRate: 0.17,
      taxRatePercentText: '17%',
      tierCode: 'RATE_17',
      title: 'Thuế suất ưu đãi 17% (Doanh thu năm trước > 3 tỷ đến 50 tỷ)',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      isExempted: false,
      legalBasis: 'Luật Thuế Thu nhập doanh nghiệp số 67/2025/QH15 & Nghị định 320/2025/NĐ-CP.',
      explanation: `Doanh thu năm trước quy đổi 12 tháng là ${normalizedRev.toLocaleString('vi-VN')} đ (thuộc ngưỡng 3 - 50 tỷ đồng), áp dụng thuế suất ưu đãi doanh nghiệp nhỏ 17%.`,
      normalizedRevenue: normalizedRev,
    };
  }

  // Bậc D: Doanh thu quy đổi > 50 tỷ VNĐ (hoặc không khai báo doanh thu) -> Thuế suất thông thường 20%
  // Kiểm tra ưu đãi địa bàn khó khăn 17% nếu có
  if (input.zoneTaxRate === 0.17) {
    return {
      taxRate: 0.17,
      taxRatePercentText: '17%',
      tierCode: 'RATE_ZONE_17',
      title: 'Thuế suất ưu đãi địa bàn khó khăn 17%',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      isExempted: false,
      legalBasis: input.zoneLegalBasis || 'Nghị định 218/2013/NĐ-CP & Phụ lục III Nghị định 31/2021/NĐ-CP.',
      explanation: 'Doanh nghiệp đặt tại địa bàn KT-XH khó khăn, hưởng thuế suất ưu đãi địa bàn 17%.',
      normalizedRevenue: normalizedRev,
    };
  }

  return {
    taxRate: 0.20,
    taxRatePercentText: '20%',
    tierCode: 'RATE_20',
    title: 'Thuế suất thông thường 20% (Doanh thu > 50 tỷ đồng)',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    isExempted: false,
    legalBasis: 'Điều 10 Luật Thuế Thu nhập doanh nghiệp 67/2025/QH15 (mức phổ thông).',
    explanation: normalizedRev > 50000000000
      ? `Doanh thu năm trước quy đổi là ${normalizedRev.toLocaleString('vi-VN')} đ (> 50 tỷ đồng), áp dụng thuế suất TNDN phổ thông 20%.`
      : 'Áp dụng mức thuế suất phổ thông 20% theo quy định chung.',
    normalizedRevenue: normalizedRev,
  };
}
