import type { BaseProfile, DynamicSituationQuestion } from '../../interfaces';

export function getLaborBhxhSurveyQuestions(profile: BaseProfile): DynamicSituationQuestion[] {
  return [
    {
      id: 'q_labor_bhxh_mandatory',
      moduleId: 'MODULE_LABOR_HR',
      branchType: 'labor_scale',
      branchCode: profile.employeeScale,
      branchLabel: 'Đóng BHXH bắt buộc',
      title: 'Doanh nghiệp đã ký hợp đồng lao động và tham gia BHXH bắt buộc cho toàn bộ người lao động làm việc từ đủ 1 tháng trở lên chưa?',
      legalBasis: 'Điều 2 Luật Bảo hiểm xã hội số 58/2014/QH13 và Bộ luật Lao động 2019.',
      options: [
        'Đã ký HĐLĐ và đóng BHXH bắt buộc đầy đủ cho 100% nhân viên',
        'Chưa tham gia BHXH cho nhân viên',
        'Chỉ đóng BHXH cho nhân sự chủ chốt',
        'Chưa rõ'
      ],
      severity: 'urgent'
    }
  ];
}

export const laborBhxhSurveyConfig = {
  groupKey: 'lao_dong_bhxh',
  groupTitle: 'Lao Động & BHXH',
  moduleTag: 'LAO ĐỘNG & BHXH',
  description: 'Rà soát hợp đồng lao động, mức lương đóng BHXH bắt buộc và nội quy lao động.',
  estimatedMinutes: 2,
  getQuestions: getLaborBhxhSurveyQuestions,
};
