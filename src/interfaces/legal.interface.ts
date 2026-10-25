export interface LegalRuleCitation {
  title?: string;
  sourceUrl?: string;
  articleNumber?: string;
  docNumber?: string;
}

export interface LegalRule {
  id?: string;
  code: string;
  title: string;
  conditionSummary?: string;
  legalReference?: string;
  priority?: string;
  category?: string;
  version?: string;
  effectiveDate?: string;
  conditionsJson?: {
    content?: string;
    answer?: string;
    citations?: LegalRuleCitation[];
    keywords?: string[];
    options?: string[];
    [key: string]: any;
  };
}

export interface LegalDocumentItem {
  id: string;
  code: string;
  name: string;
  database?: string;
  status?: string;
  effectiveDate?: string;
  issuedDate?: string;
  sourceUrl?: string;
}
