import type { ContextFact } from '../../../interfaces';
import type { RevenueRow, ExpenseRow } from '../../../utils/excelTaxTemplate';
import { getCalculatedQuarterDeadline } from '../../../utils/taxCalendar';

// Bảng rủi ro chế tài xử phạt thực tế theo các Nghị định hiện hành về Thuế TNDN & Chứng từ chi phí
export const STATUTORY_PENALTY_RISKS: Record<string, string> = {
  'RULE-TAX-TNDN-80':
    'Tính tiền chậm nộp 0,03%/ngày trên số thuế TNDN tạm nộp 4 quý còn thiếu so với ngưỡng 80% quyết toán theo Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP.',
  'RULE-TAX-TNDN-FINAL':
    'Phạt tiền từ 2.000.000đ - 25.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp chậm hồ sơ khai quyết toán thuế TNDN năm (Mẫu 03/TNDN).',
  'RULE-TAX-TNDN-B4':
    'Truy thu thuế TNDN, phạt 20% trên số thuế khai thiếu và tính tiền chậm nộp 0,03%/ngày theo Điều 16 Nghị định 125/2020/NĐ-CP khi hạch toán sai chi phí không được trừ Mục B4.',
  'RULE-CIT-B4-CASH':
    'Loại toàn bộ khỏi chi phí được trừ tại chỉ tiêu B4 khi tính thuế TNDN đối với hóa đơn từ 5 triệu đồng trở lên thanh toán bằng tiền mặt.',
  'RULE-TAX-FCT-10D':
    'Loại chi phí dịch vụ nước ngoài khỏi chi phí được trừ TNDN và phạt từ 2.000.000đ - 25.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP nếu chậm kê khai thuế nhà thầu.',
  'RULE-TAX-CYCLE-CHANGE-20D':
    'Phạt cảnh cáo hoặc phạt tiền từ 1.000.000đ - 5.000.000đ theo Điều 10 Nghị định 125/2020/NĐ-CP khi vi phạm thời hạn thông báo chuyển đổi kỳ tính thuế.',
  'RULE-TAX-DISSOLUTION-45D':
    'Phạt tiền từ 8.000.000đ - 15.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai quyết toán thuế TNDN khi giải thể quá hạn.',
  'RULE-TAX-POS-FNB':
    'Phạt tiền từ 4.000.000đ - 8.000.000đ theo Điều 24 Nghị định 125/2020/NĐ-CP và rủi ro ấn định doanh thu tính thuế TNDN khi không xuất hóa đơn bán lẻ đúng thời điểm.',
};

// Bộ Thẻ Bối Cảnh Chuẩn Luật Định Thuế TNDN (Dùng khi khởi tạo hoặc context rỗng)
export const STANDARD_21_CONTEXT_FACTS: Array<Omit<ContextFact, 'id'> & { id: string }> = [
  {
    id: 'fact-tax-1',
    key: 'q_tax_cit_finalization',
    label:
      'Doanh nghiệp có lập kế hoạch đối chiếu doanh thu - chi phí, bóc tách chỉ tiêu B4 và nộp Tờ khai quyết toán thuế TNDN (Mẫu 03/TNDN) trước ngày 31/03 hàng năm không?',
    group: 'thue_ke_toan',
    currentValue:
      'Đã đối chiếu sổ kế toán, bóc tách chi phí loại trừ Mục B4 và nộp quyết toán 03/TNDN đúng hạn',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-tax-2',
    key: 'q_tax_corp_2',
    label:
      'Doanh nghiệp có thực hiện tạm nộp thuế Thu nhập doanh nghiệp (TNDN) 4 quý đạt tối thiểu 80% số thuế TNDN phải nộp cả năm không?',
    group: 'thue_ke_toan',
    currentValue: 'Đã tạm nộp định kỳ hàng quý, lũy kế 4 quý đạt tối thiểu 80% thuế TNDN cả năm',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-tax-3',
    key: 'q_tax_corp_3',
    label: 'Mọi khoản chi mua hàng hóa, dịch vụ từng lần từ 5 triệu đồng trở lên có đủ hóa đơn hợp pháp và chứng từ thanh toán không dùng tiền mặt không?',
    group: 'thue_ke_toan',
    currentValue: '100% hóa đơn từ 5 triệu đồng trở lên đều chuyển khoản qua tài khoản ngân hàng của doanh nghiệp',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-tax-4',
    key: 'q_tax_tncn_withholding',
    label:
      'Doanh nghiệp đã lưu đủ hồ sơ chi lương, khấu trừ 10% thù lao vãng lai từ 2 triệu đồng và bóc tách lương chủ Công ty TNHH 1TV vào Mục B4 chưa?',
    group: 'thue_ke_toan',
    currentValue: 'Đã hoàn thiện đầy đủ hồ sơ bảo vệ chi phí tiền lương và bóc tách đúng quy định TT 96/2015/TT-BTC',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-tax-5',
    key: 'q_tax_corp_fct_ads',
    label:
      'Doanh nghiệp có kê khai thuế nhà thầu (FCT) hoặc thu thập hóa đơn hợp pháp cho chi phí quảng cáo trực tuyến (Facebook, Google, TikTok) để tính vào chi phí được trừ TNDN không?',
    group: 'thue_ke_toan',
    currentValue: 'Đã có đủ tờ khai nộp thuế nhà thầu mẫu 01/NTNN hoặc hóa đơn VAT hợp lệ',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-tax-6',
    key: 'q_tax_bank_account',
    label:
      'Toàn bộ giao dịch thanh toán chi phí được trừ TNDN có được thực hiện từ tài khoản ngân hàng đứng tên pháp nhân doanh nghiệp không?',
    group: 'thue_ke_toan',
    currentValue:
      '100% giao dịch kinh doanh thực hiện qua tài khoản ngân hàng pháp nhân đã đăng ký với cơ quan thuế',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
];

// Cấu trúc dữ liệu sổ thu chi lưu trữ theo từng Kỳ (Phương án A)
export interface PeriodFinancialData {
  revenues: RevenueRow[];
  expenses: ExpenseRow[];
}

export type PeriodStore = Record<string, PeriodFinancialData>;

// Khởi tạo ban đầu trống 100% cho Phân hệ Thuế TNDN (Zero-data canvas)
export const DEFAULT_REVENUE_ROWS: RevenueRow[] = [];
export const DEFAULT_EXPENSE_ROWS: ExpenseRow[] = [];

export interface CitSummaryData {
  totalRevenue: number;
  revenueCount: number;
  totalAccountingExpense: number;
  expenseCount: number;
  totalDisallowedExpense: number;
  disallowedCount: number;
  totalDeductibleExpense: number;
  assessableIncome: number;
  taxRate: number;
  estimatedTaxAmount: number;
  statutoryPrepayment80: number;
  accountingProfitBeforeTax: number;
  netProfitAfterTax: number;
}

export const EMPTY_CIT_SUMMARY: CitSummaryData = {
  totalRevenue: 0,
  revenueCount: 0,
  totalAccountingExpense: 0,
  expenseCount: 0,
  totalDisallowedExpense: 0,
  disallowedCount: 0,
  totalDeductibleExpense: 0,
  assessableIncome: 0,
  taxRate: 0.2,
  estimatedTaxAmount: 0,
  statutoryPrepayment80: 0,
  accountingProfitBeforeTax: 0,
  netProfitAfterTax: 0,
};

export interface CitRevenueRecord {
  id: string;
  date: string;
  invoiceNo?: string;
  description: string;
  amount: number;
}

export interface CitExpenseRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  paymentMethod: string;
  hasInvoice: string;
  note?: string;
  isDisallowedB4?: boolean;
  disallowedReason?: string;
  legalBasis?: string;
}

export function getQuarterDeadline(quarter: number | 'ALL', year: number): string {
  const info = getCalculatedQuarterDeadline(quarter, year);
  return info.formattedDate;
}

export function getQuarterReminderDate(quarter: number | 'ALL', year: number): string {
  switch (quarter) {
    case 1:
      return `23/04/${year}`;
    case 2:
      return `24/07/${year}`;
    case 3:
      return `24/10/${year}`;
    case 4:
      return `24/01/${year + 1}`;
    case 'ALL':
      return `24/03/${year + 1}`;
    default:
      return `24/01/${year + 1}`;
  }
}

export function getModuleTag(groupKey?: string): string {
  switch (groupKey) {
    case 'thue_ke_toan':
      return 'PHÂN HỆ: THUẾ TNDN';
    case 'boi_canh_co_so':
      return 'HỒ SƠ CƠ SỞ';
    default:
      return 'PHÂN HỆ THUẾ TNDN';
  }
}
