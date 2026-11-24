import type { ContextFact } from '../../../interfaces';
import type { RevenueRow, ExpenseRow } from '../../../utils/excelTaxTemplate';
import { getCalculatedQuarterDeadline } from '../../../utils/taxCalendar';

// Bảng rủi ro chế tài xử phạt thực tế theo các Nghị định hiện hành về Thuế & Hóa đơn
export const STATUTORY_PENALTY_RISKS: Record<string, string> = {
  'RULE-TAX-GTGT':
    'Phạt tiền từ 2.000.000đ - 25.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai thuế quá thời hạn quy định.',
  'RULE-TAX-TNDN-80':
    'Tính tiền chậm nộp 0,03%/ngày trên số thuế TNDN tạm nộp 4 quý còn thiếu so với ngưỡng 80% quyết toán theo Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP.',
  'RULE-TAX-MB':
    'Phạt tiền từ 2.000.000đ - 5.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai lệ phí môn bài quá hạn quy định.',
  'RULE-TAX-FCT-10D':
    'Phạt tiền từ 2.000.000đ - 25.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai thuế nhà thầu quá hạn quy định.',
  'RULE-TAX-CYCLE-CHANGE-20D':
    'Phạt cảnh cáo hoặc phạt tiền từ 1.000.000đ - 5.000.000đ theo Điều 10 Nghị định 125/2020/NĐ-CP khi vi phạm thời hạn thông báo chuyển đổi kỳ tính thuế.',
  'RULE-TAX-DISSOLUTION-45D':
    'Phạt tiền từ 8.000.000đ - 15.000.000đ theo Điều 13 Nghị định 125/2020/NĐ-CP đối với hành vi nộp hồ sơ khai quyết toán thuế khi giải thể chậm quá 90 ngày.',
  'RULE-TAX-POS-FNB':
    'Phạt cảnh cáo hoặc phạt tiền từ 4.000.000đ - 8.000.000đ theo Điều 24 Nghị định 125/2020/NĐ-CP đối với hành vi không lập hóa đơn điện tử máy tính tiền khi bán lẻ hàng hóa, dịch vụ ăn uống.',
};

// 21 Thẻ Bối Cảnh Chuẩn Luật Định Doanh Nghiệp Việt Nam (Dùng khi khởi tạo hoặc context rỗng)
export const STANDARD_21_CONTEXT_FACTS: Array<Omit<ContextFact, 'id'> & { id: string }> = [
  {
    id: 'fact-tax-1',
    key: 'q_tax_corp_1',
    label:
      'Doanh nghiệp có thực hiện nộp tờ khai thuế GTGT và thuế TNCN định kỳ theo Quý (hạn ngày cuối tháng đầu quý sau: 30/04, 31/07, 31/10, 31/01) đúng hạn không?',
    group: 'thue_ke_toan',
    currentValue:
      'Đã nộp tờ khai và tiền thuế đầy đủ đúng hạn theo Quý (hạn ngày cuối tháng đầu quý sau: 30/04, 31/07, 31/10, 31/01)',
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
    label: 'Doanh nghiệp có thực hiện kê khai và nộp Lệ phí môn bài hàng năm trước ngày 30/01 không?',
    group: 'thue_ke_toan',
    currentValue: 'Đã nộp đầy đủ lệ phí môn bài bậc quy định trước ngày 30/01',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-tax-4',
    key: 'q_tax_corp_4',
    label:
      'Doanh nghiệp có thực hiện khấu trừ 10% thuế TNCN tại nguồn khi chi trả thù lao từ 2 triệu đồng/lần trở lên cho cá nhân vãng lai không?',
    group: 'thue_ke_toan',
    currentValue: 'Đã thực hiện khấu trừ 10% và cấp chứng từ khấu trừ thuế TNCN điện tử',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-tax-5',
    key: 'q_tax_corp_5',
    label:
      'Doanh nghiệp có thanh toán chi phí quảng cáo trực tuyến (Facebook, Google, TikTok) và kê khai thuế nhà thầu (FCT) trong vòng 10 ngày không?',
    group: 'thue_ke_toan',
    currentValue: 'Có phát sinh chi phí quảng cáo và đã nộp tờ khai thuế nhà thầu mẫu 01/NTNN',
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fact-tax-6',
    key: 'q_tax_corp_6',
    label:
      'Doanh nghiệp có rà soát điều kiện thanh toán không dùng tiền mặt qua ngân hàng đối với các hóa đơn mua vào từng lần từ 20 triệu đồng trở lên không?',
    group: 'thue_ke_toan',
    currentValue:
      '100% hóa đơn từ 20 triệu trở lên đều được chuyển khoản qua tài khoản ngân hàng của doanh nghiệp',
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
      return 'MODULE 1: THUẾ TNDN';
    case 'phap_ly_von':
      return 'MODULE 2: PHÁP LÝ';
    case 'nganh_nghe_van_hanh':
      return 'MODULE 3: VẬN HÀNH';
    case 'hoa_don_dong_tien':
      return 'MODULE 4: HÓA ĐƠN';
    case 'lao_dong_bhxh':
      return 'MODULE 5: LAO ĐỘNG';
    case 'dia_diem_pccc':
      return 'MODULE 6: PCCC';
    default:
      return 'MODULE BỐI CẢNH';
  }
}
