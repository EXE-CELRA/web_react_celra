export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'unverified' | 'accepted' | 'rejected';

export interface EvidenceDocument {
  id: string;
  organizationId: string;
  taskId?: string;
  linkedTaskId?: string;
  documentType?: string;
  category?: string;
  tag?: string;
  quarter?: number | string;
  year?: number;
  period?: string;
  title?: string;
  name?: string;
  fileUrl: string;
  fileName?: string;
  fileSize: number | string;
  mimeType?: string;
  fileType?: string;
  verificationStatus?: VerificationStatus;
  status?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  confidenceScore?: number;
  ocrExtractedData?: any;
  createdAt: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface EvidenceUploadModalProps {
  visible: boolean;
  taskId?: string;
  initialTag?: string;
  initialQuarter?: number | string;
  initialYear?: number;
  onClose: () => void;
  onSuccess: () => void;
}
