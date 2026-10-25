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
 * 📦 METADATA CÁC MODULE TUÂN THỦ PHÁP LÝ CELRA
 */
export const COMPLIANCE_MODULES: Record<ComplianceModuleId, ComplianceModuleMeta> = {
  MODULE_TAX_CORE: {
    id: 'MODULE_TAX_CORE',
    name: 'Tuân thủ Thuế Doanh Nghiệp',
    badge: 'MVP Sẵn sàng',
    status: 'ACTIVE',
    statusLabel: 'Đang kích hoạt (MVP)',
    description: 'Kê khai thuế GTGT, TNDN, TNCN, Thuế môn bài & Lịch nghĩa vụ thuế định kỳ đủ các đợt',
    iconName: 'Receipt'
  },
  MODULE_INVOICE_CASHFLOW: {
    id: 'MODULE_INVOICE_CASHFLOW',
    name: 'Hóa Đơn & Dòng Tiền Thực Tế',
    badge: 'MVP Sẵn sàng',
    status: 'ACTIVE',
    statusLabel: 'Đang kích hoạt (MVP)',
    description: 'Hóa đơn máy tính tiền POS, Doanh thu sàn TMĐT, Đối soát tiền mặt và sao kê ngân hàng',
    iconName: 'Coins'
  },
  MODULE_LABOR_HR: {
    id: 'MODULE_LABOR_HR',
    name: 'Lao Động, Tiền Lương & BHXH',
    badge: 'Giai đoạn 2',
    status: 'ROADMAP_PHASE_2',
    statusLabel: 'Lộ trình Giai đoạn 2',
    description: 'Hợp đồng lao động, Thang bảng lương, Đóng BHXH bắt buộc, Đăng ký Nội quy lao động',
    iconName: 'Users'
  },
  MODULE_LICENSING_ATTP: {
    id: 'MODULE_LICENSING_ATTP',
    name: 'An Toàn Thực Phẩm & Giấy Phép Con',
    badge: 'Giai đoạn 3',
    status: 'ROADMAP_PHASE_3',
    statusLabel: 'Lộ trình Giai đoạn 3',
    description: 'Chứng nhận ATTP, PCCC cơ sở, Khám sức khỏe thẻ xanh, Kiểm thực 3 bước & Lưu mẫu',
    iconName: 'ShieldAlert'
  },
  MODULE_ECOM_DATA_PRIVACY: {
    id: 'MODULE_ECOM_DATA_PRIVACY',
    name: 'Thương Mại Điện Tử & Bảo Vệ Dữ Liệu',
    badge: 'Toàn diện',
    status: 'ACTIVE',
    statusLabel: 'Hoạt động',
    description: 'Thông báo website Bộ Công Thương, Nghị định 13/2023/NĐ-CP bảo vệ dữ liệu cá nhân khách hàng',
    iconName: 'Globe'
  },
  MODULE_PREMISES_PCCC: {
    id: 'MODULE_PREMISES_PCCC',
    name: 'Địa Điểm & An Toàn PCCC',
    badge: 'Toàn diện',
    status: 'ACTIVE',
    statusLabel: 'Hoạt động',
    description: 'Biển hiệu trụ sở chính theo Luật Quảng cáo, Trang bị phương tiện PCCC cơ sở theo NĐ 136/2020',
    iconName: 'Building2'
  },
  MODULE_CONTRACTS: {
    id: 'MODULE_CONTRACTS',
    name: 'Hợp Đồng & Giao Kết Kinh Doanh',
    badge: 'Toàn diện',
    status: 'ACTIVE',
    statusLabel: 'Hoạt động',
    description: 'Thẩm quyền đại diện ký kết hợp đồng, Hợp đồng thuê mặt bằng, Hợp đồng cung ứng dịch vụ',
    iconName: 'Briefcase'
  },
  MODULE_DATA_IP: {
    id: 'MODULE_DATA_IP',
    name: 'Dữ Liệu & Sở Hữu Trí Tuệ',
    badge: 'Toàn diện',
    status: 'ACTIVE',
    statusLabel: 'Hoạt động',
    description: 'Bảo vệ dữ liệu cá nhân theo NĐ 13/2023, Đăng ký bảo hộ nhãn hiệu và thương hiệu theo Luật SHTT',
    iconName: 'HardDrive'
  },
  MODULE_LICENSING_CON: {
    id: 'MODULE_LICENSING_CON',
    name: 'Giấy Phép Con & Ngành Nghề Chuyên Ngành',
    badge: 'Toàn diện',
    status: 'ACTIVE',
    statusLabel: 'Hoạt động',
    description: 'Rà soát danh mục ngành nghề có điều kiện theo Luật Đầu tư 2020 và các giấy phép chuyên ngành',
    iconName: 'Award'
  },
  MODULE_LEGAL_CORP: {
    id: 'MODULE_LEGAL_CORP',
    name: 'Hồ Sơ Pháp Lý & Quản Trị Vốn',
    badge: 'Toàn diện',
    status: 'ACTIVE',
    statusLabel: 'Hoạt động',
    description: 'Tiến độ góp đủ 100% vốn điều lệ 90 ngày, Thủ tục đăng ký thay đổi ĐKKD trong 10 ngày làm việc',
    iconName: 'ShieldCheck'
  }
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
  requiresLaborRuleBook: false,
  companyTypeTag: 'TAG_TNHH_2TV',
  industryTags: []
};

export const STANDARD_OPTIONS = [
  'Đã hoàn thành / Tuân thủ đầy đủ',
  'Chưa thực hiện / Chưa có',
  'Đang chuẩn bị / Có một phần',
  'Chưa rõ quy định'
];
