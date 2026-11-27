export interface ContextGroupConfig {
  key: string;
  label: string;
  shortLabel: string;
  tag: string;
  icon: any;
  badgeClass: string;
}

export interface ContextFact {
  id: string;
  organizationId?: string;
  category?: string;
  group?: string;
  factKey?: string;
  key?: string;
  label: string;
  valueType?: string;
  value?: string;
  currentValue?: string;
  source: string;
  providedBy?: string;
  providedAt?: string;
  affectedRules?: string[];
  status?: string;
  confidenceScore?: number;
  history?: any[];
  createdAt?: string;
  updatedAt?: string;
  conflictDetails?: string | null;
  [key: string]: any;
}

export interface ContextFactHistory {
  id: string;
  factId: string;
  oldValue: string;
  newValue: string;
  reason?: string;
  actorId?: string;
  actorName?: string;
  createdAt: string;
}
