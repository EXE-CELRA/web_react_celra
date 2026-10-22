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
import { 
  calculateLegalDueDate, 
  formatISODate, 
  STATUTORY_PERIOD_METAS 
} from '../utils/taxCalendar';

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
// [ CHUẨN HÓA BỘ CÂU HỎI ĐA LĨNH VỰC - UNIVERSAL COMPLIANCE QUESTION SCHEMA ]
// =========================================================================

export type ComplianceDomain = 'TAX' | 'INVOICE' | 'BHXH' | 'LABOR' | 'SAFETY' | 'CORPORATE' | 'LICENSING';

export interface StandardComplianceQuestion {
  id: string;
  domain: ComplianceDomain;
  subCategory: string;
  version: string;
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'ARCHIVED';
  title: string;
  description?: string;
  severity: 'urgent' | 'high' | 'medium';
  legalReference: {
    docCode: string;
    docTitle: string;
    articleNumber: string;
    sourceUrl: string;
    statusInDLPL: 'VALID' | 'AMENDED' | 'EXPIRED';
    penaltyClause?: string;
  };
  conditions: {
    minRevenue?: number;
    maxRevenue?: number;
    minEmployees?: number;
    maxEmployees?: number;
    companyTypes?: CompanyTypeTag[];
    industryTags?: IndustryTag[];
    isNewlyEstablished?: boolean;
  };
  options?: string[];
}

/**
 * Danh mục câu hỏi chuẩn hóa đa lĩnh vực (Universal Question Registry).
 * Bao trùm 6 trụ cột tuân thủ cốt lõi của doanh nghiệp tại Việt Nam:
 * 1. Thuế (Tax)
 * 2. Hóa đơn & Dòng tiền (Invoice & Cashflow)
 * 3. Lao động & Tiền lương (Labor & HR)
 * 4. Bảo hiểm xã hội (BHXH)
 * 5. Pháp lý Doanh nghiệp & Quản trị Vốn (Corporate Governance)
 * 6. Giấy phép chuyên ngành & Dữ liệu (Licensing & Compliance)
 */
export const UNIVERSAL_COMPLIANCE_REGISTRY: StandardComplianceQuestion[] = [
  // LĨNH VỰC 1: THUẾ (TAX)
  {
    id: 'q_std_tax_period',
    domain: 'TAX',
    subCategory: 'Kê khai định kỳ',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Doanh nghiệp có thực hiện nộp tờ khai thuế GTGT và thuế TNCN định kỳ đúng hạn theo quy định không?',
    description: 'Tự động tính theo doanh thu: <= 50 tỷ nộp theo Quý (30/04, 31/07, 31/10, 31/01), > 50 tỷ nộp theo Tháng (ngày 20).',
    severity: 'urgent',
    legalReference: {
      docCode: '126/2020',
      docTitle: 'Nghị định 126/2020/NĐ-CP & Luật Quản lý thuế số 38/2019/QH14',
      articleNumber: 'Khoản 1 Điều 44 Luật QLT, Điều 8 & 9 NĐ 126/2020',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-1262020nd-cp-ve-huong-dan-luat-quan-ly-thue-24636.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      companyTypes: ['TAG_TNHH_1TV', 'TAG_TNHH_2TV'],
    },
  },
  {
    id: 'q_std_tax_tndn_80',
    domain: 'TAX',
    subCategory: 'Tạm nộp thuế TNDN',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Doanh nghiệp có thực hiện tạm nộp thuế Thu nhập doanh nghiệp (TNDN) 4 quý đạt tối thiểu 80% số thuế TNDN phải nộp cả năm không?',
    description: 'Hạn tạm nộp quý 4 là ngày 30/01 năm sau. Nếu nộp thiếu sẽ bị tính tiền chậm nộp 0,03%/ngày.',
    severity: 'high',
    legalReference: {
      docCode: '91/2022',
      docTitle: 'Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP sửa đổi Nghị định 126/2020/NĐ-CP',
      articleNumber: 'Khoản 3 Điều 1 NĐ 91/2022',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-912022nd-cp-cua-chinh-phu-ve-viec-sua-doi-bo-sung-mot-so-dieu-cua-nghi-dinh-1262020nd-cp-ngay-19102020-cua-chinh-phu-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-quan-ly-thue-1098434.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      companyTypes: ['TAG_TNHH_1TV', 'TAG_TNHH_2TV'],
    },
  },
  {
    id: 'q_std_tax_monbai',
    domain: 'TAX',
    subCategory: 'Lệ phí môn bài',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Doanh nghiệp có thực hiện nộp tờ khai và lệ phí môn bài hàng năm chậm nhất ngày 30/01 không?',
    description: 'Hàng năm nộp trước 30/01: vốn > 10 tỷ nộp 3 triệu/năm, vốn <= 10 tỷ nộp 2 triệu/năm.',
    severity: 'high',
    legalReference: {
      docCode: '126/2020',
      docTitle: 'Khoản 9 Điều 18 Nghị định 126/2020/NĐ-CP & Nghị định 139/2016/NĐ-CP',
      articleNumber: 'Khoản 9 Điều 18 NĐ 126/2020',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-1262020nd-cp-ve-huong-dan-luat-quan-ly-thue-24636.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      companyTypes: ['TAG_TNHH_1TV', 'TAG_TNHH_2TV'],
    },
  },
  {
    id: 'q_std_tax_withholding',
    domain: 'TAX',
    subCategory: 'Khấu trừ thuế TNCN',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Doanh nghiệp có thực hiện khấu trừ 10% thuế TNCN tại nguồn khi chi trả thu nhập từ 2 triệu đồng/lần cho lao động không ký HĐLĐ hoặc ký dưới 03 tháng không?',
    description: 'Bắt buộc khấu trừ 10% tại nguồn trước khi chi trả, trừ trường hợp NLĐ làm cam kết Mẫu 08/CK-TNCN theo Thông tư 111/2013/TT-BTC.',
    severity: 'high',
    legalReference: {
      docCode: '111/2013',
      docTitle: 'Thông tư 111/2013/TT-BTC hướng dẫn Luật Thuế TNCN',
      articleNumber: 'Điểm i Khoản 1 Điều 25 TT 111/2013',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-1112013tt-btc-huong-dan-luat-thue-thu-nhap-ca-nhan-va-nghi-dinh-652013nd-cp-do-bo-truong-bo-tai-chinh-ban-hanh-324009.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      minEmployees: 1,
    },
  },

  // LĨNH VỰC 2: HÓA ĐƠN & DÒNG TIỀN (INVOICE)
  {
    id: 'q_std_inv_pos',
    domain: 'INVOICE',
    subCategory: 'Máy tính tiền F&B',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Cơ sở đã cài đặt và sử dụng Hóa đơn điện tử khởi tạo từ máy tính tiền kết nối dữ liệu trực tiếp với cơ quan thuế khi thanh toán cho khách chưa?',
    description: 'Bắt buộc đối với các cơ sở ăn uống, nhà hàng, quán cafe có phát sinh bán lẻ trực tiếp.',
    severity: 'urgent',
    legalReference: {
      docCode: '123/2020',
      docTitle: 'Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC',
      articleNumber: 'Điều 90 Luật QLT 38/2019, Điều 11 NĐ 123/2020',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-782021tt-btc-huong-dan-thuc-hien-luat-quan-ly-thue-nghi-dinh-1232020nd-cp-quy-dinh-ve-hoa-don-chung-tu-do-bo-truong-bo-tai-chinh-ban-hanh-1550.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      industryTags: ['TAG_FNB'],
    },
  },
  {
    id: 'q_std_inv_noncash_20m',
    domain: 'INVOICE',
    subCategory: 'Thanh toán không dùng tiền mặt',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Mọi giao dịch mua hàng hóa, dịch vụ từ 20 triệu đồng trở lên (đã có VAT) có được thanh toán qua tài khoản ngân hàng công ty không?',
    description: 'Điều kiện bắt buộc để được khấu trừ thuế GTGT đầu vào và tính vào chi phí được trừ khi tính thuế TNDN theo Thông tư 219/2013 và TT 78/2014.',
    severity: 'urgent',
    legalReference: {
      docCode: '219/2013',
      docTitle: 'Thông tư 219/2013/TT-BTC & Thông tư 78/2014/TT-BTC',
      articleNumber: 'Điều 15 TT 219/2013/TT-BTC',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-2192013tt-btc-huong-dan-luat-thue-gia-tri-gia-tang-va-nghi-dinh-2092013nd-cp-do-bo-truong-bo-tai-chinh-ban-hanh-323235.html#dieu_15',
      statusInDLPL: 'VALID',
    },
    conditions: {
      companyTypes: ['TAG_TNHH_1TV', 'TAG_TNHH_2TV'],
    },
  },
  {
    id: 'q_std_inv_bank_reg',
    domain: 'INVOICE',
    subCategory: 'Đăng ký tài khoản ngân hàng',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Toàn bộ các tài khoản ngân hàng mà doanh nghiệp dùng để giao dịch thanh toán kinh doanh đã được thông báo cho cơ quan thuế chưa?',
    description: 'Doanh nghiệp phải thông báo số tài khoản ngân hàng với cơ quan thuế trong thời hạn 10 ngày làm việc kể từ ngày mở tài khoản theo Khoản 2 Điều 36 Luật QLT.',
    severity: 'high',
    legalReference: {
      docCode: '38/2019',
      docTitle: 'Luật Quản lý thuế số 38/2019/QH14',
      articleNumber: 'Khoản 2 Điều 36 Luật QLT 38/2019/QH14',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/luat-quan-ly-thue-2019-54279.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      companyTypes: ['TAG_TNHH_1TV', 'TAG_TNHH_2TV'],
    },
  },

  // LĨNH VỰC 3: LAO ĐỘNG & TIỀN LƯƠNG (LABOR)
  {
    id: 'q_std_labor_contract',
    domain: 'LABOR',
    subCategory: 'Hợp đồng lao động & Chi lương',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Hồ sơ chi phí tiền lương có đầy đủ Hợp đồng lao động, Bảng chấm công và Chứng từ chi trả lương qua ngân hàng/phiếu chi hợp lệ không?',
    description: 'Căn cứ Điều 4 Thông tư 96/2015/TT-BTC. Điều kiện tiên quyết để chi phí tiền lương được tính vào chi phí hợp lý được trừ khi tính thuế TNDN.',
    severity: 'high',
    legalReference: {
      docCode: '96/2015',
      docTitle: 'Thông tư 96/2015/TT-BTC hướng dẫn thuế TNDN',
      articleNumber: 'Điều 4 TT 96/2015/TT-BTC',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      minEmployees: 1,
    },
  },
  {
    id: 'q_std_labor_rulebook',
    domain: 'LABOR',
    subCategory: 'Nội quy lao động',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Doanh nghiệp đã ban hành Nội quy lao động bằng văn bản và đăng ký với cơ quan quản lý lao động chưa?',
    description: 'Bắt buộc từ 10 lao động trở lên. Miễn thủ tục đăng ký nếu dưới 10 lao động theo Điều 218 BLLĐ 2019.',
    severity: 'urgent',
    legalReference: {
      docCode: '45/2019',
      docTitle: 'Bộ luật Lao động 2019',
      articleNumber: 'Điều 118, Điều 119 và Điều 218 BLLĐ 2019',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      minEmployees: 10,
    },
  },
  {
    id: 'q_std_labor_salary_scale',
    domain: 'LABOR',
    subCategory: 'Thang bảng lương',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Doanh nghiệp đã xây dựng Thang lương, Bảng lương và Định mức lao động làm cơ sở để trả lương và ký kết hợp đồng chưa?',
    description: 'Người sử dụng lao động phải xây dựng thang lương, bảng lương và định mức lao động làm cơ sở để tuyển dụng, sử dụng lao động theo Điều 93 BLLĐ 2019.',
    severity: 'medium',
    legalReference: {
      docCode: '45/2019',
      docTitle: 'Bộ luật Lao động 2019',
      articleNumber: 'Điều 93 BLLĐ 2019',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      minEmployees: 1,
    },
  },

  // LĨNH VỰC 4: BẢO HIỂM XÃ HỘI (BHXH)
  {
    id: 'q_std_bhxh_compulsory',
    domain: 'BHXH',
    subCategory: 'Trích nộp BHXH bắt buộc',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Doanh nghiệp có ký HĐLĐ và tham gia đóng đầy đủ BHXH, BHYT, BHTN bắt buộc cho toàn bộ nhân sự ký hợp đồng từ 01 tháng trở lên không?',
    description: 'Chậm đóng hoặc trốn đóng sẽ bị tính lãi 0,03%/ngày và có thể bị truy cứu trách nhiệm hình sự theo Điều 216 BLHS.',
    severity: 'urgent',
    legalReference: {
      docCode: '58/2014',
      docTitle: 'Luật Bảo hiểm xã hội số 58/2014/QH13',
      articleNumber: 'Điều 2, Điều 85, Điều 86 Luật BHXH',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/bao-hiem-van-ban/luat-bao-hiem-xa-hoi-2014-301054.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      minEmployees: 1,
    },
  },
  {
    id: 'q_std_labor_report_6m',
    domain: 'BHXH',
    subCategory: 'Báo cáo lao động 6 tháng',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Doanh nghiệp có thực hiện báo cáo tình hình thay đổi lao động định kỳ 6 tháng (trước 05/06) và hàng năm (trước 05/12) không?',
    description: 'Báo cáo qua Cổng Dịch vụ công Quốc gia hoặc gửi trực tiếp Phòng/Sở LĐ-TB&XH theo Khoản 2 Điều 4 Nghị định 145/2020/NĐ-CP.',
    severity: 'high',
    legalReference: {
      docCode: '145/2020',
      docTitle: 'Nghị định 145/2020/NĐ-CP hướng dẫn Bộ luật Lao động',
      articleNumber: 'Khoản 2 Điều 4 NĐ 145/2020/NĐ-CP',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/nghi-dinh-1452020nd-cp-huong-dan-bo-luat-lao-dong-ve-dieu-kien-lao-dong-va-quan-he-lao-dong-24750.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      minEmployees: 1,
    },
  },

  // LĨNH VỰC 5: PHÁP LÝ DOANH NGHIỆP & QUẢN TRỊ VỐN (CORPORATE)
  {
    id: 'q_std_corp_capital_90d',
    domain: 'CORPORATE',
    subCategory: 'Góp vốn điều lệ',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Các thành viên/chủ sở hữu đã góp đủ 100% số vốn điều lệ cam kết trong thời hạn 90 ngày kể từ ngày cấp Giấy chứng nhận ĐKDN chưa?',
    description: 'Trường hợp sau 90 ngày chưa góp đủ vốn, doanh nghiệp bắt buộc phải đăng ký điều chỉnh giảm vốn điều lệ trong thời hạn 30 ngày tiếp theo (Điều 47 & 75 Luật DN 2020).',
    severity: 'urgent',
    legalReference: {
      docCode: '59/2020',
      docTitle: 'Luật Doanh nghiệp số 59/2020/QH14',
      articleNumber: 'Khoản 2 Điều 47 & Khoản 2 Điều 75 Luật DN 2020',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/doanh-nghiep-van-ban/luat-doanh-nghiep-2020-44943.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      companyTypes: ['TAG_TNHH_1TV', 'TAG_TNHH_2TV'],
    },
  },
  {
    id: 'q_std_corp_amend_10d',
    domain: 'CORPORATE',
    subCategory: 'Thay đổi đăng ký kinh doanh',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Khi có thay đổi về người đại diện pháp luật, địa chỉ trụ sở, ngành nghề hoặc vốn, doanh nghiệp có thực hiện đăng ký thay đổi trong 10 ngày làm việc không?',
    description: 'Doanh nghiệp chịu trách nhiệm đăng ký thay đổi nội dung Giấy chứng nhận ĐKDN trong thời hạn 10 ngày làm việc kể từ ngày có thay đổi theo Điều 30 Luật Doanh nghiệp 2020.',
    severity: 'high',
    legalReference: {
      docCode: '59/2020',
      docTitle: 'Luật Doanh nghiệp số 59/2020/QH14',
      articleNumber: 'Điều 30 Luật Doanh nghiệp 2020',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/doanh-nghiep-van-ban/luat-doanh-nghiep-2020-44943.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      companyTypes: ['TAG_TNHH_1TV', 'TAG_TNHH_2TV'],
    },
  },

  // LĨNH VỰC 6: GIẤY PHÉP CHUYÊN NGÀNH THỰC TẾ & BẢO VỆ DỮ LIỆU (LICENSING)
  {
    id: 'q_std_fnb_food_safety',
    domain: 'LICENSING',
    subCategory: 'An toàn thực phẩm F&B',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Cơ sở kinh doanh F&B đã được cấp Giấy chứng nhận cơ sở đủ điều kiện An toàn thực phẩm (hoặc ký Cam kết ATTP) còn hiệu lực chưa?',
    description: 'Bắt buộc đối với nhà hàng, cơ sở chế biến kinh doanh dịch vụ ăn uống. Nhân viên trực tiếp tiếp xúc thực phẩm phải có Giấy khám sức khỏe thẻ xanh và tập huấn ATTP.',
    severity: 'urgent',
    legalReference: {
      docCode: '15/2018',
      docTitle: 'Nghị định 15/2018/NĐ-CP quy định chi tiết thi hành Luật An toàn thực phẩm',
      articleNumber: 'Điều 11, Điều 12 NĐ 15/2018/NĐ-CP',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/y-te-van-ban/nghi-dinh-152018nd-cp-huong-dan-luat-an-toan-thuc-pham-372957.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      industryTags: ['TAG_FNB'],
    },
  },
  {
    id: 'q_std_ecom_bct_registration',
    domain: 'LICENSING',
    subCategory: 'Thông báo website TMĐT Bộ Công Thương',
    version: '2026.1',
    status: 'ACTIVE',
    title: 'Website hoặc Ứng dụng di động bán hàng trực tuyến của doanh nghiệp đã hoàn tất thủ tục Thông báo với Bộ Công Thương chưa?',
    description: 'Thương nhân sở hữu website thương mại điện tử bán hàng phải thông báo với Bộ Công Thương qua Cổng online.gov.vn theo Nghị định 52/2013/NĐ-CP và Nghị định 85/2021/NĐ-CP.',
    severity: 'high',
    legalReference: {
      docCode: '52/2013',
      docTitle: 'Nghị định 52/2013/NĐ-CP & Nghị định 85/2021/NĐ-CP về TMĐT',
      articleNumber: 'Điều 27 Nghị định 52/2013/NĐ-CP',
      sourceUrl: 'https://dulieuphapluat.vn/van-ban/thuong-mai-van-ban/nghi-dinh-522013nd-cp-ve-thuong-mai-dien-tu-321319.html',
      statusInDLPL: 'VALID',
    },
    conditions: {
      industryTags: ['TAG_ECOMMERCE'],
    },
  },
];

/**
 * Kiểm tra xem một câu hỏi khảo sát cũ có bị thay đổi bởi luật mới không (Phục vụ Micro-Survey)
 */
export function checkQuestionOutdatedByLaw(
  questionId: string, 
  userCompletedVersion?: string
): { isOutdated: boolean; newLawTitle?: string; newDocCode?: string } {
  const currentQ = UNIVERSAL_COMPLIANCE_REGISTRY.find(q => q.id === questionId);
  if (!currentQ) return { isOutdated: false };

  // Nếu người dùng đã làm ở phiên bản cũ hơn phiên bản hiện tại của luật
  if (userCompletedVersion && userCompletedVersion !== currentQ.version) {
    return {
      isOutdated: true,
      newLawTitle: currentQ.legalReference.docTitle,
      newDocCode: currentQ.legalReference.docCode,
    };
  }

  return { isOutdated: false };
}

// =========================================================================
// [ TẦNG 1: HỒ SƠ DOANH NGHIỆP ] (Khai báo 1 lần duy nhất lúc Onboarding)
// =========================================================================

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

export interface LegalTypeDetection {
  tagId: 'TAG_TNHH_1TV' | 'TAG_TNHH_2TV' | 'UNSUPPORTED';
  label: string;
  isSupported: boolean;
  unsupportedReason?: string;
}

/**
 * Thuật toán tự động bóc tách Hình thức kinh doanh từ Tên pháp lý doanh nghiệp (theo Khoản 1 Điều 37 Luật Doanh nghiệp 2020)
 * Giai đoạn hiện tại: Chỉ hỗ trợ Công ty TNHH 1 thành viên và Công ty TNHH 2 thành viên trở lên.
 */
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
 * 2 Thẻ ngành nghề trọng tâm (Focus Industries) giai đoạn MVP
 * Thu gọn phạm vi để hoàn thiện logic chuyên sâu theo đúng luật và chuẩn hóa lịch kê khai
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
  industryTags: ['TAG_FNB']
};

export const STANDARD_OPTIONS = [
  'Đã hoàn thành / Tuân thủ đầy đủ',
  'Chưa thực hiện / Chưa có',
  'Đang chuẩn bị / Có một phần',
  'Chưa rõ quy định'
];

/**
 * Tạo danh mục câu hỏi tình huống Dynamic TOÀN DIỆN 360 ĐỘ bao trùm 6 trụ cột tuân thủ:
 * 1. Thuế Doanh nghiệp (GTGT, TNCN, TNDN 80%, Lệ phí môn bài)
 * 2. Hóa đơn & Dòng tiền (HĐĐT máy tính tiền, Giao dịch > 20tr, Đăng ký TK ngân hàng)
 * 3. Lao động & Tiền lương (HĐLĐ, Bảng chấm công, Thang bảng lương, NQLĐ)
 * 4. Bảo hiểm xã hội & Khai trình (Trích nộp BHXH bắt buộc, Báo cáo lao động 6 tháng)
 * 5. Pháp lý Doanh nghiệp & Vốn (Góp đủ 100% vốn 90 ngày, Thay đổi ĐKKD 10 ngày)
 * 6. Giấy phép chuyên ngành (ATTP cho F&B, Thông báo website Bộ Công Thương cho TMĐT)
 *
 * Khảo sát này thu thập 1 lần duy nhất lúc Onboarding để khóa cố định, phục vụ mọi phân hệ sau này.
 */
export function generateDynamicQuestions(profile: BaseProfile): DynamicSituationQuestion[] {
  const questions: DynamicSituationQuestion[] = [];
  const corpTypeLabel = profile.companyTypeTag === 'TAG_TNHH_1TV' ? 'TNHH 1TV' : 'TNHH 2TV+';
  const isQuarterly = profile.isNewlyEstablished || (profile.annualRevenue || 0) <= 50000000000;
  const cycleDesc = isQuarterly
    ? 'theo Quý (hạn ngày cuối tháng đầu quý sau: 30/04, 31/07, 31/10, 31/01)'
    : 'theo Tháng (hạn ngày 20 của tháng tiếp theo do doanh thu > 50 tỷ)';
  const actualEmpCount = profile.employeeCount || (profile.employeeScale === 'under_10' ? 8 : profile.employeeScale === '10_to_50' ? 25 : 60);

  // ----------------------------------------------------
  // TRỤ CỘT 1: THUẾ DOANH NGHIỆP (TAX COMPLIANCE)
  // ----------------------------------------------------
  questions.push(
    {
      id: 'q_tax_corp_1',
      moduleId: 'MODULE_TAX_CORE',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: `Loại hình: ${corpTypeLabel}`,
      title: `Doanh nghiệp có thực hiện nộp tờ khai thuế GTGT và thuế TNCN định kỳ ${cycleDesc} đúng hạn không?`,
      legalBasis: 'Khoản 1 Điều 44 Luật Quản lý thuế số 38/2019/QH14 và Điều 8, Điều 9 Nghị định 126/2020/NĐ-CP. Hạn nộp theo tháng là ngày 20 tháng sau, theo quý là ngày cuối cùng của tháng đầu quý sau.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-1252020nd-cp-quy-dinh-ve-xu-phat-vi-pham-hanh-chinh-ve-thue-hoa-don-24591.html#dieu_13',
      options: [
        `Đã nộp tờ khai và tiền thuế đầy đủ đúng hạn ${cycleDesc}`,
        'Doanh nghiệp không phát sinh doanh thu/chi phí (nộp tờ khai trắng đúng hạn)',
        'Có phát sinh nghĩa vụ thuế nhưng chưa nộp hoặc nộp chậm quá hạn',
        'Chưa rõ kỳ kê khai của doanh nghiệp thuộc diện theo Tháng hay Quý'
      ],
      severity: 'urgent',
    },
    {
      id: 'q_tax_corp_2',
      moduleId: 'MODULE_TAX_CORE',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: `Loại hình: ${corpTypeLabel}`,
      title: 'Doanh nghiệp có thực hiện tạm nộp thuế Thu nhập doanh nghiệp (TNDN) 4 quý đạt tối thiểu 80% số thuế TNDN phải nộp cả năm không?',
      legalBasis: 'Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP sửa đổi Nghị định 126/2020/NĐ-CP. Hạn tạm nộp quý 4 là ngày 30/01 năm sau. Nếu nộp thiếu sẽ bị tính tiền chậm nộp 0,03%/ngày.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-912022nd-cp-cua-chinh-phu-ve-viec-sua-doi-bo-sung-mot-so-dieu-cua-nghi-dinh-1262020nd-cp-ngay-19102020-cua-chinh-phu-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-quan-ly-thue-1098434.html',
      options: [
        'Đã tạm nộp định kỳ hàng quý, lũy kế 4 quý đạt tối thiểu 80% thuế TNDN cả năm',
        'Năm nay doanh nghiệp kinh doanh lỗ hoặc hòa vốn (không phát sinh thuế TNDN phải nộp)',
        'Có lãi nhưng chưa tạm nộp quý nào hoặc nộp thiếu dưới 80% (nguy cơ phạt chậm nộp 0,03%/ngày)',
        'Chưa rõ số lãi ước tính / Kế toán chưa thực hiện tạm tính 80%'
      ],
      severity: 'high',
    },
    {
      id: 'q_tax_monbai',
      moduleId: 'MODULE_TAX_CORE',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: `Loại hình: ${corpTypeLabel}`,
      title: 'Doanh nghiệp có thực hiện kê khai và nộp Lệ phí môn bài hàng năm chậm nhất ngày 30/01 không?',
      legalBasis: 'Khoản 9 Điều 18 Nghị định 126/2020/NĐ-CP & Nghị định 139/2016/NĐ-CP. Vốn > 10 tỷ nộp 3.000.000đ/năm, vốn <= 10 tỷ nộp 2.000.000đ/năm.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-1262020nd-cp-ve-huong-dan-luat-quan-ly-thue-24636.html',
      options: [
        'Đã kê khai và nộp đủ Lệ phí môn bài vào ngân sách nhà nước',
        'Doanh nghiệp mới thành lập năm nay (thuộc diện được miễn Lệ phí môn bài năm đầu)',
        'Chưa nộp tiền Lệ phí môn bài cho năm tài chính hiện tại',
        'Chưa nắm rõ mức lệ phí môn bài áp dụng theo vốn điều lệ'
      ],
      severity: 'high',
    },
    {
      id: 'q_tax_tncn_withholding',
      moduleId: 'MODULE_TAX_CORE',
      branchType: 'labor_scale',
      branchCode: 'SCALE_LABOR',
      branchLabel: `Nhân sự: ${actualEmpCount} lao động`,
      title: 'Doanh nghiệp có thực hiện khấu trừ 10% thuế TNCN tại nguồn khi chi trả thu nhập từ 2.000.000 VNĐ/lần trở lên cho lao động thời vụ / thử việc / không ký HĐLĐ không?',
      legalBasis: 'Điểm i Khoản 1 Điều 25 Thông tư 111/2013/TT-BTC. Trừ trường hợp NLĐ đủ điều kiện lập cam kết thu nhập Mẫu 08/CK-TNCN theo quy định.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-1112013tt-btc-huong-dan-luat-thue-thu-nhap-ca-nhan-va-nghi-dinh-652013nd-cp-do-bo-truong-bo-tai-chinh-ban-hanh-324009.html',
      options: [
        'Đã khấu trừ 10% tại nguồn hoặc có Cam kết thu nhập 08/CK-TNCN của người lao động',
        'Không sử dụng lao động thời vụ / thử việc, 100% nhân sự ký HĐLĐ chính thức',
        'Chưa thực hiện khấu trừ 10% khi trả tiền công/thù lao từ 2 triệu đồng trở lên',
        'Chưa rõ quy định về khấu trừ thuế TNCN tại nguồn'
      ],
      severity: 'high',
    }
  );

  // ----------------------------------------------------
  // TRỤ CỘT 2: HÓA ĐƠN & DÒNG TIỀN (INVOICE & CASHFLOW)
  // ----------------------------------------------------
  questions.push(
    {
      id: 'q_tax_corp_3',
      moduleId: 'MODULE_INVOICE_CASHFLOW',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: `Loại hình: ${corpTypeLabel}`,
      title: 'Mọi giao dịch mua hàng hóa, dịch vụ từ 20 triệu đồng trở lên (đã có VAT) có được thanh toán qua tài khoản ngân hàng công ty (không dùng tiền mặt) không?',
      legalBasis: 'Điều 15 Thông tư 219/2013/TT-BTC và Thông tư 78/2014/TT-BTC. Điều kiện bắt buộc để được khấu trừ thuế GTGT đầu vào và tính vào chi phí được trừ khi tính thuế TNDN.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-2192013tt-btc-huong-dan-luat-thue-gia-tri-gia-tang-va-nghi-dinh-2092013nd-cp-do-bo-truong-bo-tai-chinh-ban-hanh-323235.html#dieu_15',
      options: [
        '100% hóa đơn từ 20 triệu trở lên đều chuyển khoản qua tài khoản ngân hàng công ty',
        'Chưa phát sinh đơn hàng hoặc chi phí mua vào nào từ 20 triệu trở lên',
        'Có một số hóa đơn trên 20 triệu thanh toán bằng tiền mặt hoặc tài khoản cá nhân',
        'Chưa rõ quy định điều kiện khấu trừ thuế GTGT và chi phí hợp lý'
      ],
      severity: 'urgent',
    },
    {
      id: 'q_tax_bank_account',
      moduleId: 'MODULE_INVOICE_CASHFLOW',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: `Loại hình: ${corpTypeLabel}`,
      title: 'Toàn bộ các tài khoản ngân hàng công ty dùng để giao dịch nhận tiền và thanh toán kinh doanh đã được thông báo với cơ quan quản lý thuế chưa?',
      legalBasis: 'Khoản 2 Điều 36 Luật Quản lý thuế số 38/2019/QH14. Bắt buộc đăng ký thông tin tài khoản ngân hàng trong thời hạn 10 ngày làm việc.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/luat-quan-ly-thue-2019-54279.html',
      options: [
        'Đã đăng ký đầy đủ toàn bộ tài khoản ngân hàng công ty với cơ quan quản lý thuế',
        'Chưa mở tài khoản ngân hàng công ty',
        'Có tài khoản ngân hàng đang giao dịch nhưng chưa làm thủ tục thông báo với thuế',
        'Chỉ dùng tài khoản cá nhân của chủ doanh nghiệp để nhận tiền và thanh toán'
      ],
      severity: 'high',
    }
  );

  // Đặc thù F&B: Máy tính tiền, POS, Thực phẩm tươi sống
  if (profile.industryTags.includes('TAG_FNB')) {
    questions.push(
      {
        id: 'q_fnb_tax_1',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_FNB',
        branchLabel: 'F&B: Máy tính tiền & Hóa đơn',
        title: 'Cơ sở đã cài đặt và sử dụng Hóa đơn điện tử khởi tạo từ máy tính tiền kết nối dữ liệu trực tiếp với cơ quan thuế khi thanh toán cho khách ăn uống chưa?',
        legalBasis: 'Điều 90 Luật Quản lý thuế số 38/2019/QH14, Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC. Bắt buộc đối với các cơ sở ăn uống, nhà hàng, quán cafe có phát sinh bán lẻ trực tiếp.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-782021tt-btc-huong-dan-thuc-hien-luat-quan-ly-thue-nghi-dinh-1232020nd-cp-quy-dinh-ve-hoa-don-chung-tu-do-bo-truong-bo-tai-chinh-ban-hanh-1550.html',
        options: [
          'Đã cài đặt giải pháp HĐĐT khởi tạo từ máy tính tiền kết nối tự động Cục Thuế',
          'Chỉ xuất hóa đơn điện tử thông thường cuối ngày hoặc khi khách yêu cầu',
          'Có phần mềm bán hàng POS nhưng chưa kết nối xuất HĐĐT từ máy tính tiền',
          'Cơ sở chưa có phần mềm POS, hiện chỉ thanh toán tiền mặt/chuyển khoản thông thường'
        ],
        severity: 'urgent',
      },
      {
        id: 'q_fnb_tax_2',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_FNB',
        branchLabel: 'F&B: Doanh thu máy POS & App giao hàng',
        title: 'Doanh nghiệp có thực hiện đối soát định kỳ giữa doanh thu thực tế (máy POS, chuyển khoản VietQR, tiền mặt, GrabFood/ShopeeFood) với tổng doanh thu xuất hóa đơn kê khai thuế không?',
        legalBasis: 'Thông tư 80/2021/TT-BTC hướng dẫn Luật Quản lý thuế. Cơ quan thuế đang đối chiếu dữ liệu giao dịch tài khoản ngân hàng và máy POS để phát hiện hành vi trốn thuế ngoài sổ sách.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-802021tt-btc-huong-dan-luat-quan-ly-thue-va-nghi-dinh-1262020nd-cp-huong-dan-luat-quan-ly-thue-do-bo-truong-bo-tai-chinh-ban-hanh-962.html',
        options: [
          'Toàn bộ doanh thu quẹt thẻ POS và quét mã VietQR đều được đối soát và kê khai đầy đủ',
          'Cơ sở chưa triển khai thanh toán qua máy POS hoặc mã VietQR',
          'Tiền POS/VietQR chảy về tài khoản cá nhân và chưa hạch toán vào doanh thu tính thuế',
          'Doanh thu thực tế tại quầy có chênh lệch so với doanh thu báo cáo thuế'
        ],
        severity: 'high',
      },
      {
        id: 'q_fnb_tax_3',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_FNB',
        branchLabel: 'F&B: Chứng từ nguyên liệu thực phẩm',
        title: 'Nguyên liệu thực phẩm đầu vào (thịt, rau củ, hải sản, đồ uống) có đầy đủ Hóa đơn GTGT hoặc Bảng kê thu mua nông sản Mẫu 01/TNDN hợp pháp không?',
        legalBasis: 'Thông tư 96/2015/TT-BTC hướng dẫn thuế TNDN. Nguyên liệu mua từ người dân trực tiếp đánh bắt, trồng trọt phải lập Bảng kê 01/TNDN kèm chứng từ thanh toán.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
        options: [
          'Toàn bộ thịt, rau củ, hải sản mua ngoài chợ đều lập Bảng kê 01/TNDN hợp lệ',
          '100% nguyên liệu đầu vào đều mua từ công ty/nhà cung cấp có Hóa đơn GTGT',
          'Có mua nguyên liệu ngoài chợ nhưng chỉ có hóa đơn bán lẻ/giấy viết tay không hợp lệ',
          'Chưa nắm rõ quy định lập Bảng kê thu mua nông sản Mẫu 01/TNDN'
        ],
        severity: 'high',
      }
    );
  }

  // Đặc thù Bán lẻ & Sàn TMĐT
  if (profile.industryTags.includes('TAG_ECOMMERCE')) {
    questions.push(
      {
        id: 'q_ecom_tax_1',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_ECOMMERCE',
        branchLabel: 'TMĐT: Doanh thu sàn Shopee / TikTok Shop',
        title: 'Doanh nghiệp có thực hiện đối soát và xuất hóa đơn đầy đủ cho doanh thu bán hàng trên các sàn TMĐT (Shopee, TikTok Shop, Lazada) không?',
        legalBasis: 'Khoản 7 Điều 1 Nghị định 91/2022/NĐ-CP và Thông tư 40/2021/TT-BTC. Các sàn TMĐT có trách nhiệm cung cấp định kỳ dữ liệu doanh thu của từng gian hàng trực tiếp về Tổng cục Thuế.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-912022nd-cp-cua-chinh-phu-ve-viec-sua-doi-bo-sung-mot-so-dieu-cua-nghi-dinh-1262020nd-cp-ngay-19102020-cua-chinh-phu-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-quan-ly-thue-1098434.html',
        options: [
          'Đã đối soát 100% dữ liệu doanh thu báo cáo từ sàn TMĐT và xuất hóa đơn đầy đủ',
          'Mới mở gian hàng trên sàn TMĐT, chưa phát sinh doanh thu đáng kể',
          'Doanh thu nhận từ sàn cao hơn số liệu kê khai thuế (nguy cơ bị cơ quan thuế truy thu)',
          'Chưa rõ cách đối soát doanh thu sàn TMĐT với cơ quan thuế'
        ],
        severity: 'urgent',
      },
      {
        id: 'q_ecom_tax_2',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_ECOMMERCE',
        branchLabel: 'TMĐT: Dòng tiền thu hộ COD đối soát',
        title: 'Dòng tiền thu hộ COD từ các đơn vị vận chuyển (GHTK, GHN, Viettel Post...) có được hạch toán đầy đủ vào doanh thu tính thuế của công ty không?',
        legalBasis: 'Luật Quản lý thuế số 38/2019/QH14. Dòng tiền đối soát COD chuyển vào tài khoản doanh nghiệp hoặc tài khoản cá nhân chủ shop đều thuộc diện quản lý thuế.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/luat-quan-ly-thue-2019-54279.html',
        options: [
          'Dòng tiền COD từ đơn vị vận chuyển đối soát được hạch toán đầy đủ vào doanh thu công ty',
          'Không sử dụng hình thức giao hàng thu tiền hộ COD (khách thanh toán 100% trả trước)',
          'Tiền đối soát COD nhận vào tài khoản cá nhân và chưa khai báo tính thuế',
          'Chưa rõ quy định quản lý thuế đối với dòng tiền thu hộ COD'
        ],
        severity: 'high',
      },
      {
        id: 'q_ecom_tax_3',
        moduleId: 'MODULE_INVOICE_CASHFLOW',
        branchType: 'industry',
        branchCode: 'TAG_ECOMMERCE',
        branchLabel: 'TMĐT: Hóa đơn nguồn gốc hàng hóa',
        title: 'Toàn bộ nguồn hàng hóa nhập về để bán online có đầy đủ Hóa đơn GTGT đầu vào hoặc Tờ khai hải quan nhập khẩu chính ngạch không?',
        legalBasis: 'Điều 17 Nghị định 98/2020/NĐ-CP về xử phạt vi phạm hành chính trong hoạt động thương mại. Hàng hóa bán lẻ không có hóa đơn chứng từ bị xử lý là hàng lậu/không rõ nguồn gốc xuất xứ.',
        verificationUrl: 'https://dulieuphapluat.vn/van-ban/thuong-mai-van-ban/nghi-dinh-982020nd-cp-quy-dinh-ve-xu-phat-vi-pham-hanh-chinh-trong-hoat-dong-thuong-mai-san-xuat-buon-ban-hang-gia-hang-cam-va-bao-ve-quyen-loi-nguoi-tieu-dung-27595.html',
        options: [
          '100% nguồn hàng nhập về bán đều có Hóa đơn GTGT hoặc Tờ khai hải quan chính ngạch',
          'Tự sản xuất hàng hóa bán lẻ, có định mức nguyên vật liệu nội bộ',
          'Hàng hóa nhập tiểu ngạch/chợ đầu mối, không có hóa đơn chứng từ chứng minh nguồn gốc',
          'Có hóa đơn chứng từ cho một phần nguồn hàng, phần còn lại chưa có'
        ],
        severity: 'urgent',
      }
    );
  }

  // ----------------------------------------------------
  // TRỤ CỘT 3: LAO ĐỘNG & TIỀN LƯƠNG (LABOR & HR)
  // ----------------------------------------------------
  questions.push(
    {
      id: 'q_tax_salary_1',
      moduleId: 'MODULE_LABOR_HR',
      branchType: 'labor_scale',
      branchCode: 'SCALE_LABOR',
      branchLabel: `Nhân sự: ${actualEmpCount} lao động`,
      title: 'Hồ sơ chi phí tiền lương có đầy đủ Hợp đồng lao động, Bảng chấm công và Chứng từ chi lương (sao kê ngân hàng/phiếu chi có chữ ký) không?',
      legalBasis: 'Điều 4 Thông tư 96/2015/TT-BTC. Điều kiện để chi phí tiền lương, tiền công được tính vào chi phí hợp lý khi tính thuế TNDN.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
      options: [
        'Đầy đủ Hợp đồng lao động, Bảng chấm công và Chứng từ thanh toán lương có ký nhận',
        'Chưa có nhân sự thuê ngoài, do chủ sở hữu tự vận hành',
        'Có HĐLĐ nhưng chưa có bảng chấm công hoặc chi lương tiền mặt không ký nhận',
        'Chưa ký Hợp đồng lao động bằng văn bản cho nhân viên'
      ],
      severity: 'high',
    },
    {
      id: 'q_labor_salary_scale',
      moduleId: 'MODULE_LABOR_HR',
      branchType: 'labor_scale',
      branchCode: 'SCALE_LABOR',
      branchLabel: `Nhân sự: ${actualEmpCount} lao động`,
      title: 'Doanh nghiệp đã xây dựng và công khai Thang lương, Bảng lương và Định mức lao động tại nơi làm việc chưa?',
      legalBasis: 'Điều 93 Bộ luật Lao động 2019. Người sử dụng lao động phải xây dựng thang lương, bảng lương và định mức lao động làm cơ sở tuyển dụng, trả lương.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
      options: [
        'Đã xây dựng Thang bảng lương, Định mức lao động và công khai tại nơi làm việc',
        'Đang trong quá trình xây dựng định mức và thang bậc lương',
        'Trả lương theo thỏa thuận miệng/thực tế, chưa lập hồ sơ Thang bảng lương bằng văn bản',
        'Chưa rõ quy định về nghĩa vụ xây dựng thang bảng lương'
      ],
      severity: 'medium',
    }
  );

  if (actualEmpCount >= 10 || profile.requiresLaborRuleBook) {
    questions.push({
      id: 'q_tax_salary_2',
      moduleId: 'MODULE_LABOR_HR',
      branchType: 'labor_scale',
      branchCode: 'SCALE_LABOR',
      branchLabel: `Lao động từ 10 người trở lên (${actualEmpCount} người)`,
      title: 'Doanh nghiệp đã ban hành và nộp hồ sơ đăng ký Nội quy lao động tại Phòng LĐ-TB&XH trong vòng 10 ngày kể từ ngày ban hành chưa?',
      legalBasis: 'Điều 118 & Điều 119 Bộ luật Lao động 2019. Người sử dụng lao động sử dụng từ 10 người lao động trở lên phải có nội quy lao động bằng văn bản và đăng ký với cơ quan quản lý.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html#dieu_119',
      options: [
        'Đã ban hành Nội quy lao động và nộp hồ sơ đăng ký tại cơ quan LĐ-TB&XH đúng hạn 10 ngày',
        'Đã có Nội quy lao động nội bộ nhưng chưa đăng ký với Phòng LĐ-TB&XH',
        'Chưa ban hành văn bản Nội quy lao động cho cơ sở',
        'Chưa rõ thủ tục đăng ký Nội quy lao động tại địa phương'
      ],
      severity: 'urgent',
    });
  }

  // ----------------------------------------------------
  // TRỤ CỘT 4: BẢO HIỂM XÃ HỘI & BÁO CÁO LAO ĐỘNG (BHXH)
  // ----------------------------------------------------
  questions.push(
    {
      id: 'q_bhxh_mandatory',
      moduleId: 'MODULE_LABOR_HR',
      branchType: 'labor_scale',
      branchCode: 'SCALE_LABOR',
      branchLabel: `Nhân sự: ${actualEmpCount} lao động`,
      title: 'Doanh nghiệp có tham gia đóng đầy đủ BHXH, BHYT, BHTN bắt buộc cho toàn bộ người lao động ký hợp đồng từ 01 tháng trở lên không?',
      legalBasis: 'Điều 2, Điều 85, Điều 86 Luật Bảo hiểm xã hội số 58/2014/QH13. Trốn đóng hoặc chậm đóng sẽ bị tính lãi 0,03%/ngày và có thể bị xử lý hình sự theo Điều 216 BLHS.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/bao-hiem-van-ban/luat-bao-hiem-xa-hoi-2014-301054.html',
      options: [
        'Đã đăng ký mã đơn vị và trích nộp BHXH, BHYT, BHTN hàng tháng đầy đủ cho 100% NLĐ',
        'Toàn bộ nhân viên là lao động thời vụ dưới 1 tháng hoặc cộng tác viên',
        'Chỉ đóng BHXH cho một số nhân sự chủ chốt, còn lại chưa tham gia',
        'Chưa đăng ký tham gia bảo hiểm xã hội bắt buộc cho bất kỳ nhân viên nào'
      ],
      severity: 'urgent',
    },
    {
      id: 'q_labor_report_biannual',
      moduleId: 'MODULE_LABOR_HR',
      branchType: 'labor_scale',
      branchCode: 'SCALE_LABOR',
      branchLabel: `Nhân sự: ${actualEmpCount} lao động`,
      title: 'Doanh nghiệp có nộp Báo cáo tình hình thay đổi lao động định kỳ 6 tháng một lần (trước 05/06 và trước 05/12 hàng năm) không?',
      legalBasis: 'Khoản 2 Điều 4 Nghị định 145/2020/NĐ-CP hướng dẫn Bộ luật Lao động. Nộp qua Cổng Dịch vụ công Quốc gia hoặc Phòng LĐ-TB&XH.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/nghi-dinh-1452020nd-cp-huong-dan-bo-luat-lao-dong-ve-dieu-kien-lao-dong-va-quan-he-lao-dong-24750.html',
      options: [
        'Đã nộp Báo cáo tình hình thay đổi lao động định kỳ 6 tháng (trước 05/06 và 05/12)',
        'Mới thành lập dưới 6 tháng, chưa tới kỳ nộp báo cáo đầu tiên',
        'Chưa từng nộp báo cáo tình hình thay đổi lao động qua Cổng Dịch vụ công',
        'Chưa rõ quy định và biểu mẫu báo cáo thay đổi lao động'
      ],
      severity: 'high',
    }
  );

  // ----------------------------------------------------
  // TRỤ CỘT 5: PHÁP LÝ DOANH NGHIỆP & QUẢN TRỊ VỐN (CORPORATE)
  // ----------------------------------------------------
  questions.push(
    {
      id: 'q_corp_capital_90d',
      moduleId: 'MODULE_LEGAL_CORP',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: `Pháp lý: ${corpTypeLabel}`,
      title: 'Chủ sở hữu hoặc các thành viên góp vốn đã hoàn thành góp đủ 100% số vốn điều lệ cam kết trong vòng 90 ngày kể từ ngày cấp ĐKKD chưa?',
      legalBasis: 'Khoản 2 Điều 47 & Khoản 2 Điều 75 Luật Doanh nghiệp 2020. Trường hợp chưa góp đủ, phải đăng ký điều chỉnh giảm vốn trong vòng 30 ngày tiếp theo.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/doanh-nghiep-van-ban/luat-doanh-nghiep-2020-44943.html',
      options: [
        'Đã góp đủ 100% số vốn điều lệ cam kết vào tài khoản công ty trong thời hạn 90 ngày',
        'Đang trong thời hạn 90 ngày đầu kể từ ngày cấp ĐKKD, đang tiến hành góp vốn',
        'Đã quá 90 ngày nhưng các thành viên/cổ đông vẫn chưa góp đủ số vốn cam kết',
        'Chưa góp đủ vốn và chưa làm thủ tục đăng ký giảm vốn điều lệ'
      ],
      severity: 'urgent',
    },
    {
      id: 'q_corp_amend_10d',
      moduleId: 'MODULE_LEGAL_CORP',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: `Pháp lý: ${corpTypeLabel}`,
      title: 'Khi có thay đổi về người đại diện pháp luật, địa chỉ trụ sở, ngành nghề kinh doanh, công ty có đăng ký thay đổi ĐKKD trong thời hạn 10 ngày làm việc không?',
      legalBasis: 'Điều 30 Luật Doanh nghiệp 2020. Doanh nghiệp phải đăng ký thay đổi nội dung Giấy chứng nhận ĐKDN với Phòng ĐKKD trong thời hạn 10 ngày làm việc.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/doanh-nghiep-van-ban/luat-doanh-nghiep-2020-44943.html',
      options: [
        'Luôn nộp hồ sơ thay đổi ĐKKD trong thời hạn 10 ngày làm việc khi có biến động',
        'Từ khi thành lập đến nay chưa phát sinh bất kỳ thay đổi nào so với ĐKKD ban đầu',
        'Có thay đổi (địa chỉ, ngành nghề, người đại diện) nhưng chưa làm thủ tục tại Phòng ĐKKD',
        'Chưa rõ thời hạn 10 ngày làm việc và mức xử phạt chậm đăng ký thay đổi'
      ],
      severity: 'high',
    }
  );

  // ----------------------------------------------------
  // TRỤ CỘT 6: GIẤY PHÉP CHUYÊN NGÀNH THỰC TẾ & BẢO VỆ DỮ LIỆU
  // ----------------------------------------------------
  if (profile.industryTags.includes('TAG_FNB')) {
    questions.push({
      id: 'q_fnb_food_safety',
      moduleId: 'MODULE_LICENSING_ATTP',
      branchType: 'industry',
      branchCode: 'TAG_FNB',
      branchLabel: 'Giấy phép con: An toàn thực phẩm F&B',
      title: 'Cơ sở kinh doanh đã có Giấy chứng nhận cơ sở đủ điều kiện An toàn thực phẩm (hoặc ký Cam kết ATTP) còn hiệu lực và nhân viên có khám sức khỏe thẻ xanh chưa?',
      legalBasis: 'Điều 11 & Điều 12 Nghị định 15/2018/NĐ-CP hướng dẫn Luật An toàn thực phẩm. Cơ sở dịch vụ ăn uống bắt buộc tuân thủ điều kiện vệ sinh ATTP.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/y-te-van-ban/nghi-dinh-152018nd-cp-huong-dan-luat-an-toan-thuc-pham-372957.html',
      options: [
        'Đã có Giấy chứng nhận cơ sở đủ điều kiện ATTP còn hạn và nhân viên có thẻ xanh khám sức khỏe',
        'Đang trong quá trình nộp hồ sơ xin cấp Giấy chứng nhận ATTP tại Ban QLATTP / Phòng Y tế',
        'Chưa có Giấy chứng nhận ATTP hoặc Giấy chứng nhận đã hết hạn',
        'Chưa rõ thủ tục và điều kiện kiểm tra cơ sở đủ điều kiện ATTP'
      ],
      severity: 'urgent',
    });
  }

  if (profile.industryTags.includes('TAG_ECOMMERCE')) {
    questions.push({
      id: 'q_ecom_bct_notification',
      moduleId: 'MODULE_ECOM_DATA_PRIVACY',
      branchType: 'industry',
      branchCode: 'TAG_ECOMMERCE',
      branchLabel: 'Giấy phép con: Thông báo website TMĐT',
      title: 'Website hoặc Ứng dụng di động bán hàng trực tuyến của doanh nghiệp đã hoàn tất thủ tục Thông báo với Bộ Công Thương (online.gov.vn) chưa?',
      legalBasis: 'Điều 27 Nghị định 52/2013/NĐ-CP và Nghị định 85/2021/NĐ-CP về thương mại điện tử. Hành vi không thông báo website bán hàng bị phạt từ 10 đến 20 triệu đồng.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/thuong-mai-van-ban/nghi-dinh-522013nd-cp-ve-thuong-mai-dien-tu-321319.html',
      options: [
        'Đã hoàn thành thủ tục Thông báo website/ứng dụng bán hàng trên Cổng online.gov.vn (có logo xanh)',
        'Website chỉ mang tính chất giới thiệu sản phẩm/tin tức, không có chức năng đặt hàng online',
        'Website/App đang hoạt động bán hàng nhưng chưa làm thủ tục thông báo với Bộ Công Thương',
        'Chưa rõ quy trình và hồ sơ thông báo website thương mại điện tử'
      ],
      severity: 'high',
    });
  }

  // ----------------------------------------------------
  // TRỤ CỘT 7: ĐỊA ĐIỂM & AN TOÀN PCCC (PREMISES)
  // ----------------------------------------------------
  questions.push(
    {
      id: 'q_premises_signboard',
      moduleId: 'MODULE_PREMISES_PCCC',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: 'Địa điểm & Trụ sở',
      title: 'Doanh nghiệp đã gắn biển hiệu ghi đúng tên công ty, mã số thuế và địa chỉ tại trụ sở chính/địa điểm kinh doanh chưa?',
      legalBasis: 'Điều 34 Luật Quảng cáo số 16/2012/QH13 và Điều 37 Luật Doanh nghiệp 2020. Nếu không treo biển, cơ quan thuế có thể khóa mã số thuế với lý do không hoạt động tại địa chỉ đăng ký.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/van-hoa-van-ban/luat-quang-cao-2012-300431.html',
      options: [
        'Đã gắn biển hiệu đầy đủ thông tin (Tên công ty, MST, Địa chỉ) tại cửa trụ sở',
        'Mới thuê địa điểm, đang trong quá trình đặt làm biển hiệu',
        'Chưa gắn biển hiệu công ty tại địa chỉ đăng ký kinh doanh',
        'Địa chỉ đăng ký là văn phòng ảo / địa chỉ mượn, chưa có biển hiệu'
      ],
      severity: 'high',
    },
    {
      id: 'q_premises_fire_safety',
      moduleId: 'MODULE_PREMISES_PCCC',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: 'Phòng cháy chữa cháy',
      title: 'Trụ sở, văn phòng hoặc cơ sở kinh doanh đã trang bị đầy đủ phương tiện PCCC (bình chữa cháy, nội quy, tiêu lệnh) chưa?',
      legalBasis: 'Điều 5 & Điều 7 Nghị định 136/2020/NĐ-CP quy định chi tiết thi hành Luật Phòng cháy và chữa cháy. Cơ sở phải trang bị tối thiểu bình chữa cháy xách tay và phương tiện cứu nạn cơ bản.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/an-ninh-quoc-phong-van-ban/nghi-dinh-1362020nd-cp-huong-dan-luat-phong-chay-va-chua-chay-24646.html',
      options: [
        'Đã trang bị đầy đủ bình chữa cháy còn hạn, tiêu lệnh PCCC và phân công người phụ trách',
        'Địa điểm nằm trong tòa nhà văn phòng / trung tâm thương mại đã có hệ thống PCCC chung',
        'Chưa trang bị bình chữa cháy hoặc bình chữa cháy đã hết hạn kiểm định',
        'Chưa rõ tiêu chuẩn PCCC áp dụng cho diện tích và loại hình cơ sở'
      ],
      severity: 'high',
    }
  );

  // ----------------------------------------------------
  // TRỤ CỘT 8: HỢP ĐỒNG & GIAO KẾT KINH DOANH (CONTRACTS)
  // ----------------------------------------------------
  questions.push({
    id: 'q_contract_authorization',
    moduleId: 'MODULE_CONTRACTS',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: 'Hợp đồng & Giao kết',
    title: 'Các hợp đồng kinh tế (mua bán, thuê mặt bằng, dịch vụ) có được ký kết đúng thẩm quyền người đại diện pháp luật hoặc có giấy ủy quyền hợp pháp không?',
    legalBasis: 'Điều 137, Điều 141, Điều 142 Bộ luật Dân sự 2015. Hợp đồng do người không có thẩm quyền ký kết có nguy cơ bị tòa án tuyên vô hiệu, dẫn đến mất chi phí và không được đòi bồi thường.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/dan-su-van-ban/bo-luat-dan-su-2015-300488.html',
    options: [
      '100% hợp đồng do Người đại diện pháp luật trực tiếp ký hoặc có Văn bản ủy quyền hợp pháp',
      'Đang sử dụng mẫu hợp đồng nội bộ đã được thẩm định pháp lý',
      'Có một số hợp đồng do quản lý/nhân viên tự ký mà không có giấy ủy quyền của giám đốc',
      'Chủ yếu thỏa thuận qua tin nhắn, email hoặc trao đổi miệng, không ký hợp đồng văn bản'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // TRỤ CỘT 9: DỮ LIỆU & SỞ HỮU TRÍ TUỆ (DATA & IP)
  // ----------------------------------------------------
  questions.push(
    {
      id: 'q_data_protection_nd13',
      moduleId: 'MODULE_DATA_IP',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: 'Bảo vệ dữ liệu cá nhân',
      title: 'Doanh nghiệp có thu thập dữ liệu cá nhân (khách hàng, nhân viên) và đã ban hành chính sách/quy trình bảo vệ dữ liệu theo Nghị định 13/2023/NĐ-CP chưa?',
      legalBasis: 'Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân. Doanh nghiệp xử lý dữ liệu cá nhân phải có biện pháp bảo vệ và lập Hồ sơ đánh giá tác động xử lý dữ liệu cá nhân nộp Bộ Công an.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/cong-nghe-thong-tin-van-ban/nghi-dinh-132023nd-cp-bao-ve-du-lieu-ca-nhan-1149454.html',
      options: [
        'Đã ban hành Chính sách bảo mật dữ liệu và có sự đồng ý của khách hàng/người lao động',
        'Chỉ lưu thông tin liên hệ cơ bản nội bộ, không chia sẻ cho bên thứ ba',
        'Có thu thập thông tin khách hàng/nhân sự nhưng chưa có quy chế bảo vệ dữ liệu văn bản',
        'Chưa rõ các nghĩa vụ doanh nghiệp theo Nghị định 13/2023/NĐ-CP'
      ],
      severity: 'medium',
    },
    {
      id: 'q_ip_trademark_brand',
      moduleId: 'MODULE_DATA_IP',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: 'Sở hữu trí tuệ',
      title: 'Tên thương hiệu, logo hoặc nhãn hiệu của sản phẩm/dịch vụ đã được nộp đơn đăng ký bảo hộ độc quyền tại Cục Sở hữu trí tuệ chưa?',
      legalBasis: 'Điều 87 Luật Sở hữu trí tuệ số 50/2005/QH11 (sửa đổi 2022). Việt Nam áp dụng nguyên tắc nộp đơn đầu tiên (first-to-file). Ai nộp trước sẽ được cấp quyền sở hữu thương hiệu.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/so-huu-tri-tue-van-ban/luat-so-huu-tri-tue-2005-300645.html',
      options: [
        'Đã nộp đơn hoặc đã được Cục Sở hữu trí tuệ cấp Văn bằng bảo hộ nhãn hiệu',
        'Đang hoàn thiện hồ sơ tra cứu và chuẩn bị nộp đơn đăng ký bảo hộ nhãn hiệu',
        'Đang kinh doanh theo thương hiệu nhưng chưa đăng ký bảo hộ (nguy cơ bị đối thủ đăng ký trước)',
        'Chỉ sử dụng tên theo đúng Giấy phép kinh doanh, chưa phát triển nhãn hiệu riêng'
      ],
      severity: 'medium',
    }
  );

  // ----------------------------------------------------
  // TRỤ CỘT 10: GIẤY PHÉP CON & NGÀNH NGHỀ CÓ ĐIỀU KIỆN CHUNG
  // ----------------------------------------------------
  questions.push({
    id: 'q_general_conditional_license',
    moduleId: 'MODULE_LICENSING_CON',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: 'Giấy phép con',
    title: 'Doanh nghiệp đã rà soát và hoàn thiện đầy đủ các Giấy phép con / Chứng chỉ hành nghề đối với các ngành nghề kinh doanh có điều kiện của mình chưa?',
    legalBasis: 'Điều 7 Luật Đầu tư 2020 và Danh mục 227 ngành, nghề đầu tư kinh doanh có điều kiện. Hoạt động khi chưa có giấy phép đủ điều kiện sẽ bị đình chỉ và xử phạt nặng.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/dau-tu-van-ban/luat-dau-tu-2020-44942.html',
    options: [
      'Đã được cấp đầy đủ Giấy phép con / Chứng chỉ hành nghề còn hiệu lực cho mọi ngành có điều kiện',
      'Ngành nghề hoạt động của doanh nghiệp là kinh doanh thông thường, không yêu cầu giấy phép con',
      'Đang nộp hồ sơ xin cấp Giấy phép con tại cơ quan quản lý chuyên ngành',
      'Chưa rà soát hoặc chưa có giấy phép con đối với ngành nghề kinh doanh có điều kiện'
    ],
    severity: 'urgent',
  });

  // ----------------------------------------------------
  // CÂU BỔ SUNG 1: HÓA ĐƠN ĐẦU VÀO TỪ DOANH NGHIỆP RỦI RO CAO (INVOICE)
  // ----------------------------------------------------
  questions.push({
    id: 'q_inv_risky_supplier',
    moduleId: 'MODULE_INVOICE_CASHFLOW',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: 'Hóa đơn & Nhà cung cấp',
    title: 'Doanh nghiệp có thực hiện tra cứu định kỳ tình trạng hoạt động của nhà cung cấp trên Cổng Cục Thuế để phòng ngừa rủi ro nhận phải hóa đơn của doanh nghiệp bỏ trốn / ngừng hoạt động không?',
    legalBasis: 'Công văn 1798/TCT-TTKT của Tổng cục Thuế về rà soát xử lý hóa đơn không hợp pháp. Nếu bên bán đã bỏ trốn hoặc bị khóa MST trước thời điểm xuất hóa đơn, bên mua sẽ bị loại chi phí và truy thu thuế.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-1252020nd-cp-quy-dinh-ve-xu-phat-vi-pham-hanh-chinh-ve-thue-hoa-don-24591.html',
    options: [
      '100% nhà cung cấp mới đều được tra cứu trạng thái hoạt động trên cổng Tổng cục Thuế trước khi thanh toán',
      'Chỉ kiểm tra tính hợp lệ của file XML hóa đơn điện tử nhận được qua email',
      'Chưa từng tra cứu tình trạng hoạt động của nhà cung cấp trên trang tra cứu thuế',
      'Chưa rõ công cụ và cách tra cứu danh sách doanh nghiệp có rủi ro cao về hóa đơn'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // CÂU BỔ SUNG 2: KHÁM SỨC KHỎE ĐỊNH KỲ CHO NGƯỜI LAO ĐỘNG (LABOR)
  // ----------------------------------------------------
  questions.push({
    id: 'q_labor_health_check',
    moduleId: 'MODULE_LABOR_HR',
    branchType: 'labor_scale',
    branchCode: 'SCALE_LABOR',
    branchLabel: `Lao động: ${actualEmpCount} nhân sự`,
    title: 'Doanh nghiệp có tổ chức khám sức khỏe định kỳ ít nhất 01 lần/năm cho toàn bộ người lao động (hoặc 06 tháng/lần với lao động làm việc nặng nhọc, độc hại) không?',
    legalBasis: 'Điều 21 Luật An toàn, vệ sinh lao động số 84/2015/QH13. Không tổ chức khám sức khỏe định kỳ cho người lao động bị phạt tiền từ 1.000.000đ đến 3.000.000đ cho mỗi người lao động, tối đa 50 triệu đồng.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/luat-an-toan-ve-sinh-lao-dong-2015-300484.html',
    options: [
      'Đã tổ chức khám sức khỏe định kỳ hàng năm và có sổ theo dõi sức khỏe cho 100% nhân sự',
      'Đang liên hệ cơ sở y tế để lên lịch khám sức khỏe cho nhân viên trong năm tài chính',
      'Chưa từng tổ chức khám sức khỏe định kỳ cho người lao động kể từ khi thành lập',
      'Chưa nắm rõ nghĩa vụ bắt buộc tổ chức khám sức khỏe định kỳ của người sử dụng lao động'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // CÂU BỔ SUNG 3: LẬP VÀ QUẢN LÝ SỔ ĐĂNG KÝ THÀNH VIÊN / CỔ ĐÔNG (LEGAL)
  // ----------------------------------------------------
  questions.push({
    id: 'q_corp_member_register_book',
    moduleId: 'MODULE_LEGAL_CORP',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: `Pháp lý: ${corpTypeLabel}`,
    title: 'Công ty đã lập, cập nhật và lưu trữ Sổ đăng ký thành viên (đối với TNHH) hoặc Sổ đăng ký cổ đông (đối với Cổ phần) kèm Giấy chứng nhận phần vốn góp chưa?',
    legalBasis: 'Điều 48 Luật Doanh nghiệp 2020. Công ty phải cấp Giấy chứng nhận phần vốn góp và lập Sổ đăng ký thành viên ngay sau khi thành viên góp đủ vốn. Vi phạm bị phạt tiền từ 30 đến 50 triệu đồng theo Nghị định 122/2021/NĐ-CP.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/doanh-nghiep-van-ban/luat-doanh-nghiep-2020-44943.html',
    options: [
      'Đã lập Sổ đăng ký thành viên bằng văn bản và cấp Giấy chứng nhận phần vốn góp cho từng thành viên',
      'Chỉ có Giấy chứng nhận đăng ký doanh nghiệp (ĐKKD), chưa lập Sổ đăng ký thành viên nội bộ',
      'Chưa cấp Giấy chứng nhận phần vốn góp cho các thành viên đã góp tiền',
      'Chưa rõ quy định và biểu mẫu Sổ đăng ký thành viên theo Luật Doanh nghiệp 2020'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // CÂU BỔ SUNG 4: HỒ SƠ QUẢN LÝ THEO DÕI HOẠT ĐỘNG PCCC CƠ SỞ (PREMISES)
  // ----------------------------------------------------
  questions.push({
    id: 'q_premises_fire_dossier',
    moduleId: 'MODULE_PREMISES_PCCC',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: 'Hồ sơ PCCC cơ sở',
    title: 'Cơ sở kinh doanh đã lập Hồ sơ quản lý, theo dõi hoạt động phòng cháy chữa cháy và có phương án chữa cháy cơ sở được phê duyệt chưa?',
    legalBasis: 'Điều 9 Thông tư 149/2020/TT-BCA và Nghị định 136/2020/NĐ-CP. Người đứng đầu cơ sở phải lập, cập nhật hồ sơ PCCC gồm bảng thống kê phương tiện, nội quy, sơ đồ thoát nạn và phương án chữa cháy nội bộ.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/an-ninh-quoc-phong-van-ban/thong-tu-1492020tt-bca-huong-dan-luat-phong-chay-va-chua-chay-va-nghi-dinh-1362020nd-cp-do-bo-truong-bo-cong-an-ban-hanh-1002.html',
    options: [
      'Đã lập đầy đủ Hồ sơ PCCC cơ sở, có sơ đồ thoát nạn và phương án chữa cháy tại chỗ',
      'Văn phòng nằm trong tòa nhà cho thuê, sử dụng chung hồ sơ PCCC của Ban quản lý tòa nhà',
      'Chỉ trang bị bình chữa cháy, chưa lập hồ sơ theo dõi hoạt động PCCC bằng văn bản',
      'Chưa rõ quy định về các đầu mục giấy tờ trong bộ Hồ sơ quản lý PCCC cơ sở'
    ],
    severity: 'medium',
  });

  // ----------------------------------------------------
  // CÂU BỔ SUNG 5: HỢP ĐỒNG THUÊ ĐỊA ĐIỂM KINH DOANH VÀ CHỨNG TỪ TIỀN THUÊ (PREMISES)
  // ----------------------------------------------------
  questions.push({
    id: 'q_premises_lease_contract',
    moduleId: 'MODULE_PREMISES_PCCC',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: 'Địa điểm: Hợp đồng thuê mặt bằng',
    title: 'Hợp đồng thuê trụ sở/địa điểm kinh doanh có đầy đủ Hóa đơn GTGT (nếu thuê của công ty) hoặc Chứng từ nộp thuế thay chủ nhà và Giấy tờ chứng minh quyền sở hữu của bên cho thuê không?',
    legalBasis: 'Thông tư 96/2015/TT-BTC và Thông tư 40/2021/TT-BTC. Tiền thuê nhà chỉ được tính vào chi phí hợp lý khi có Hợp đồng thuê, chứng từ thanh toán ngân hàng và hóa đơn/chứng từ nộp thuế môn bài, GTGT, TNCN thay chủ nhà (nếu thuê của cá nhân trên 100 triệu/năm).',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
    options: [
      'Hợp đồng thuê mặt bằng đứng tên công ty, có đầy đủ hóa đơn/chứng từ thuế và thanh toán ngân hàng',
      'Trụ sở là nhà thuộc sở hữu của thành viên sáng lập / gia đình cho mượn miễn phí',
      'Thuê mặt bằng của cá nhân trên 100 triệu/năm nhưng chỉ trả tiền mặt và không có chứng từ nộp thuế',
      'Hợp đồng thuê nhà đứng tên cá nhân của giám đốc, chưa chuyển tên sang pháp nhân công ty'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // CÂU BỔ SUNG 6: ĐIỀU KHOẢN PHẠT VI PHẠM TRONG HỢP ĐỒNG THƯƠNG MẠI (CONTRACTS)
  // ----------------------------------------------------
  questions.push({
    id: 'q_contract_penalty_clause',
    moduleId: 'MODULE_CONTRACTS',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: 'Hợp đồng: Mức phạt vi phạm',
    title: 'Các hợp đồng mua bán hàng hóa, cung ứng dịch vụ của công ty có thỏa thuận mức phạt vi phạm hợp đồng tuân thủ giới hạn tối đa 8% giá trị phần nghĩa vụ bị vi phạm không?',
    legalBasis: 'Điều 301 Luật Thương mại số 36/2005/QH11. Mức phạt đối với vi phạm nghĩa vụ hợp đồng do các bên thoả thuận nhưng không quá 8% giá trị phần nghĩa vụ hợp đồng bị vi phạm (trừ hợp đồng dịch vụ giám định). Phần thỏa thuận vượt quá 8% sẽ bị tòa án tuyên vô hiệu.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/thuong-mai-van-ban/luat-thuong-mai-2005-300439.html',
    options: [
      'Mọi hợp đồng kinh tế đều khống chế mức phạt vi phạm không vượt quá 8% theo đúng Luật Thương mại',
      'Hợp đồng thỏa thuận mức phạt vi phạm cao (15% - 20%) hoặc không giới hạn theo thói quen',
      'Hợp đồng chỉ ghi bồi thường thiệt hại thực tế phát sinh, không có điều khoản phạt vi phạm',
      'Chưa rõ quy định mức trần phạt vi phạm 8% trong hợp đồng thương mại'
    ],
    severity: 'medium',
  });

  // ----------------------------------------------------
  // CÂU BỔ SUNG 7: NGHIỆM THU VÀ THANH LÝ HỢP ĐỒNG (CONTRACTS)
  // ----------------------------------------------------
  questions.push({
    id: 'q_contract_acceptance_minutes',
    moduleId: 'MODULE_CONTRACTS',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: 'Hợp đồng: Biên bản nghiệm thu',
    title: 'Khi hoàn thành giao hàng hoặc cung cấp dịch vụ, công ty có lập Biên bản giao nhận / Biên bản nghiệm thu và Biên bản thanh lý hợp đồng làm căn cứ xuất hóa đơn và thanh toán không?',
    legalBasis: 'Điều 9 Nghị định 123/2020/NĐ-CP và Luật Kế toán 2015. Thời điểm lập hóa đơn đối với dịch vụ là thời điểm hoàn thành việc cung cấp dịch vụ. Biên bản nghiệm thu là chứng từ kế toán bắt buộc để chứng minh dịch vụ đã thực hiện thực tế.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-1232020nd-cp-quy-dinh-ve-hoa-don-chung-tu-24589.html',
    options: [
      '100% hợp đồng đều có Biên bản nghiệm thu bàn giao và Biên bản thanh lý có chữ ký của hai bên',
      'Đang sử dụng phiếu xuất kho kiêm vận chuyển nội bộ hoặc hóa đơn điện tử làm căn cứ giao nhận',
      'Nhiều giao dịch chỉ xuất hóa đơn và chuyển khoản, không có biên bản nghiệm thu hoặc thanh lý',
      'Chưa rõ quy trình lập và lưu trữ hồ sơ nghiệm thu thanh lý hợp đồng'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // CÂU BỔ SUNG 8: BẢN QUYỀN PHẦN MỀM & QUẢN TRỊ TÀI SẢN SỐ (DATA & IP)
  // ----------------------------------------------------
  questions.push({
    id: 'q_ip_software_license_assets',
    moduleId: 'MODULE_DATA_IP',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: 'SHTT: Bản quyền phần mềm & Tài sản số',
    title: 'Hệ thống máy tính, phần mềm kế toán, hệ điều hành (Windows, Office) và hình ảnh thiết kế quảng cáo của doanh nghiệp có bản quyền hợp pháp (tránh vi phạm quyền tác giả) không?',
    legalBasis: 'Điều 20 & Điều 28 Luật Sở hữu trí tuệ 2005 (sửa đổi 2022) và Nghị định 131/2013/NĐ-CP. Hành vi sao chép, sử dụng phần mềm máy tính không có bản quyền phục vụ hoạt động kinh doanh bị phạt tiền từ 15 đến 35 triệu đồng và buộc gỡ bỏ.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/so-huu-tri-tue-van-ban/luat-so-huu-tri-tue-2005-300645.html',
    options: [
      'Toàn bộ phần mềm kế toán, văn phòng và hình ảnh quảng cáo đều có bản quyền/hóa đơn mua hợp pháp',
      'Sử dụng các giải pháp phần mềm mã nguồn mở miễn phí hoặc gói dịch vụ thuê bao chính hãng',
      'Có một số máy tính dùng phần mềm crack hoặc lấy hình ảnh trên mạng chưa xin phép bản quyền',
      'Chưa rà soát bản quyền phần mềm và tài sản số trong doanh nghiệp'
    ],
    severity: 'medium',
  });

  return questions;
}

/**
 * Tự động sinh danh mục Checklists & Tasks tuân thủ bao quát toàn bộ 7 kỳ hạn luật định:
 * 1. Kỳ Hàng Tháng (Monthly)
 * 2. Kỳ Hàng Quý (Quarterly)
 * 3. Kỳ 6 Tháng / Bán niên (Biannual_6M)
 * 4. Kỳ Cả Năm / Quyết toán (Annual)
 * 5. Đợt 10 Ngày (Event_10D)
 * 6. Đợt 20 Ngày (Event_20D)
 * 7. Đợt 45 Ngày (Event_45D)
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
  const now = new Date();
  const nowISODate = formatISODate(now);
  const nowFull = now.toISOString().replace('T', ' ').substring(0, 16);

  const isQuarterly = profile.isNewlyEstablished || (profile.annualRevenue || 0) <= 50000000000;
  const actualEmpCount = profile.employeeCount || (profile.employeeScale === 'under_10' ? 8 : profile.employeeScale === '10_to_50' ? 25 : 60);

  // 1. Ghi nhận dữ kiện bối cảnh nền tảng (Context Facts)
  contextFacts.push(
    {
      id: 'fact-tax-code',
      key: 'tax_code',
      label: 'Mã số thuế doanh nghiệp',
      group: 'legal',
      currentValue: profile.taxCode || '',
      source: 'Khảo sát nền tảng Bước 1',
      providedBy: 'Chủ doanh nghiệp',
      providedAt: nowFull,
      status: 'confirmed',
      affectedRules: ['RULE_TAX_REGISTRATION'],
      history: [{ value: profile.taxCode || '', changedBy: 'Chủ DN', changedAt: nowFull, note: 'Định danh pháp lý' }]
    },
    {
      id: 'fact-annual-revenue',
      key: 'annual_revenue',
      label: 'Doanh thu năm trước liền kề',
      group: 'thue_ke_toan',
      currentValue: profile.isNewlyEstablished ? 'Mới thành lập (Doanh thu = 0)' : `${(profile.annualRevenue || 0).toLocaleString('vi-VN')} VNĐ`,
      source: 'Khảo sát nền tảng Bước 1',
      providedBy: 'Chủ doanh nghiệp',
      providedAt: nowFull,
      status: 'confirmed',
      affectedRules: ['RULE-TAX-GTGT', 'RULE-TAX-TNDN-80'],
      history: [{ value: String(profile.annualRevenue || 0), changedBy: 'Chủ DN', changedAt: nowFull, note: 'Căn cứ xác định kỳ khai thuế theo NĐ 126/2020' }]
    },
    {
      id: 'fact-tax-filing-cycle',
      key: 'tax_filing_cycle',
      label: 'Kỳ kê khai thuế GTGT & TNCN',
      group: 'tax_accounting',
      currentValue: isQuarterly ? 'THEO_QUY (Doanh thu ≤ 50 tỷ hoặc mới thành lập)' : 'THEO_THANG (Doanh thu năm trước > 50 tỷ)',
      source: 'Tự động xác định theo Điều 8 & 9 Nghị định 126/2020/NĐ-CP',
      providedBy: 'Hệ thống CELRA',
      providedAt: nowFull,
      status: 'confirmed',
      affectedRules: ['RULE-TAX-GTGT'],
      history: [{ value: isQuarterly ? 'THEO_QUY' : 'THEO_THANG', changedBy: 'CELRA Engine', changedAt: nowFull, note: 'Xác định kỳ kê khai' }]
    },
    {
      id: 'fact-employee-count',
      key: 'employee_count',
      label: 'Số lượng nhân sự thực tế',
      group: 'lao_dong_bhxh',
      currentValue: `${actualEmpCount} nhân viên`,
      source: 'Khảo sát nền tảng Bước 1',
      providedBy: 'Chủ doanh nghiệp',
      providedAt: nowFull,
      status: 'confirmed',
      affectedRules: actualEmpCount >= 10 ? ['RULE_LABOR_MANDATORY_REGISTRATION'] : ['RULE_LABOR_GENERAL'],
      history: [{ value: String(actualEmpCount), changedBy: 'Chủ DN', changedAt: nowFull, note: 'Quy mô lao động thực tế' }]
    },
    {
      id: 'fact-industry-tags',
      key: 'industry_tags',
      label: 'Ngành nghề trọng tâm',
      group: 'operations',
      currentValue: profile.industryTags.map(tag => INDUSTRY_TAGS.find(t => t.id === tag)?.shortLabel || tag).join(', '),
      source: 'Khảo sát nền tảng Bước 1',
      providedBy: 'Chủ doanh nghiệp',
      providedAt: nowFull,
      status: 'confirmed',
      affectedRules: profile.industryTags.map(t => `RULE_${t}`),
      history: [{ value: profile.industryTags.join(', '), changedBy: 'Chủ DN', changedAt: nowFull, note: 'Gắn thẻ ngành nghề thực tế' }]
    }
  );

  // 2. Ghi nhận toàn diện các câu trả lời 360 độ vào ContextFact
  questions.forEach((q) => {
    let factGroup: ContextFact['group'] = 'thue_ke_toan';
    if (q.moduleId === 'MODULE_INVOICE_CASHFLOW') {
      factGroup = 'hoa_don_dong_tien';
    } else if (q.moduleId === 'MODULE_LABOR_HR') {
      factGroup = 'lao_dong_bhxh';
    } else if (q.moduleId === 'MODULE_PREMISES_PCCC') {
      factGroup = 'dia_diem_pccc';
    } else if (q.moduleId === 'MODULE_CONTRACTS') {
      factGroup = 'hop_dong';
    } else if (q.moduleId === 'MODULE_DATA_IP' || q.moduleId === 'MODULE_ECOM_DATA_PRIVACY') {
      factGroup = 'du_lieu_shtt';
    } else if (q.moduleId === 'MODULE_LICENSING_ATTP' || q.moduleId === 'MODULE_LICENSING_CON') {
      factGroup = 'giay_phep_con';
    } else if (q.moduleId === 'MODULE_LEGAL_CORP' || q.id === 'q_corp_capital_90d' || q.id === 'q_corp_amend_10d' || q.id === 'q_corp_member_register_book') {
      factGroup = 'phap_ly_von';
    } else if (q.branchType === 'labor_scale') {
      factGroup = 'hr_labor';
    } else if (q.branchType === 'company_type') {
      factGroup = 'legal';
    } else {
      factGroup = 'nganh_nghe_van_hanh';
    }

    contextFacts.push({
      id: `fact-dynamic-${q.id}`,
      key: q.id,
      label: q.title,
      group: factGroup,
      currentValue: q.selectedOption || 'Chưa thực hiện / Chưa có',
      source: `Khảo sát Toàn diện 360° [${q.branchLabel}]`,
      providedBy: 'Chủ doanh nghiệp',
      providedAt: nowFull,
      status: 'confirmed',
      affectedRules: [q.branchCode],
      history: [{ value: q.selectedOption || 'Chưa thực hiện', changedBy: 'Chủ DN', changedAt: nowFull, note: q.branchLabel }]
    });
  });

  // 3. Xây dựng Checklists & Tasks theo ĐẦY ĐỦ CÁC KỲ HẠN LUẬT ĐỊNH
  const cklId = `ckl-statutory-${Date.now()}`;

  checklists.push({
    id: cklId,
    code: 'CKL-TAX-STATUTORY-01',
    title: 'Bộ Check-list Nghĩa vụ Tuân thủ Thuế & Lao động Toàn diện theo Luật định',
    category: 'Thuế & Lao Động',
    priority: 'urgent',
    status: 'in_progress',
    generatedFromRuleId: 'RULE-TAX-FULL-CYCLE',
    ruleCode: 'RULE-TAX-FULL-CYCLE',
    contextReason: `Kích hoạt từ bối cảnh ${profile.companyTypeTag} (${isQuarterly ? 'Kê khai Quý' : 'Kê khai Tháng'}) và ngành nghề ${profile.industryTags.join(', ')}.`,
    legalBasis: 'Luật Quản lý thuế số 38/2019/QH14, Nghị định 126/2020/NĐ-CP, Nghị định 91/2022/NĐ-CP, Bộ luật Lao động 2019.',
    assigneeRole: 'Kế toán trưởng & Chủ doanh nghiệp',
    createdAt: nowISODate,
    items: [
      { id: 'i-1', title: 'Nộp tờ khai thuế GTGT & TNCN đúng kỳ hạn', isRequired: true, isChecked: false, evidenceRequired: true },
      { id: 'i-2', title: 'Tạm nộp đủ 80% thuế TNDN 4 quý', isRequired: true, isChecked: false, evidenceRequired: true },
      { id: 'i-3', title: 'Báo cáo sử dụng lao động định kỳ 6 tháng (05/06 & 05/12)', isRequired: true, isChecked: false, evidenceRequired: true },
      { id: 'i-4', title: 'Nộp tờ khai lệ phí môn bài và quyết toán năm BCTC (31/03)', isRequired: true, isChecked: false, evidenceRequired: true },
      { id: 'i-5', title: 'Kê khai thuế nhà thầu (10 ngày) và đăng ký NQLĐ', isRequired: true, isChecked: false, evidenceRequired: true },
    ]
  });

  let taskCounter = 1;

  // --- KỲ 1: HÀNG THÁNG (MONTHLY) ---
  if (!isQuarterly) {
    // Nếu doanh thu > 50 tỷ: Kê khai GTGT & TNCN hàng tháng
    tasks.push({
      id: `task-m-${taskCounter}`,
      code: `TASK-CYCLE-M0${taskCounter++}`,
      title: 'Nộp tờ khai thuế GTGT & khấu trừ thuế TNCN hàng tháng (Kỳ Doanh thu > 50 tỷ)',
      checklistId: cklId,
      category: 'Kỳ Hàng Tháng (Ngày 20)',
      periodCycle: 'MONTHLY',
      periodLabel: STATUTORY_PERIOD_METAS.MONTHLY.label,
      priority: 'urgent',
      departmentId: 'dept-accounting',
      departmentName: 'Phòng Kế toán',
      assigneeRole: 'internal_accountant',
      waitingOnRole: 'internal_accountant',
      dueDate: formatISODate(calculateLegalDueDate('MONTHLY', now)),
      status: 'in_progress',
      description: 'Nộp tờ khai thuế GTGT và thuế TNCN tháng phát sinh chậm nhất ngày 20 của tháng tiếp theo. Căn cứ Khoản 1 Điều 44 Luật QLT số 38/2019/QH14.',
      legalBasis: 'Khoản 1 Điều 44 Luật Quản lý thuế số 38/2019/QH14',
      contextTrigger: 'Doanh nghiệp có doanh thu năm trước liền kề trên 50 tỷ đồng.',
      ruleCode: 'RULE-TAX-GTGT-MONTHLY',
    });
  }

  // Trích nộp BHXH bắt buộc hàng tháng
  tasks.push({
    id: `task-m-${taskCounter}`,
    code: `TASK-CYCLE-M0${taskCounter++}`,
    title: `Trích nộp BHXH, BHYT, BHTN định kỳ hàng tháng cho ${actualEmpCount} người lao động`,
    checklistId: cklId,
    category: 'Kỳ Hàng Tháng (Ngày 20)',
    periodCycle: 'MONTHLY',
    periodLabel: STATUTORY_PERIOD_METAS.MONTHLY.label,
    priority: 'high',
    departmentId: 'dept-hr',
    departmentName: 'Phòng Nhân sự / Kế toán',
    assigneeRole: 'hr_staff',
    waitingOnRole: 'internal_accountant',
    dueDate: formatISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)), // Ngày cuối cùng của tháng
    status: 'in_progress',
    description: 'Chậm nhất ngày cuối cùng của tháng, trích nộp tiền đóng BHXH, BHYT, BHTN từ tiền lương của NLĐ và chuyển khoản vào tài khoản cơ quan BHXH.',
    legalBasis: 'Điều 7 Quyết định 595/QĐ-BHXH & Luật BHXH',
    contextTrigger: `Doanh nghiệp sử dụng ${actualEmpCount} nhân sự có ký kết HĐLĐ.`,
    ruleCode: 'RULE-LABOR-BHXH-MONTHLY',
  });

  // --- KỲ 2: HÀNG QUÝ (QUARTERLY) ---
  if (isQuarterly) {
    tasks.push({
      id: `task-q-${taskCounter}`,
      code: `TASK-CYCLE-Q0${taskCounter++}`,
      title: 'Lập và nộp tờ khai thuế GTGT & TNCN Quý (DN ≤ 50 tỷ hoặc mới thành lập)',
      checklistId: cklId,
      category: 'Kỳ Hàng Quý',
      periodCycle: 'QUARTERLY',
      periodLabel: STATUTORY_PERIOD_METAS.QUARTERLY.label,
      priority: 'urgent',
      departmentId: 'dept-accounting',
      departmentName: 'Phòng Kế toán',
      assigneeRole: 'internal_accountant',
      waitingOnRole: 'owner',
      dueDate: formatISODate(calculateLegalDueDate('QUARTERLY', now)),
      status: 'in_progress',
      description: 'Hạn nộp hồ sơ khai thuế GTGT và khấu trừ TNCN theo quý là ngày cuối cùng của tháng đầu quý tiếp theo (30/04, 31/07, 31/10, 31/01).',
      legalBasis: 'Khoản 1 Điều 44 Luật QLT 38/2019/QH14 và Điều 8 Nghị định 126/2020/NĐ-CP',
      contextTrigger: 'Doanh nghiệp có doanh thu ≤ 50 tỷ đồng hoặc mới thành lập trong năm.',
      ruleCode: 'RULE-TAX-GTGT-QUARTERLY',
    });
  }

  // Tạm nộp 80% thuế TNDN 4 quý
  tasks.push({
    id: `task-q-${taskCounter}`,
    code: `TASK-CYCLE-Q0${taskCounter++}`,
    title: 'Tạm nộp thuế Thu nhập doanh nghiệp (TNDN) Quý (Đảm bảo 4 quý đạt ≥ 80% cả năm)',
    checklistId: cklId,
    category: 'Kỳ Hàng Quý',
    periodCycle: 'QUARTERLY',
    periodLabel: STATUTORY_PERIOD_METAS.QUARTERLY.label,
    priority: 'urgent',
    departmentId: 'dept-accounting',
    departmentName: 'Phòng Kế toán',
    assigneeRole: 'internal_accountant',
    waitingOnRole: 'owner',
    dueDate: formatISODate(calculateLegalDueDate('QUARTERLY', now)),
    status: 'in_progress',
    description: 'Doanh nghiệp tự tính và tạm nộp thuế TNDN quý. Tổng số tạm nộp 4 quý không được thấp hơn 80% số thuế TNDN phải nộp theo quyết toán năm.',
    legalBasis: 'Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP sửa đổi NĐ 126/2020/NĐ-CP',
    contextTrigger: 'Quy định bắt buộc đối với mọi công ty TNHH/Cổ phần chịu thuế TNDN.',
    ruleCode: 'RULE-TAX-TNDN-80',
  });

  // --- KỲ 3: 6 THÁNG / BÁN NIÊN (BIANNUAL_6M) ---
  tasks.push({
    id: `task-bi-${taskCounter}`,
    code: `TASK-CYCLE-6M0${taskCounter++}`,
    title: 'Nộp Báo cáo tình hình thay đổi lao động định kỳ 6 tháng (Hạn 05/06 hoặc 05/12)',
    checklistId: cklId,
    category: 'Kỳ 6 Tháng (Bán niên)',
    periodCycle: 'BIANNUAL_6M',
    periodLabel: STATUTORY_PERIOD_METAS.BIANNUAL_6M.label,
    priority: 'high',
    departmentId: 'dept-hr',
    departmentName: 'Phòng Hành chính - Nhân sự',
    assigneeRole: 'hr_staff',
    waitingOnRole: 'owner',
    dueDate: formatISODate(calculateLegalDueDate('BIANNUAL_6M', now)),
    status: 'in_progress',
    description: 'Người sử dụng lao động phải báo cáo tình hình thay đổi lao động định kỳ: 6 tháng đầu năm (trước 05/06) và cả năm (trước 05/12) qua Cổng Dịch vụ công Quốc gia hoặc Sở LĐ-TB&XH.',
    legalBasis: 'Khoản 2 Điều 4 Nghị định 145/2020/NĐ-CP hướng dẫn Bộ luật Lao động',
    contextTrigger: `Doanh nghiệp đang sử dụng ${actualEmpCount} người lao động.`,
    ruleCode: 'RULE-LABOR-REPORT-6M',
  });

  // --- KỲ 4: CẢ NĂM / QUYẾT TOÁN NĂM (ANNUAL) ---
  tasks.push(
    {
      id: `task-ann-${taskCounter}`,
      code: `TASK-CYCLE-A0${taskCounter++}`,
      title: 'Nộp Lệ phí môn bài hàng năm (Hạn chậm nhất ngày 30/01)',
      checklistId: cklId,
      category: 'Kỳ Cả Năm',
      periodCycle: 'ANNUAL',
      periodLabel: STATUTORY_PERIOD_METAS.ANNUAL.label,
      priority: 'high',
      departmentId: 'dept-accounting',
      departmentName: 'Phòng Kế toán',
      assigneeRole: 'internal_accountant',
      waitingOnRole: 'owner',
      dueDate: formatISODate(calculateLegalDueDate('ANNUAL', now)),
      status: 'in_progress',
      description: 'Hạn nộp lệ phí môn bài chậm nhất ngày 30/01 hàng năm. Doanh nghiệp vốn > 10 tỷ nộp 3.000.000đ; vốn ≤ 10 tỷ nộp 2.000.000đ. Doanh nghiệp mới thành lập năm đầu được miễn.',
      legalBasis: 'Khoản 9 Điều 18 Nghị định 126/2020/NĐ-CP & Nghị định 139/2016/NĐ-CP',
      contextTrigger: `Doanh nghiệp có vốn điều lệ ${(profile.charterCapital || 0).toLocaleString('vi-VN')} VNĐ.`,
      ruleCode: 'RULE-TAX-MONBAI',
    },
    {
      id: `task-ann-${taskCounter}`,
      code: `TASK-CYCLE-A0${taskCounter++}`,
      title: 'Hồ sơ Quyết toán năm: BCTC, Quyết toán thuế TNDN & Quyết toán thuế TNCN (Hạn 31/03)',
      checklistId: cklId,
      category: 'Kỳ Cả Năm',
      periodCycle: 'ANNUAL',
      periodLabel: STATUTORY_PERIOD_METAS.ANNUAL.label,
      priority: 'urgent',
      departmentId: 'dept-accounting',
      departmentName: 'Phòng Kế toán',
      assigneeRole: 'internal_accountant',
      waitingOnRole: 'owner',
      dueDate: formatISODate(new Date(now.getFullYear() + (now.getMonth() >= 3 ? 1 : 0), 2, 31, 23, 59, 59)), // 31/03
      status: 'in_progress',
      description: 'Chậm nhất ngày cuối cùng của tháng thứ 3 kể từ ngày kết thúc năm dương lịch (31/03), nộp toàn bộ Báo cáo tài chính, Tờ khai quyết toán thuế TNDN (Mẫu 03/TNDN) và Quyết toán thuế TNCN (Mẫu 05/QTT-TNCN).',
      legalBasis: 'Điểm a Khoản 2 Điều 44 Luật Quản lý thuế số 38/2019/QH14',
      contextTrigger: 'Nghĩa vụ quyết toán năm bắt buộc cho toàn bộ tổ chức kinh doanh.',
      ruleCode: 'RULE-TAX-ANNUAL-FINAL',
    }
  );

  // --- KỲ 5: TỪNG LẦN PHÁT SINH 10 NGÀY (EVENT_10D) ---
  tasks.push({
    id: `task-ev10-${taskCounter}`,
    code: `TASK-CYCLE-E10-${taskCounter++}`,
    title: 'Kê khai và nộp thuế nhà thầu (FCT) khi thanh toán chi phí Ads quốc tế (Facebook, Google, TikTok)',
    checklistId: cklId,
    category: 'Đợt Phát Sinh 10 Ngày',
    periodCycle: 'EVENT_10D',
    periodLabel: STATUTORY_PERIOD_METAS.EVENT_10D.label,
    priority: 'high',
    departmentId: 'dept-accounting',
    departmentName: 'Phòng Kế toán',
    assigneeRole: 'internal_accountant',
    waitingOnRole: 'owner',
    dueDate: formatISODate(calculateLegalDueDate('EVENT_10D', now)),
    status: 'in_progress',
    description: 'Đối với khoản thanh toán dịch vụ xuyên biên giới cho nhà thầu nước ngoài chưa đăng ký thuế tại Việt Nam, doanh nghiệp phải nộp hồ sơ khai thuế chậm nhất là ngày thứ 10 kể từ ngày phát sinh nghĩa vụ thanh toán.',
    legalBasis: 'Khoản 3 Điều 44 Luật Quản lý thuế số 38/2019/QH14 & Thông tư 103/2014/TT-BTC',
    contextTrigger: `Doanh nghiệp kinh doanh ${profile.industryTags.includes('TAG_ECOMMERCE') ? 'Thương mại điện tử' : 'F&B'} có phát sinh chi phí marketing online.`,
    ruleCode: 'RULE-TAX-FCT-10D',
  });

  if (actualEmpCount >= 10 || profile.requiresLaborRuleBook) {
    tasks.push({
      id: `task-ev10-${taskCounter}`,
      code: `TASK-CYCLE-E10-${taskCounter++}`,
      title: 'Nộp hồ sơ đăng ký Nội quy lao động trong thời hạn 10 ngày kể từ ngày ban hành',
      checklistId: cklId,
      category: 'Đợt Phát Sinh 10 Ngày',
      periodCycle: 'EVENT_10D',
      periodLabel: STATUTORY_PERIOD_METAS.EVENT_10D.label,
      priority: 'urgent',
      departmentId: 'dept-hr',
      departmentName: 'Phòng Nhân sự',
      assigneeRole: 'hr_staff',
      waitingOnRole: 'owner',
      dueDate: formatISODate(calculateLegalDueDate('EVENT_10D', now)),
      status: 'in_progress',
      description: 'Trong thời hạn 10 ngày kể từ ngày ban hành nội quy lao động, người sử dụng lao động phải nộp hồ sơ đăng ký nội quy lao động đến cơ quan chuyên môn về lao động thuộc UBND cấp tỉnh.',
      legalBasis: 'Khoản 1 Điều 119 Bộ luật Lao động 2019',
      contextTrigger: `Doanh nghiệp sử dụng ${actualEmpCount} người lao động (từ 10 người trở lên bắt buộc đăng ký NQLĐ).`,
      ruleCode: 'RULE-LABOR-NQLD-10D',
    });
  }

  // --- KỲ 6: ĐỢT 20 NGÀY (EVENT_20D) ---
  tasks.push({
    id: `task-ev20-${taskCounter}`,
    code: `TASK-CYCLE-E20-${taskCounter++}`,
    title: 'Rà soát ngưỡng 50 tỷ để gửi thông báo chuyển đổi kỳ khai thuế Quý sang Tháng (Hạn 20 ngày)',
    checklistId: cklId,
    category: 'Đợt 20 Ngày',
    periodCycle: 'EVENT_20D',
    periodLabel: STATUTORY_PERIOD_METAS.EVENT_20D.label,
    priority: 'medium',
    departmentId: 'dept-accounting',
    departmentName: 'Phòng Kế toán',
    assigneeRole: 'internal_accountant',
    waitingOnRole: 'owner',
    dueDate: formatISODate(calculateLegalDueDate('EVENT_20D', now)),
    status: 'in_progress',
    description: 'Trường hợp người nộp thuế đang kê khai thuế theo quý có tổng doanh thu năm trước liền kề trên 50 tỷ đồng thì phải thực hiện kê khai thuế theo tháng từ năm tiếp theo. Nộp Mẫu 01/ĐK-TĐKKT chậm nhất là ngày 20 của tháng đầu tiên của quý đầu tiên chuyển đổi.',
    legalBasis: 'Điều 9 Nghị định 126/2020/NĐ-CP',
    contextTrigger: `Doanh thu hiện tại: ${(profile.annualRevenue || 0).toLocaleString('vi-VN')} VNĐ.`,
    ruleCode: 'RULE-TAX-CONVERT-20D',
  });

  // --- KỲ 7: ĐỢT 45 NGÀY (EVENT_45D) ---
  tasks.push({
    id: `task-ev45-${taskCounter}`,
    code: `TASK-CYCLE-E45-${taskCounter++}`,
    title: 'Hồ sơ quyết toán thuế trong trường hợp giải thể, chia tách, sáp nhập (Hạn 45 ngày)',
    checklistId: cklId,
    category: 'Đợt 45 Ngày',
    periodCycle: 'EVENT_45D',
    periodLabel: STATUTORY_PERIOD_METAS.EVENT_45D.label,
    priority: 'low',
    departmentId: 'dept-accounting',
    departmentName: 'Phòng Kế toán & Ban Giám đốc',
    assigneeRole: 'internal_accountant',
    waitingOnRole: 'owner',
    dueDate: formatISODate(calculateLegalDueDate('EVENT_45D', now)),
    status: 'need_info',
    description: 'Chậm nhất là ngày thứ 45 kể từ ngày có quyết định giải thể, chia tách, hợp nhất, chấm dứt dự án hoặc chấm dứt hoạt động, doanh nghiệp phải nộp đủ hồ sơ quyết toán thuế dứt điểm với cơ quan thuế.',
    legalBasis: 'Khoản 4 Điều 44 Luật Quản lý thuế số 38/2019/QH14',
    contextTrigger: 'Dự phòng rủi ro pháp lý cơ cấu doanh nghiệp.',
    ruleCode: 'RULE-TAX-DISSOLUTION-45D',
  });

  // --- KỲ 8: ĐỢT 03 NGÀY LÀM VIỆC (EVENT_3D) ---
  tasks.push({
    id: `task-ev3d-${taskCounter}`,
    code: `TASK-CYCLE-E3D-${taskCounter++}`,
    title: 'Thông báo tạm ngừng / tiếp tục kinh doanh trước 03 ngày làm việc & Giải trình HĐĐT sai sót Mẫu 04/SS',
    checklistId: cklId,
    category: 'Đợt 03 Ngày Làm Việc',
    periodCycle: 'EVENT_3D',
    periodLabel: STATUTORY_PERIOD_METAS.EVENT_3D.label,
    priority: 'high',
    departmentId: 'dept-operations',
    departmentName: 'Phòng Pháp chế & Vận hành',
    assigneeRole: 'owner',
    waitingOnRole: 'service_accountant',
    dueDate: formatISODate(calculateLegalDueDate('EVENT_3D', now)),
    status: 'need_info',
    description: 'Doanh nghiệp phải gửi thông báo bằng văn bản đến Phòng ĐKKD chậm nhất 03 ngày làm việc trước ngày tạm ngừng hoặc mở lại trước hạn (Điều 66 NĐ 01/2021). Đồng thời gửi Mẫu 04/SS-HĐĐT giải trình sai sót hóa đơn điện tử trong 03 ngày làm việc khi nhận thông báo rà soát (Điều 19 NĐ 123/2020).',
    legalBasis: 'Khoản 1 Điều 66 Nghị định 01/2021/NĐ-CP & Điều 19 Nghị định 123/2020/NĐ-CP',
    contextTrigger: 'Quy chế quản lý hành chính doanh nghiệp và hóa đơn điện tử.',
    ruleCode: 'RULE-CORP-SUSPEND-3D',
  });

  // --- KỲ 9: ĐỢT 10 NGÀY LÀM VIỆC (EVENT_10D_BIZ) ---
  tasks.push({
    id: `task-ev10biz-${taskCounter}`,
    code: `TASK-CYCLE-E10B-${taskCounter++}`,
    title: 'Đăng ký thay đổi nội dung Giấy chứng nhận ĐKDN & Thông báo tài khoản ngân hàng trong 10 ngày làm việc',
    checklistId: cklId,
    category: 'Đợt 10 Ngày Làm Việc',
    periodCycle: 'EVENT_10D_BIZ',
    periodLabel: STATUTORY_PERIOD_METAS.EVENT_10D_BIZ.label,
    priority: 'high',
    departmentId: 'dept-operations',
    departmentName: 'Phòng Pháp chế / Ban Giám đốc',
    assigneeRole: 'owner',
    waitingOnRole: 'service_accountant',
    dueDate: formatISODate(calculateLegalDueDate('EVENT_10D_BIZ', now)),
    status: 'need_info',
    description: 'Khi thay đổi địa chỉ trụ sở, người đại diện pháp luật, ngành nghề kinh doanh, vốn điều lệ... phải đăng ký với Sở KH&ĐT trong 10 ngày làm việc (Điều 30 Luật DN 2020). Đồng thời thông báo thay đổi tài khoản ngân hàng với cơ quan thuế trong 10 ngày làm việc (Khoản 2 Điều 36 Luật QLT).',
    legalBasis: 'Điều 30 Luật Doanh nghiệp 2020 & Khoản 2 Điều 36 Luật Quản lý thuế số 38/2019/QH14',
    contextTrigger: 'Thay đổi thông tin pháp lý doanh nghiệp hoặc mở thêm tài khoản thanh toán.',
    ruleCode: 'RULE-CORP-AMEND-10D',
  });

  // --- KỲ 10: ĐỢT 90 NGÀY (EVENT_90D) ---
  tasks.push({
    id: `task-ev90d-${taskCounter}`,
    code: `TASK-CYCLE-E90D-${taskCounter++}`,
    title: 'Góp đủ 100% vốn điều lệ đã đăng ký cam kết trong vòng 90 ngày kể từ ngày cấp GCN ĐKDN',
    checklistId: cklId,
    category: 'Đợt 90 Ngày (Góp Vốn)',
    periodCycle: 'EVENT_90D',
    periodLabel: STATUTORY_PERIOD_METAS.EVENT_90D.label,
    priority: 'urgent',
    departmentId: 'dept-accounting',
    departmentName: 'Ban Thành viên / Cổ đông sáng lập',
    assigneeRole: 'owner',
    waitingOnRole: 'internal_accountant',
    dueDate: formatISODate(calculateLegalDueDate('EVENT_90D', now)),
    status: profile.isNewlyEstablished ? 'in_progress' : 'need_info',
    description: 'Các thành viên/cổ đông phải góp đủ 100% số vốn điều lệ đã đăng ký cam kết trong vòng 90 ngày kể từ ngày được cấp GCN ĐKDN. Trường hợp không góp đủ vốn bị xử phạt vi phạm hành chính từ 30 đến 50 triệu đồng.',
    legalBasis: 'Khoản 2 Điều 47 & Khoản 2 Điều 75 Luật Doanh nghiệp 2020',
    contextTrigger: `Vốn điều lệ đăng ký: ${(profile.charterCapital || 0).toLocaleString('vi-VN')} VNĐ.`,
    ruleCode: 'RULE-CORP-CAPITAL-90D',
  });

  // --- KỲ 11: ĐỢT 30 NGÀY (EVENT_30D_CAPITAL) ---
  tasks.push({
    id: `task-ev30cap-${taskCounter}`,
    code: `TASK-CYCLE-E30C-${taskCounter++}`,
    title: 'Thủ tục đăng ký điều chỉnh giảm vốn điều lệ trong thời hạn 30 ngày (nếu sau 90 ngày chưa góp đủ)',
    checklistId: cklId,
    category: 'Đợt 30 Ngày (Giảm Vốn)',
    periodCycle: 'EVENT_30D_CAPITAL',
    periodLabel: STATUTORY_PERIOD_METAS.EVENT_30D_CAPITAL.label,
    priority: 'medium',
    departmentId: 'dept-operations',
    departmentName: 'Phòng Pháp chế / Kế toán',
    assigneeRole: 'owner',
    waitingOnRole: 'service_accountant',
    dueDate: formatISODate(calculateLegalDueDate('EVENT_30D_CAPITAL', now)),
    status: 'need_info',
    description: 'Trường hợp có thành viên chưa góp đủ vốn điều lệ đã cam kết trong vòng 90 ngày, doanh nghiệp có 30 ngày tiếp theo để thực hiện thủ tục đăng ký điều chỉnh giảm vốn điều lệ xuống bằng số vốn thực tế đã góp.',
    legalBasis: 'Khoản 3 Điều 47 & Khoản 3 Điều 75 Luật Doanh nghiệp 2020',
    contextTrigger: 'Dự phòng rủi ro cơ cấu vốn điều lệ doanh nghiệp.',
    ruleCode: 'RULE-CORP-CAPITAL-REDUCE-30D',
  });

  // --- TÁC VỤ ĐẶC THÙ NGÀNH: F&B ---
  if (profile.industryTags.includes('TAG_FNB')) {
    tasks.push(
      {
        id: `task-fnb-pos`,
        code: `TASK-FNB-POS-01`,
        title: 'Cài đặt & đối soát Hóa đơn điện tử máy tính tiền cho Nhà hàng / Quán cafe',
        checklistId: cklId,
        category: 'Hóa Đơn & Vận Hành F&B',
        periodCycle: 'MONTHLY',
        periodLabel: 'Nghiệp vụ F&B',
        priority: 'urgent',
        departmentId: 'dept-operations',
        departmentName: 'Phòng Vận hành & Kế toán',
        assigneeRole: 'owner',
        waitingOnRole: 'internal_accountant',
        dueDate: formatISODate(calculateLegalDueDate('EVENT_10D', now)),
        status: 'in_progress',
        description: 'Đăng ký sử dụng hóa đơn điện tử khởi tạo từ máy tính tiền kết nối dữ liệu trực tiếp với cơ quan thuế qua phần mềm bán hàng (POS). Đối soát doanh thu bill thực tế và VietQR tránh chênh lệch.',
        legalBasis: 'Điều 90 Luật QLT 38/2019/QH14 & Thông tư 78/2021/TT-BTC',
        contextTrigger: 'Kích hoạt từ thẻ hoạt động: Dịch vụ ăn uống / F&B.',
        ruleCode: 'RULE-FNB-POS-INVOICE',
      },
      {
        id: `task-fnb-raw`,
        code: `TASK-FNB-RAW-02`,
        title: 'Lập Bảng kê thu mua nông sản thực phẩm tươi sống Mẫu 01/TNDN hợp lệ',
        checklistId: cklId,
        category: 'Hóa Đơn & Vận Hành F&B',
        periodCycle: 'QUARTERLY',
        periodLabel: 'Nghiệp vụ F&B',
        priority: 'high',
        departmentId: 'dept-accounting',
        departmentName: 'Phòng Kế toán F&B',
        assigneeRole: 'internal_accountant',
        waitingOnRole: 'owner',
        dueDate: formatISODate(calculateLegalDueDate('QUARTERLY', now)),
        status: 'in_progress',
        description: 'Tập hợp toàn bộ chứng từ thu mua thịt, cá, rau củ quả từ người nông dân không có hóa đơn vào Bảng kê Mẫu số 01/TNDN kèm phiếu chi tiền để làm căn cứ tính chi phí hợp lý được trừ khi tính thuế TNDN.',
        legalBasis: 'Điều 4 Thông tư 96/2015/TT-BTC',
        contextTrigger: 'Nguyên liệu thực phẩm đầu vào phục vụ chế biến F&B.',
        ruleCode: 'RULE-FNB-RAW-INGREDIENTS',
      }
    );
  }

  // --- TÁC VỤ ĐẶC THÙ NGÀNH: BÁN LẺ & TMĐT ---
  if (profile.industryTags.includes('TAG_ECOMMERCE')) {
    tasks.push(
      {
        id: `task-ecom-reconcile`,
        code: `TASK-ECOM-PLATFORM-01`,
        title: 'Đối soát số liệu doanh thu sàn TMĐT (Shopee, TikTok Shop) với tờ khai thuế',
        checklistId: cklId,
        category: 'Hóa Đơn & Dòng Tiền TMĐT',
        periodCycle: 'QUARTERLY',
        periodLabel: 'Nghiệp vụ TMĐT',
        priority: 'urgent',
        departmentId: 'dept-accounting',
        departmentName: 'Phòng Kế toán TMĐT',
        assigneeRole: 'internal_accountant',
        waitingOnRole: 'owner',
        dueDate: formatISODate(calculateLegalDueDate('QUARTERLY', now)),
        status: 'in_progress',
        description: 'Tải báo cáo tài chính sao kê định kỳ từ Shopee/TikTok Shop, đối chiếu tổng doanh thu trước phí sàn với tổng doanh thu đã kê khai nộp thuế để loại trừ nguy cơ bị cơ quan thuế truy thu do lệch số liệu dữ liệu sàn truyền về.',
        legalBasis: 'Khoản 7 Điều 1 Nghị định 91/2022/NĐ-CP & Thông tư 40/2021/TT-BTC',
        contextTrigger: 'Kích hoạt từ thẻ hoạt động: Bán lẻ & Sàn TMĐT.',
        ruleCode: 'RULE-ECOM-REVENUE-SYNC',
      },
      {
        id: `task-ecom-cod`,
        code: `TASK-ECOM-COD-02`,
        title: 'Lập sổ đối soát dòng tiền thu hộ COD từ đơn vị vận chuyển (GHTK, GHN, Viettel Post)',
        checklistId: cklId,
        category: 'Hóa Đơn & Dòng Tiền TMĐT',
        periodCycle: 'MONTHLY',
        periodLabel: 'Nghiệp vụ TMĐT',
        priority: 'high',
        departmentId: 'dept-accounting',
        departmentName: 'Phòng Kế toán TMĐT',
        assigneeRole: 'internal_accountant',
        waitingOnRole: 'owner',
        dueDate: formatISODate(calculateLegalDueDate('MONTHLY', now)),
        status: 'in_progress',
        description: 'Hạch toán toàn bộ dòng tiền thu hộ COD do các công ty giao vận chuyển khoản về tài khoản công ty, đối chiếu phiếu gửi đơn hàng và hóa đơn bán lẻ tương ứng.',
        legalBasis: 'Luật Quản lý thuế số 38/2019/QH14',
        contextTrigger: 'Dòng tiền bán hàng COD qua kênh trực tuyến.',
        ruleCode: 'RULE-ECOM-COD-RECONCILE',
      }
    );
  }

  return { checklists, tasks, contextFacts };
}
