import type { ExpenseRow, RevenueRow } from './excelTaxTemplate';
import type { TaxIncentiveInfo } from './taxIncentiveZones';

export interface DisallowedExpenseFinding {
  id: string;
  date: string;
  category: string;
  amount: number;
  paymentMethod: string;
  hasInvoice: string;
  violationType: 'NO_INVOICE' | 'CASH_OVER_20M' | 'LLC1_OWNER_SALARY' | 'FCT_ADS_WARNING';
  reason: string;
  legalBasis: string;
  taxImpact: number; // Số tiền thuế TNDN bị đội lên do khoản này (amount * 20%)
  recommendation: string;
}

export interface CitCalculationResult {
  totalRevenue: number;
  totalAccountingExpense: number;
  totalDisallowedExpense: number;   // Chỉ tiêu B4 trên Tờ khai 03/TNDN
  totalDeductibleExpense: number;   // Chi phí được trừ thực tế
  assessableIncome: number;         // Thu nhập tính thuế
  incentiveInfo: TaxIncentiveInfo;  // Vùng ưu đãi
  taxRate: number;                  // Thuế suất áp dụng (0.10, 0.17 hoặc 0.20)
  estimatedTaxAmount: number;       // Thuế TNDN cả năm dự kiến
  statutoryPrepayment80: number;    // Nghĩa vụ tạm nộp 4 quý tối thiểu 80% (NĐ 91/2022)
  accountingProfitBeforeTax: number;// Lợi nhuận kế toán trước thuế (Doanh thu - Chi phí)
  netProfitAfterTax: number;        // Lợi nhuận ròng sau thuế (Doanh thu - Chi phí - Thuế TNDN)
  disallowedItems: DisallowedExpenseFinding[];
  warningAdsItems: DisallowedExpenseFinding[];
  isExemptedIncentive: boolean;
}

/**
 * 🧮 RULE ENGINE BÓC TÁCH CHI PHÍ HỢP LỆ VÀ TÍNH TOÁN THUẾ TNDN
 */
export function calculateCitTax(
  revenues: RevenueRow[],
  expenses: ExpenseRow[],
  incentiveInfo: TaxIncentiveInfo,
  companyTypeTag: string = 'TAG_TNHH_1TV'
): CitCalculationResult {
  const isTnhh1Tv = companyTypeTag === 'TAG_TNHH_1TV';
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const totalAccountingExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const disallowedItems: DisallowedExpenseFinding[] = [];
  const warningAdsItems: DisallowedExpenseFinding[] = [];

  expenses.forEach((item, index) => {
    const catLower = item.category.toLowerCase();
    const payLower = item.paymentMethod.toLowerCase();
    const invLower = item.hasInvoice.toLowerCase();
    const isCash = payLower.includes('tiền mặt') || payLower.includes('cash');
    const hasNoInv = invLower.includes('không') || invLower.includes('no') || invLower.includes('chưa');

    // 1. RÀ SOÁT: Chi phí không có hóa đơn chứng từ hợp pháp
    if (hasNoInv && !catLower.includes('lương')) {
      disallowedItems.push({
        id: `disallow_no_inv_${index}`,
        date: item.date,
        category: item.category,
        amount: item.amount,
        paymentMethod: item.paymentMethod,
        hasInvoice: item.hasInvoice,
        violationType: 'NO_INVOICE',
        reason: 'Chi phí mua hàng hóa, dịch vụ không có hóa đơn GTGT / hóa đơn bán hàng hợp pháp.',
        legalBasis: 'Điểm 2.1 Khoản 2 Điều 6 Thông tư 78/2014/TT-BTC (sửa đổi bởi Điều 4 Thông tư 96/2015/TT-BTC).',
        taxImpact: Math.round(item.amount * incentiveInfo.taxRate),
        recommendation: 'Yêu cầu nhà cung cấp xuất bổ sung hóa đơn điện tử hoặc loại bỏ khoản này khỏi chi phí hợp lý trên tờ khai 03/TNDN (Mục B4).'
      });
      return;
    }

    // 2. RÀ SOÁT: Hóa đơn từ 20 triệu trở lên thanh toán tiền mặt
    if (item.amount >= 20000000 && isCash) {
      disallowedItems.push({
        id: `disallow_cash_20m_${index}`,
        date: item.date,
        category: item.category,
        amount: item.amount,
        paymentMethod: item.paymentMethod,
        hasInvoice: item.hasInvoice,
        violationType: 'CASH_OVER_20M',
        reason: 'Hóa đơn từng lần từ 20 triệu đồng trở lên (đã có VAT) thanh toán bằng tiền mặt, không có chứng từ thanh toán không dùng tiền mặt qua ngân hàng.',
        legalBasis: 'Điểm 2.2 Khoản 2 Điều 6 Thông tư 78/2014/TT-BTC & Điều 15 Thông tư 219/2013/TT-BTC.',
        taxImpact: Math.round(item.amount * incentiveInfo.taxRate),
        recommendation: 'Bắt buộc chuyển khoản qua tài khoản ngân hàng của doanh nghiệp (hoặc lập biên bản thỏa thuận bù trừ công nợ hợp pháp) để được khấu trừ thuế và tính chi phí hợp lý.'
      });
      return;
    }

    // 3. RÀ SOÁT: Đặc thù Lương chủ sở hữu Công ty TNHH 1 Thành viên
    if (isTnhh1Tv && (
      catLower.includes('lương chủ') ||
      catLower.includes('lương giám đốc') ||
      catLower.includes('lương chủ tịch') ||
      catLower.includes('thù lao chủ') ||
      catLower.includes('lương tổng giám đốc')
    )) {
      disallowedItems.push({
        id: `disallow_llc1_salary_${index}`,
        date: item.date,
        category: item.category,
        amount: item.amount,
        paymentMethod: item.paymentMethod,
        hasInvoice: item.hasInvoice,
        violationType: 'LLC1_OWNER_SALARY',
        reason: 'Tiền lương, tiền công của chủ công ty TNHH một thành viên do một cá nhân làm chủ (dù có trực tiếp tham gia điều hành hay không) không được tính vào chi phí được trừ khi tính thuế TNDN.',
        legalBasis: 'Điểm 2.6 Khoản 2 Điều 6 Thông tư 78/2014/TT-BTC (sửa đổi bởi Điều 4 Thông tư 96/2015/TT-BTC).',
        taxImpact: Math.round(item.amount * incentiveInfo.taxRate),
        recommendation: 'Khoản chi này phải tự động kết chuyển loại trừ trên Tờ khai Quyết toán 03/TNDN (Chỉ tiêu B4). Lưu ý: Khoản thù lao này chủ sở hữu được miễn nộp thuế TNCN theo CV 727/TCT-TNCN.'
      });
      return;
    }

    // 4. CẢNH BÁO: Chi phí quảng cáo nước ngoài (Facebook, Google, TikTok)
    if (catLower.includes('facebook') || catLower.includes('google') || catLower.includes('tiktok') || catLower.includes('meta')) {
      warningAdsItems.push({
        id: `warn_ads_${index}`,
        date: item.date,
        category: item.category,
        amount: item.amount,
        paymentMethod: item.paymentMethod,
        hasInvoice: item.hasInvoice,
        violationType: 'FCT_ADS_WARNING',
        reason: 'Chi phí quảng cáo trực tuyến xuyên biên giới chi trả trực tiếp cho nhà thầu nước ngoài.',
        legalBasis: 'Thông tư 103/2014/TT-BTC & Thông tư 80/2021/TT-BTC về Thuế nhà thầu nước ngoài (FCT).',
        taxImpact: Math.round(item.amount * incentiveInfo.taxRate),
        recommendation: 'Để được cơ quan thuế chấp thuận là chi phí hợp lý khi thanh tra, doanh nghiệp phải có chứng từ khấu trừ & nộp thay thuế nhà thầu FCT hoặc mua dịch vụ qua đại lý có pháp nhân tại VN.'
      });
    }
  });

  const totalDisallowedExpense = disallowedItems.reduce((sum, item) => sum + item.amount, 0);
  const totalDeductibleExpense = Math.max(0, totalAccountingExpense - totalDisallowedExpense);
  const assessableIncome = Math.max(0, totalRevenue - totalDeductibleExpense);
  const estimatedTaxAmount = Math.round(assessableIncome * incentiveInfo.taxRate);
  const statutoryPrepayment80 = Math.round(estimatedTaxAmount * 0.8);
  const accountingProfitBeforeTax = totalRevenue - totalAccountingExpense;
  const netProfitAfterTax = accountingProfitBeforeTax - estimatedTaxAmount;

  return {
    totalRevenue,
    totalAccountingExpense,
    totalDisallowedExpense,
    totalDeductibleExpense,
    assessableIncome,
    incentiveInfo,
    taxRate: incentiveInfo.taxRate,
    estimatedTaxAmount,
    statutoryPrepayment80,
    accountingProfitBeforeTax,
    netProfitAfterTax,
    disallowedItems,
    warningAdsItems,
    isExemptedIncentive: incentiveInfo.tier !== 'ZONE_STANDARD'
  };
}
