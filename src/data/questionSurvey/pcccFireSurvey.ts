import type { BaseProfile, DynamicSituationQuestion } from '../../interfaces';

export function getPcccFireSurveyQuestions(_profile: BaseProfile): DynamicSituationQuestion[] {
  return [
    {
      id: 'q_pccc_profile',
      moduleId: 'MODULE_PREMISES_PCCC',
      branchType: 'module',
      branchCode: 'PCCC_SAFETY',
      branchLabel: 'Hồ sơ quản lý PCCC',
      title: 'Cơ sở đã lập hồ sơ quản lý, theo dõi hoạt động phòng cháy và chữa cháy theo mẫu quy định chưa?',
      legalBasis: 'Điều 4 Thông tư 149/2020/TT-BCA và Nghị định 136/2020/NĐ-CP.',
      options: [
        'Đã lập hồ sơ quản lý PCCC và trang bị bình chữa cháy định kỳ',
        'Chưa lập hồ sơ PCCC cơ sở',
        'Chưa rõ cơ sở thuộc diện quản lý PCCC nào',
        'Đang hoàn thiện'
      ],
      severity: 'high'
    }
  ];
}

export const pcccFireSurveyConfig = {
  groupKey: 'dia_diem_pccc',
  groupTitle: 'Địa Điểm & PCCC',
  moduleTag: 'ĐỊA ĐIỂM & PCCC',
  description: 'Rà soát an toàn PCCC, bình chữa cháy, nội quy và hồ sơ thẩm duyệt cơ sở.',
  estimatedMinutes: 2,
  getQuestions: getPcccFireSurveyQuestions,
};
