export type CompanyTypeTag = 'TAG_HKD' | 'TAG_TNHH_1TV' | 'TAG_TNHH_2TV' | 'TAG_JSC';

export type IndustryTag = 
  | 'TAG_FNB' 
  | 'TAG_ECOMMERCE' 
  | 'TAG_B2B_SERVICE'
  | 'TAG_MANUFACTURING' 
  | 'TAG_IT_SOFTWARE' 
  | 'TAG_EDUCATION' 
  | 'TAG_LOGISTICS';

export type ComplianceModuleId = 
  | 'MODULE_TAX_CORE'
  | 'MODULE_INVOICE_CASHFLOW'
  | 'MODULE_LABOR_HR'
  | 'MODULE_LICENSING_ATTP'
  | 'MODULE_ECOM_DATA_PRIVACY'
  | 'MODULE_PREMISES_PCCC'
  | 'MODULE_CONTRACTS'
  | 'MODULE_DATA_IP'
  | 'MODULE_LICENSING_CON'
  | 'MODULE_LEGAL_CORP';

export type EmployeeScale = 'under_10' | '10_to_50' | 'over_50';

export interface BaseProfile {
  taxCode: string;
  companyName: string;
  employeeScale: EmployeeScale;
  employeeCount?: number;
  annualRevenue?: number;
  charterCapital?: number;
  isNewlyEstablished?: boolean;
  requiresLaborRuleBook: boolean;
  companyTypeTag: CompanyTypeTag;
  industryTags: IndustryTag[];
}

export interface DynamicSituationQuestion {
  id: string;
  moduleId?: ComplianceModuleId;
  branchType: 'company_type' | 'industry' | 'labor_scale' | 'module';
  branchCode: string;
  branchLabel: string;
  title: string;
  legalBasis: string;
  options: string[];
  selectedOption?: string;
  warningNotice?: string;
  severity?: string;
  verificationEvidence?: string;
  verificationUrl?: string;
  legalReference?: {
    lawName: string;
    article?: string;
    penaltyRange?: string;
  };
}

export interface SurveyQuestion {
  id: string;
  code: string;
  title: string;
  description?: string;
  category: string;
  inputType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'NUMBER' | 'BOOLEAN' | 'TEXT';
  options?: Array<{ label: string; value: any }>;
  currentAnswer?: any;
}

export interface TagMeta<T> {
  id: T;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  badgeColor: string;
}

export interface ComplianceModuleMeta {
  id: ComplianceModuleId;
  name: string;
  badge: string;
  status: 'ACTIVE' | 'ROADMAP_PHASE_2' | 'ROADMAP_PHASE_3';
  statusLabel: string;
  description: string;
  iconName: string;
}

export type ComplianceDomain = 'TAX' | 'INVOICE' | 'BHXH' | 'LABOR' | 'SAFETY' | 'CORPORATE' | 'LICENSING';

export interface StandardComplianceQuestion {
  id: string;
  domain: ComplianceDomain;
  subCategory: string;
  version: string;
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'ARCHIVED';
  title: string;
  description?: string;
  severity: 'urgent' | 'high' | 'medium';
  legalReference: {
    docCode: string;
    docTitle: string;
    articleNumber: string;
    sourceUrl: string;
    statusInDLPL: 'VALID' | 'AMENDED' | 'EXPIRED';
    penaltyClause?: string;
  };
  conditions: {
    minRevenue?: number;
    maxRevenue?: number;
    minEmployees?: number;
    maxEmployees?: number;
    companyTypes?: CompanyTypeTag[];
    industryTags?: IndustryTag[];
    isNewlyEstablished?: boolean;
  };
  options?: string[];
}

export interface LegalTypeDetection {
  tagId: 'TAG_TNHH_1TV' | 'TAG_TNHH_2TV' | 'UNSUPPORTED' | CompanyTypeTag;
  label: string;
  isSupported: boolean;
  unsupportedReason?: string;
}
