export type ExpertCaseStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'PROPOSALS_RECEIVED'
  | 'ESCROW_FUNDED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export interface ExpertQuote {
  id: string;
  caseId: string;
  expertId: string;
  expertName: string;
  expertAvatar?: string;
  proposedPrice: number;
  deliveryTimeline: string;
  proposalNote: string;
  isAccepted: boolean;
  createdAt: string;
}

export interface ExpertCase {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  category: string;
  budgetEstimate: number;
  escrowAmount: number;
  status: ExpertCaseStatus;
  deliverables?: string;
  conclusions?: string;
  selectedExpertId?: string;
  createdAt: string;
  quotes?: ExpertQuote[];
}
