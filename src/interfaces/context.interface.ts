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
  nhom?: string;
  factKey?: string;
  key?: string;
  khoa?: string;
  label: string;
  nhan?: string;
  valueType?: string;
  value?: string;
  currentValue?: string;
  giaTriHienTai?: string;
  source: string;
  nguon?: string;
  providedBy?: string;
  providedAt?: string;
  affectedRules?: string[];
  cacQuyTacLienQuan?: string[];
  status?: string;
  trangThai?: string;
  confidenceScore?: number;
  history?: any[];
  updatedAt?: string;
  conflictDetails?: string | null;
  chiTietXungDot?: string | null;
  taoLuc?: string;
  capNhatLuc?: string;
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
