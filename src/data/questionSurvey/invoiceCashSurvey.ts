import type { BaseProfile, DynamicSituationQuestion } from '../../interfaces';

export function getInvoiceCashSurveyQuestions(profile: BaseProfile): DynamicSituationQuestion[] {
  return [
    {
      id: 'q_cash_bank_account',
      moduleId: 'MODULE_INVOICE_CASHFLOW',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: 'Tài khoản ngân hàng',
      title: 'Tài khoản thanh toán ngân hàng phục vụ kinh doanh đã được thông báo với cơ quan quản lý thuế chưa?',
      legalBasis: 'Khoản 2 Điều 36 Luật Quản lý thuế số 38/2019/QH14.',
      options: [
        'Đã thông báo đầy đủ với cơ quan thuế',
        'Chưa thông báo với cơ quan thuế',
        'Chỉ dùng tài khoản cá nhân',
        'Chưa rõ'
      ],
      severity: 'high'
    }
  ];
}

export const invoiceCashSurveyConfig = {
  groupKey: 'hoa_don_dong_tien',
  groupTitle: 'Hóa Đơn & Dòng Tiền',
  moduleTag: 'HÓA ĐƠN & DÒNG TIỀN',
  description: 'Rà soát chứng từ không dùng tiền mặt và thông báo tài khoản ngân hàng kinh doanh.',
  estimatedMinutes: 2,
  getQuestions: getInvoiceCashSurveyQuestions,
};
