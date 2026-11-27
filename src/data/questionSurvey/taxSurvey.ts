import type { BaseProfile, DynamicSituationQuestion } from '../../interfaces';

/**
 * 🏛️ PHÂN HỆ KHẢO SÁT CHUYÊN BIỆT: TUÂN THỦ THUẾ THU NHẬP DOANH NGHIỆP (TNDN)
 * 
 * Toàn bộ câu hỏi tình huống tập trung 100% vào nghĩa vụ Thuế TNDN, điều kiện chi phí được trừ (Mục B4)
 * và chứng từ thanh toán hợp pháp theo thông tin pháp nhân (BaseProfile).
 */
export function getTaxSurveyQuestions(profile: BaseProfile): DynamicSituationQuestion[] {
  const questions: DynamicSituationQuestion[] = [];
  const corpTypeLabel = profile.companyTypeTag === 'TAG_TNHH_1TV' ? 'TNHH 1TV' : 'TNHH 2TV+';
  const actualEmpCount = profile.employeeCount || (profile.employeeScale === 'under_10' ? 8 : profile.employeeScale === '10_to_50' ? 25 : 60);

  // ----------------------------------------------------
  // 1. TẠM NỘP THUẾ TNDN 4 QUÝ ĐẠT TỐI THIỂU 80%
  // ----------------------------------------------------
  questions.push({
    id: 'q_tax_corp_2',
    moduleId: 'MODULE_TAX_CORE',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: `Loại hình: ${corpTypeLabel}`,
    title: 'Doanh nghiệp có thực hiện tạm nộp thuế Thu nhập doanh nghiệp (TNDN) 4 quý đạt tối thiểu 80% số thuế TNDN phải nộp cả năm không?',
    legalBasis: 'Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP sửa đổi Nghị định 126/2020/NĐ-CP. Tổng số thuế TNDN đã tạm nộp của 04 quý không được thấp hơn 80% số thuế TNDN phải nộp theo quyết toán năm. Hạn tạm nộp quý 4 là ngày cuối tháng 01 năm sau.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/nghi-dinh-912022nd-cp-cua-chinh-phu-ve-viec-sua-doi-bo-sung-mot-so-dieu-cua-nghi-dinh-1262020nd-cp-ngay-19102020-cua-chinh-phu-quy-dinh-chi-tiet-mot-so-dieu-cua-luat-quan-ly-thue-1098434.html',
    options: [
      'Đã tạm nộp thuế TNDN các quý đầy đủ, dự kiến đạt từ 80% trở lên so với quyết toán năm',
      'Năm nay doanh nghiệp đang lỗ hoặc thuộc diện miễn thuế TNDN nên chưa phát sinh số phải nộp',
      'Có lãi nhưng chưa tạm nộp đủ 80% thuế TNDN (nguy cơ bị tính tiền chậm nộp 0,03%/ngày)',
      'Chưa ước tính được số thuế TNDN cả năm và chưa thực hiện tạm nộp'
    ],
    severity: 'urgent',
  });

  // ----------------------------------------------------
  // 2. QUYẾT TOÁN THUẾ TNDN NĂM (MẪU 03/TNDN) & BÓC TÁCH MỤC B4
  // ----------------------------------------------------
  questions.push({
    id: 'q_tax_cit_finalization',
    moduleId: 'MODULE_TAX_CORE',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: `Quyết toán 03/TNDN: ${corpTypeLabel}`,
    title: 'Doanh nghiệp đã lập kế hoạch đối chiếu sổ kế toán, bóc tách chi phí không được trừ tại chỉ tiêu B4 và nộp Tờ khai quyết toán 03/TNDN trước ngày 31/03 chưa?',
    legalBasis: 'Điểm a Khoản 2 Điều 44 Luật Quản lý thuế số 38/2019/QH14 & Điều 4 Thông tư 96/2015/TT-BTC. Các khoản chi không đủ hóa đơn, chứng từ phải tự giác loại trừ tại chỉ tiêu B4 trên tờ khai 03/TNDN để tránh phạt 20% khai sai.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/luat-quan-ly-thue-2019-54279.html',
    options: [
      'Đã rà soát bóc tách đầy đủ chi phí loại trừ Mục B4 và nộp quyết toán 03/TNDN đúng hạn',
      'Doanh nghiệp mới thành lập năm nay, chưa đến kỳ quyết toán thuế TNDN năm đầu tiên',
      'Chưa phân loại được khoản chi nào được trừ và không được trừ tại Mục B4',
      'Đang chậm nộp hồ sơ quyết toán thuế TNDN năm trước'
    ],
    severity: 'urgent',
  });

  // ----------------------------------------------------
  // 3. ĐIỀU KIỆN THANH TOÁN KHÔNG DÙNG TIỀN MẶT TỪ 5 TRIỆU ĐỒNG (CHI PHÍ TNDN)
  // ----------------------------------------------------
  questions.push({
    id: 'q_tax_corp_3',
    moduleId: 'MODULE_INVOICE_CASHFLOW',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: `Loại hình: ${corpTypeLabel}`,
    title: 'Mọi giao dịch mua hàng hóa, dịch vụ từ 5 triệu đồng trở lên (đã có VAT) có được thanh toán không dùng tiền mặt qua tài khoản ngân hàng công ty không?',
    legalBasis: 'Luật Thuế TNDN số 67/2025/QH15 & Điều 4 Thông tư 96/2015/TT-BTC. Các khoản chi mua hàng hóa, dịch vụ từng lần từ 5 triệu đồng trở lên thanh toán bằng tiền mặt sẽ bị loại khỏi chi phí được trừ (Mục B4) khi tính thuế TNDN.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
    options: [
      '100% hóa đơn từ 5 triệu đồng trở lên đều chuyển khoản qua tài khoản ngân hàng công ty',
      'Chưa phát sinh chi phí mua vào nào từ 5 triệu đồng trở lên',
      'Có một số hóa đơn từ 5 triệu trở lên thanh toán bằng tiền mặt hoặc tài khoản cá nhân (nguy cơ loại B4)',
      'Chưa nắm rõ ngưỡng thanh toán không dùng tiền mặt mới khi tính chi phí được trừ TNDN'
    ],
    severity: 'urgent',
  });

  // ----------------------------------------------------
  // 4. HỒ SƠ CHI PHÍ TIỀN LƯƠNG & LƯƠNG CHỦ CÔNG TY TNHH 1TV (MỤC B4)
  // ----------------------------------------------------
  questions.push({
    id: 'q_tax_tncn_withholding',
    moduleId: 'MODULE_TAX_CORE',
    branchType: 'labor_scale',
    branchCode: 'SCALE_LABOR',
    branchLabel: `Chi phí nhân sự (${actualEmpCount} người)`,
    title: profile.companyTypeTag === 'TAG_TNHH_1TV'
      ? 'Doanh nghiệp đã loại trừ tiền lương, thù lao của Chủ sở hữu Công ty TNHH 1TV khỏi chi phí được trừ (Mục B4) và chuẩn bị đủ bảng lương, chứng từ khấu trừ cho nhân viên chưa?'
      : 'Doanh nghiệp đã lưu đủ hợp đồng, bảng chấm công, chứng từ chi trả lương và khấu trừ 10% thù lao thời vụ/vãng lai từ 2 triệu đồng để bảo vệ chi phí lương được trừ TNDN chưa?',
    legalBasis: 'Khoản 2.6 Điều 4 Thông tư 96/2015/TT-BTC & Điểm i Khoản 1 Điều 25 Thông tư 111/2013/TT-BTC. Tiền lương chủ Công ty TNHH 1TV do một cá nhân làm chủ không được trừ khi tính thuế TNDN; chi phí nhân công thiếu chứng từ hợp lệ sẽ bị xuất toán.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/linh-vuc-khac-van-ban/thong-tu-962015tt-btc-huong-dan-ve-thue-thu-nhap-doanh-nghiep-tai-nghi-dinh-122015nd-cp-quy-dinh-chi-tiet-thi-hanh-luat-sua-doi-bo-sung-mot-so-dieu-cua-cac-luat-ve-thue-va-sua-doi-bo-sung-mot-so-dieu-cua-thong-tu-782014tt-btc-thong-tu-1192014tt-btc-thong-tu-1512014tt-btc-do-bo-truong-bo-tai-chinh-ban-hanh-285496.html',
    options: [
      'Đã tách riêng chi phí không được trừ Mục B4 và lưu đầy đủ hồ sơ chi lương, khấu trừ hợp lệ',
      'Chưa phát sinh chi phí tiền lương, thù lao nhân sự trong kỳ',
      'Đang hạch toán chung lương chủ TNHH 1TV hoặc chi trả thời vụ tiền mặt thiếu chứng từ (nguy cơ xuất toán)',
      'Chưa rõ quy định về hồ sơ bảo vệ chi phí tiền lương khi quyết toán thuế TNDN'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // 5. TÀI KHOẢN NGÂN HÀNG PHÁP NHÂN PHỤC VỤ CHI PHÍ ĐƯỢC TRỪ
  // ----------------------------------------------------
  questions.push({
    id: 'q_tax_bank_account',
    moduleId: 'MODULE_INVOICE_CASHFLOW',
    branchType: 'company_type',
    branchCode: profile.companyTypeTag,
    branchLabel: `Loại hình: ${corpTypeLabel}`,
    title: 'Toàn bộ tài khoản ngân hàng dùng để nhận doanh thu và thanh toán chi phí được trừ đã đứng tên pháp nhân công ty và thông báo với cơ quan thuế chưa?',
    legalBasis: 'Khoản 2 Điều 36 Luật Quản lý thuế số 38/2019/QH14 & Điều 4 Thông tư 96/2015/TT-BTC. Thanh toán từ tài khoản cá nhân chưa được ủy quyền hợp lệ dễ dẫn đến rủi ro bị loại chi phí khi thanh tra thuế TNDN.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/luat-quan-ly-thue-2019-54279.html',
    options: [
      'Đã mở và đăng ký đầy đủ tài khoản ngân hàng pháp nhân công ty với cơ quan thuế',
      'Chưa mở tài khoản ngân hàng công ty',
      'Có tài khoản ngân hàng công ty nhưng chưa cập nhật thông tin với cơ quan thuế',
      'Đang dùng tài khoản cá nhân để nhận doanh thu và chi trả chi phí kinh doanh'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // 6. THUẾ NHÀ THẦU FCT ĐỂ HỢP THỨC HÓA CHI PHÍ QUẢNG CÁO QUỐC TẾ (TNDN)
  // ----------------------------------------------------
  questions.push({
    id: 'q_tax_corp_fct_ads',
    moduleId: 'MODULE_TAX_CORE',
    branchType: 'company_type',
    branchCode: 'FCT_ADS',
    branchLabel: 'Chi phí Ads & Phần mềm quốc tế',
    title: 'Khi tính chi phí quảng cáo Facebook, Google, TikTok hoặc phần mềm quốc tế vào chi phí được trừ TNDN, doanh nghiệp đã có hóa đơn VAT hoặc tờ khai nộp thuế nhà thầu (FCT) hợp lệ chưa?',
    legalBasis: 'Khoản 3 Điều 44 Luật Quản lý thuế số 38/2019/QH14, Thông tư 103/2014/TT-BTC & Điều 4 Thông tư 96/2015/TT-BTC. Chi phí dịch vụ xuyên biên giới thiếu chứng từ thuế nhà thầu hoặc hóa đơn hợp pháp sẽ bị loại tại Mục B4.',
    verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-1032014tt-btc-huong-dan-thuc-hien-nghia-vu-thue-ap-dung-doi-voi-to-chuc-ca-nhan-nuoc-ngoai-kinh-doanh-tai-viet-nam-hoac-co-thu-nhap-tai-viet-nam-do-bo-truong-bo-tai-chinh-ban-hanh-243292.html',
    options: [
      'Đã có đủ hóa đơn VAT từ nhà cung cấp đã đăng ký thuế tại VN hoặc đã kê khai nộp FCT đầy đủ',
      'Không phát sinh chi phí quảng cáo online hay phần mềm quốc tế',
      'Có chi trả qua thẻ tín dụng cá nhân/công ty nhưng chưa có hóa đơn/chứng từ FCT hợp lệ (nguy cơ loại B4)',
      'Chưa rõ điều kiện đưa chi phí quảng cáo Facebook/Google/TikTok vào chi phí được trừ TNDN'
    ],
    severity: 'high',
  });

  // ----------------------------------------------------
  // 7. GHI NHẬN ĐẦY ĐỦ DOANH THU TÍNH THUẾ TNDN & HĐĐT BÁN LẺ / TMĐT
  // ----------------------------------------------------
  if (profile.industryTags && (profile.industryTags.includes('TAG_FNB') || profile.industryTags.includes('TAG_ECOMMERCE'))) {
    questions.push({
      id: 'q_tax_pos_invoice',
      moduleId: 'MODULE_INVOICE_CASHFLOW',
      branchType: 'industry',
      branchCode: 'INDUSTRY_POS',
      branchLabel: 'Đối soát doanh thu tính thuế TNDN',
      title: 'Doanh nghiệp đã xuất hóa đơn điện tử đầy đủ và đối soát khớp tổng doanh thu thực nhận (POS / sàn TMĐT / COD) với doanh thu tính thuế TNDN chưa?',
      legalBasis: 'Điều 8 Thông tư 78/2014/TT-BTC, Điều 90 Luật Quản lý thuế số 38/2019/QH14 & Nghị định 123/2020/NĐ-CP. Chênh lệch doanh thu giữa dữ liệu sàn TMĐT/POS truyền về cơ quan thuế và sổ TNDN dẫn đến truy thu thuế và phạt trốn thuế.',
      verificationUrl: 'https://dulieuphapluat.vn/van-ban/thue-phi-le-phi-van-ban/thong-tu-782021tt-btc-huong-dan-thuc-hien-luat-quan-ly-thue-nghi-dinh-1232020nd-cp-quy-dinh-ve-hoa-don-chung-tu-do-bo-truong-bo-tai-chinh-ban-hanh-1550.html',
      options: [
        'Đã xuất HĐĐT đầy đủ và đối soát khớp 100% doanh thu bán hàng với sổ tính thuế TNDN',
        'Chỉ xuất hóa đơn cho khách lấy hóa đơn, chưa xuất hóa đơn lẻ cuối ngày cho khách không lấy',
        'Có bán trên sàn TMĐT / thu COD nhưng chưa đối soát khớp doanh thu tính thuế TNDN',
        'Chưa thiết lập quy trình đối soát doanh thu bán lẻ với tờ khai thuế TNDN'
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
  description: 'Rà soát chuyên sâu các tình huống cốt lõi về Thuế TNDN: tạm nộp 80%, quyết toán 03/TNDN và điều kiện chi phí được trừ Mục B4.',
  estimatedMinutes: 2,
  getQuestions: getTaxSurveyQuestions,
};
