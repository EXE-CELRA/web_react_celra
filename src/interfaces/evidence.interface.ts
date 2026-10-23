export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface EvidenceDocument {
  id: string;
  organizationId: string;
  taskId?: string;
  documentType: string;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  confidenceScore?: number;
  createdAt: string;
}
