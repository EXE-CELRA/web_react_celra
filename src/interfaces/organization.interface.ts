export interface Organization {
  id: string;
  name?: string;
  legalName: string;
  taxCode: string;
  legalType?: string;
  industry?: string;
  businessModel?: string;
  operatingYears?: string;
  revenueStatus?: string;
  scale?: string;
  employeeCount?: number;
  locations?: string;
  hasOnlineSales?: boolean;
  address?: string;
  city?: string;
  representativeName?: string;
  status: string;
  onboardingStep: number;
  complianceScore: number;
  createdAt?: string;
  updatedAt?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
