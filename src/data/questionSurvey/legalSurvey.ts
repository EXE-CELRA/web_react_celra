import type { BaseProfile, DynamicSituationQuestion } from '../../interfaces';

export function getLegalSurveyQuestions(profile: BaseProfile): DynamicSituationQuestion[] {
  return [
    {
      id: 'q_legal_capital_90d',
      moduleId: 'MODULE_LEGAL_CORP',
      branchType: 'company_type',
      branchCode: profile.companyTypeTag,
      branchLabel: 'Góp vốn điều lệ',
      title: 'Các thành viên/cổ đông đã góp đủ 100% số vốn điều lệ đã đăng ký trong thời hạn 90 ngày kể từ ngày cấp GCNĐKDN chưa?',
      legalBasis: 'Khoản 2 Điều 47 và Khoản 1 Điều 75 Luật Doanh nghiệp 2020. Thời hạn góp vốn tối đa là 90 ngày.',
      options: [
        'Đã góp đủ 100% vốn điều lệ bằng tiền gửi vào tài khoản công ty',
        'Đang trong thời hạn 90 ngày kể từ ngày thành lập',
        'Đã quá 90 ngày nhưng chưa góp đủ và chưa đăng ký giảm vốn điều lệ',
        'Chưa rõ tình trạng góp vốn thực tế của các thành viên'
      ],
      severity: 'urgent'
    }
  ];
}

export const legalSurveyConfig = {
  groupKey: 'phap_ly_von',
  groupTitle: 'Pháp Lý Doanh Nghiệp & Vốn',
  moduleTag: 'PHÁP LÝ & VỐN',
  description: 'Rà soát nghĩa vụ góp vốn 90 ngày, thay đổi thông tin ĐKDN và điều lệ công ty.',
  estimatedMinutes: 2,
  getQuestions: getLegalSurveyQuestions,
};
