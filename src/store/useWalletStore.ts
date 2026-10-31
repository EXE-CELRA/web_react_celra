import { create } from 'zustand';
import apiClient from '../api/client';
import type { WalletInfo, WalletLedger, CreditPackage } from '../types';

interface WalletState {
  wallet: WalletInfo | null;
  ledgers: WalletLedger[];
  packages: CreditPackage[];
  isLoading: boolean;
  error: string | null;

  fetchWallet: () => Promise<void>;
  fetchLedgers: () => Promise<void>;
  fetchPackages: () => Promise<CreditPackage[]>;
  buyPackage: (packageId: string) => Promise<any>;
  deposit: (amount: number, note?: string) => Promise<any>;
  generateDepositQR: (
    amount: number,
    note?: string,
    packageId?: string,
  ) => Promise<{
    qrCodeUrl: string;
    checkoutUrl?: string;
    orderCode: string;
    amount: number;
    accountNo?: string;
    accountName?: string;
    bankId?: string;
  }>;
  processSandboxPayment: (payload: {
    packageId?: string;
    amount?: number;
    outcome: 'SUCCESS' | 'FAILED';
    failureReason?: string;
    bankName?: string;
  }) => Promise<any>;
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
      const res: any = await apiClient.get('/wallets/my-wallet');
      set({ wallet: res, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  };

  const fetchLedgersFn = async () => {
    try {
      const res: any = await apiClient.get('/wallets/transactions');
      const list = Array.isArray(res) ? res : [];
      set({ ledgers: list });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPackagesFn = async () => {
    try {
      const res: any = await apiClient.get('/wallets/packages');
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
    try {
      const res: any = await apiClient.post('/wallets/buy-package', { packageId });
      set({ wallet: res });
      const txRes: any = await apiClient.get('/wallets/transactions');
      if (Array.isArray(txRes)) set({ ledgers: txRes });
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  const depositFn = async (amount: number, note?: string) => {
    try {
      const res: any = await apiClient.post('/wallets/deposit', { amount, note });
      set({ wallet: res });
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  const generateDepositQRFn = async (amount: number, note?: string, packageId?: string) => {
    try {
      const res: any = await apiClient.post('/payments/vietqr/generate', {
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
    } catch (err: any) {
      throw err;
    }
  };

  const processSandboxPaymentFn = async (payload: any) => {
    try {
      const res: any = await apiClient.post('/wallets/sandbox-payment', payload);
      if (res.wallet) {
        set({ wallet: res.wallet });
      }
      const txRes: any = await apiClient.get('/wallets/transactions');
      if (Array.isArray(txRes)) set({ ledgers: txRes });
      return res;
    } catch (err: any) {
      throw err;
    }
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
