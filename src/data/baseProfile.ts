import type { 
  CompanyTypeTag, 
  IndustryTag, 
  BaseProfile, 
  ComplianceModuleId,
  TagMeta,
  ComplianceModuleMeta,
  LegalTypeDetection,
} from '../interfaces';

/**
 * 🏢 THẺ LOẠI HÌNH DOANH NGHIỆP (BƯỚC 1)
 */
export const COMPANY_TYPE_TAGS: TagMeta<CompanyTypeTag>[] = [
  {
    id: 'TAG_TNHH_1TV',
    label: 'Công ty TNHH Một thành viên',
    shortLabel: 'TNHH 1TV',
    description: 'Do 1 cá nhân hoặc tổ chức làm chủ sở hữu, chịu thuế TNDN và quyết toán năm',
    iconName: 'Building2',
    badgeColor: 'bg-blue-50 border-blue-300 text-blue-800'
  },
  {
    id: 'TAG_TNHH_2TV',
    label: 'Công ty TNHH Hai thành viên trở lên',
    shortLabel: 'TNHH 2TV+',
    description: 'Từ 2 đến 50 thành viên góp vốn, có Hội đồng thành viên & Sổ đăng ký thành viên',
    iconName: 'Users',
    badgeColor: 'bg-cyan-50 border-cyan-300 text-cyan-800'
  }
];

export function detectEnterpriseLegalType(companyName: string): LegalTypeDetection {
  const upper = (companyName || '').toUpperCase().trim();

  // 1. Kiểm tra Công ty TNHH 1 thành viên
  if (
    upper.includes('TNHH 1 THÀNH VIÊN') ||
    upper.includes('TNHH MỘT THÀNH VIÊN') ||
    upper.includes('TNHH 1TV') ||
    upper.includes('TNHH MTV') ||
    upper.includes('TRÁCH NHIỆM HỮU HẠN MỘT THÀNH VIÊN') ||
    upper.includes('TRÁCH NHIỆM HỮU HẠN 1 THÀNH VIÊN')
  ) {
    return {
      tagId: 'TAG_TNHH_1TV',
      label: 'Công ty TNHH 1 thành viên',
      isSupported: true,
    };
  }

  // 2. Kiểm tra Công ty TNHH 2 thành viên trở lên
  if (
    upper.includes('TNHH') ||
    upper.includes('TRÁCH NHIỆM HỮU HẠN')
  ) {
    return {
      tagId: 'TAG_TNHH_2TV',
      label: 'Công ty TNHH 2 thành viên trở lên',
      isSupported: true,
    };
  }

  // 3. Các loại hình khác chưa hỗ trợ trong giai đoạn hiện tại (sau này phát triển thêm CP / Hộ kinh doanh thì mở rộng ở đây)
  let detectedType = 'Khác';
  if (upper.includes('CỔ PHẦN') || upper.includes('CTCP')) {
    detectedType = 'Công ty Cổ phần (JSC)';
  } else if (upper.includes('DOANH NGHIỆP TƯ NHÂN') || upper.includes('DNTN')) {
    detectedType = 'Doanh nghiệp tư nhân';
  } else if (upper.includes('HỘ KINH DOANH') || upper.includes('HKD')) {
    detectedType = 'Hộ kinh doanh cá thể';
  } else if (upper.includes('HỢP DANH')) {
    detectedType = 'Công ty Hợp danh';
  } else if (upper.includes('CHI NHÁNH')) {
    detectedType = 'Chi nhánh phụ thuộc';
  }

  return {
    tagId: 'UNSUPPORTED',
    label: detectedType,
    isSupported: false,
    unsupportedReason: `Hiện tại hệ thống chỉ hỗ trợ loại hình doanh nghiệp Cty 1 thành viên và 2 thành viên trở lên, chưa hỗ trợ loại hình ${detectedType} của bạn.`,
  };
}

/**
 * 🏷️ THẺ NGÀNH NGHỀ TRỌNG TÂM (BƯỚC 1)
 */
export const INDUSTRY_TAGS: TagMeta<IndustryTag>[] = [
  {
    id: 'TAG_FNB',
    label: 'Dịch vụ ăn uống / F&B / Nhà hàng / Quán cafe',
    shortLabel: 'F&B & Ăn uống',
    description: 'Bán lẻ trực tiếp tại quán / takeaway / GrabFood / ShopeeFood. Bắt buộc xuất HĐĐT máy tính tiền và đối soát dòng tiền POS/VietQR.',
    iconName: 'UtensilsCrossed',
    badgeColor: 'bg-amber-50 border-amber-300 text-amber-800'
  },
  {
    id: 'TAG_ECOMMERCE',
    label: 'Bán lẻ / Bán hàng Online / Có Website, App TMĐT',
    shortLabel: 'Bán lẻ & TMĐT',
    description: 'Bán hàng qua Shopee, TikTok Shop, Lazada, Website riêng, thu hộ COD. Đối soát lệch doanh thu sàn thuế và chứng từ hàng hóa nhập.',
    iconName: 'ShoppingCart',
    badgeColor: 'bg-purple-50 border-purple-300 text-purple-800'
  }
];

/**
 * 📦 METADATA PHÂN HỆ TUÂN THỦ THUẾ TNDN CELRA
 */
export const COMPLIANCE_MODULES: Record<ComplianceModuleId, ComplianceModuleMeta> = {
  MODULE_TAX_CORE: {
    id: 'MODULE_TAX_CORE',
    name: 'Tuân thủ Thuế Thu Nhập Doanh Nghiệp (TNDN)',
    badge: 'Trọng tâm',
    status: 'ACTIVE',
    statusLabel: 'Đang kích hoạt',
    description: 'Sàng lọc thuế suất TNDN (15%/17%/20%), Tạm nộp 4 quý tối thiểu 80%, Quyết toán Mẫu 03/TNDN & Lịch nghĩa vụ thuế TNDN',
    iconName: 'Receipt'
  },
  MODULE_INVOICE_CASHFLOW: {
    id: 'MODULE_INVOICE_CASHFLOW',
    name: 'Hóa Đơn & Chi Phí Được Trừ (Mục B4)',
    badge: 'Trọng tâm',
    status: 'ACTIVE',
    statusLabel: 'Đang kích hoạt',
    description: 'Kiểm soát hóa đơn hợp pháp, điều kiện chuyển khoản từ 5 triệu đồng và bóc tách chi phí không được trừ tại Mục B4',
    iconName: 'Coins'
  },
};

/**
 * 📋 DỮ LIỆU KHỞI TẠO HỒ SƠ PHÁP NHÂN MẶC ĐỊNH (BƯỚC 1)
 */
export const DEFAULT_BASE_PROFILE: BaseProfile = {
  taxCode: '',
  companyName: '',
  employeeScale: 'under_10',
  employeeCount: 1,
  annualRevenue: 0,
  charterCapital: 0,
  isNewlyEstablished: false,
  companyTypeTag: 'TAG_TNHH_2TV',
  industryTags: [], // Bắt đầu bằng mảng rỗng để bắt buộc người dùng chủ động chọn ngành nghề thực tế
};

export const STANDARD_OPTIONS = [
  'Đã hoàn thành / Tuân thủ đầy đủ',
  'Chưa thực hiện / Chưa có',
  'Đang chuẩn bị / Có một phần',
  'Chưa rõ quy định'
];
