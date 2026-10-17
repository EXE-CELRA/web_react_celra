import type { 
  CompanyTypeTag, 
  IndustryTag, 
  BaseProfile, 
  DynamicSituationQuestion,
  Checklist,
  Task,
  ContextFact,
  ComplianceModuleId,
} from '../types';

export interface TagMeta<T> {
  id: T;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  badgeColor: string;
}

export interface ComplianceModuleMeta {
  id: ComplianceModuleId;
  name: string;
  badge: string;
  status: 'ACTIVE' | 'ROADMAP_PHASE_2' | 'ROADMAP_PHASE_3';
  statusLabel: string;
  description: string;
  iconName: string;
}

// =========================================================================
// [ TẦNG 1: HỒ SƠ DOANH NGHIỆP ] (Khai báo 1 lần duy nhất lúc Onboarding)
// =========================================================================

export const COMPANY_TYPE_TAGS: TagMeta<CompanyTypeTag>[] = [
  {
    id: 'TAG_TNHH_1TV',
    label: 'Công ty TNHH Một thành viên',
    shortLabel: 'TNHH 1TV',
    description: 'Do 1 tổ chức hoặc 1 cá nhân làm chủ sở hữu, chịu thuế TNDN và quyết toán năm',
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

export const INDUSTRY_TAGS: TagMeta<IndustryTag>[] = [
  {
    id: 'TAG_FNB',
    label: 'Dịch vụ ăn uống / F&B / Nhà hàng / Quán cafe',
    shortLabel: 'F&B & Nhà hàng',
    description: 'Bán trực tiếp tại chỗ, bắt buộc sử dụng Hóa đơn điện tử máy tính tiền kết nối cơ quan thuế',
    iconName: 'UtensilsCrossed',
    badgeColor: 'bg-amber-50 border-amber-300 text-amber-800'
  },
  {
    id: 'TAG_ECOMMERCE',
    label: 'Bán lẻ / Bán hàng Online / Có Website, App TMĐT',
    shortLabel: 'Bán lẻ & TMĐT',
    description: 'Kinh doanh Shopee, TikTok Shop, Website, giao hàng COD — Rà soát lệch doanh thu sàn với thuế',
    iconName: 'ShoppingCart',
    badgeColor: 'bg-purple-50 border-purple-300 text-purple-800'
  },
  {
    id: 'TAG_B2B_SERVICE',
    label: 'Dịch vụ B2B / Văn phòng / Tư vấn / Phần mềm',
    shortLabel: 'Dịch vụ B2B & Phần mềm',
    description: 'Cung cấp dịch vụ cho doanh nghiệp, xuất hóa đơn theo nghiệm thu, rà soát chi phí lương & khấu trừ TNCN 10%',
    iconName: 'Code2',
    badgeColor: 'bg-teal-50 border-teal-300 text-teal-800'
  },
  {
    id: 'TAG_MANUFACTURING',
    label: 'Sản xuất / Chế biến / Gia công / Có kho bãi',
    shortLabel: 'Sản xuất & Kho',
    description: 'Nhà xưởng gia công chế biến — Định mức tiêu hao nguyên vật liệu làm căn cứ tính chi phí hợp lý TNDN',
    iconName: 'Factory',
    badgeColor: 'bg-orange-50 border-orange-300 text-orange-800'
  },
  {
    id: 'TAG_EDUCATION',
    label: 'Giáo dục / Đào tạo / Trung tâm kỹ năng',
    shortLabel: 'Giáo dục & Đào tạo',
    description: 'Đào tạo giảng dạy kỹ năng — Rà soát đối tượng không chịu thuế GTGT và hóa đơn học phí',
    iconName: 'GraduationCap',
    badgeColor: 'bg-rose-50 border-rose-300 text-rose-800'
  },
  {
    id: 'TAG_LOGISTICS',
    label: 'Vận tải / Giao nhận kho vận',
    shortLabel: 'Vận tải & Logistics',
    description: 'Vận tải hàng hóa hành khách — Hóa đơn điện tử xăng dầu, phí cầu đường và chi phí khấu hao phương tiện',
    iconName: 'Truck',
    badgeColor: 'bg-sky-50 border-sky-300 text-sky-800'
  }
];

// =========================================================================
// [ TẦNG 2: CÁC MODULE TUÂN THỦ PHÁP LÝ ] (Mở khóa dần theo lộ trình)
// =========================================================================

export const COMPLIANCE_MODULES: Record<ComplianceModuleId, ComplianceModuleMeta> = {
  MODULE_TAX_CORE: {
    id: 'MODULE_TAX_CORE',
    name: 'Tuân thủ Thuế Doanh Nghiệp',
    badge: 'MVP Sẵn sàng',
    status: 'ACTIVE',
    statusLabel: 'Đang kích hoạt (MVP)',
    description: 'Kê khai thuế GTGT, TNDN, TNCN, Thuế môn bài & Lịch nghĩa vụ thuế định kỳ',
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
    badge: 'Giai đoạn 3',
    status: 'ROADMAP_PHASE_3',
    statusLabel: 'Lộ trình Giai đoạn 3',
    description: 'Thông báo website Bộ Công Thương, Nghị định 13/2023/NĐ-CP bảo vệ dữ liệu cá nhân khách hàng',
    iconName: 'Globe'
  }
};

export const DEFAULT_BASE_PROFILE: BaseProfile = {
  taxCode: '0318294012',
  companyName: 'Công ty TNHH Bếp Việt',
  employeeScale: 'under_10',
  requiresLaborRuleBook: false,
  companyTypeTag: 'TAG_TNHH_2TV',
  industryTags: ['TAG_FNB', 'TAG_ECOMMERCE']
};

export const STANDARD_OPTIONS = [
  'Đã hoàn thành / Tuân thủ đầy đủ',
  'Chưa thực hiện / Chưa có',
  'Đang chuẩn bị / Có một phần',
  'Chưa rõ quy định'
];

/**
 * Generate Dynamic Question List based on BaseProfile selected in Step 1
 * Focusing on MVP Active Modules: MODULE_TAX_CORE and MODULE_INVOICE_CASHFLOW
 */
export function generateDynamicQuestions(profile: BaseProfile): DynamicSituationQuestion[] {
  const questions: DynamicSituationQuestion[] = [];

  // ----------------------------------------------------
  // NHÁNH A: THEO LOẠI HÌNH DOANH NGHIỆP (THUẾ & QUẢN TRỊ KÊ KHAI)
  // Áp dụng cho Công ty TNHH 1TV & TNHH 2TV+
  // ----------------------------------------------------
  const corpTypeLabel = profile.companyTypeTag === 'TAG_TNHH_1TV' ? 'TNHH 1TV' : 'TNHH 2TV+';
  questions.push(
    {
      id: 'q_tax_corp_1',
      moduleId: 'MODULE_TAX_CORE',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: `Loại hình: ${corpTypeLabel}`,
      title: 'Doanh nghiệp có thực hiện nộp tờ khai thuế GTGT và thuế TNCN định kỳ (theo tháng hoặc quý) đúng thời hạn quy định không?',
      legalBasis: 'Điều 44 Luật Quản lý thuế số 38/2019/QH14 và Nghị định 126/2020/NĐ-CP. Hạn nộp theo tháng là ngày 20 tháng sau, theo quý là ngày cuối cùng của tháng đầu quý sau.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-1252020nd-cp-quy-dinh-ve-xu-phat-vi-pham-hanh-chinh-ve-thue-hoa-don-24591.html#dieu_13',
      options: STANDARD_OPTIONS,
      severity: 'urgent',
      legalReference: {
        lawName: 'Nghị định 125/2020/NĐ-CP',
        article: 'Điều 13'
      }
    },
    {
      id: 'q_tax_corp_2',
      moduleId: 'MODULE_TAX_CORE',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: `Loại hình: ${corpTypeLabel}`,
      title: 'Doanh nghiệp có thực hiện tạm nộp thuế Thu nhập doanh nghiệp (TNDN) 4 quý đạt tối thiểu 80% số thuế TNDN phải nộp cả năm không?',
      legalBasis: 'Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP sửa đổi Nghị định 126/2020/NĐ-CP. Hạn tạm nộp quý 4 là ngày 30/01 năm sau.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-912022nd-cp-cua-chinh-phu-ve-viec-sua-doi-bo-sung-mot-so-dieu-cua-nghi-dinh-1262020nd-cp-ngay-19102020-cua-chinh-phu-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-quan-ly-thue-1098434.html',
      options: STANDARD_OPTIONS,
      severity: 'high',
      legalReference: {
        lawName: 'Nghị định 91/2022/NĐ-CP',
        article: 'Khoản 3 Điều 1'
      }
    },
    {
      id: 'q_tax_corp_3',
      moduleId: 'MODULE_INVOICE_CASHFLOW',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: `Loại hình: ${corpTypeLabel}`,
      title: 'Mọi giao dịch mua hàng hóa, dịch vụ từ 20 triệu đồng trở lên (đã có VAT) có được thanh toán qua tài khoản ngân hàng công ty (không dùng tiền mặt) không?',
      legalBasis: 'Điều 15 Thông tư 219/2013/TT-BTC và Thông tư 78/2014/TT-BTC. Điều kiện bắt buộc để được khấu trừ thuế GTGT đầu vào và tính vào chi phí được trừ khi tính thuế TNDN.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-2192013tt-btc-huong-dan-luat-thue-gia-tri-gia-tang-va-nghi-dinh-2092013nd-cp-do-bo-truong-bo-tai-chinh-ban-hanh-323235.html#dieu_15',
      options: STANDARD_OPTIONS,
      severity: 'urgent',
      legalReference: {
        lawName: 'Thông tư 219/2013/TT-BTC',
        article: 'Điều 15'
      }
    }
  );

  // ----------------------------------------------------
  // NHÁNH B: THEO THẺ NGÀNH NGHỀ & DÒNG TIỀN HÓA ĐƠN
  // ----------------------------------------------------

  // 1. F&B: Máy tính tiền, doanh thu bill & nguyên liệu
  if (profile.industryTags.includes('TAG_FNB')) {
    questions.push(
      {
        id: 'q_fnb_tax_1',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_FNB',
        branchLabel: 'Ngành nghề: Dịch vụ ăn uống / F&B',
        title: 'Cơ sở đã cài đặt và sử dụng Hóa đơn điện tử khởi tạo từ máy tính tiền kết nối dữ liệu trực tiếp với cơ quan thuế khi thanh toán cho khách ăn uống chưa?',
        legalBasis: 'Điều 90 Luật Quản lý thuế số 38/2019/QH14, Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC. Bắt buộc đối với các cơ sở ăn uống, nhà hàng, quán cafe có phát sinh bán lẻ trực tiếp.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-782021tt-btc-huong-dan-thuc-hien-luat-quan-ly-thue-nghi-dinh-1232020nd-cp-quy-dinh-ve-hoa-don-chung-tu-do-bo-truong-bo-tai-chinh-ban-hanh-1550.html',
        options: STANDARD_OPTIONS,
        severity: 'urgent',
        legalReference: {
          lawName: 'Nghị định 125/2020/NĐ-CP',
          article: 'Điều 24'
        }
      },
      {
        id: 'q_fnb_tax_2',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_FNB',
        branchLabel: 'Ngành nghề: Dịch vụ ăn uống / F&B',
        title: 'Doanh nghiệp có thực hiện đối soát định kỳ giữa doanh thu thực tế (máy POS, chuyển khoản VietQR, tiền mặt) với tổng doanh thu xuất hóa đơn kê khai thuế không?',
        legalBasis: 'Thông tư 80/2021/TT-BTC hướng dẫn Luật Quản lý thuế. Cơ quan thuế đang đối chiếu dữ liệu giao dịch tài khoản ngân hàng và máy POS để phát hiện hành vi trốn thuế ngoài sổ sách.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-802021tt-btc-huong-dan-luat-quan-ly-thue-va-nghi-dinh-1262020nd-cp-huong-dan-luat-quan-ly-thue-do-bo-truong-bo-tai-chinh-ban-hanh-962.html',
        options: STANDARD_OPTIONS,
        severity: 'high',
        legalReference: {
          lawName: 'Luật Quản lý thuế 38/2019/QH14',
          article: 'Điều 143'
        }
      },
      {
        id: 'q_fnb_tax_3',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_FNB',
        branchLabel: 'Ngành nghề: Dịch vụ ăn uống / F&B',
        title: 'Nguyên liệu thực phẩm đầu vào (thịt, rau củ, hải sản, đồ uống) có đầy đủ Hóa đơn GTGT hoặc Bảng kê thu mua nông sản Mẫu 01/TNDN hợp pháp không?',
        legalBasis: 'Thông tư 96/2015/TT-BTC hướng dẫn thuế TNDN. Nguyên liệu mua từ người dân trực tiếp đánh bắt, trồng trọt phải lập Bảng kê 01/TNDN kèm chứng từ thanh toán.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
        options: STANDARD_OPTIONS,
        severity: 'high',
        legalReference: {
          lawName: 'Thông tư 96/2015/TT-BTC',
          article: 'Điều 4'
        }
      }
    );
  }

  // 2. Bán lẻ & E-commerce: Doanh thu sàn, COD & Hóa đơn hàng hóa
  if (profile.industryTags.includes('TAG_ECOMMERCE')) {
    questions.push(
      {
        id: 'q_ecom_tax_1',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_ECOMMERCE',
        branchLabel: 'Ngành nghề: Bán lẻ & Sàn TMĐT',
        title: 'Doanh nghiệp có thực hiện đối soát và xuất hóa đơn đầy đủ cho doanh thu bán hàng trên các sàn TMĐT (Shopee, TikTok Shop, Lazada) không?',
        legalBasis: 'Nghị định 91/2022/NĐ-CP và Thông tư 40/2021/TT-BTC. Các sàn TMĐT có trách nhiệm cung cấp toàn bộ dữ liệu doanh thu, tài khoản ngân hàng của nhà bán hàng cho Tổng cục Thuế.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-912022nd-cp-cua-chinh-phu-ve-viec-sua-doi-bo-sung-mot-so-dieu-cua-nghi-dinh-1262020nd-cp-ngay-19102020-cua-chinh-phu-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-quan-ly-thue-1098434.html',
        options: STANDARD_OPTIONS,
        severity: 'urgent',
        legalReference: {
          lawName: 'Nghị định 91/2022/NĐ-CP',
          article: 'Khoản 7 Điều 1'
        }
      },
      {
        id: 'q_ecom_tax_2',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_ECOMMERCE',
        branchLabel: 'Ngành nghề: Bán lẻ & Sàn TMĐT',
        title: 'Dòng tiền thu hộ COD từ các đơn vị vận chuyển (GHTK, GHN, Viettel Post...) có được hạch toán đầy đủ vào doanh thu tính thuế của công ty không?',
        legalBasis: 'Luật Quản lý thuế số 38/2019/QH14. Dòng tiền đối soát COD chuyển vào tài khoản doanh nghiệp hoặc tài khoản cá nhân chủ shop đều thuộc diện quản lý thuế.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/luat-quan-ly-thue-2019-54279.html',
        options: STANDARD_OPTIONS,
        severity: 'high',
        legalReference: {
          lawName: 'Luật Quản lý thuế 38/2019/QH14',
          article: 'Điều 17 & Điều 143'
        }
      },
      {
        id: 'q_ecom_tax_3',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_ECOMMERCE',
        branchLabel: 'Ngành nghề: Bán lẻ & Sàn TMĐT',
        title: 'Toàn bộ nguồn hàng hóa nhập về để bán online có đầy đủ Hóa đơn GTGT đầu vào hoặc Tờ khai hải quan nhập khẩu chính ngạch không?',
        legalBasis: 'Nghị định 98/2020/NĐ-CP về xử phạt vi phạm hành chính trong hoạt động thương mại. Hàng hóa bán ra phải chứng minh được nguồn gốc xuất xứ hợp pháp.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/thuong-mai-van-ban/nghi-dinh-982020nd-cp-quy-dinh-ve-xu-phat-vi-pham-hanh-chinh-trong-hoat-dong-thuong-mai-san-xuat-buon-ban-hang-gia-hang-cam-va-bao-ve-quyen-loi-nguoi-tieu-dung-27595.html',
        options: STANDARD_OPTIONS,
        severity: 'urgent',
        legalReference: {
          lawName: 'Nghị định 98/2020/NĐ-CP',
          article: 'Điều 17'
        }
      }
    );
  }

  // 3. Dịch vụ B2B & Phần mềm: Nghiệm thu, chi phí hợp lý & Thuế TNCN cộng tác viên
  if (profile.industryTags.includes('TAG_B2B_SERVICE') || profile.industryTags.includes('TAG_IT_SOFTWARE')) {
    questions.push(
      {
        id: 'q_b2b_tax_1',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_B2B_SERVICE',
        branchLabel: 'Ngành nghề: Dịch vụ B2B & Phần mềm',
        title: 'Hóa đơn điện tử đầu ra cho khách hàng có được lập ngay tại thời điểm hoàn thành dịch vụ hoặc nghiệm thu thanh toán theo quy định không?',
        legalBasis: 'Khoản 2 Điều 9 Nghị định 123/2020/NĐ-CP. Thời điểm lập hóa đơn đối với cung cấp dịch vụ là thời điểm hoàn thành việc cung cấp dịch vụ, không phân biệt đã thu được tiền hay chưa.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/ke-toan-kiem-toan-van-ban/nghi-dinh-1232020nd-cp-quy-dinh-ve-hoa-don-chung-tu-24634.html#dieu_9',
        options: STANDARD_OPTIONS,
        severity: 'high',
        legalReference: {
          lawName: 'Nghị định 125/2020/NĐ-CP',
          article: 'Điều 24 Khoản 3'
        }
      },
      {
        id: 'q_b2b_tax_2',
        moduleId: 'MODULE_TAX_CORE',
        branchType: 'industry',
        branchCode: 'TAG_B2B_SERVICE',
        branchLabel: 'Ngành nghề: Dịch vụ B2B & Phần mềm',
        title: 'Các khoản chi phí thuê ngoài (freelance, chuyên gia, cộng tác viên) từ 2 triệu đồng/lần có thực hiện khấu trừ 10% thuế TNCN hoặc có hóa đơn hợp lệ không?',
        legalBasis: 'Điểm i Khoản 1 Điều 25 Thông tư 111/2013/TT-BTC. Trả tiền công, tiền thù lao từ 2.000.000 đồng/lần trở lên phải khấu trừ 10% thuế TNCN trước khi chi trả.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-1112013tt-btc-huong-dan-luat-thue-thu-nhap-ca-nhan-va-nghi-dinh-652013nd-cp-do-bo-truong-bo-tai-chinh-ban-hanh-334800.html#dieu_25',
        options: STANDARD_OPTIONS,
        severity: 'high',
        legalReference: {
          lawName: 'Thông tư 111/2013/TT-BTC',
          article: 'Điều 25 Khoản 1'
        }
      }
    );
  }

  // 4. Sản xuất: Định mức tiêu hao nguyên vật liệu
  if (profile.industryTags.includes('TAG_MANUFACTURING')) {
    questions.push(
      {
        id: 'q_mfg_tax_1',
        moduleId: 'MODULE_TAX_CORE',
        branchType: 'industry',
        branchCode: 'TAG_MANUFACTURING',
        branchLabel: 'Ngành nghề: Sản xuất & Kho bãi',
        title: 'Doanh nghiệp có xây dựng Bảng định mức tiêu hao nguyên vật liệu sản xuất từ đầu năm để làm căn cứ tính chi phí hợp lý thuế TNDN không?',
        legalBasis: 'Thông tư 96/2015/TT-BTC về thuế TNDN. Phần chi vượt định mức tiêu hao nguyên vật liệu do DN tự xây dựng sẽ bị loại khỏi chi phí được trừ khi tính thuế TNDN.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
        options: STANDARD_OPTIONS,
        severity: 'medium',
        legalReference: {
          lawName: 'Thông tư 96/2015/TT-BTC',
          article: 'Điều 4'
        }
      }
    );
  }

  // 5. Giáo dục & Đào tạo: Đối tượng không chịu thuế GTGT
  if (profile.industryTags.includes('TAG_EDUCATION')) {
    questions.push(
      {
        id: 'q_edu_tax_1',
        moduleId: 'MODULE_TAX_CORE',
        branchType: 'industry',
        branchCode: 'TAG_EDUCATION',
        branchLabel: 'Ngành nghề: Giáo dục & Đào tạo',
        title: 'Doanh nghiệp có phân loại đúng các dịch vụ dạy học thuộc đối tượng Không chịu thuế GTGT và các dịch vụ khác phải chịu thuế GTGT (5% hoặc 10%) không?',
        legalBasis: 'Khoản 13 Điều 4 Thông tư 219/2013/TT-BTC. Dạy học, dạy nghề theo quy định của pháp luật thuộc đối tượng không chịu thuế GTGT; dịch vụ bán giáo trình, ăn uống đi kèm phải chịu thuế riêng.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-2192013tt-btc-huong-dan-luat-thue-gia-tri-gia-tang-va-nghi-dinh-2092013nd-cp-do-bo-truong-bo-tai-chinh-ban-hanh-323235.html#dieu_4',
        options: STANDARD_OPTIONS,
        severity: 'medium',
        legalReference: {
          lawName: 'Thông tư 219/2013/TT-BTC',
          article: 'Điều 4 Khoản 13'
        }
      }
    );
  }

  // 6. Vận tải & Logistics: Hóa đơn xăng dầu & phí cầu đường
  if (profile.industryTags.includes('TAG_LOGISTICS')) {
    questions.push(
      {
        id: 'q_log_tax_1',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_LOGISTICS',
        branchLabel: 'Ngành nghề: Vận tải & Logistics',
        title: 'Hóa đơn xăng dầu và chi phí nhiên liệu phục vụ vận tải có được xuất theo từng lần bơm đúng quy định và có lệnh điều xe chứng minh hợp lý không?',
        legalBasis: 'Nghị định 123/2020/NĐ-CP và Công điện 1284/CĐ-TTg của Thủ tướng Chính phủ về thực hiện HĐĐT xăng dầu từng lần bán.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/ke-toan-kiem-toan-van-ban/nghi-dinh-1232020nd-cp-quy-dinh-ve-hoa-don-chung-tu-24634.html#dieu_9',
        options: STANDARD_OPTIONS,
        severity: 'high',
        legalReference: {
          lawName: 'Nghị định 123/2020/NĐ-CP',
          article: 'Điều 9 & Điều 24'
        }
      }
    );
  }

  // ----------------------------------------------------
  // NHÁNH C: THEO QUY MÔ NHÂN SỰ (CHI PHÍ TIỀN LƯƠNG & THUẾ TNCN)
  // ----------------------------------------------------
  questions.push(
    {
      id: 'q_tax_salary_1',
      moduleId: 'MODULE_TAX_CORE',
      branchType: 'labor_scale',
      branchCode: 'SCALE_LABOR',
      branchLabel: `Quy mô lao động: ${profile.employeeScale === 'under_10' ? 'Dưới 10 nhân sự' : profile.employeeScale === '10_to_50' ? '10 - 50 nhân sự' : 'Trên 50 nhân sự'}`,
      title: 'Hồ sơ chi phí tiền lương có đầy đủ Hợp đồng lao động, Bảng chấm công và Chứng từ chi lương (sao kê ngân hàng/phiếu chi có chữ ký) không?',
      legalBasis: 'Điều 4 Thông tư 96/2015/TT-BTC. Điều kiện để chi phí tiền lương, tiền công được tính vào chi phí hợp lý khi tính thuế TNDN.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
      options: STANDARD_OPTIONS,
      severity: 'high',
      legalReference: {
        lawName: 'Thông tư 96/2015/TT-BTC',
        article: 'Điều 4'
      }
    }
  );

  if (profile.employeeScale !== 'under_10') {
    questions.push(
      {
        id: 'q_tax_salary_2',
        moduleId: 'MODULE_TAX_CORE',
        branchType: 'labor_scale',
        branchCode: 'SCALE_LABOR',
        branchLabel: `Quy mô lao động: ${profile.employeeScale === '10_to_50' ? '10 - 50 nhân sự' : 'Trên 50 nhân sự'}`,
        title: 'Doanh nghiệp có thực hiện tính thuế TNCN theo biểu lũy tiến từng phần và nộp Tờ khai khấu trừ thuế TNCN định kỳ theo tháng/quý không?',
        legalBasis: 'Thông tư 111/2013/TT-BTC và Luật Thuế thu nhập cá nhân. Doanh nghiệp chi trả thu nhập có trách nhiệm khấu trừ thuế TNCN trước khi trả lương cho nhân viên.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-1112013tt-btc-huong-dan-luat-thue-thu-nhap-ca-nhan-va-nghi-dinh-652013nd-cp-do-bo-truong-bo-tai-chinh-ban-hanh-334800.html',
        options: STANDARD_OPTIONS,
        severity: 'high',
        legalReference: {
          lawName: 'Thông tư 111/2013/TT-BTC',
          article: 'Điều 25 & Điều 26'
        }
      }
    );
  }

  return questions;
}

/**
 * Generate Actionable Checklists & Remediation Tasks from survey answers
 * Producing structured tasks for TAX & INVOICE COMPLIANCE
 */
export function generateComplianceArtifacts(
  profile: BaseProfile,
  questions: DynamicSituationQuestion[]
): {
  checklists: Checklist[];
  tasks: Task[];
  contextFacts: ContextFact[];
} {
  const checklists: Checklist[] = [];
  const tasks: Task[] = [];
  const contextFacts: ContextFact[] = [];
  const now = new Date().toISOString().replace('T', ' ').substring(0, 10);
  const nowFull = new Date().toISOString().replace('T', ' ').substring(0, 16);

  // 1. Build Context Facts from Base Profile (TẦNG 1: HỒ SƠ DOANH NGHIỆP)
  contextFacts.push(
    {
      id: 'fact-tax-code',
      key: 'tax_code',
      label: 'Mã số thuế doanh nghiệp',
      group: 'legal',
      currentValue: profile.taxCode,
      source: 'Khảo sát nền tảng Bước 1',
      providedBy: 'Chủ doanh nghiệp',
      providedAt: nowFull,
      status: 'confirmed',
      affectedRules: ['RULE_TAX_REGISTRATION'],
      history: [{ value: profile.taxCode, changedBy: 'Chủ DN', changedAt: nowFull, note: 'Khai báo Bước 1' }]
    },
    {
      id: 'fact-company-type',
      key: 'company_type_tag',
      label: 'Loại hình doanh nghiệp',
      group: 'legal',
      currentValue: COMPANY_TYPE_TAGS.find(t => t.id === profile.companyTypeTag)?.label || profile.companyTypeTag,
      source: 'Khảo sát nền tảng Bước 1',
      providedBy: 'Chủ doanh nghiệp',
      providedAt: nowFull,
      status: 'confirmed',
      affectedRules: ['RULE_CORPORATE_TAX_STRUCTURE'],
      history: [{ value: profile.companyTypeTag, changedBy: 'Chủ DN', changedAt: nowFull, note: 'Gắn thẻ THẺ 1' }]
    },
    {
      id: 'fact-employee-scale',
      key: 'employee_scale',
      label: 'Quy mô nhân sự',
      group: 'hr_labor',
      currentValue: profile.employeeScale === 'under_10' 
        ? 'Dưới 10 nhân viên (Quy mô vi mô)' 
        : profile.employeeScale === '10_to_50' 
        ? 'Từ 10 đến 50 nhân viên (Phát sinh thuế TNCN định kỳ)' 
        : 'Trên 50 nhân viên (Quy mô vừa)',
      source: 'Khảo sát nền tảng Bước 1',
      providedBy: 'Chủ doanh nghiệp',
      providedAt: nowFull,
      status: 'confirmed',
      affectedRules: ['RULE_PIT_WITHHOLDING'],
      history: [{ value: profile.employeeScale, changedBy: 'Chủ DN', changedAt: nowFull, note: 'Khai báo quy mô' }]
    },
    {
      id: 'fact-industry-tags',
      key: 'industry_tags',
      label: 'Ngành nghề & Hoạt động thực tế',
      group: 'operations',
      currentValue: profile.industryTags.map(tag => INDUSTRY_TAGS.find(t => t.id === tag)?.shortLabel || tag).join(', '),
      source: 'Khảo sát nền tảng Bước 1',
      providedBy: 'Chủ doanh nghiệp',
      providedAt: nowFull,
      status: 'confirmed',
      affectedRules: profile.industryTags.map(t => `RULE_${t}_TAX`),
      history: [{ value: profile.industryTags.join(', '), changedBy: 'Chủ DN', changedAt: nowFull, note: 'Gắn thẻ THẺ 2' }]
    }
  );

  // 2. Add question responses into ContextFacts
  questions.forEach((q) => {
    contextFacts.push({
      id: `fact-dynamic-${q.id}`,
      key: q.id,
      label: q.title,
      group: q.branchType === 'company_type' ? 'tax_accounting' : q.branchType === 'labor_scale' ? 'tax_accounting' : 'revenue_invoices',
      currentValue: q.selectedOption || 'Chưa trả lời',
      source: `Khảo sát tình huống Bước 2 (${q.branchLabel})`,
      providedBy: 'Chủ doanh nghiệp',
      providedAt: nowFull,
      status: 'confirmed',
      affectedRules: [q.branchCode],
      history: [{ value: q.selectedOption || 'Chưa trả lời', changedBy: 'Chủ DN', changedAt: nowFull, note: q.branchLabel }]
    });
  });

  // 3. Generate Checklists & Remediation Tasks for TAX & INVOICE MODULES
  // Checklist 1: Thuế & Nghĩa vụ tờ khai (Tax Core)
  const taxQues = questions.filter(q => q.moduleId === 'MODULE_TAX_CORE' || q.branchType === 'company_type');
  if (taxQues.length > 0) {
    const cklId = `ckl-tax-${Date.now()}`;
    const nonCompliant = taxQues.filter(q => q.selectedOption !== 'Đã hoàn thành / Tuân thủ đầy đủ');

    checklists.push({
      id: cklId,
      code: 'CKL-TAX-CORE-01',
      title: 'Bộ Check-list Tuân thủ Thuế & Lịch nộp tờ khai định kỳ (GTGT, TNDN, TNCN)',
      category: 'Thuế Doanh Nghiệp',
      priority: nonCompliant.length > 0 ? 'urgent' : 'medium',
      status: nonCompliant.length === 0 ? 'completed' : 'in_progress',
      generatedFromRuleId: 'RULE-TAX-CORE',
      ruleCode: 'RULE-TAX-CORE',
      contextReason: `Kích hoạt từ loại hình ${COMPANY_TYPE_TAGS.find(t => t.id === profile.companyTypeTag)?.shortLabel || 'Doanh nghiệp'} theo Luật Quản lý thuế số 38/2019/QH14.`,
      legalBasis: 'Luật Quản lý thuế số 38/2019/QH14 và Nghị định 126/2020/NĐ-CP',
      assigneeRole: 'Kế toán & Chủ doanh nghiệp',
      createdAt: now,
      items: taxQues.map((q, idx) => ({
        id: `i-tax-${idx}`,
        title: q.title,
        isRequired: true,
        isChecked: q.selectedOption === 'Đã hoàn thành / Tuân thủ đầy đủ',
        evidenceRequired: true
      }))
    });

    taxQues.forEach((q, idx) => {
      if (q.selectedOption !== 'Đã hoàn thành / Tuân thủ đầy đủ') {
        tasks.push({
          id: `task-tax-${idx}-${Date.now()}`,
          code: `TASK-TAX-0${idx + 1}`,
          title: `[Thuế] ${q.title.substring(0, 75)}...`,
          checklistId: cklId,
          category: 'Thuế Doanh Nghiệp',
          priority: q.severity || 'urgent',
          departmentId: 'dept-accounting',
          departmentName: 'Phòng Kế toán & Đại lý thuế',
          assigneeId: 'user-accountant',
          assigneeName: 'Trần Kế Toán',
          assigneeRole: 'internal_accountant',
          waitingOnRole: 'internal_accountant',
          waitingOnName: 'Trần Kế Toán',
          dueDate: '2026-04-20',
          status: 'in_progress',
          description: `Yêu cầu rà soát hoàn thiện nghĩa vụ thuế: ${q.title}\nCăn cứ pháp lý: ${q.legalBasis}`,
          contextTrigger: `Phát hiện trạng thái "${q.selectedOption || 'Chưa thực hiện'}" từ khảo sát Bước 2.`,
          ruleCode: 'RULE-TAX-CORE',
          legalBasis: q.legalBasis,
          documents: [],
          comments: [
            {
              id: `c-tax-${idx}`,
              authorName: 'CELRA Tax Compliance Engine',
              authorRole: 'admin',
              content: `Tác vụ được tự động tạo từ câu trả lời khảo sát bối cảnh "${profile.companyTypeTag}". Vui lòng hoàn thành để tránh mức phạt vi phạm hành chính về thuế.`,
              createdAt: nowFull
            }
          ],
          timeline: [
            {
              id: `tl-tax-${idx}`,
              title: 'Khởi tạo tác vụ tuân thủ thuế',
              description: 'Tự động sinh từ khảo sát bối cảnh ban đầu',
              actor: 'CELRA System',
              actorRole: 'admin',
              timestamp: nowFull,
              type: 'status_change'
            }
          ]
        });
      }
    });
  }

  // Checklist 2: Hóa đơn & Dòng tiền thực tế (Invoices & Cashflow)
  const invoiceQues = questions.filter(q => q.moduleId === 'MODULE_INVOICE_CASHFLOW');
  if (invoiceQues.length > 0) {
    const cklId = `ckl-inv-${Date.now()}`;
    const nonCompliant = invoiceQues.filter(q => q.selectedOption !== 'Đã hoàn thành / Tuân thủ đầy đủ');

    checklists.push({
      id: cklId,
      code: 'CKL-INVOICE-01',
      title: 'Bộ Check-list Chuẩn hóa Hóa đơn điện tử & Đối soát dòng tiền POS / Sàn TMĐT',
      category: 'Hóa Đơn & Dòng Tiền',
      priority: nonCompliant.length > 0 ? 'urgent' : 'high',
      status: nonCompliant.length === 0 ? 'completed' : 'in_progress',
      generatedFromRuleId: 'RULE-INVOICE-CASHFLOW',
      ruleCode: 'RULE-INVOICE-CASHFLOW',
      contextReason: `Kích hoạt từ thẻ hoạt động thực tế ${profile.industryTags.map(t => INDUSTRY_TAGS.find(i => i.id === t)?.shortLabel).join(', ')}.`,
      legalBasis: 'Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC',
      assigneeRole: 'Kế toán & Quản lý vận hành',
      createdAt: now,
      items: invoiceQues.map((q, idx) => ({
        id: `i-inv-${idx}`,
        title: q.title,
        isRequired: true,
        isChecked: q.selectedOption === 'Đã hoàn thành / Tuân thủ đầy đủ',
        evidenceRequired: true
      }))
    });

    invoiceQues.forEach((q, idx) => {
      if (q.selectedOption !== 'Đã hoàn thành / Tuân thủ đầy đủ') {
        tasks.push({
          id: `task-inv-${idx}-${Date.now()}`,
          code: `TASK-INV-0${idx + 1}`,
          title: `[Hóa đơn] ${q.title.substring(0, 75)}...`,
          checklistId: cklId,
          category: 'Hóa Đơn & Dòng Tiền',
          priority: q.severity || 'high',
          departmentId: 'dept-accounting',
          departmentName: 'Phòng Kế toán & Vận hành',
          assigneeId: 'user-accountant',
          assigneeName: 'Trần Kế Toán',
          assigneeRole: 'internal_accountant',
          waitingOnRole: 'internal_accountant',
          waitingOnName: 'Trần Kế Toán',
          dueDate: '2026-04-25',
          status: 'in_progress',
          description: `${q.title}\nCăn cứ pháp lý: ${q.legalBasis}`,
          contextTrigger: `Kích hoạt từ câu trả lời "${q.selectedOption || 'Chưa thực hiện'}".`,
          ruleCode: 'RULE-INVOICE-CASHFLOW',
          legalBasis: q.legalBasis,
          documents: [],
          comments: [
            {
              id: `c-inv-${idx}`,
              authorName: 'CELRA Compliance Engine',
              authorRole: 'admin',
              content: `Khuyến nghị đối chiếu số liệu bán hàng thực tế với hóa đơn đã xuất để tránh nguy cơ bị xử phạt từ 10 đến 20 triệu đồng.`,
              createdAt: nowFull
            }
          ],
          timeline: [
            {
              id: `tl-inv-${idx}`,
              title: 'Tác vụ hóa đơn dòng tiền được tạo',
              description: 'Tạo từ khảo sát chuyên sâu về Hóa đơn & Dòng tiền',
              actor: 'CELRA Rule Engine',
              actorRole: 'admin',
              timestamp: nowFull,
              type: 'status_change'
            }
          ]
        });
      }
    });
  }

  return { checklists, tasks, contextFacts };
}
