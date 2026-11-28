export interface CitationItem {
  title: string;
  docNumber: string;
  articleNumber?: string;
  sourceUrl?: string;
  url?: string;
}

export interface ProposedChecklistItem {
  id: string;
  code: string;
  title: string;
  category: string;
  priority: string;
  reason: string;
  legalBasis: string;
  assigneeRole?: string;
}

export interface ParsedObligation {
  title: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NEEDS_VERIFICATION' | 'INCOMPLETE';
  priority?: 'urgent' | 'high' | 'medium';
  shortDesc: string;
  systemRecorded?: string;
  verifiedResult?: string;
  actionRequired?: string;
  legalBasis?: string;
  sourceUrl?: string;
}

export interface MessageItem {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  citations?: CitationItem[];
  attachedFiles?: Array<{ fileId: string; fileName: string; fileType: string; fileSize?: string }>;
  actionType?: 'info' | 'open_compliance_audit' | 'task_proposal' | 'enterprise_audit';
  isEnterpriseQuery?: boolean;
  ctaButton?: {
    text: string;
    action: string;
  };
  proposedChecklists?: ProposedChecklistItem[];
  timestamp?: string;
  createdAt?: string;
}

export interface ConversationItem {
  id: string;
  userId: string;
  enterpriseId: string;
  organizationId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessage?: string;
  lastMessageRole?: string;
  lastMessageAt?: string;
}

export interface ConversationDetail {
  id: string;
  userId: string;
  enterpriseId: string;
  organizationId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: MessageItem[];
}
