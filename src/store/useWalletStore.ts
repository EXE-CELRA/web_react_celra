import { create } from 'zustand';
import apiClient from '../api/client';
import type { WalletInfo, WalletLedger, CreditPackage } from '../types';

export interface SandboxPaymentPayload {
  packageId?: string;
  amount?: number;
  outcome: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  bankName?: string;
}

export interface SandboxPaymentResponse {
  code: string;
  wallet?: WalletInfo;
  transaction?: WalletLedger;
  message?: string;
  [key: string]: unknown;
}

interface DepositQRResult {
  qrCodeUrl: string;
  checkoutUrl?: string;
  orderCode: string;
  amount: number;
  accountNo?: string;
  accountName?: string;
  bankId?: string;
}

interface WalletState {
  wallet: WalletInfo | null;
  ledgers: WalletLedger[];
  packages: CreditPackage[];
  isLoading: boolean;
  error: string | null;

  fetchWallet: () => Promise<void>;
  fetchLedgers: () => Promise<void>;
  fetchPackages: () => Promise<CreditPackage[]>;
  buyPackage: (packageId: string) => Promise<WalletInfo>;
  deposit: (amount: number, note?: string) => Promise<WalletInfo>;
  generateDepositQR: (amount: number, note?: string, packageId?: string) => Promise<DepositQRResult>;
  processSandboxPayment: (payload: SandboxPaymentPayload) => Promise<SandboxPaymentResponse>;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message;
  }
  return fallback;
}

export const useWalletStore = create<WalletState>((set) => {
  const defaultPackages: CreditPackage[] = [
    {
      id: 'PKG_50',
      name: 'Gói Khởi Động',
      credits: 50,
      priceVnd: 100000,
      badge: 'Khởi đầu',
      bonusText: 'Trải nghiệm rà soát cơ bản',
      popular: false,
    },
    {
      id: 'PKG_120',
      name: 'Gói Tiêu Chuẩn',
      credits: 120,
      priceVnd: 200000,
      badge: 'Phổ biến nhất',
      bonusText: 'Tặng 20 Credit (Tiết kiệm 17%)',
      popular: true,
    },
    {
      id: 'PKG_450',
      name: 'Gói Doanh Nghiệp',
      credits: 450,
      priceVnd: 500000,
      badge: 'Tiết kiệm 45%',
      bonusText: 'Tặng 200 Credit (Tối ưu chi phí)',
      popular: false,
    },
  ];

  const fetchWalletFn = async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get<unknown, WalletInfo>('/wallets/my-wallet');
      set({ wallet: res, isLoading: false });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Không thể tải thông tin ví'), isLoading: false });
    }
  };

  const fetchLedgersFn = async () => {
    try {
      const res = await apiClient.get<unknown, WalletLedger[]>('/wallets/transactions');
      const list = Array.isArray(res) ? res : [];
      set({ ledgers: list });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPackagesFn = async () => {
    try {
      const res = await apiClient.get<unknown, CreditPackage[]>('/wallets/packages');
      if (Array.isArray(res) && res.length > 0) {
        set({ packages: res });
        return res;
      }
    } catch (err) {
      console.error(err);
    }
    return defaultPackages;
  };

  const buyPackageFn = async (packageId: string) => {
    const res = await apiClient.post<unknown, WalletInfo>('/wallets/buy-package', { packageId });
    set({ wallet: res });
    const txRes = await apiClient.get<unknown, WalletLedger[]>('/wallets/transactions');
    if (Array.isArray(txRes)) set({ ledgers: txRes });
    return res;
  };

  const depositFn = async (amount: number, note?: string) => {
    const res = await apiClient.post<unknown, WalletInfo>('/wallets/deposit', { amount, note });
    set({ wallet: res });
    return res;
  };

  const generateDepositQRFn = async (amount: number, note?: string, packageId?: string) => {
    const res = await apiClient.post<
      unknown,
      {
        qrUrl: string;
        content?: string;
        amount: number;
        accountNo?: string;
        accountName?: string;
        bankId?: string;
      }
    >('/payments/vietqr/generate', {
      amount,
      note,
      packageId,
    });
    return {
      qrCodeUrl: res.qrUrl,
      checkoutUrl: res.qrUrl,
      orderCode: res.content || `CELRA NAP ${amount}`,
      amount: res.amount,
      accountNo: res.accountNo,
      accountName: res.accountName,
      bankId: res.bankId,
    };
  };

  const processSandboxPaymentFn = async (payload: SandboxPaymentPayload) => {
    const res = await apiClient.post<unknown, SandboxPaymentResponse>(
      '/wallets/sandbox-payment',
      payload,
    );
    if (res.wallet) {
      set({ wallet: res.wallet });
    }
    const txRes = await apiClient.get<unknown, WalletLedger[]>('/wallets/transactions');
    if (Array.isArray(txRes)) set({ ledgers: txRes });
    return res;
  };

  return {
    wallet: null,
    ledgers: [],
    packages: defaultPackages,
    isLoading: false,
    error: null,

    fetchWallet: fetchWalletFn,
    fetchLedgers: fetchLedgersFn,
    fetchPackages: fetchPackagesFn,
    buyPackage: buyPackageFn,
    deposit: depositFn,
    generateDepositQR: generateDepositQRFn,
    processSandboxPayment: processSandboxPaymentFn,
  };
});
