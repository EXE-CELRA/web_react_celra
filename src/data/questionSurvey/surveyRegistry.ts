import type { BaseProfile, ContextFact, DynamicSituationQuestion } from '../../interfaces';
import { taxSurveyConfig } from './taxSurvey';
import { legalSurveyConfig } from './legalSurvey';
import { invoiceCashSurveyConfig } from './invoiceCashSurvey';
import { laborBhxhSurveyConfig } from './laborBhxhSurvey';
import { pcccFireSurveyConfig } from './pcccFireSurvey';
import { operationSurveyConfig } from './operationSurvey';

export interface ModuleSurveyConfig {
  groupKey: string;
  groupTitle: string;
  moduleTag: string;
  description: string;
  estimatedMinutes: number;
  getQuestions: (profile: BaseProfile) => DynamicSituationQuestion[];
}

export const SURVEY_MODULE_REGISTRY: Record<string, ModuleSurveyConfig> = {
  thue_ke_toan: taxSurveyConfig,
  phap_ly_von: legalSurveyConfig,
  hoa_don_dong_tien: invoiceCashSurveyConfig,
  lao_dong_bhxh: laborBhxhSurveyConfig,
  dia_diem_pccc: pcccFireSurveyConfig,
  nganh_nghe_van_hanh: operationSurveyConfig,
};

export function getModuleSurveyConfig(groupKey: string): ModuleSurveyConfig | null {
  return SURVEY_MODULE_REGISTRY[groupKey] || null;
}

/**
 * Kiểm tra xem một phân hệ đã hoàn thành khảo sát tình huống chuyên biệt chưa.
 * Dữ kiện được xem là đã hoàn thành nếu trong danh sách facts có các thẻ câu hỏi tình huống thực tế
 * đã được lưu vào cơ sở dữ liệu hoặc phiên làm việc hiện tại.
 */
export function isGroupSurveyCompleted(facts: ContextFact[], groupKey: string): boolean {
  if (groupKey === 'boi_canh_co_so') {
    return true;
  }
  if (!facts) return false;

  if (groupKey === 'thue_ke_toan') {
    // Phân hệ Thuế TNDN hoạt động thuần túy qua Sổ Thu Chi & Kê khai Excel (Zero survey requirement)
    return true;
  }

  // Các phân hệ khác: Kiểm tra xem đã có dữ kiện nào thuộc nhóm đó chưa
  const moduleFacts = facts.filter((f) => f.group === groupKey);
  return moduleFacts.length > 0;
}
