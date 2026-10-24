import type { BaseProfile, DynamicSituationQuestion } from '../../interfaces';

export function getOperationSurveyQuestions(_profile: BaseProfile): DynamicSituationQuestion[] {
  return [
    {
      id: 'q_op_sub_license',
      moduleId: 'MODULE_LICENSING_CON',
      branchType: 'industry',
      branchCode: 'SUB_LICENSE',
      branchLabel: 'Giấy phép con',
      title: 'Các ngành nghề kinh doanh có điều kiện của doanh nghiệp đã được cấp đủ Giấy phép con (ATTP, ANTT, v.v.) chưa?',
      legalBasis: 'Luật Đầu tư 2020 về danh mục ngành, nghề đầu tư kinh doanh có điều kiện.',
      options: [
        'Đã có đầy đủ giấy phép con còn hiệu lực',
        'Ngành nghề không thuộc diện kinh doanh có điều kiện',
        'Đang trong quá trình xin cấp giấy phép',
        'Chưa làm thủ tục xin cấp giấy phép con'
      ],
      severity: 'high'
    }
  ];
}

export const operationSurveyConfig = {
  groupKey: 'nganh_nghe_van_hanh',
  groupTitle: 'Ngành Nghề & Vận Hành',
  moduleTag: 'VẬN HÀNH & GIẤY PHÉP',
  description: 'Rà soát giấy phép con, đăng ký kinh doanh và điều kiện vận hành ngành nghề thực tế.',
  estimatedMinutes: 2,
  getQuestions: getOperationSurveyQuestions,
};
