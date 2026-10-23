export type WalletTransactionType = 'DEPOSIT' | 'ESCROW_HOLD' | 'ESCROW_CAPTURE' | 'REFUND' | 'WITHDRAW';

export type WalletTransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';

export interface WalletLedger {
  id: string;
  organizationId: string;
  transactionType: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: WalletTransactionStatus;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceVnd: number;
  badge: string;
  bonusText: string;
  popular?: boolean;
}

export interface WalletInfo {
  id: string;
  organizationId: string;
  balance: number;
  heldAmount?: number;
  escrowHold?: number;
  availableBalance?: number;
  currency: string;
}
