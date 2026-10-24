import type { BaseProfile, DynamicSituationQuestion } from '../../interfaces';

/**
 * 🏛️ PHÂN HỆ KHẢO SÁT CHUYÊN BIỆT: THUẾ DOANH NGHIỆP & HÓA ĐƠN DÒNG TIỀN
 * 
 * Toàn bộ câu hỏi tình huống tập trung 100% vào các nghĩa vụ thuế trọng yếu
 * của doanh nghiệp Việt Nam, tính toán linh hoạt dựa theo thông tin pháp nhân (BaseProfile).
 */
export function getTaxSurveyQuestions(profile: BaseProfile): DynamicSituationQuestion[] {
  const questions: DynamicSituationQuestion[] = [];
  const corpTypeLabel = profile.companyTypeTag === 'TAG_TNHH_1TV' ? 'TNHH 1TV' : 'TNHH 2TV+';
  const isQuarterly = profile.isNewlyEstablished || (profile.annualRevenue || 0) <= 50000000000;
  const cycleDesc = isQuarterly
    ? 'theo Quý (hạn ngày cuối tháng đầu quý sau: 30/04, 31/07, 31/10, 31/01)'
    : 'theo Tháng (hạn ngày 20 của tháng tiếp theo do doanh thu > 50 tỷ)';
  const actualEmpCount = profile.employeeCount || (profile.employeeScale === 'under_10' ? 8 : profile.employeeScale === '10_to_50' ? 25 : 60);
  const charterCapital = profile.charterCapital || 0;
  const monBaiTier = charterCapital > 10000000000 ? 'Bậc 1 (Vốn > 10 tỷ: 3.000.000đ/năm)' : 'Bậc 2 (Vốn ≤ 10 tỷ: 2.000.000đ/năm)';

  // ----------------------------------------------------
  // 1. KỲ KÊ KHAI THUẾ GTGT & THUẾ TNCN ĐỊNH KỲ
  // ----------------------------------------------------
  questions.push({
    id: 'q_tax_corp_1',
    moduleId: 'MODULE_TAX_CORE',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: `Loại hình: ${corpTypeLabel}`,
    title: `Doanh nghiệp có thực hiện nộp tờ khai thuế GTGT và thuế TNCN định kỳ ${cycleDesc} đúng hạn không?`,
    legalBasis: 'Điều 8, Điều 9 Nghị định 126/2020/NĐ-CP và Luật Quản lý thuế số 38/2019/QH14. Doanh thu năm trước liền kề ≤ 50 tỷ kê khai theo Quý, trên 50 tỷ bắt buộc kê khai theo Tháng.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-1262020nd-cp-ve-huong-dan-luat-quan-ly-thue-24636.html',
    options: [
      `Đã nộp đầy đủ toàn bộ tờ khai thuế GTGT & TNCN ${isQuarterly ? 'theo Quý' : 'theo Tháng'} đúng thời hạn`,
      'Doanh nghiệp mới thành lập trong năm, chưa đến kỳ kê khai đầu tiên',
      'Đang có tờ khai thuế bị chậm nộp so với thời hạn quy định (nguy cơ phạt chậm nộp)',
      'Chưa rõ doanh nghiệp thuộc diện kê khai theo Tháng hay theo Quý'
    ],
    severity: 'urgent',
  });

  // ----------------------------------------------------
  // 2. TẠM NỘP THUẾ TNDN 4 QUÝ ĐẠT TỐI THIỂU 80%
  // ----------------------------------------------------
  questions.push({
    id: 'q_tax_corp_2',
    moduleId: 'MODULE_TAX_CORE',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: `Loại hình: ${corpTypeLabel}`,
    title: 'Doanh nghiệp có thực hiện tạm nộp thuế Thu nhập doanh nghiệp (TNDN) 4 quý đạt tối thiểu 80% số thuế TNDN phải nộp cả năm không?',
    legalBasis: 'Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP sửa đổi Nghị định 126/2020/NĐ-CP. Tổng số thuế TNDN đã tạm nộp của 04 quý không được thấp hơn 80% số thuế TNDN phải nộp theo quyết toán năm. Hạn tạm nộp quý 4 là ngày 30/01 năm sau.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-912022nd-cp-cua-chinh-phu-ve-viec-sua-doi-bo-sung-mot-so-dieu-cua-nghi-dinh-1262020nd-cp-ngay-19102020-cua-chinh-phu-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-quan-ly-thue-1098434.html',
    options: [
      'Đã tạm nộp thuế TNDN các quý đầy đủ, dự kiến đạt trên 80% quyết toán năm',
      'Năm nay doanh nghiệp đang lỗ hoặc chưa có lãi tính thuế, không phát sinh thuế TNDN',
      'Có lãi nhưng chưa tạm nộp đủ 80% thuế TNDN (nguy cơ bị tính tiền chậm nộp 0,03%/ngày)',
      'Chưa ước tính được số thuế TNDN cả năm và chưa thực hiện tạm nộp'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // 3. LỆ PHÍ MÔN BÀI HÀNG NĂM TRƯỚC 30/01
  // ----------------------------------------------------
  questions.push({
    id: 'q_tax_monbai',
    moduleId: 'MODULE_TAX_CORE',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: `Lệ phí môn bài: ${monBaiTier}`,
    title: 'Doanh nghiệp có thực hiện kê khai và nộp Lệ phí môn bài hàng năm chậm nhất ngày 30/01 không?',
    legalBasis: 'Điều 4, Điều 5 Nghị định 139/2016/NĐ-CP và Thông tư 65/2020/TT-BTC. Doanh nghiệp thành lập mới được miễn lệ phí môn bài năm đầu tiên. Các năm tiếp theo hạn nộp là ngày 30/01 hàng năm.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-1392016nd-cp-quy-dinh-ve-le-phi-mon-bai-do-chinh-phu-ban-hanh-100412.html',
    options: [
      'Đã nộp lệ phí môn bài đầy đủ trước ngày 30/01 hàng năm',
      'Doanh nghiệp mới thành lập năm nay, đang được miễn lệ phí môn bài theo Nghị định 22/2020/NĐ-CP',
      'Chưa nộp lệ phí môn bài năm nay (nguy cơ bị phong tỏa tài khoản và phạt hành chính)',
      'Chưa rõ mức lệ phí môn bài doanh nghiệp mình phải nộp theo vốn điều lệ'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // 4. KHẤU TRỪ 10% THUẾ TNCN CÁ NHÂN VÃNG LAI
  // ----------------------------------------------------
  questions.push({
    id: 'q_tax_tncn_withholding',
    moduleId: 'MODULE_TAX_CORE',
    branchType: 'labor_scale',
    branchCode: 'SCALE_LABOR',
    branchLabel: `Nhân sự: ${actualEmpCount} lao động`,
    title: 'Doanh nghiệp có thực hiện khấu trừ 10% thuế TNCN tại nguồn khi chi trả thu nhập từ 2.000.000 VNĐ/lần trở lên cho lao động thời vụ / thử việc / không ký HĐLĐ không?',
    legalBasis: 'Điểm i Khoản 1 Điều 25 Thông tư 111/2013/TT-BTC. Doanh nghiệp chi trả thù lao từ 2.000.000 VNĐ trở lên cho cá nhân không ký HĐLĐ hoặc ký HĐLĐ dưới 03 tháng phải khấu trừ thuế TNCN 10% trước khi trả, trừ trường hợp làm cam kết Mẫu 08/CK-TNCN đủ điều kiện.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-1112013tt-btc-huong-dan-luat-thue-thu-nhap-ca-nhan-va-nghi-dinh-652013nd-cp-do-bo-truong-bo-tai-chinh-ban-hanh-323238.html',
    options: [
      'Đã khấu trừ 10% hoặc thu thập Bản cam kết Mẫu 08/CK-TNCN hợp lệ đối với 100% trường hợp',
      'Chỉ ký HĐLĐ dài hạn từ 3 tháng trở lên với toàn bộ nhân viên, không có lao động thời vụ',
      'Có chi trả trên 2 triệu cho cộng tác viên/thời vụ bằng tiền mặt nhưng chưa khấu trừ 10%',
      'Chưa nắm rõ quy định khấu trừ thuế TNCN 10% và điều kiện làm cam kết'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // 5. THANH TOÁN KHÔNG DÙNG TIỀN MẶT TỪ 20 TRIỆU ĐỒNG
  // ----------------------------------------------------
  questions.push({
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
      'Có một số hóa đơn trên 20 triệu thanh toán bằng tiền mặt hoặc tài khoản cá nhân (nguy cơ bị xuất toán)',
      'Chưa rõ quy định điều kiện khấu trừ thuế GTGT và chi phí hợp lý'
    ],
    severity: 'urgent',
  });

  // ----------------------------------------------------
  // 6. THÔNG BÁO TÀI KHOẢN NGÂN HÀNG KINH DOANH VỚI THUẾ
  // ----------------------------------------------------
  questions.push({
    id: 'q_tax_bank_account',
    moduleId: 'MODULE_INVOICE_CASHFLOW',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: `Loại hình: ${corpTypeLabel}`,
    title: 'Toàn bộ các tài khoản ngân hàng công ty dùng để giao dịch nhận tiền và thanh toán kinh doanh đã được thông báo với cơ quan quản lý thuế chưa?',
    legalBasis: 'Khoản 2 Điều 36 Luật Quản lý thuế số 38/2019/QH14. Bắt buộc đăng ký thông tin tài khoản ngân hàng phục vụ hoạt động sản xuất kinh doanh với cơ quan thuế quản lý trực tiếp.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/luat-quan-ly-thue-2019-54279.html',
    options: [
      'Đã đăng ký đầy đủ toàn bộ tài khoản ngân hàng công ty với cơ quan quản lý thuế',
      'Chưa mở tài khoản ngân hàng công ty',
      'Có tài khoản ngân hàng đang giao dịch nhưng chưa làm thủ tục thông báo với thuế',
      'Chỉ dùng tài khoản cá nhân của chủ doanh nghiệp để nhận tiền và thanh toán'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // 7. THUẾ NHÀ THẦU FCT CHO CHI PHÍ QUẢNG CÁO ONLINE QUỐC TẾ
  // ----------------------------------------------------
  questions.push({
    id: 'q_tax_corp_fct_ads',
    moduleId: 'MODULE_TAX_CORE',
    branchType: 'company_type',
    branchCode: 'FCT_ADS',
    branchLabel: 'Chi phí Ads & Phần mềm quốc tế',
    title: 'Doanh nghiệp có thực hiện kê khai và nộp thuế nhà thầu (FCT) khi thanh toán chi phí quảng cáo trực tuyến trực tiếp cho Facebook, Google, TikTok không?',
    legalBasis: 'Khoản 3 Điều 44 Luật Quản lý thuế số 38/2019/QH14, Thông tư 103/2014/TT-BTC & Thông tư 80/2021/TT-BTC. Khi chi trả dịch vụ xuyên biên giới cho nhà thầu nước ngoài chưa nộp thuế tại Việt Nam, doanh nghiệp trong nước phải khấu trừ và nộp thay thuế nhà thầu trong vòng 10 ngày kể từ ngày phát sinh nghĩa vụ thanh toán.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-1032014tt-btc-huong-dan-thuc-hien-nghia-vu-thue-ap-dung-doi-voi-to-chuc-ca-nhan-nuoc-ngoai-kinh-doanh-tai-viet-nam-hoac-co-thu-nhap-tai-viet-nam-do-bo-truong-bo-tai-chinh-ban-hanh-243292.html',
    options: [
      'Đã kê khai đầy đủ thuế nhà thầu (hoặc mua qua Agency có hóa đơn VAT tại Việt Nam)',
      'Không phát sinh chi phí quảng cáo online quốc tế (Facebook, Google, TikTok)',
      'Có thanh toán tiền quảng cáo qua thẻ visa cá nhân/công ty nhưng chưa kê khai nộp thuế nhà thầu',
      'Chưa rõ quy định về nghĩa vụ thuế nhà thầu đối với dịch vụ trực tuyến xuyên biên giới'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // 8. HÓA ĐƠN ĐIỆN TỬ MÁY TÍNH TIỀN (POS) & DOANH THU ĐỐI SOÁT
  // ----------------------------------------------------
  if (profile.industryTags && (profile.industryTags.includes('TAG_FNB') || profile.industryTags.includes('TAG_ECOMMERCE'))) {
    questions.push({
      id: 'q_tax_pos_invoice',
      moduleId: 'MODULE_INVOICE_CASHFLOW',
      branchType: 'industry',
      branchCode: 'INDUSTRY_POS',
      branchLabel: 'Hóa đơn máy tính tiền POS / Bán lẻ',
      title: 'Cơ sở đã cài đặt và sử dụng Hóa đơn điện tử khởi tạo từ máy tính tiền kết nối dữ liệu trực tiếp với cơ quan thuế khi thanh toán cho khách hàng chưa?',
      legalBasis: 'Điều 90 Luật Quản lý thuế số 38/2019/QH14, Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC. Bắt buộc đối với các cơ sở ăn uống, bán lẻ hàng hóa, dịch vụ trực tiếp đến người tiêu dùng.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-782021tt-btc-huong-dan-thuc-hien-luat-quan-ly-thue-nghi-dinh-1232020nd-cp-quy-dinh-ve-hoa-don-chung-tu-do-bo-truong-bo-tai-chinh-ban-hanh-1550.html',
      options: [
        'Đã cài đặt giải pháp HĐĐT khởi tạo từ máy tính tiền kết nối tự động với Cục Thuế',
        'Chỉ xuất hóa đơn điện tử thông thường cuối ngày hoặc khi khách có yêu cầu',
        'Có phần mềm bán hàng POS nhưng chưa kết nối xuất HĐĐT từ máy tính tiền',
        'Cơ sở chưa có máy tính tiền POS, hiện chỉ nhận chuyển khoản hoặc tiền mặt'
      ],
      severity: 'urgent',
    });
  }

  return questions;
}

/**
 * Cấu hình Phân hệ Khảo sát: Thuế TNDN
 */
export const taxSurveyConfig = {
  groupKey: 'thue_ke_toan',
  groupTitle: 'Thuế TNDN',
  moduleTag: 'THUẾ TNDN',
  description: 'Rà soát 8 tình huống trọng yếu về Thuế GTGT, TNDN, Lệ phí môn bài, FCT, và điều kiện khấu trừ chi phí hợp lý.',
  estimatedMinutes: 2,
  getQuestions: getTaxSurveyQuestions,
};
